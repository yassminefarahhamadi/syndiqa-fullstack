package tn.esprit.pidev.dto.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyndicDashboardDTO {

    // Organization Info
    private String organizationName;
    private List<String> residenceNames;
    private List<String> buildingNames;

    // KPIs
    private int totalBuildings;
    private int totalApartments;
    private int totalResidents;
    private int totalOwners;
    private int totalTenants;
    private int totalStaff;
    private int activeLeases;

    // Financial
    private double totalCharged;
    private double totalCollected;
    private double totalOverdue;
    private double collectionRate;
    private long overdueChargesCount;
    private long paidChargesCount;
    private long pendingChargesCount;
    private long partialChargesCount;
    private double totalExpenses;

    // Risk
    private long highRiskCount;
    private long mediumRiskCount;
    private long lowRiskCount;

    // Recent activity
    private List<RecentChargeDTO> recentOverdueCharges;
    private List<MonthlyBreakdownDTO> monthlyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentChargeDTO {
        private String residentName;
        private String apartmentNumber;
        private String label;
        private double amount;
        private String dueDate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyBreakdownDTO {
        private String month;
        private double charged;
        private double collected;
        private double expenses;
    }
}
