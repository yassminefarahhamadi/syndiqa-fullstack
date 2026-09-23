package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantRiskRequestDto {
    private String tenantAccountId;
    private Double monthlyRent;
}
