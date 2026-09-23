package tn.esprit.pidev.services.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.gamification.EngagementSummaryDTO;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.gamification.ForestStats;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.repositories.gamification.EcoChallengeRepository;
import tn.esprit.pidev.repositories.gamification.ForestStatsRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EngagementService {

    private final PropertyBuildingRepository buildingRepo;
    private final ForestStatsRepository forestRepo;
    private final EcoChallengeRepository challengeRepo;

    public EngagementSummaryDTO getBuildingSummary(String buildingId) {
        Building b = buildingRepo.findById(buildingId).orElse(null);
        ForestStats forest = forestRepo.findById(buildingId)
                .orElse(ForestStats.builder().buildingId(buildingId).totalKwh(0).build());
        
        List<EcoChallenge> activeChallenges = challengeRepo.findByBuildingId(buildingId).stream()
                .filter(c -> c.getStatus() == EcoChallenge.ChallengeStatus.ACTIVE)
                .collect(Collectors.toList());

        return EngagementSummaryDTO.builder()
                .buildingId(buildingId)
                .buildingName(b != null ? b.getName() : "Unknown Building")
                .forestStats(forest)
                .activeChallenges(activeChallenges)
                .build();
    }
}
