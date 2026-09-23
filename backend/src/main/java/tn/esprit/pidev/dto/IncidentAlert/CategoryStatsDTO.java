package tn.esprit.pidev.dto.IncidentAlert;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@AllArgsConstructor
public class CategoryStatsDTO {
    private String category;
    private long count;
}
