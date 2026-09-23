package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.enums.ParticipationStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventParticipationResponse {
    private String id;
    private String eventId;
    private String accountId;
    private String organizationId;
    private ParticipationStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
}
