package tn.esprit.pidev.entities.communityevents;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.enums.ParticipationStatus;

import java.time.LocalDateTime;

@Document(collection = "event_participations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipation {

    @Id
    private String id;

    private String eventId;
    private String accountId;
    private String organizationId;

    private ParticipationStatus status;

    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
}
