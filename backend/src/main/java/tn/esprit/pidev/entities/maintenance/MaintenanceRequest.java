package tn.esprit.pidev.entities.maintenance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "maintenance_requests")
public class MaintenanceRequest {

    @Id
    private String id;

    private String title;
    private String description;
    private String maintenanceCode;

    private String organizationId;
    private String reportedBy;
    private String reporterAccountId;
    private String apartmentId;
    private String buildingId;
    private String residenceId;
    private String locationDetails;

    private String beforeImageUrl;

    private MaintenanceCategory category;
    private MaintenanceSource source;
    private Priority priority;
    private MaintenanceSeverity severity;
    private Status status;

    private String createdByAccountId;
    private String lastUpdatedByAccountId;
    private String closedByAccountId;

    private Integer subTaskCount;
    private Integer completedSubTaskCount;
    private Double progressPercent;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime startedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime verifiedAt;
}

