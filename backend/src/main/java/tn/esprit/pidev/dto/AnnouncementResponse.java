package tn.esprit.pidev.dto;

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
public class AnnouncementResponse {
    private String id;
    private String organizationId;
    private String title;
    private String content;
    private AnnouncementType type;
    private Priority priority;
    private String accountId;
    private TargetScope targetScope;
    private String buildingId;
    private boolean requiresAcknowledgement;
    private boolean acknowledged;
    private LocalDateTime acknowledgedAt;
    private long acknowledgementCount;
    private boolean pinned;
    private boolean pinActive;
    private LocalDateTime pinnedUntil;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
