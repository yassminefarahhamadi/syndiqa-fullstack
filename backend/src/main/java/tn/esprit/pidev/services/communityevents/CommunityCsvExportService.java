package tn.esprit.pidev.services.communityevents;

import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.AnnouncementResponse;
import tn.esprit.pidev.dto.CommunityDashboardResponse;
import tn.esprit.pidev.dto.CommunityEventResponse;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommunityCsvExportService {

    public String exportAnnouncements(List<AnnouncementResponse> announcements) {
        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of(
            "id",
            "title",
            "content",
            "type",
            "priority",
            "targetScope",
            "buildingId",
            "requiresAcknowledgement",
            "acknowledged",
            "acknowledgedAt",
            "acknowledgementCount",
            "pinned",
            "pinActive",
            "pinnedUntil",
            "createdAt",
            "updatedAt"
        ));
        announcements.forEach(announcement -> appendRow(csv, List.of(
            value(announcement.getId()),
            value(announcement.getTitle()),
            value(announcement.getContent()),
            value(announcement.getType()),
            value(announcement.getPriority()),
            value(announcement.getTargetScope()),
            value(announcement.getBuildingId()),
            value(announcement.isRequiresAcknowledgement()),
            value(announcement.isAcknowledged()),
            value(announcement.getAcknowledgedAt()),
            value(announcement.getAcknowledgementCount()),
            value(announcement.isPinned()),
            value(announcement.isPinActive()),
            value(announcement.getPinnedUntil()),
            value(announcement.getCreatedAt()),
            value(announcement.getUpdatedAt())
        )));
        return csv.toString();
    }

    public String exportEvents(List<CommunityEventResponse> events) {
        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of(
            "id",
            "title",
            "description",
            "category",
            "status",
            "startDate",
            "endDate",
            "location",
            "maxCapacity",
            "registeredCount",
            "availableSpots",
            "buildingId",
            "hasAiPoster",
            "aiPosterGeneratedAt",
            "averageRating",
            "feedbackCount",
            "feedbackOpen",
            "createdAt",
            "updatedAt"
        ));
        events.forEach(event -> appendRow(csv, List.of(
            value(event.getId()),
            value(event.getTitle()),
            value(event.getDescription()),
            value(event.getCategory()),
            value(event.getStatus()),
            value(event.getStartDate()),
            value(event.getEndDate()),
            value(event.getLocation()),
            value(event.getMaxCapacity()),
            value(event.getRegisteredCount()),
            value(event.getAvailableSpots()),
            value(event.getBuildingId()),
            value(event.getAiPosterSvg() != null && !event.getAiPosterSvg().isBlank()),
            value(event.getAiPosterGeneratedAt()),
            value(event.getAverageRating()),
            value(event.getFeedbackCount()),
            value(event.getFeedbackOpen()),
            value(event.getCreatedAt()),
            value(event.getUpdatedAt())
        )));
        return csv.toString();
    }

    public String exportDashboard(CommunityDashboardResponse dashboard) {
        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of("metric", "value"));
        appendRow(csv, List.of("totalEvents", value(dashboard.getTotalEvents())));
        appendRow(csv, List.of("upcomingEvents", value(dashboard.getUpcomingEvents())));
        appendRow(csv, List.of("publishedEvents", value(dashboard.getPublishedEvents())));
        appendRow(csv, List.of("fullEvents", value(dashboard.getFullEvents())));
        appendRow(csv, List.of("totalRegistrations", value(dashboard.getTotalRegistrations())));
        appendRow(csv, List.of("totalAnnouncements", value(dashboard.getTotalAnnouncements())));
        appendRow(csv, List.of("urgentAnnouncements", value(dashboard.getUrgentAnnouncements())));
        appendRow(csv, List.of("pinnedAnnouncements", value(dashboard.getPinnedAnnouncements())));
        appendRow(csv, List.of("acknowledgementRequiredAnnouncements", value(dashboard.getAcknowledgementRequiredAnnouncements())));
        appendRow(csv, List.of("totalAcknowledgements", value(dashboard.getTotalAcknowledgements())));
        appendRow(csv, List.of("pendingAcknowledgements", value(dashboard.getPendingAcknowledgements())));
        appendRow(csv, List.of("averageEventRating", value(dashboard.getAverageEventRating())));
        appendRow(csv, List.of("totalEventFeedback", value(dashboard.getTotalEventFeedback())));
        appendRow(csv, List.of("highestRatedEventId", value(dashboard.getHighestRatedEventId())));
        appendRow(csv, List.of("highestRatedEventTitle", value(dashboard.getHighestRatedEventTitle())));
        appendRow(csv, List.of("highestRatedEventAverage", value(dashboard.getHighestRatedEventAverage())));
        appendRow(csv, List.of("lowestRatedEventId", value(dashboard.getLowestRatedEventId())));
        appendRow(csv, List.of("lowestRatedEventTitle", value(dashboard.getLowestRatedEventTitle())));
        appendRow(csv, List.of("lowestRatedEventAverage", value(dashboard.getLowestRatedEventAverage())));
        return csv.toString();
    }

    private void appendRow(StringBuilder csv, List<String> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(escape(values.get(i)));
        }
        csv.append("\r\n");
    }

    private String escape(String value) {
        String safeValue = value == null ? "" : value;
        if (safeValue.contains(",") || safeValue.contains("\"") || safeValue.contains("\n") || safeValue.contains("\r")) {
            return "\"" + safeValue.replace("\"", "\"\"") + "\"";
        }
        return safeValue;
    }

    private String value(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime.toString();
        }
        return String.valueOf(value);
    }
}
