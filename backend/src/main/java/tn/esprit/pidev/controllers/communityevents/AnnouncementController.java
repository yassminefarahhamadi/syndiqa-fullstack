package tn.esprit.pidev.controllers.communityevents;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.AnnouncementAiDraftRequest;
import tn.esprit.pidev.dto.AnnouncementAiDraftResponse;
import tn.esprit.pidev.dto.AnnouncementAcknowledgementResponse;
import tn.esprit.pidev.dto.AnnouncementRequest;
import tn.esprit.pidev.dto.AnnouncementResponse;
import tn.esprit.pidev.entities.communityevents.Announcement;
import tn.esprit.pidev.entities.communityevents.AnnouncementAcknowledgement;
import tn.esprit.pidev.repositories.communityevents.AnnouncementAcknowledgementRepository;
import tn.esprit.pidev.services.communityevents.AnnouncementAiAssistantService;
import tn.esprit.pidev.services.communityevents.AnnouncementService;
import tn.esprit.pidev.services.communityevents.CommunityCsvExportService;
import tn.esprit.pidev.entities.user.AccountRole;
import jakarta.servlet.http.HttpServletRequest;
import tn.esprit.pidev.security.Roles;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final AnnouncementAiAssistantService announcementAiAssistantService;
    private final CommunityCsvExportService communityCsvExportService;
    private final AnnouncementAcknowledgementRepository acknowledgementRepository;

    @PostMapping("/ai/draft")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public AnnouncementAiDraftResponse generateAnnouncementDraft(@Valid @RequestBody AnnouncementAiDraftRequest draftRequest) {
        return announcementAiAssistantService.generateDraft(draftRequest);
    }

    @PostMapping
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public AnnouncementResponse createAnnouncement(@Valid @RequestBody AnnouncementRequest announcementRequest, HttpServletRequest request) {
        Announcement announcement = toEntity(announcementRequest);
        announcement.setOrganizationId((String) request.getAttribute("organizationId"));
        announcement.setAccountId((String) request.getAttribute("accountId"));
        return toResponse(announcementService.createAnnouncement(announcement), (String) request.getAttribute("accountId"));
    }

    @GetMapping
    public List<AnnouncementResponse> getAllAnnouncements(HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        AccountRole role = getRole(request);
        return announcementService.getAllAnnouncements(organizationId, accountId, role).stream()
            .map(announcement -> toResponse(announcement, accountId))
            .toList();
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<String> exportAnnouncements(HttpServletRequest request) {
        String csv = communityCsvExportService.exportAnnouncements(getAllAnnouncements(request));
        return csvResponse(csv, "announcements.csv");
    }

    @GetMapping("/{id}")
    public AnnouncementResponse getAnnouncementById(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        AccountRole role = getRole(request);
        return toResponse(announcementService.getAnnouncementById(id, organizationId, accountId, role), accountId);
    }

    @PatchMapping("/{id}/acknowledge")
    @Roles({AccountRole.RESIDENT})
    @ResponseStatus(HttpStatus.OK)
    public AnnouncementAcknowledgementResponse acknowledgeAnnouncement(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        AccountRole role = getRole(request);
        return toAcknowledgementResponse(announcementService.acknowledgeAnnouncement(id, organizationId, accountId, role));
    }

    @GetMapping("/{id}/acknowledgements")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public List<AnnouncementAcknowledgementResponse> getAcknowledgements(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return announcementService.getAcknowledgements(id, organizationId).stream()
            .map(this::toAcknowledgementResponse)
            .toList();
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public AnnouncementResponse updateAnnouncement(@PathVariable String id, @Valid @RequestBody AnnouncementRequest announcementRequest, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return toResponse(announcementService.updateAnnouncement(id, toEntity(announcementRequest), organizationId),
            (String) request.getAttribute("accountId"));
    }

    @DeleteMapping("/{id}")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public void deleteAnnouncement(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        announcementService.deleteAnnouncement(id, organizationId);
    }

    private Announcement toEntity(AnnouncementRequest request) {
        return Announcement.builder()
            .title(request.getTitle())
            .content(request.getContent())
            .type(request.getType())
            .priority(request.getPriority())
            .targetScope(request.getTargetScope())
            .buildingId(request.getBuildingId())
            .requiresAcknowledgement(request.isRequiresAcknowledgement())
            .pinned(request.isPinned())
            .pinnedUntil(request.getPinnedUntil())
            .build();
    }

    private AnnouncementResponse toResponse(Announcement announcement, String accountId) {
        AnnouncementAcknowledgement acknowledgement = acknowledgementRepository
            .findByAnnouncementIdAndAccountId(announcement.getId(), accountId)
            .orElse(null);
        return AnnouncementResponse.builder()
            .id(announcement.getId())
            .organizationId(announcement.getOrganizationId())
            .title(announcement.getTitle())
            .content(announcement.getContent())
            .type(announcement.getType())
            .priority(announcement.getPriority())
            .accountId(announcement.getAccountId())
            .targetScope(announcement.getTargetScope())
            .buildingId(announcement.getBuildingId())
            .requiresAcknowledgement(announcement.isRequiresAcknowledgement())
            .acknowledged(acknowledgement != null)
            .acknowledgedAt(acknowledgement != null ? acknowledgement.getAcknowledgedAt() : null)
            .acknowledgementCount(acknowledgementRepository.countByAnnouncementId(announcement.getId()))
            .pinned(announcement.isPinned())
            .pinActive(announcementService.isPinActive(announcement))
            .pinnedUntil(announcement.getPinnedUntil())
            .createdAt(announcement.getCreatedAt())
            .updatedAt(announcement.getUpdatedAt())
            .build();
    }

    private AnnouncementAcknowledgementResponse toAcknowledgementResponse(AnnouncementAcknowledgement acknowledgement) {
        return AnnouncementAcknowledgementResponse.builder()
            .id(acknowledgement.getId())
            .announcementId(acknowledgement.getAnnouncementId())
            .accountId(acknowledgement.getAccountId())
            .organizationId(acknowledgement.getOrganizationId())
            .acknowledgedAt(acknowledgement.getAcknowledgedAt())
            .build();
    }

    private AccountRole getRole(HttpServletRequest request) {
        return AccountRole.valueOf((String) request.getAttribute("role"));
    }

    private ResponseEntity<String> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(csv);
    }
}
