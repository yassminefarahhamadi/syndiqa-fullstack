package tn.esprit.pidev.entities.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "forest_stats")
public class ForestStats {
    @Id
    private String buildingId; // Use buildingId as the @Id for easy indexing
    private double totalKwh;

    /**
     * Tree formula: 1 tree = 5 kWh produced
     */
    @com.fasterxml.jackson.annotation.JsonProperty("totalTrees")
    public int getTotalTrees() {
        return (int) (totalKwh / 5.0);
    }

    /**
     * CO2 formula: co2AvoidedKg = totalEnergyKwh × 0.5
     */
    @com.fasterxml.jackson.annotation.JsonProperty("co2AvoidedKg")
    public double getCo2AvoidedKg() {
        return totalKwh * 0.5;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("forestLevel")
    public ForestLevel getForestLevel() {
        int trees = getTotalTrees();
        if (trees >= 500) return ForestLevel.NATIONAL_PARK;
        if (trees >= 200) return ForestLevel.FOREST;
        if (trees >= 50) return ForestLevel.GROVE;
        return ForestLevel.SEEDLING;
    }

    public enum ForestLevel {
        SEEDLING, GROVE, FOREST, NATIONAL_PARK
    }
}
