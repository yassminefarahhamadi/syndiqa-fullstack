package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalSolarSummaryDTO {
    private double totalKwhAllTime;
    private double monthlyKwh;
    private double monthlySavings;
    private long activeSystemsCount;
    private long buildingCount;
    private long residentCount;
    private double totalOutstandingCharges; // Placeholder for future finance integration
}
