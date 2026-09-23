package tn.esprit.pidev.entities.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "anomaly_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnomalyHistory {
    @Id
    private String id;
    private String solarSystemId;
    private LocalDateTime timestamp;
    private double powerAtTime;
    private double baselineAtTime;
    
    private String anomalyType; // e.g., Dust, Inverter, Wiring
    private String resolutionAction; // e.g., Cleaning, Reboot, Replacement
    
    @Builder.Default
    private String status = "PENDING"; // PENDING, RESOLVED
    
    private String technicianNotes;
    private LocalDateTime resolvedAt;
}
