package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionComparisonDto {
    private String leaseId;
    private String initialInspectionId;
    private String finalInspectionId;
    private List<ItemComparisonDto> itemComparisons;
    private int degradationScore;
    private BigDecimal totalEstimatedDeduction;
    private int totalItems;
    private int degradedItems;
    private int missingItems;
}
