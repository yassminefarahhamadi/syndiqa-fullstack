package tn.esprit.pidev.services.communityevents;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.communityevents.Announcement;
import tn.esprit.pidev.entities.communityevents.AnnouncementAcknowledgement;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.ResidentProfile;
import tn.esprit.pidev.enums.TargetScope;
import tn.esprit.pidev.exception.BadRequestException;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.communityevents.AnnouncementAcknowledgementRepository;
import tn.esprit.pidev.repositories.communityevents.AnnouncementRepository;
import tn.esprit.pidev.repositories.user.ResidentProfileRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementAcknowledgementRepository acknowledgementRepository;
    private final ResidentProfileRepository residentProfileRepository;

    @Override
    public Announcement createAnnouncement(Announcement announcement) {
        applyTargetRules(announcement);
        applyPinRules(announcement);
        announcement.setCreatedAt(LocalDateTime.now());
        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    @Override
    public List<Announcement> getAllAnnouncements(String organizationId, String accountId, AccountRole role) {
        List<Announcement> announcements = announcementRepository.findByOrganizationId(organizationId);
        if (role != AccountRole.RESIDENT) {
            return announcements.stream()
                .sorted(announcementComparator())
                .toList();
        }

        String residentBuildingId = getResidentBuildingId(accountId, organizationId);
        return announcements.stream()
            .filter(announcement -> isVisibleToResident(announcement, residentBuildingId))
            .sorted(announcementComparator())
            .toList();
    }

    @Override
    public Announcement getAnnouncementById(String id, String organizationId, String accountId, AccountRole role) {
        Announcement announcement = announcementRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Announcement not found with id: " + id));
        if (!organizationId.equals(announcement.getOrganizationId())) {
            throw new NotFoundException("Announcement not found with id: " + id);
        }
        if (role == AccountRole.RESIDENT) {
            String residentBuildingId = getResidentBuildingId(accountId, organizationId);
            if (!isVisibleToResident(announcement, residentBuildingId)) {
                throw new NotFoundException("Announcement not found with id: " + id);
            }
        }
        return announcement;
    }

    @Override
    public Announcement updateAnnouncement(String id, Announcement announcementDetails, String organizationId) {
        Announcement announcement = getAnnouncementByIdForAdmin(id, organizationId);

        announcement.setTitle(announcementDetails.getTitle());
        announcement.setContent(announcementDetails.getContent());
        announcement.setType(announcementDetails.getType());
        announcement.setPriority(announcementDetails.getPriority());
        announcement.setTargetScope(announcementDetails.getTargetScope());
        announcement.setBuildingId(announcementDetails.getBuildingId());
        announcement.setRequiresAcknowledgement(announcementDetails.isRequiresAcknowledgement());
        announcement.setPinned(announcementDetails.isPinned());
        announcement.setPinnedUntil(announcementDetails.getPinnedUntil());
        applyTargetRules(announcement);
        applyPinRules(announcement);
        announcement.setUpdatedAt(LocalDateTime.now());

        return announcementRepository.save(announcement);
    }

    @Override
    public void deleteAnnouncement(String id, String organizationId) {
        Announcement announcement = getAnnouncementByIdForAdmin(id, organizationId);
        announcementRepository.delete(announcement);
    }

    @Override
    public AnnouncementAcknowledgement acknowledgeAnnouncement(String id, String organizationId, String accountId, AccountRole role) {
        Announcement announcement = getAnnouncementById(id, organizationId, accountId, role);
        if (!announcement.isRequiresAcknowledgement()) {
            throw new BadRequestException("Announcement does not require acknowledgement");
        }

        return acknowledgementRepository.findByAnnouncementIdAndAccountId(id, accountId)
            .orElseGet(() -> acknowledgementRepository.save(AnnouncementAcknowledgement.builder()
                .announcementId(id)
                .accountId(accountId)
                .organizationId(organizationId)
                .acknowledgedAt(LocalDateTime.now())
                .build()));
    }

    @Override
    public List<AnnouncementAcknowledgement> getAcknowledgements(String id, String organizationId) {
        getAnnouncementByIdForAdmin(id, organizationId);
        return acknowledgementRepository.findByAnnouncementId(id);
    }

    @Override
    public boolean isPinActive(Announcement announcement) {
        return announcement.isPinned()
            && (announcement.getPinnedUntil() == null || announcement.getPinnedUntil().isAfter(LocalDateTime.now()));
    }

    private Announcement getAnnouncementByIdForAdmin(String id, String organizationId) {
        Announcement announcement = announcementRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Announcement not found with id: " + id));
        if (!organizationId.equals(announcement.getOrganizationId())) {
            throw new NotFoundException("Announcement not found with id: " + id);
        }
        return announcement;
    }

    private void applyTargetRules(Announcement announcement) {
        if (announcement.getTargetScope() == null) {
            announcement.setTargetScope(TargetScope.ORGANIZATION);
        }
        if (announcement.getTargetScope() == TargetScope.BUILDING) {
            if (announcement.getBuildingId() == null || announcement.getBuildingId().isBlank()) {
                throw new BadRequestException("buildingId is required for building-targeted announcements");
            }
            return;
        }
        announcement.setBuildingId(null);
    }

    private void applyPinRules(Announcement announcement) {
        if (!announcement.isPinned()) {
            announcement.setPinnedUntil(null);
            return;
        }
        if (announcement.getPinnedUntil() != null && !announcement.getPinnedUntil().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("pinnedUntil must be in the future");
        }
    }

    private Comparator<Announcement> announcementComparator() {
        return Comparator
            .comparing((Announcement announcement) -> !isPinActive(announcement))
            .thenComparing(
                Announcement::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
            );
    }

    private String getResidentBuildingId(String accountId, String organizationId) {
        return residentProfileRepository.findByAccountId(accountId)
            .filter(profile -> Objects.equals(profile.getOrganizationId(), organizationId))
            .map(ResidentProfile::getBuildingId)
            .orElse(null);
    }

    private boolean isVisibleToResident(Announcement announcement, String residentBuildingId) {
        TargetScope scope = announcement.getTargetScope() == null
            ? TargetScope.ORGANIZATION
            : announcement.getTargetScope();
        if (scope == TargetScope.ORGANIZATION) {
            return true;
        }
        return residentBuildingId != null && residentBuildingId.equals(announcement.getBuildingId());
    }
}
