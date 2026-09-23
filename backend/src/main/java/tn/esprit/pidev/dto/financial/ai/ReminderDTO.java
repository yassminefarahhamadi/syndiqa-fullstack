package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderDTO {
    private String reminderText;
    private String chargeId;
    private String userId;
    private String tone;
    private Long daysOverdue;
    private Double chargeAmount;
    private Instant generatedAt;
}
