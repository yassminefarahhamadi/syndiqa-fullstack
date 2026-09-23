package tn.esprit.pidev.entities.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "apartments")
public class Apartment {
    @Id
    private String id;

    @NotBlank(message = "Building ID cannot be blank")
    private String buildingId; // link to Building

    private String organizationId;

    @Positive(message = "Floor must be positive")
    private int floor;

    @NotBlank(message = "Unit number cannot be blank")
    private String unitNumber;

    @Positive(message = "Surface must be positive")
    private double surfaceM2;

    @NotBlank(message = "Type cannot be blank")
    private String type;   // e.g., "1BR", "2BR"

    private String status; // AVAILABLE / OCCUPIED (optional)
}
