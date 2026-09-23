package tn.esprit.pidev.entities.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "parkingSpots")
public class ParkingSpot {
    @Id
    private String id; // MongoDB auto-generates 24-char ID

    @NotBlank(message = "Building ID cannot be blank")
    private String buildingId; // link to Building

    private String organizationId;

    @Positive(message = "Spot number must be positive")
    private int number; // spot number (1, 2, 3, etc.)

    @NotBlank(message = "Type cannot be blank")
    private String type; // e.g., "Regular", "Accessible", "Reserved"

    @NotBlank(message = "Status cannot be blank")
    private String status; // "AVAILABLE", "OCCUPIED", "RESERVED"
}

