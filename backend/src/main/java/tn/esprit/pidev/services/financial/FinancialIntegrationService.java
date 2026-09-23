package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.pidev.dto.financial.CreditResultDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.financial.Wallet;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IWalletRepo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialIntegrationService {

    private final IWalletRepo walletRepository;
    private final IChargeRepo chargeRepository;

    @Transactional
    public CreditResultDTO applyCredit(String orgId, String accountId, Double amount, String source) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Credit amount must be positive");
        }

        Wallet wallet = walletRepository.findByUserIdAndOrganizationId(accountId, orgId)
                .orElseGet(() -> Wallet.builder()
                        .userId(accountId)
                        .organizationId(orgId)
                        .balance(0.0)
                        .transactions(new ArrayList<>())
                        .build());

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        Wallet.WalletTransaction transaction = Wallet.WalletTransaction.builder()
                .id(UUID.randomUUID().toString())
                .type(Wallet.TransactionType.SOLAR_CREDIT)
                .amount(amount)
                .balanceAfter(wallet.getBalance() + amount)
                .description("Automatic credit - Source: " + source)
                .timestamp(now)
                .build();

        wallet.getTransactions().add(transaction);
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setUpdatedAt(now);

        walletRepository.save(wallet);
        
        log.info("Applied credit of {} TND for user {} in org {} (Source: {})", amount, accountId, orgId, source);

        return CreditResultDTO.builder()
                .accountId(accountId)
                .orgId(orgId)
                .creditAmount(amount)
                .newBalance(wallet.getBalance())
                .source(source)
                .timestamp(now)
                .build();
    }

    @Transactional
    public Charge applyFee(String orgId, String accountId, Double amount, String source, LocalDate dueDate) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Fee amount must be positive");
        }

        if (dueDate == null || dueDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Due date cannot be in the past");
        }

        String period = "AUTO-" + YearMonth.now().toString();

        Charge charge = Charge.builder()
                .organizationId(orgId)
                .userId(accountId)
                .label(source)
                .amount(amount)
                .paidAmount(0.0)
                .dueDate(dueDate)
                .status(ChargeStatus.PENDING)
                .period(period)
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        Charge savedCharge = chargeRepository.save(charge);
        
        log.info("Applied fee of {} TND for user {} in org {} (Source: {}, Due: {})", amount, accountId, orgId, source, dueDate);
        
        return savedCharge;
    }
}
