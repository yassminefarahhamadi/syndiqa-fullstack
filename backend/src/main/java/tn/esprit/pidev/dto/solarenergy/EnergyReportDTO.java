package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyReportDTO {
    private String solarSystemId;
    private String period;
    private double totalEnergy; // in kWh
    private double savingsEstimation; // in TND
    
    // Environmental Stats
    private double co2Avoided; // in kg
    private double treesPlantedEquivalent; 
    
    // Daily breakdown for charts: Map<DateString, kWh>
    private Map<String, Double> dailyProduction;

    // Time of day distribution: Map<PeriodName, kWh>
    // e.g., {"Morning": 10.5, "Midday Peak": 45.2, ...}
    private Map<String, Double> dailyPeriodDistribution;
}
