package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.dto.EventFeedbackRequest;
import tn.esprit.pidev.dto.EventFeedbackSummaryResponse;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventFeedback;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.exception.BadRequestException;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventFeedbackRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;
import tn.esprit.pidev.services.communityevents.EventFeedbackServiceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventFeedbackServiceImplTest {

    @Mock
    private EventFeedbackRepository eventFeedbackRepository;

    @Mock
    private CommunityEventRepository communityEventRepository;

    @Mock
    private EventParticipationRepository eventParticipationRepository;

    @InjectMocks
    private EventFeedbackServiceImpl service;

    @Test
    void createFeedbackRejectsEventBeforeEndDate() {
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(CommunityEvent.builder()
            .id("event-1")
            .organizationId("org-1")
            .status(EventStatus.PUBLISHED)
            .endDate(LocalDateTime.now().plusHours(1))
            .build()));

        assertThrows(BadRequestException.class, () -> service.createOrUpdateFeedback(
            "event-1",
            "account-1",
            "org-1",
            EventFeedbackRequest.builder().rating(5).build()
        ));
        verify(eventFeedbackRepository, never()).save(any(EventFeedback.class));
    }

    @Test
    void createFeedbackRejectsNonParticipant() {
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(finishedEvent()));
        when(eventParticipationRepository.findByEventIdAndAccountId("event-1", "account-1")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> service.createOrUpdateFeedback(
            "event-1",
            "account-1",
            "org-1",
            EventFeedbackRequest.builder().rating(5).build()
        ));
    }

    @Test
    void createFeedbackSavesParticipantFeedbackAfterEventEnds() {
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(finishedEvent()));
        when(eventParticipationRepository.findByEventIdAndAccountId("event-1", "account-1"))
            .thenReturn(Optional.of(EventParticipation.builder().status(ParticipationStatus.REGISTERED).build()));
        when(eventFeedbackRepository.findByEventIdAndAccountId("event-1", "account-1")).thenReturn(Optional.empty());
        when(eventFeedbackRepository.save(any(EventFeedback.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventFeedback feedback = service.createOrUpdateFeedback(
            "event-1",
            "account-1",
            "org-1",
            EventFeedbackRequest.builder().rating(5).comment("Great event").build()
        );

        assertEquals(5, feedback.getRating());
        assertEquals("Great event", feedback.getComment());
        assertEquals("event-1", feedback.getEventId());
        assertEquals("account-1", feedback.getAccountId());
        assertNotNull(feedback.getCreatedAt());
        assertNotNull(feedback.getUpdatedAt());
    }

    @Test
    void summaryCalculatesAverageAndRatingBuckets() {
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(finishedEvent()));
        when(eventFeedbackRepository.findByEventId("event-1")).thenReturn(List.of(
            EventFeedback.builder().rating(5).build(),
            EventFeedback.builder().rating(4).build(),
            EventFeedback.builder().rating(3).build(),
            EventFeedback.builder().rating(1).build()
        ));

        EventFeedbackSummaryResponse summary = service.getFeedbackSummary("event-1", "org-1");

        assertEquals(3.3, summary.getAverageRating());
        assertEquals(4, summary.getFeedbackCount());
        assertEquals(2, summary.getPositiveCount());
        assertEquals(1, summary.getNeutralCount());
        assertEquals(1, summary.getNegativeCount());
    }

    private CommunityEvent finishedEvent() {
        return CommunityEvent.builder()
            .id("event-1")
            .organizationId("org-1")
            .status(EventStatus.PUBLISHED)
            .endDate(LocalDateTime.now().minusHours(1))
            .build();
    }
}
