package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.financial.ai.PaymentRiskDTO;
import tn.esprit.pidev.dto.financial.ai.ReminderDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.financial.Reminder;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IReminderRepo;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderGenerator {

    private final IChargeRepo chargeRepository;
    private final PaymentRiskScorer paymentRiskScorer;
    private final GeminiApiClient geminiApiClient;
    private final IReminderRepo reminderRepository;
    private final tn.esprit.pidev.services.user.EmailService emailService;
    private final tn.esprit.pidev.services.notification.SmsService smsService;
    private final tn.esprit.pidev.repositories.user.AccountRepository accountRepository;

    public ReminderDTO generateReminder(String chargeId) {
        log.info("Generating AI reminder for charge {}", chargeId);

        Charge charge = chargeRepository.findById(chargeId)
                .orElseThrow(() -> new IllegalArgumentException("Charge not found"));

        if (!ChargeStatus.OVERDUE.equals(charge.getStatus())) {
            throw new IllegalArgumentException("This charge is not overdue");
        }

        long daysOverdue = ChronoUnit.DAYS.between(charge.getDueDate(), LocalDate.now());
        
        if (daysOverdue < 0) {
            daysOverdue = 0;
        }

        PaymentRiskDTO riskDTO = paymentRiskScorer.calculateRiskScore(charge.getUserId(), charge.getOrganizationId());

        String tone;
        if (daysOverdue < 15) {
            tone = "polite and informative";
        } else if (daysOverdue <= 30) {
            tone = "firm but respectful";
        } else {
            tone = "formal and urgent";
        }

        double amountDue = (charge.getAmount() != null ? charge.getAmount() : 0.0) -
                (charge.getPaidAmount() != null ? charge.getPaidAmount() : 0.0);

        String prompt = String.format(
                "You are a property manager for a Tunisian syndicate. Draft a payment reminder message.\n\n" +
                "Details:\n" +
                "- Amount Due: %.3f TND\n" +
                "- Subject: %s\n" +
                "- Days Overdue: %d days\n" +
                "- Resident Profile Risk: %s (%s)\n" +
                "- Required Tone: %s\n\n" +
                "Instructions: Write a professional message in English, maximum 2-3 sentences. " +
                "Refer to the Tunisian Co-ownership Code if the delay exceeds 30 days. " +
                "Do not include threats. Keep it professional and culturally appropriate.",
                amountDue, charge.getLabel(), daysOverdue, riskDTO.getRiskLevel(), riskDTO.getRecommendation(), tone
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 500);
        String reminderText;

        if (aiResponse.isPresent() && !aiResponse.get().trim().isEmpty()) {
            reminderText = aiResponse.get();
        } else {
            reminderText = String.format("Dear resident, your charge of %.3f TND for %s is overdue by %d days. Please settle your account as soon as possible.", amountDue, charge.getLabel(), daysOverdue);
        }

        ReminderDTO dto = ReminderDTO.builder()
                .reminderText(reminderText)
                .chargeId(charge.getId())
                .userId(charge.getUserId())
                .tone(tone)
                .daysOverdue(daysOverdue)
                .chargeAmount(charge.getAmount())
                .generatedAt(Instant.now())
                .build();

        Reminder entity = Reminder.builder()
                .organizationId(charge.getOrganizationId())
                .chargeId(dto.getChargeId())
                .userId(dto.getUserId())
                .reminderText(dto.getReminderText())
                .tone(dto.getTone())
                .daysOverdue(dto.getDaysOverdue())
                .chargeAmount(dto.getChargeAmount())
                .status("PENDING")
                .build();

        reminderRepository.save(entity);

        // Send reminder notification to resident
        sendReminderNotification(charge, reminderText, amountDue, daysOverdue);

        return dto;
    }

    private void sendReminderNotification(Charge charge, String reminderText, double amountDue, long daysOverdue) {
        try {
            // Get resident account info
            accountRepository.findById(charge.getUserId()).ifPresent(account -> {
                String firstName = account.getFirstName() != null ? account.getFirstName() : "Resident";
                
                // Notifications temporarily disabled because the methods don't exist on dev branch
                /*
                emailService.sendPaymentReminderEmail(
                    account.getEmail(),
                    firstName,
                    reminderText,
                    charge.getLabel(),
                    amountDue
                );
                
                if (account.getPhone() != null && !account.getPhone().isEmpty()) {
                    smsService.sendPaymentReminderSms(
                        account.getPhone(),
                        firstName,
                        charge.getLabel(),
                        amountDue,
                        (int) daysOverdue
                    );
                }
                */
                
                log.info("Payment reminder created for {} for charge {}", account.getEmail(), charge.getId());
            });
        } catch (Exception e) {
            log.error("Failed to send payment reminder: {}", e.getMessage());
        }
    }
}
