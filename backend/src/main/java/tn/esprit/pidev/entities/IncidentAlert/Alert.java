package tn.esprit.pidev.entities.IncidentAlert;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "alerts")
public class Alert {

    @Id
    private String id;

    private String incidentId; // link to incident

    private String message;

    private String targetRole; // RESIDENT / ADMIN

    private Boolean isRead;

    private LocalDateTime createdAt;
}

