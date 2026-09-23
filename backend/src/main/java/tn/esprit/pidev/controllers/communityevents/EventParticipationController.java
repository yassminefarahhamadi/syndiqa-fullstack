package tn.esprit.pidev.controllers.communityevents;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.EventParticipationResponse;
import tn.esprit.pidev.dto.RegisterEventParticipationRequest;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.services.communityevents.EventParticipationService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/event-participations")
@RequiredArgsConstructor
public class EventParticipationController {

    private final EventParticipationService service;

    @PostMapping
    public EventParticipationResponse register(@Valid @RequestBody RegisterEventParticipationRequest participationRequest, HttpServletRequest request) {
        EventParticipation participation = EventParticipation.builder()
            .eventId(participationRequest.getEventId())
            .build();
        participation.setAccountId((String) request.getAttribute("accountId"));
        participation.setOrganizationId((String) request.getAttribute("organizationId"));
        return toResponse(service.register(participation));
    }

    @GetMapping("/event/{eventId}")
    public List<EventParticipationResponse> getByEvent(@PathVariable String eventId) {
        return service.getByEvent(eventId).stream()
            .map(this::toResponse)
            .toList();
    }

    @GetMapping("/my-participations")
    public List<EventParticipationResponse> getByAccount(HttpServletRequest request) {
        String accountId = (String) request.getAttribute("accountId");
        return service.getByAccount(accountId).stream()
            .map(this::toResponse)
            .toList();
    }

    @DeleteMapping("/event/{eventId}/unregister")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@PathVariable String eventId, HttpServletRequest request) {
        String accountId = (String) request.getAttribute("accountId");
        String organizationId = (String) request.getAttribute("organizationId");
        service.unregister(eventId, accountId, organizationId);
    }

    private EventParticipationResponse toResponse(EventParticipation participation) {
        return EventParticipationResponse.builder()
            .id(participation.getId())
            .eventId(participation.getEventId())
            .accountId(participation.getAccountId())
            .organizationId(participation.getOrganizationId())
            .status(participation.getStatus())
            .registeredAt(participation.getRegisteredAt())
            .updatedAt(participation.getUpdatedAt())
            .build();
    }
}
