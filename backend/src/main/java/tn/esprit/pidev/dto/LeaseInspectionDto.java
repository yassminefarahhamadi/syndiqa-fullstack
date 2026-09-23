package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for creating/updating lease inspections
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseInspectionDto {

    private String id;

    private String leaseId;
    private String apartmentId;
    private String organizationId;

    @Builder.Default
    private InspectionType inspectionType = InspectionType.INITIAL;

    private String inspectorAccountId;
    private String tenantAccountId;
    private String managerAccountId;

    private LocalDate inspectionDate;

    @Builder.Default
    private InspectionCondition condition = InspectionCondition.ACCEPTABLE;

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

    @Builder.Default
    private LeaseInspectionStatus status = LeaseInspectionStatus.PENDING;
}

