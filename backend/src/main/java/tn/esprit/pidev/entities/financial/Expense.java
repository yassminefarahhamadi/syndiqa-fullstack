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

@Document(collection = "expenses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Expense implements Serializable {

    @Id
    private String id;
    private String organizationId;
    private String buildingId;
    private String apartmentId;  // For apartment-specific expenses (water, repairs, etc.)
    private String description;
    private Double amount;
    private String category;
    private LocalDate expenseDate;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
