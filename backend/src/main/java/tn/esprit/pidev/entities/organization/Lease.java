package tn.esprit.pidev.entities.organization;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Read-only from this module — used to derive apartment scope.
 * Other modules own the writes to this collection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leases")
public class Lease {

    @Id
    private String id;

    private String accountId;
    private String apartmentId;
    private String buildingId;


    private String organizationId;

    private LocalDate startDate;
    private LocalDate endDate;

    private BigDecimal monthlyRent;
    private BigDecimal depositAmount;

    @Builder.Default
    private tn.esprit.pidev.entities.organization.LeaseStatus status = LeaseStatus.PENDING;

    private boolean isOwner;
    private String contractFileUrl;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

