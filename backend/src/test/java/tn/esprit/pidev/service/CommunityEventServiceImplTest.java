package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.services.communityevents.CommunityEventServiceImpl;
import tn.esprit.pidev.services.communityevents.EventPosterAiService;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommunityEventServiceImplTest {

    @Mock
    private CommunityEventRepository communityEventRepository;

    @Mock
    private EventPosterAiService eventPosterAiService;

    @InjectMocks
    private CommunityEventServiceImpl service;

    @Test
    void createEventStoresGeneratedPosterSvgWhenGeminiReturnsOne() {
        CommunityEvent event = CommunityEvent.builder()
            .title("Community meeting")
            .description("Discuss building updates")
            .startDate(LocalDateTime.now().plusDays(2))
            .endDate(LocalDateTime.now().plusDays(2).plusHours(2))
            .location("Main hall")
            .build();
        when(eventPosterAiService.generatePosterSvg(event)).thenReturn(Optional.of("<svg></svg>"));
        when(communityEventRepository.save(any(CommunityEvent.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        CommunityEvent result = service.createEvent(event);

        ArgumentCaptor<CommunityEvent> captor = ArgumentCaptor.forClass(CommunityEvent.class);
        verify(communityEventRepository).save(captor.capture());
        assertEquals(EventStatus.DRAFT, result.getStatus());
        assertEquals("<svg></svg>", captor.getValue().getAiPosterSvg());
        assertNotNull(captor.getValue().getAiPosterGeneratedAt());
    }
}
