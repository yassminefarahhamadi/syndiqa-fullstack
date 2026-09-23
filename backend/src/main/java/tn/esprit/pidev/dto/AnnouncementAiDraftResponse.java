package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.enums.TargetScope;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementAiDraftResponse {
    private String title;
    private String content;
    private AnnouncementType type;
    private Priority priority;
    private TargetScope suggestedTargetScope;
    private String suggestedBuildingName;
}
