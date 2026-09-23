package tn.esprit.pidev.controllers.communityevents;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.CommunityEventRequest;
import tn.esprit.pidev.dto.CommunityEventResponse;
import tn.esprit.pidev.dto.EventFeedbackRequest;
import tn.esprit.pidev.dto.EventFeedbackResponse;
import tn.esprit.pidev.dto.EventFeedbackSummaryResponse;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventFeedback;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.services.communityevents.CommunityCsvExportService;
import tn.esprit.pidev.services.communityevents.CommunityEventService;
import tn.esprit.pidev.services.communityevents.EventFeedbackService;

import jakarta.servlet.http.HttpServletRequest;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.entities.user.AccountRole;
import java.util.List;

@RestController
@RequestMapping("/api/community-events")
@RequiredArgsConstructor
public class CommunityEventController {

    private final CommunityEventService communityEventService;
    private final EventParticipationRepository eventParticipationRepository;
    private final CommunityCsvExportService communityCsvExportService;
    private final EventFeedbackService eventFeedbackService;
    private final AccountRepository accountRepository;

    @PostMapping
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityEventResponse createEvent(@Valid @RequestBody CommunityEventRequest eventRequest, HttpServletRequest request) {
        CommunityEvent event = toEntity(eventRequest);
        event.setOrganizationId((String) request.getAttribute("organizationId"));
        event.setAccountId((String) request.getAttribute("accountId"));
        return toResponse(communityEventService.createEvent(event), request);
    }

    @GetMapping
    public List<CommunityEventResponse> getAllEvents(HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return communityEventService.getAllEvents(organizationId).stream()
            .map(event -> toResponse(event, request))
            .toList();
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<String> exportEvents(HttpServletRequest request) {
        String csv = communityCsvExportService.exportEvents(getAllEvents(request));
        return csvResponse(csv, "community-events.csv");
    }

    @GetMapping("/{id}")
    public CommunityEventResponse getEventById(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(communityEventService.getEventById(id, organizationId), request);
    }

    @GetMapping("/{eventId}/feedback")
    public List<EventFeedbackResponse> getEventFeedback(@PathVariable String eventId, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        AccountRole role = getRole(request);
        return eventFeedbackService.getFeedbackForEvent(eventId, organizationId).stream()
            .map(feedback -> toFeedbackResponse(feedback, role))
            .toList();
    }

    @GetMapping("/{eventId}/feedback/summary")
    public EventFeedbackSummaryResponse getEventFeedbackSummary(@PathVariable String eventId, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return eventFeedbackService.getFeedbackSummary(eventId, organizationId);
    }

    @PostMapping("/{eventId}/feedback")
    @Roles({AccountRole.RESIDENT})
    public EventFeedbackResponse createOrUpdateFeedback(
            @PathVariable String eventId,
            @Valid @RequestBody EventFeedbackRequest feedbackRequest,
            HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        return toFeedbackResponse(eventFeedbackService.createOrUpdateFeedback(eventId, accountId, organizationId, feedbackRequest), getRole(request));
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityEventResponse updateEvent(@PathVariable String id, @Valid @RequestBody CommunityEventRequest eventRequest, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(communityEventService.updateEvent(id, toEntity(eventRequest), organizationId), request);
    }

    @PatchMapping("/{id}/publish")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityEventResponse publishEvent(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(communityEventService.publishEvent(id, organizationId), request);
    }

    @PatchMapping("/{id}/cancel")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityEventResponse cancelEvent(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(communityEventService.cancelEvent(id, organizationId), request);
    }

    @PatchMapping("/{id}/complete")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityEventResponse completeEvent(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(communityEventService.completeEvent(id, organizationId), request);
    }

    @DeleteMapping("/{id}")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public void deleteEvent(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        communityEventService.deleteEvent(id, organizationId);
    }

    private CommunityEvent toEntity(CommunityEventRequest request) {
        return CommunityEvent.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .category(request.getCategory())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .location(request.getLocation())
            .maxCapacity(request.getMaxCapacity())
            .buildingId(request.getBuildingId())
            .build();
    }

    private CommunityEventResponse toResponse(CommunityEvent event, HttpServletRequest request) {
        long registeredCount = eventParticipationRepository.countByEventIdAndStatus(
            event.getId(),
            ParticipationStatus.REGISTERED
        );
        Integer availableSpots = event.getMaxCapacity() == null
            ? null
            : Math.max(event.getMaxCapacity() - Math.toIntExact(registeredCount), 0);
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        EventFeedbackSummaryResponse feedbackSummary = eventFeedbackService.getFeedbackSummary(event.getId(), organizationId);

        return CommunityEventResponse.builder()
            .id(event.getId())
            .organizationId(event.getOrganizationId())
            .title(event.getTitle())
            .description(event.getDescription())
            .category(event.getCategory())
            .status(event.getStatus())
            .startDate(event.getStartDate())
            .endDate(event.getEndDate())
            .location(event.getLocation())
            .maxCapacity(event.getMaxCapacity())
            .registeredCount(registeredCount)
            .availableSpots(availableSpots)
            .accountId(event.getAccountId())
            .buildingId(event.getBuildingId())
            .aiPosterSvg(event.getAiPosterSvg())
            .aiPosterGeneratedAt(event.getAiPosterGeneratedAt())
            .averageRating(feedbackSummary.getAverageRating())
            .feedbackCount(feedbackSummary.getFeedbackCount())
            .feedbackOpen(eventFeedbackService.isFeedbackOpen(event.getId(), organizationId))
            .currentUserCanFeedback(eventFeedbackService.canAccountFeedback(event.getId(), accountId, organizationId))
            .currentUserReviewed(eventFeedbackService.hasAccountReviewed(event.getId(), accountId))
            .createdAt(event.getCreatedAt())
            .updatedAt(event.getUpdatedAt())
            .build();
    }

    private EventFeedbackResponse toFeedbackResponse(EventFeedback feedback, AccountRole viewerRole) {
        Account account = accountRepository.findById(feedback.getAccountId())
            .filter(found -> feedback.getOrganizationId().equals(found.getOrganizationId()))
            .orElse(null);
        String firstName = account != null ? account.getFirstName() : null;
        String lastName = account != null ? account.getLastName() : null;
        String displayName = displayName(firstName, lastName);
        return EventFeedbackResponse.builder()
            .id(feedback.getId())
            .eventId(feedback.getEventId())
            .accountId(viewerRole == AccountRole.RESIDENT ? null : feedback.getAccountId())
            .residentName(displayName)
            .accountName(displayName)
            .accountFirstName(firstName)
            .accountLastName(lastName)
            .organizationId(feedback.getOrganizationId())
            .rating(feedback.getRating())
            .comment(feedback.getComment())
            .createdAt(feedback.getCreatedAt())
            .updatedAt(feedback.getUpdatedAt())
            .build();
    }

    private AccountRole getRole(HttpServletRequest request) {
        return AccountRole.valueOf((String) request.getAttribute("role"));
    }

    private String displayName(String firstName, String lastName) {
        String fullName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
        return fullName.isBlank() ? "Resident" : fullName;
    }

    private ResponseEntity<String> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(csv);
    }
}
