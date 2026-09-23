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
@Document(collection = "reminders")
public class Reminder {

    @Id
    private String id;
    
    private String organizationId;
    private String chargeId;
    private String userId;
    
    private String reminderText;
    private String tone;
    private Long daysOverdue;
    private Double chargeAmount;

    @Builder.Default
    private String status = "PENDING";

    @Builder.Default
    private Instant createdAt = Instant.now();
    
    @Builder.Default
    private Instant generatedAt = Instant.now();
}
