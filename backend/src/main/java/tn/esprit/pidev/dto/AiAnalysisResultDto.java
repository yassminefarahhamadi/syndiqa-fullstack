package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResultDto {
    private InspectionCondition condition;
    private String description;
    private List<String> damagesDetected;
    private BigDecimal estimatedCost;
    private Integer confidence;
    private String recommendations;
}
