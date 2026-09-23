package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.exception.ConflictException;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;
import tn.esprit.pidev.services.communityevents.EventParticipationServiceImpl;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventParticipationServiceImplTest {

    @Mock
    private EventParticipationRepository repository;

    @Mock
    private CommunityEventRepository communityEventRepository;

    @InjectMocks
    private EventParticipationServiceImpl service;

    @Test
    void unregisterCancelsParticipationInsteadOfDeletingIt() {
        EventParticipation participation = EventParticipation.builder()
            .id("participation-1")
            .eventId("event-1")
            .accountId("account-1")
            .status(ParticipationStatus.REGISTERED)
            .build();
        CommunityEvent event = CommunityEvent.builder()
            .id("event-1")
            .organizationId("org-1")
            .status(EventStatus.PUBLISHED)
            .build();
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(repository.findByEventIdAndAccountId("event-1", "account-1"))
            .thenReturn(Optional.of(participation));

        service.unregister("event-1", "account-1", "org-1");

        ArgumentCaptor<EventParticipation> captor = ArgumentCaptor.forClass(EventParticipation.class);
        verify(repository).save(captor.capture());
        verify(repository, never()).delete(any(EventParticipation.class));
        assertEquals(ParticipationStatus.CANCELLED, captor.getValue().getStatus());
        assertNotNull(captor.getValue().getUpdatedAt());
    }

    @Test
    void registerRejectsExistingActiveParticipation() {
        EventParticipation existing = EventParticipation.builder()
            .eventId("event-1")
            .accountId("account-1")
            .status(ParticipationStatus.REGISTERED)
            .build();
        EventParticipation request = EventParticipation.builder()
            .eventId("event-1")
            .accountId("account-1")
            .build();
        when(repository.findByEventIdAndAccountId("event-1", "account-1"))
            .thenReturn(Optional.of(existing));

        assertThrows(ConflictException.class, () -> service.register(request));
        verify(repository, never()).save(any(EventParticipation.class));
    }

    @Test
    void registerReactivatesCancelledParticipation() {
        EventParticipation existing = EventParticipation.builder()
            .id("participation-1")
            .eventId("event-1")
            .accountId("account-1")
            .organizationId("old-org")
            .status(ParticipationStatus.CANCELLED)
            .build();
        EventParticipation request = EventParticipation.builder()
            .eventId("event-1")
            .accountId("account-1")
            .organizationId("org-1")
            .build();
        CommunityEvent event = CommunityEvent.builder()
            .id("event-1")
            .organizationId("org-1")
            .status(EventStatus.PUBLISHED)
            .maxCapacity(10)
            .build();
        when(repository.findByEventIdAndAccountId("event-1", "account-1"))
            .thenReturn(Optional.of(existing));
        when(communityEventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(repository.countByEventIdAndStatus("event-1", ParticipationStatus.REGISTERED)).thenReturn(1L);
        when(repository.save(existing)).thenReturn(existing);

        EventParticipation result = service.register(request);

        assertEquals("participation-1", result.getId());
        assertEquals("org-1", result.getOrganizationId());
        assertEquals(ParticipationStatus.REGISTERED, result.getStatus());
        assertNotNull(result.getRegisteredAt());
        assertNotNull(result.getUpdatedAt());
    }
}
