package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemComparisonDto {
    private String itemName;
    private InspectionCondition initialCondition;
    private InspectionCondition finalCondition;
    private boolean degraded;
    private boolean missing;
    private int degradationGap;
    private BigDecimal estimatedDeduction;
}
