package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.financial.Payment;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IPaymentRepo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static tn.esprit.pidev.config.CacheConfig.CHARGES_CACHE;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChargeServiceImpl implements IChargeService {

    private final IChargeRepo chargeRepo;
    private final IPaymentRepo paymentRepo;
    private final IWalletService walletService;
    private final tn.esprit.pidev.repositories.user.AccountRepository accountRepo;
    private static final java.time.format.DateTimeFormatter DATE_FMT = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final tn.esprit.pidev.services.user.EmailService emailService;
    private final tn.esprit.pidev.services.notification.SmsService smsService;

    // ═══════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════

    @Override
    @CacheEvict(value = CHARGES_CACHE, allEntries = true)
    public Charge addCharge(String organizationId, Charge charge) {
        charge.setOrganizationId(organizationId);
        charge.setCreatedAt(LocalDateTime.now());
        if (charge.getStatus() == null) charge.setStatus(ChargeStatus.PENDING);
        if (charge.getPaidAmount() == null) charge.setPaidAmount(0.0);
        Charge saved = chargeRepo.save(charge);
        log.info("Charge created: id={}, label={}, orgId={}", saved.getId(), saved.getLabel(), saved.getOrganizationId());

        // Send notification to resident
        if (saved.getUserId() != null) {
            sendChargeNotification(saved);
        }

        return saved;
    }

    @Override
    @CacheEvict(value = CHARGES_CACHE, allEntries = true)
    public Charge updateCharge(String organizationId, String id, Charge charge) {
        Charge existing = findByIdAndOrg(organizationId, id);
        if (charge.getLabel() != null) existing.setLabel(charge.getLabel());
        if (charge.getAmount() != null) existing.setAmount(charge.getAmount());
        if (charge.getDueDate() != null) existing.setDueDate(charge.getDueDate());
        if (charge.getBuildingId() != null) existing.setBuildingId(charge.getBuildingId());
        if (charge.getUserId() != null) existing.setUserId(charge.getUserId());
        if (charge.getPeriod() != null) existing.setPeriod(charge.getPeriod());
        return chargeRepo.save(existing);
    }

    @Override
    @CacheEvict(value = CHARGES_CACHE, allEntries = true)
    public void deleteCharge(String organizationId, String id) {
        Charge existing = findByIdAndOrg(organizationId, id);
        chargeRepo.delete(existing);
    }

    @Override
    @Cacheable(value = CHARGES_CACHE, key = "'org:' + #organizationId")
    public List<Charge> getAllCharges(String organizationId) {
        return chargeRepo.findByOrganizationId(organizationId);
    }

    @Override
    @Cacheable(value = CHARGES_CACHE, key = "'org:' + #organizationId + ':id:' + #id")
    public Charge getChargeById(String organizationId, String id) {
        return findByIdAndOrg(organizationId, id);
    }

    @Override
    @Cacheable(value = CHARGES_CACHE, key = "'org:' + #organizationId + ':user:' + #userId")
    public List<Charge> getChargesByUser(String organizationId, String userId) {
        return chargeRepo.findByOrganizationIdAndUserId(organizationId, userId);
    }

    @Override
    @Cacheable(value = CHARGES_CACHE, key = "'org:' + #organizationId + ':building:' + #buildingId")
    public List<Charge> getChargesByBuilding(String organizationId, String buildingId) {
        return chargeRepo.findByOrganizationIdAndBuildingId(organizationId, buildingId);
    }

    // ═══════════════════════════════════════════════
    //  BUSINESS SERVICE 1: Intelligent Payment Processing
    //  (with partial payment support)
    // ═══════════════════════════════════════════════

    @Override
    @CacheEvict(value = CHARGES_CACHE, allEntries = true)
    public Charge processPayment(String organizationId, String userId, String chargeId, Double amount, String method) {
        Charge charge = findByIdAndOrg(organizationId, chargeId);

        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }

        // Cap amount to remaining balance to prevent overpayment
        double remaining = charge.getAmount() - (charge.getPaidAmount() != null ? charge.getPaidAmount() : 0.0);
        if (remaining <= 0) {
            throw new IllegalStateException("Charge is already fully paid");
        }
        if (amount > remaining) {
            log.warn("Payment amount {} exceeds remaining {} for charge {}. Capping to remaining.", amount, remaining, chargeId);
            amount = remaining;
        }

        // IDOR protection: verify the charge belongs to this user
        if (charge.getUserId() != null && !charge.getUserId().equals(userId)) {
            throw new IllegalStateException("This charge does not belong to the authenticated user");
        }

        // If paying via Wallet, deduct first
        if ("WALLET".equalsIgnoreCase(method)) {
            walletService.deductFunds(organizationId, userId, amount, chargeId);
        }

        // Track cumulative payment
        double newPaidAmount = (charge.getPaidAmount() != null ? charge.getPaidAmount() : 0.0) + amount;
        charge.setPaidAmount(newPaidAmount);

        // Determine new status
        if (newPaidAmount >= charge.getAmount()) {
            charge.setStatus(ChargeStatus.PAID);
            log.info("Charge {} fully paid (paid: {}, total: {})", chargeId, newPaidAmount, charge.getAmount());
        } else {
            charge.setStatus(ChargeStatus.PARTIALLY_PAID);
            log.info("Charge {} partially paid (paid: {}/{} )", chargeId, newPaidAmount, charge.getAmount());
        }

        // Create Payment record
        Payment payment = Payment.builder()
                .organizationId(organizationId)
                .chargeId(chargeId)
                .userId(userId)
                .amount(amount)
                .method(method)
                .paymentDate(LocalDateTime.now())
                .build();
        paymentRepo.save(payment);

        return chargeRepo.save(charge);
    }

    // ═══════════════════════════════════════════════
    //  BUSINESS SERVICE 2: Automatic Overdue Audit
    // ═══════════════════════════════════════════════

    @Override
    public int markOverdueCharges(String organizationId) {
        // Only transition PENDING charges to OVERDUE.
        // PARTIALLY_PAID charges keep their status to preserve paidAmount context.
        List<Charge> overdueCharges = chargeRepo.findByOrganizationIdAndStatusAndDueDateBefore(
                organizationId, ChargeStatus.PENDING, LocalDate.now());

        int count = 0;
        for (Charge charge : overdueCharges) {
            charge.setStatus(ChargeStatus.OVERDUE);
            chargeRepo.save(charge);
            count++;
        }
        log.info("Marked {} charges as OVERDUE for org {}", count, organizationId);
        return count;
    }

    // ═══════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════

    private Charge findByIdAndOrg(String organizationId, String id) {
        return chargeRepo.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new NotFoundException("Charge not found or access denied"));
    }
    private void sendChargeNotification(Charge charge) {
        try {
            // Get resident account info
            accountRepo.findById(charge.getUserId()).ifPresent(account -> {
                String firstName = account.getFirstName() != null ? account.getFirstName() : "Resident";
                String dueDate = charge.getDueDate() != null ? charge.getDueDate().toString() : "N/A";
                
                // Notifications temporarily disabled because the methods don't exist on dev branch
                /*
                // Send email notification
                emailService.sendChargeNotification(
                    account.getEmail(),
                    firstName,
                    charge.getLabel(),
                    charge.getAmount(),
                    dueDate
                );
                
                // Send SMS notification if phone number exists
                if (account.getPhone() != null && !account.getPhone().isEmpty()) {
                    smsService.sendChargeNotificationSms(
                        account.getPhone(),
                        firstName,
                        charge.getLabel(),
                        charge.getAmount(),
                        dueDate
                    );
                }
                */
                
                log.info("Notifications triggered for {} for charge {}", account.getEmail(), charge.getId());
            });
        } catch (Exception e) {
            log.error("Failed to trigger charge notification: {}", e.getMessage());
        }
    }


}
