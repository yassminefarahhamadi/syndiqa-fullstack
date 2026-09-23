package tn.esprit.pidev.entities.communityevents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "announcement_acknowledgements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementAcknowledgement {
    @Id
    private String id;

    private String announcementId;
    private String accountId;
    private String organizationId;
    private LocalDateTime acknowledgedAt;
}
