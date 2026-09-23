package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialAnalysisDTO {
    private Double totalIncome;
    private Double totalExpenses;
    private Double savingsRate;
    private String financialHealthScore; // EXCELLENT, GOOD, AVERAGE, POOR
    private Map<String, Double> expensesByCategory;
    private List<String> recommendations;
    private List<String> investmentSuggestions;
    private String summary;
}