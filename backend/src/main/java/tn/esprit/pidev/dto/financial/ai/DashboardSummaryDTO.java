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
public class DashboardSummaryDTO {
    private Long highRiskCount;
    private Long mediumRiskCount;
    private Long lowRiskCount;
    private Double totalCharged;
    private Double totalCollected;
    private Double collectionRate;
    private Long overdueCount;
    private Double overdueAmount;
    private List<MonthlyTrendDTO> monthlyTrends;
}
