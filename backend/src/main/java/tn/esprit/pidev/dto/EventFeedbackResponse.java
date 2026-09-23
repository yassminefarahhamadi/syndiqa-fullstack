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
public class EventFeedbackResponse {
    private String id;
    private String eventId;
    private String accountId;
    private String residentName;
    private String accountName;
    private String accountFirstName;
    private String accountLastName;
    private String organizationId;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
