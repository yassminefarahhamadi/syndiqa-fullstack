package tn.esprit.pidev.dto.maintenance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAiComparisonResult {
    private String taskId;
    private double score;
    private String conclusion;
    private boolean approved;
    private String beforeImageUrl;
    private String afterImageUrl;
}
