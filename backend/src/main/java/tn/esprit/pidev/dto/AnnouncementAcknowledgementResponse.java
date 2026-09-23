package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementAcknowledgementResponse {
    private String id;
    private String announcementId;
    private String accountId;
    private String organizationId;
    private LocalDateTime acknowledgedAt;
}
