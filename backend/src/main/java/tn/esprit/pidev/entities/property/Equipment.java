package tn.esprit.pidev.entities.property;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document(collection = "equipment")
public class Equipment {
    @Id
    private String id;

    @NotBlank(message = "Building ID cannot be blank")
    private String buildingId;

    private String organizationId;

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotBlank(message = "Type cannot be blank")
    private String type; // elevator, generator, CCTV, etc.

    @NotBlank(message = "Status cannot be blank")
    private String status; // ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE

    private String serialNumber;
    private String manufacturer;
    private LocalDate installDate;
    private LocalDate lastInspectionDate;
    private LocalDate nextMaintenanceDate;
}

