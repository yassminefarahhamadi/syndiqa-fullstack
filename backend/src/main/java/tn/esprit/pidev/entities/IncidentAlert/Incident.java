package tn.esprit.pidev.entities.IncidentAlert;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.enums.IncidentAlert.Category;
import tn.esprit.pidev.enums.IncidentAlert.IncidentType;
import tn.esprit.pidev.enums.IncidentAlert.Severity;
import tn.esprit.pidev.enums.IncidentAlert.Status;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    private String id;

    private IncidentType type; // Fire, Water Leak, Security

    private Category category;

    private String description;

    private String buildingId;
    private String organizationId;

    private String userId;

    private Severity userSeverity;
    private String aiSeverity;
    private String finalSeverity;
    private String reportedBy;

    private Status status;

    private LocalDateTime reportedAt;
    private List<String> evidencePhotos;

    private String assignedDomain; // plumbing, electrical...
    private String assignedTo;

    private String audioPath;
    private String aiAudioResult; // 👈 what AI detects
    @Transient
    private String buildingName;

    private Integer rating;
    private Boolean rated = false;
}

