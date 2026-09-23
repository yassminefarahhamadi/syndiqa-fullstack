package tn.esprit.pidev.entities.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "financial_insights")
public class FinancialInsight {

    @Id
    private String id;
    
    private String organizationId;
    
    private String insightsText;
    private Double totalCharged;
    private Double totalCollected;
    private Double collectionRate;
    private Long overdueCount;
    private Double overdueAmount;
    private Long highRiskCount;
    private Long mediumRiskCount;
    private Long lowRiskCount;

    @Builder.Default
    private Instant generatedAt = Instant.now();
}
