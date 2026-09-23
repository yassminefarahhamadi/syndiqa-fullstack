package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlyPrediction {
    private int hour;
    private double expectedPower;
}
