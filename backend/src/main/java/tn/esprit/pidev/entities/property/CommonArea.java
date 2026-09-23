package tn.esprit.pidev.entities.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "commonAreas")
public class CommonArea {
    @Id
    private String id;

    @NotBlank(message = "Building ID cannot be blank")
    private String buildingId;

    private String organizationId;

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotBlank(message = "Type cannot be blank")
    private String type; // lobby, staircase, corridor, gym, etc.

    @NotBlank(message = "Status cannot be blank")
    private String status; // AVAILABLE, UNDER_MAINTENANCE, CLOSED

    @PositiveOrZero(message = "Floor must be greater than or equal to 0")
    private int floor;

    @PositiveOrZero(message = "Surface must be greater than or equal to 0")
    private double surfaceM2;

    private String description;
}

