package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import tn.esprit.pidev.dto.AnnouncementResponse;
import tn.esprit.pidev.dto.CommunityDashboardResponse;
import tn.esprit.pidev.dto.CommunityEventResponse;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.EventCategory;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.services.communityevents.CommunityCsvExportService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CommunityCsvExportServiceTest {

    private final CommunityCsvExportService service = new CommunityCsvExportService();

    @Test
    void exportAnnouncementsEscapesCommasAndQuotes() {
        String csv = service.exportAnnouncements(List.of(AnnouncementResponse.builder()
            .id("ann-1")
            .title("Water, outage")
            .content("Please prepare \"water\" bottles")
            .type(AnnouncementType.MAINTENANCE)
            .priority(Priority.HIGH)
            .build()));

        assertTrue(csv.contains("\"Water, outage\""));
        assertTrue(csv.contains("\"Please prepare \"\"water\"\" bottles\""));
    }

    @Test
    void exportEventsUsesPosterPresenceInsteadOfRawSvg() {
        String csv = service.exportEvents(List.of(CommunityEventResponse.builder()
            .id("event-1")
            .title("Movie Night")
            .description("Outdoor screening")
            .category(EventCategory.SOCIAL)
            .status(EventStatus.DRAFT)
            .aiPosterSvg("<svg></svg>")
            .averageRating(4.5)
            .feedbackCount(2L)
            .feedbackOpen(true)
            .build()));

        assertTrue(csv.contains("hasAiPoster"));
        assertTrue(csv.contains("averageRating"));
        assertTrue(csv.contains("feedbackCount"));
        assertTrue(csv.contains("true"));
        assertTrue(!csv.contains("<svg></svg>"));
    }

    @Test
    void exportDashboardWritesMetricRows() {
        String csv = service.exportDashboard(CommunityDashboardResponse.builder()
            .totalEvents(2)
            .upcomingEvents(1)
            .build());

        assertTrue(csv.contains("metric,value"));
        assertTrue(csv.contains("totalEvents,2"));
        assertTrue(csv.contains("upcomingEvents,1"));
        assertTrue(csv.contains("averageEventRating,0.0"));
    }
}
