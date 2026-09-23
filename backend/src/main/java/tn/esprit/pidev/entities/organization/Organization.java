package tn.esprit.pidev.entities.organization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.entities.user.SubscriptionPlan;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "organizations")
public class Organization {

    @Id
    private String id;

    private String name;
    private String address;
    private String city;

    @Builder.Default
    private List<String> buildingIds = new ArrayList<>();

    private String managerAccountId;

    @Builder.Default
    private List<String> memberAccountIds = new ArrayList<>();

    @Builder.Default
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    @Builder.Default
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

