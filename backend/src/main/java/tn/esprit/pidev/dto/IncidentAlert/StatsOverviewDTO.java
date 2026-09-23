package tn.esprit.pidev.dto.IncidentAlert;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatsOverviewDTO {
    private long total;
    private long resolved;
    private long pending;
    private double resolutionRate;
}
