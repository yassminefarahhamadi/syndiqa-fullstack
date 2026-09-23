package tn.esprit.pidev.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.enums.TargetScope;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementAiDraftRequest {
    @NotBlank
    private String prompt;

    @Builder.Default
    private String language = "EN";

    @Builder.Default
    private String tone = "PROFESSIONAL";

    private TargetScope targetScope;
    private String buildingName;
}
