package tn.esprit.pidev.entities.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "buildings")
public class Building {
    @Id
    private String id;

    @NotBlank(message = "Residence ID cannot be blank")
    private String residenceId; // link to Residence

    private String organizationId;

    @NotBlank(message = "Name cannot be blank")
    private String name;

    @Positive(message = "Floors count must be positive")
    private int floorsCount;


    @Positive(message = "Parking spots count must be positive")
    private int parkingSpotsCount; // total number of parking spots
}
