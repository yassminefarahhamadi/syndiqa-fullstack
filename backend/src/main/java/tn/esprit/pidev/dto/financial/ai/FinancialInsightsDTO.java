package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialInsightsDTO {
    private String insightsText;
    private Double totalCharged;
    private Double totalCollected;
    private Double collectionRate;
    private Long overdueCount;
    private Double overdueAmount;
    private Long highRiskCount;
    private Long mediumRiskCount;
    private Long lowRiskCount;
    private Instant generatedAt;
}
