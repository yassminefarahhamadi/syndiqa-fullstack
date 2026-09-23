package tn.esprit.pidev.dto.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResultDTO {
    private String issuer;
    private Double amount;
    private String date;
    private String taxId;
    private String referenceNumber;
    private String confidence;
    private String description;
    private String rawText;
}
