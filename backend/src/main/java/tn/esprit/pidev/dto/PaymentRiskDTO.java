package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.financial.RiskLevel;

/**
 * Payment Risk Score DTO
 * Contains calculated risk metrics for a resident's payment behavior
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRiskDTO {
    private String userId;
    private Double riskScore;          // 0-100 weighted score
    private RiskLevel riskLevel;       // LOW, MEDIUM, HIGH
    private Long overdueCount;         // Current overdue charges
    private Long paidLateCount;        // Historical late payments
    private Double avgDaysOverdue;     // Average days overdue
    private Integer totalCharges;      // Total charges for context
    private String recommendation;     // Action recommendation for syndic
}
