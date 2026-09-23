package tn.esprit.pidev.dto.IncidentAlert;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class WeeklyStatsDTO {
    private String day;
    private long total;
    private long resolved;
}
