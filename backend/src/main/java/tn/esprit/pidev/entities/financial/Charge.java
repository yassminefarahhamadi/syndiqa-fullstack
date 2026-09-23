package tn.esprit.pidev.entities.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "charges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Charge implements Serializable {

    @Id
    private String id;
    private String organizationId;
    private String buildingId;
    private String userId;
    private String label;
    private Double amount;
    @Builder.Default
    private Double paidAmount = 0.0;
    private LocalDate dueDate;
    @Builder.Default
    private ChargeStatus status = ChargeStatus.PENDING;
    private String period;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
