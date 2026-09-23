package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.financial.RiskLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRiskDTO {
    private String userId;
    private Double riskScore;
    private RiskLevel riskLevel;
    private Long overdueCount;
    private Long paidLateCount;
    private Double avgDaysOverdue;
    private Long totalCharges;
    private String recommendation;
}
