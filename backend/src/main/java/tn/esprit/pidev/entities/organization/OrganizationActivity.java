package tn.esprit.pidev.entities.organization;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "organization_activities")
public class OrganizationActivity {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    private ActivityType type;

    private String description;

    private String actorAccountId;

    private String targetId;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
