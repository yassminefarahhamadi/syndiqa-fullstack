package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.organization.OrganizationRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueDetectionService {

    private final IChargeRepo chargeRepository;
    private final ReminderGenerator reminderGenerator;
    private final OrganizationRepository organizationRepository;

    @Scheduled(cron = "0 0 9 * * *", zone = "Africa/Tunis")
    public void detectOverdueAndGenerateReminders() {
        log.info("Starting Daily Overdue Detection & AI Reminder Generation Job");

        // Iterate known organizations instead of loading all charges to discover org IDs
        List<Organization> allOrgs = organizationRepository.findAll();

        int totalNewlyOverdue = 0;
        int totalReminders = 0;
        Map<String, Integer> breakdown = new HashMap<>();
        LocalDate today = LocalDate.now();

        for (Organization org : allOrgs) {
            String orgId = org.getId();
            
            // Update PENDING charges past due date to OVERDUE
            List<Charge> pendingCharges = chargeRepository.findByOrganizationIdAndStatus(orgId, ChargeStatus.PENDING);
            int newlyOverdueCount = 0;
            for (Charge charge : pendingCharges) {
                if (charge.getDueDate() != null && charge.getDueDate().isBefore(today)) {
                    charge.setStatus(ChargeStatus.OVERDUE);
                    chargeRepository.save(charge);
                    newlyOverdueCount++;
                }
            }
            totalNewlyOverdue += newlyOverdueCount;

            // Generate reminders for all overdue charges in this org
            List<Charge> overdueCharges = chargeRepository.findByOrganizationIdAndStatus(orgId, ChargeStatus.OVERDUE);
            int remindersGenerated = 0;
            for (Charge charge : overdueCharges) {
                try {
                    reminderGenerator.generateReminder(charge.getId());
                    remindersGenerated++;
                } catch (Exception e) {
                    log.warn("Failed to generate reminder for charge {}: {}", charge.getId(), e.getMessage());
                }
            }
            totalReminders += remindersGenerated;
            if (remindersGenerated > 0) {
                breakdown.put(orgId, remindersGenerated);
            }
        }

        log.info("Completed Job: Total charges updated to OVERDUE: {}, Total reminders generated: {}", totalNewlyOverdue, totalReminders);
        log.info("Breakdown per organizationId: {}", breakdown);
    }
    
    // For manual triggers
    public int manualTriggerForOrganization(String organizationId) {
        log.info("Manual trigger executed for org {}", organizationId);
        
        // Also flip any PENDING past-due charges first
        LocalDate today = LocalDate.now();
        List<Charge> pendingCharges = chargeRepository.findByOrganizationIdAndStatus(organizationId, ChargeStatus.PENDING);
        for (Charge charge : pendingCharges) {
            if (charge.getDueDate() != null && charge.getDueDate().isBefore(today)) {
                charge.setStatus(ChargeStatus.OVERDUE);
                chargeRepository.save(charge);
            }
        }

        List<Charge> overdueCharges = chargeRepository.findByOrganizationIdAndStatus(organizationId, ChargeStatus.OVERDUE);
        int generated = 0;
        
        for (Charge c : overdueCharges) {
            try {
                reminderGenerator.generateReminder(c.getId());
                generated++;
            } catch(Exception e) {
                log.warn("Failed manual generation for charge {}: {}", c.getId(), e.getMessage());
            }
        }
        return generated;
    }
}
