package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResponse {
    private String solarSystemId;
    private double totalExpectedSavings; // TND
    private List<DailyPrediction> predictions;
}
