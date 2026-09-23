package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Financial Summary DTO for organization-wide metrics
 * Used for dashboard analytics and AI insights
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO {
    private String organizationId;
    
    // Collection metrics
    private Double totalCharged;        // Total amount of all charges
    private Double totalCollected;      // Total amount collected
    private Double collectionRate;      // Percentage collected
    
    // Overdue metrics
    private Integer overdueCount;       // Number of overdue charges
    private Double overdueAmount;       // Total overdue amount
    
    // Risk metrics
    private Integer highRiskResidents;  // Count of HIGH risk residents
    private Integer mediumRiskResidents;
    private Integer lowRiskResidents;
    
    // Trend analysis
    private String expenseTrend;        // "increasing", "stable", "decreasing"
    private Double monthlyAverage;      // Average monthly charges
    
    // Period
    private String period;              // e.g., "2026-04" or "Q1 2026"
}
