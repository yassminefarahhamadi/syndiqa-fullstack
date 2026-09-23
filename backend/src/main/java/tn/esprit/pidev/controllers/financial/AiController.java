package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.financial.ai.FinancialInsightsDTO;
import tn.esprit.pidev.dto.financial.ai.ReminderDTO;
import tn.esprit.pidev.entities.financial.Reminder;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.repositories.financial.IFinancialInsightRepo;
import tn.esprit.pidev.repositories.financial.IReminderRepo;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.ai.FinancialInsightsGenerator;
import tn.esprit.pidev.services.financial.ai.ReminderGenerator;
import tn.esprit.pidev.services.financial.ai.OverdueDetectionService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final FinancialInsightsGenerator insightsGenerator;
    private final ReminderGenerator reminderGenerator;
    private final OverdueDetectionService overdueDetectionService;
    private final IFinancialInsightRepo insightRepo;
    private final IReminderRepo reminderRepo;

    // Rate Limiting Map — CopyOnWriteArrayList for thread-safe list mutations
    private final ConcurrentHashMap<String, List<Instant>> rateLimiter = new ConcurrentHashMap<>();

    @PostMapping("/insights")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> generateInsights(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        
        // Rate limiting logic — thread-safe
        Instant now = Instant.now();
        List<Instant> requests = rateLimiter.computeIfAbsent(orgId, k -> new java.util.concurrent.CopyOnWriteArrayList<>());
        // Remove requests older than 1 hour
        requests.removeIf(time -> time.isBefore(now.minusSeconds(3600)));
        
        if (requests.size() >= 10) {
            long waitMinutes = 60 - java.time.Duration.between(requests.get(0), now).toMinutes();
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Rate limit reached. Please retry in " + waitMinutes + " minutes"));
        }
        
        requests.add(now);

        FinancialInsightsDTO dto = insightsGenerator.generateInsights(orgId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/insights/history")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> getInsightsHistory(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(insightRepo.findTop10ByOrganizationIdOrderByGeneratedAtDesc(orgId));
    }

    @PostMapping("/reminders/{chargeId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> generateReminderForCharge(@PathVariable String chargeId, HttpServletRequest request) {
        try {
            ReminderDTO reminder = reminderGenerator.generateReminder(chargeId);
            return ResponseEntity.ok(reminder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reminders/pending")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Reminder>> getPendingReminders(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(reminderRepo.findByOrganizationIdAndStatus(orgId, "PENDING"));
    }

    @PostMapping("/reminders/generate-all")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Map<String, Object>> generateAllReminders(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        int count = overdueDetectionService.manualTriggerForOrganization(orgId);
        return ResponseEntity.ok(Map.of("generatedCount", count));
    }
}
