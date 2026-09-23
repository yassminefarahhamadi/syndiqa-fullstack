package tn.esprit.pidev.entities.communityevents;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.enums.EventCategory;
import tn.esprit.pidev.enums.EventStatus;

import java.time.LocalDateTime;

@Document(collection = "community_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityEvent {
    @Id
    private String id;
    private String organizationId;

    private String title;
    private String description;

    private EventCategory category;
    private EventStatus status;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private String location;
    private Integer maxCapacity;

    private String accountId;
    private String buildingId;
    private String aiPosterSvg;
    private LocalDateTime aiPosterGeneratedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
