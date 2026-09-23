package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributionPreviewDTO {
    private String userId;
    private String apartmentId;
    private Double surfaceM2;
    private Double percentage;
    private Double calculatedAmount;
}
