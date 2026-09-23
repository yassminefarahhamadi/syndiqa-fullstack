package tn.esprit.pidev.dto.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditResultDTO {
    private String accountId;
    private String orgId;
    private Double creditAmount;
    private Double newBalance;
    private String source;
    private LocalDateTime timestamp;
}
