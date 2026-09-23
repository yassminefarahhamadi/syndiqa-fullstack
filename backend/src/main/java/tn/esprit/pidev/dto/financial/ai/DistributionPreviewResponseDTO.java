package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributionPreviewResponseDTO {
    private List<DistributionPreviewDTO> previews;
    private Double totalAmount;
    private Double sumCalculated;
    private boolean balanced;
}
