package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationStatsDto {
    private long totalOrganizations;
    private long totalMembers;
    private long totalBuildings;

    private long totalLeases;
    private long activeLeases;
    private long pendingLeases;
    private long terminatedLeases;
    private long expiredLeases;
    private long leasesExpiringSoon;

    private long totalInspections;
    private long initialInspections;
    private long finalInspections;
    private long completedInspections;
    private long pendingInspections;
    private long disputedInspections;
}
