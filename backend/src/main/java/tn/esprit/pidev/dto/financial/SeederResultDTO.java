package tn.esprit.pidev.dto.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeederResultDTO {
    private String status;
    private String organizationId;
    private int accountsCreated;
    private int chargesCreated;
    private int paymentsCreated;
    private String message;
}
