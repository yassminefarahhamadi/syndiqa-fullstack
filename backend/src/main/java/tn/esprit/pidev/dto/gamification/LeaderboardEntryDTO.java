package tn.esprit.pidev.dto.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDTO {
    private String buildingId;
    private String buildingName;
    private int rank;
    private double totalEnergyKwh;
    private double savingsTND;
    private double co2AvoidedKg;
    private String badge;
}
