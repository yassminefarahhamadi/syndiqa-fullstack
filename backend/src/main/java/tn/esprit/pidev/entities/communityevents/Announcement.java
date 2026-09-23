package tn.esprit.pidev.entities.communityevents;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.enums.TargetScope;

import java.time.LocalDateTime;

@Document(collection = "announcements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Announcement {
    @Id
    private String id;
    private String organizationId;

    private String title;
    private String content;

    private AnnouncementType type;
    private Priority priority;

    private String accountId;
    @Builder.Default
    private TargetScope targetScope = TargetScope.ORGANIZATION;
    private String buildingId;
    @Builder.Default
    private boolean requiresAcknowledgement = false;
    @Builder.Default
    private boolean pinned = false;
    private LocalDateTime pinnedUntil;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
