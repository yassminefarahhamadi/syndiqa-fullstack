package tn.esprit.pidev.entities.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "energy_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyReport {
    @Id
    private String id;
    private String solarSystemId;
    private String period;
    private double totalEnergy;
    private double savingsEstimation;
}
