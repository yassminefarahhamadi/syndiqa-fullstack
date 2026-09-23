package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.enums.EventCategory;
import tn.esprit.pidev.enums.EventStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityEventResponse {
    private String id;
    private String organizationId;
    private String title;
    private String description;
    private EventCategory category;
    private EventStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private Integer maxCapacity;
    private Long registeredCount;
    private Integer availableSpots;
    private String accountId;
    private String buildingId;
    private String aiPosterSvg;
    private LocalDateTime aiPosterGeneratedAt;
    private Double averageRating;
    private Long feedbackCount;
    private Boolean feedbackOpen;
    private Boolean currentUserCanFeedback;
    private Boolean currentUserReviewed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
