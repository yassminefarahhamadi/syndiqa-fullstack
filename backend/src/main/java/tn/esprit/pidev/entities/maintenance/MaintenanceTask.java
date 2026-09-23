package tn.esprit.pidev.entities.maintenance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "maintenance_tasks")
public class MaintenanceTask {

    @Id
    private String id;

    private String maintenanceRequestId;
    private String title;
    private String description;
    private Integer orderIndex;
    private String assignedTo;
    private Integer estimatedMinutes;
    private String blockedReason;

    private String afterImageUrl;
    private Double aiComparisonScore;
    private String aiComparisonConclusion;
    private Boolean aiApproved;

    private LocalDate scheduledDate;
    private LocalDate startedDate;
    private LocalDate completedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private TaskStatus status;
}

