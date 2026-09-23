package tn.esprit.pidev.entities.organization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionItem {

    @Builder.Default
    private String id = UUID.randomUUID().toString();

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
