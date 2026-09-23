package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for retrieving lease inspection details (read-only response)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseInspectionResponseDto {

    private String id;

    private String leaseId;
    private String apartmentId;
    private String organizationId;

    private InspectionType inspectionType;

    private String inspectorAccountId;
    private String tenantAccountId;
    private String managerAccountId;

    private LocalDate inspectionDate;

    private InspectionCondition condition;

    @Builder.Default
    private List<InspectionItemDto> items = new ArrayList<>();

    private String overallCondition;

    @Builder.Default
    private List<String> damagesFound = new ArrayList<>();

    private BigDecimal costsEstimated;

    @Builder.Default
    private List<String> photosUrls = new ArrayList<>();

    private String reportUrl;

    private String signedBy;

    private LeaseInspectionStatus status;

    private Instant createdAt;
    private Instant updatedAt;
}

