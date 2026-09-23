package tn.esprit.pidev.entities.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "solar_systems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolarSystem {
    @Id
    private String id;
    private String name;
    private String buildingId;
    private double capacityKw;
    @Builder.Default
    private LocalDate installationDate = LocalDate.now();
    @Builder.Default
    private boolean activeAnomaly = false;
}
