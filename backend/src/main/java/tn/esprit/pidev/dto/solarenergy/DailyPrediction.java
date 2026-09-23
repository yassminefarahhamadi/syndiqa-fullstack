package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPrediction {
    private LocalDate date;
    private double expectedTotalEnergy; // kWh
    private double expectedSavings; // TND
    private String primaryWeather; // e.g., "SUNNY", "CLOUDY"
    @Builder.Default
    private List<HourlyPrediction> hourlyProfile = new ArrayList<>();
}
