package tn.esprit.pidev.entities.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

@Document(collection = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment implements Serializable {

    @Id
    private String id;
    private String organizationId;
    private String chargeId;
    private String userId;
    private Double amount;
    @Builder.Default
    private LocalDateTime paymentDate = LocalDateTime.now();
    private String method;
    private String reference;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
