package tn.esprit.pidev.entities.financial;

/**
 * Risk level classification for resident payment behavior
 * Used in payment risk scoring algorithm
 */
public enum RiskLevel {
    LOW,      // Score < 20: Excellent payment history
    MEDIUM,   // Score 20-50: Some delays but manageable
    HIGH      // Score > 50: Frequent delays or overdue
}
