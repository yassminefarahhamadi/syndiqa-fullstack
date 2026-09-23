package tn.esprit.pidev.controllers.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.gamification.EngagementSummaryDTO;
import tn.esprit.pidev.services.gamification.EngagementService;

@RestController
@RequestMapping("/api/engagement")
@RequiredArgsConstructor
public class EngagementController {

    private final EngagementService engagementService;

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<EngagementSummaryDTO> getBuildingSummary(@PathVariable String buildingId) {
        return ResponseEntity.ok(engagementService.getBuildingSummary(buildingId));
    }
}
