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
import java.util.ArrayList;
import java.util.List;

/**
 * LeaseInspection - État des lieux
 * Documenter les inspections pré/post-location pour une location
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lease_inspections")
public class LeaseInspection {

    @Id
    private String id;

    private String leaseId;
    private String apartmentId;
    private String organizationId;

    @Builder.Default
    private InspectionType inspectionType = InspectionType.INITIAL;

    // Inspector - staff member conducting the inspection
    private String inspectorAccountId;

    // Persons present during inspection
    private String tenantAccountId;
    private String managerAccountId;

    private LocalDate inspectionDate;

    @Builder.Default
    private InspectionCondition condition = InspectionCondition.ACCEPTABLE;

    // Detailed inspection items
    @Builder.Default
    private List<InspectionItem> items = new ArrayList<>();

    // Overall condition description
    private String overallCondition;

    // List of damages found
    @Builder.Default
    private List<String> damagesFound = new ArrayList<>();

    // Estimated repair costs
    private BigDecimal costsEstimated;

    // Collection of photos/images URLs
    @Builder.Default
    private List<String> photosUrls = new ArrayList<>();

    // PDF report URL
    private String reportUrl;

    // Person who signed the report
    private String signedBy;

    @Builder.Default
    private LeaseInspectionStatus status = LeaseInspectionStatus.PENDING;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}

