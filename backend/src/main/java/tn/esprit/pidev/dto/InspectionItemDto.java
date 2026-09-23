package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import tn.esprit.pidev.entities.organization.ItemCategory;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionItemDto {

    private String id;

    private String itemName;

    @Builder.Default
    private ItemCategory category = ItemCategory.AUTRE;

    @Builder.Default
    private InspectionCondition condition = InspectionCondition.ACCEPTABLE;

    private String notes;

    @Builder.Default
    private List<String> photosUrls = new ArrayList<>();

    private BigDecimal estimatedRepairCost;

    @Builder.Default
    private boolean aiAnalyzed = false;
}
