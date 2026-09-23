package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackSummaryResponse {
    private String eventId;
    private double averageRating;
    private long feedbackCount;
    private long positiveCount;
    private long neutralCount;
    private long negativeCount;
}
