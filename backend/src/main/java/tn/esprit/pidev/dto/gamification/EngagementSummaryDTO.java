package tn.esprit.pidev.dto.gamification;

import lombok.Builder;
import lombok.Data;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.gamification.ForestStats;

import java.util.List;

@Data
@Builder
public class EngagementSummaryDTO {
    private String buildingId;
    private String buildingName;
    private ForestStats forestStats;
    private List<EcoChallenge> activeChallenges;
}
