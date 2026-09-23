package tn.esprit.pidev.dto.solarenergy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolarSystemResponseDTO {
    private String id;
    private String name;
    private String buildingId;
    private double capacityKw;
    private LocalDate installationDate;
    private boolean activeAnomaly;
}
