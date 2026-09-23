package tn.esprit.pidev.entities.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "energy_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyReading {
    @Id
    private String id;
    private String solarSystemId;
    private double voltage;
    private double current;
    private double power;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
