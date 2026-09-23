package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.dto.financial.OcrResultDTO;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartBillAnalysisDTO {
    private OcrResultDTO billData;
    private String smartCategory;
    private String spendingTrend;
    private List<String> optimizationTips;
    private String budgetAlert;
}