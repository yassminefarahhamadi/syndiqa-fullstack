package tn.esprit.pidev.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.enums.TargetScope;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private AnnouncementType type;

    @NotNull
    private Priority priority;

    @Builder.Default
    private TargetScope targetScope = TargetScope.ORGANIZATION;

    private String buildingId;

    @Builder.Default
    private boolean requiresAcknowledgement = false;

    @Builder.Default
    private boolean pinned = false;

    private LocalDateTime pinnedUntil;
}
