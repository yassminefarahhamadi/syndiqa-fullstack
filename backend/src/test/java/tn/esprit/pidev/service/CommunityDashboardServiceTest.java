package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.dto.CommunityDashboardResponse;
import tn.esprit.pidev.entities.communityevents.Announcement;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventFeedback;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.repositories.communityevents.AnnouncementAcknowledgementRepository;
import tn.esprit.pidev.repositories.communityevents.AnnouncementRepository;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventFeedbackRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;
import tn.esprit.pidev.services.communityevents.AnnouncementService;
import tn.esprit.pidev.services.communityevents.CommunityDashboardService;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityDashboardServiceTest {

    @Mock
    private CommunityEventRepository communityEventRepository;

    @Mock
    private EventParticipationRepository eventParticipationRepository;

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementAcknowledgementRepository acknowledgementRepository;

    @Mock
    private AnnouncementService announcementService;

    @Mock
    private EventFeedbackRepository eventFeedbackRepository;

    @InjectMocks
    private CommunityDashboardService service;

    @Test
    void getStatsAggregatesCommunityMetrics() {
        CommunityEvent fullEvent = CommunityEvent.builder()
            .id("event-1")
            .status(EventStatus.PUBLISHED)
            .startDate(LocalDateTime.now().plusDays(1))
            .maxCapacity(2)
            .build();
        CommunityEvent openEvent = CommunityEvent.builder()
            .id("event-2")
            .status(EventStatus.DRAFT)
            .startDate(LocalDateTime.now().minusDays(1))
            .maxCapacity(10)
            .build();
        Announcement urgentPinned = Announcement.builder()
            .id("ann-1")
            .priority(Priority.URGENT)
            .requiresAcknowledgement(true)
            .pinned(true)
            .pinnedUntil(LocalDateTime.now().plusDays(1))
            .build();
        Announcement normalRequired = Announcement.builder()
            .id("ann-2")
            .priority(Priority.MEDIUM)
            .requiresAcknowledgement(true)
            .build();

        when(communityEventRepository.findByOrganizationId("org-1")).thenReturn(List.of(fullEvent, openEvent));
        when(eventParticipationRepository.countByEventIdAndStatus("event-1", ParticipationStatus.REGISTERED)).thenReturn(2L);
        when(eventParticipationRepository.countByEventIdAndStatus("event-2", ParticipationStatus.REGISTERED)).thenReturn(3L);
        when(announcementRepository.findByOrganizationId("org-1")).thenReturn(List.of(urgentPinned, normalRequired));
        when(acknowledgementRepository.countByAnnouncementId("ann-1")).thenReturn(1L);
        when(acknowledgementRepository.countByAnnouncementId("ann-2")).thenReturn(0L);
        when(announcementService.isPinActive(urgentPinned)).thenReturn(true);
        when(announcementService.isPinActive(normalRequired)).thenReturn(false);
        when(eventFeedbackRepository.findByOrganizationId("org-1")).thenReturn(List.of(
            EventFeedback.builder().eventId("event-1").rating(5).build(),
            EventFeedback.builder().eventId("event-1").rating(4).build(),
            EventFeedback.builder().eventId("event-2").rating(2).build()
        ));

        CommunityDashboardResponse response = service.getStats("org-1");

        assertEquals(2, response.getTotalEvents());
        assertEquals(1, response.getUpcomingEvents());
        assertEquals(1, response.getPublishedEvents());
        assertEquals(1, response.getFullEvents());
        assertEquals(5, response.getTotalRegistrations());
        assertEquals(2, response.getTotalAnnouncements());
        assertEquals(1, response.getUrgentAnnouncements());
        assertEquals(1, response.getPinnedAnnouncements());
        assertEquals(2, response.getAcknowledgementRequiredAnnouncements());
        assertEquals(1, response.getTotalAcknowledgements());
        assertEquals(1, response.getPendingAcknowledgements());
        assertEquals(3.7, response.getAverageEventRating());
        assertEquals(3, response.getTotalEventFeedback());
        assertEquals("event-1", response.getHighestRatedEventId());
        assertEquals(4.5, response.getHighestRatedEventAverage());
        assertEquals("event-2", response.getLowestRatedEventId());
        assertEquals(2.0, response.getLowestRatedEventAverage());
    }
}
