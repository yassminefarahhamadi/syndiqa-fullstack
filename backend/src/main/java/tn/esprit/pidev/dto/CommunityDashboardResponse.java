package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityDashboardResponse {
    private long totalEvents;
    private long upcomingEvents;
    private long publishedEvents;
    private long fullEvents;
    private long totalRegistrations;
    private long totalAnnouncements;
    private long urgentAnnouncements;
    private long pinnedAnnouncements;
    private long acknowledgementRequiredAnnouncements;
    private long totalAcknowledgements;
    private long pendingAcknowledgements;
    private double averageEventRating;
    private long totalEventFeedback;
    private String highestRatedEventId;
    private String highestRatedEventTitle;
    private double highestRatedEventAverage;
    private String lowestRatedEventId;
    private String lowestRatedEventTitle;
    private double lowestRatedEventAverage;
}
