package tn.esprit.pidev.services.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.gamification.LeaderboardEntryDTO;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.gamification.ForestStats;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.EnergyReport;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.repositories.gamification.EcoChallengeRepository;
import tn.esprit.pidev.repositories.gamification.ForestStatsRepository;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final EcoChallengeRepository challengeRepo;
    private final ForestStatsRepository forestRepo;
    private final EnergyReadingRepository readingRepo;
    private final SolarSystemRepository solarRepo;
    private final PropertyBuildingRepository buildingRepo;

    /**
     * Generates a leaderboard ranking buildings by efficiency for a specific period (Day or Month).
     * @param datePrefix String in format "YYYY-MM" or "YYYY-MM-DD"
     */
    public List<LeaderboardEntryDTO> getLeaderboard(String datePrefix) {
        if (datePrefix == null || datePrefix.isEmpty()) {
            datePrefix = java.time.LocalDate.now().toString().substring(0, 7);
        }

        java.time.LocalDateTime start;
        java.time.LocalDateTime end;
        if (datePrefix.length() == 7) { // Monthly
            java.time.YearMonth ym = java.time.YearMonth.parse(datePrefix);
            start = ym.atDay(1).atStartOfDay();
            end = ym.atEndOfMonth().atTime(23, 59, 59);
        } else { // Daily
            java.time.LocalDate d = java.time.LocalDate.parse(datePrefix);
            start = d.atStartOfDay();
            end = d.atTime(23, 59, 59);
        }

        List<EnergyReading> allReadings = readingRepo.findByTimestampBetween(start, end);
        
        // Optimization: Pre-fetch to avoid N+1 queries
        Map<String, SolarSystem> solarMap = solarRepo.findAll().stream()
                .collect(Collectors.toMap(SolarSystem::getId, s -> s));
        Map<String, Building> buildingMap = buildingRepo.findAll().stream()
                .collect(Collectors.toMap(Building::getId, b -> b));

        Map<String, LeaderboardEntryDTO> buildingStats = new HashMap<>();

        for (EnergyReading reading : allReadings) {
            SolarSystem sys = solarMap.get(reading.getSolarSystemId());
            if (sys != null && sys.getBuildingId() != null) {
                double kwh = reading.getPower() / 1000.0;
                
                buildingStats.compute(sys.getBuildingId(), (id, entry) -> {
                    if (entry == null) {
                        Building b = buildingMap.get(id);
                        return LeaderboardEntryDTO.builder()
                                .buildingId(id)
                                .buildingName(b != null ? b.getName() : "Unknown")
                                .totalEnergyKwh(kwh)
                                .savingsTND(kwh * 0.2) // Simplified flat rate
                                .co2AvoidedKg(kwh * 0.5)
                                .build();
                    } else {
                        entry.setTotalEnergyKwh(entry.getTotalEnergyKwh() + kwh);
                        entry.setSavingsTND(entry.getSavingsTND() + (kwh * 0.2));
                        entry.setCo2AvoidedKg(entry.getCo2AvoidedKg() + (kwh * 0.5));
                        return entry;
                    }
                });
            }
        }

        List<LeaderboardEntryDTO> leaderboard = new ArrayList<>(buildingStats.values());
        leaderboard.sort(Comparator.comparingDouble(LeaderboardEntryDTO::getTotalEnergyKwh).reversed());

        for (int i = 0; i < leaderboard.size(); i++) {
            LeaderboardEntryDTO entry = leaderboard.get(i);
            int rank = i + 1;
            entry.setRank(rank);
            
            if (rank == 1) entry.setBadge("🥇 Champion CO₂");
            else if (rank == 2) entry.setBadge("🥈 Éco-Leader");
            else if (rank == 3) entry.setBadge("🥉 Vert Actif");
            else entry.setBadge("🌿 Participant");
        }

        return leaderboard;
    }

    /**
     * Syncs reading data to challenges and forest stats.
     */
    public void updateGamificationProgress(EnergyReading reading) {
        SolarSystem sys = solarRepo.findById(reading.getSolarSystemId()).orElse(null);
        if (sys == null || sys.getBuildingId() == null) return;

        String buildingId = sys.getBuildingId();
        double readingPowerKwh = reading.getPower() / 1000.0; // Assuming reading.power is in W

        // Update Forest
        ForestStats forest = forestRepo.findById(buildingId)
                .orElse(ForestStats.builder().buildingId(buildingId).totalKwh(0).build());
        forest.setTotalKwh(forest.getTotalKwh() + readingPowerKwh);
        forestRepo.save(forest);

        // Update Challenges
        List<EcoChallenge> activeChallenges = challengeRepo.findByBuildingId(buildingId).stream()
                .filter(c -> c.getStatus() == EcoChallenge.ChallengeStatus.ACTIVE)
                .collect(Collectors.toList());

        for (EcoChallenge challenge : activeChallenges) {
            challenge.setCurrentKwh(challenge.getCurrentKwh() + readingPowerKwh);
            if (challenge.getCurrentKwh() >= challenge.getTargetKwh()) {
                challenge.setStatus(EcoChallenge.ChallengeStatus.COMPLETED);
            }
            challengeRepo.save(challenge);
        }
    }
}
