package tn.esprit.pidev.entities.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Apartment Entity
 * Stores the properties of an apartment within the organization, 
 * including surfaceM2 which is fundamentally required for the ChargeDistributor 
 * proportional mathematical breakdown (tantièmes) as per the Tunisian Code de la Copropriété.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "apartments")
public class Apartment {

    @Id
    private String id;

    private String buildingId;
    private String organizationId;
    private String apartmentNumber;
    private int floorNumber;
    
    // Core property used by ChargeDistributor Algorithm
    private Double surfaceM2;

    @Builder.Default
    private Instant createdAt = Instant.now();
    
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
