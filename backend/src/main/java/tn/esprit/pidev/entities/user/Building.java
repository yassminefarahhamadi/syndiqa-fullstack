package tn.esprit.pidev.entities.user;

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
@Document(collection = "buildings")
public class Building {

    @Id
    private String id;

    private String organizationId;
    private String residenceId;
    private String name;
    private int numberOfFloors;
    private int totalApartments;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
