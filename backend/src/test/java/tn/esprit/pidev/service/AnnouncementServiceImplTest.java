package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.entities.communityevents.Announcement;
import tn.esprit.pidev.entities.communityevents.AnnouncementAcknowledgement;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.ResidentProfile;
import tn.esprit.pidev.enums.TargetScope;
import tn.esprit.pidev.exception.BadRequestException;
import tn.esprit.pidev.repositories.communityevents.AnnouncementAcknowledgementRepository;
import tn.esprit.pidev.repositories.communityevents.AnnouncementRepository;
import tn.esprit.pidev.repositories.user.ResidentProfileRepository;
import tn.esprit.pidev.services.communityevents.AnnouncementServiceImpl;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceImplTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @Mock
    private AnnouncementAcknowledgementRepository acknowledgementRepository;

    @Mock
    private ResidentProfileRepository residentProfileRepository;

    @InjectMocks
    private AnnouncementServiceImpl service;

    @Test
    void createBuildingTargetedAnnouncementRequiresBuildingId() {
        Announcement announcement = Announcement.builder()
            .organizationId("org-1")
            .targetScope(TargetScope.BUILDING)
            .build();

        assertThrows(BadRequestException.class, () -> service.createAnnouncement(announcement));
        verify(announcementRepository, never()).save(any(Announcement.class));
    }

    @Test
    void residentOnlySeesOrganizationAndOwnBuildingAnnouncements() {
        Announcement organizationAnnouncement = Announcement.builder()
            .id("ann-1")
            .organizationId("org-1")
            .targetScope(TargetScope.ORGANIZATION)
            .build();
        Announcement ownBuildingAnnouncement = Announcement.builder()
            .id("ann-2")
            .organizationId("org-1")
            .targetScope(TargetScope.BUILDING)
            .buildingId("building-a")
            .build();
        Announcement otherBuildingAnnouncement = Announcement.builder()
            .id("ann-3")
            .organizationId("org-1")
            .targetScope(TargetScope.BUILDING)
            .buildingId("building-b")
            .build();

        when(announcementRepository.findByOrganizationId("org-1"))
            .thenReturn(List.of(organizationAnnouncement, ownBuildingAnnouncement, otherBuildingAnnouncement));
        when(residentProfileRepository.findByAccountId("resident-1"))
            .thenReturn(Optional.of(ResidentProfile.builder()
                .accountId("resident-1")
                .organizationId("org-1")
                .buildingId("building-a")
                .build()));

        List<Announcement> result = service.getAllAnnouncements("org-1", "resident-1", AccountRole.RESIDENT);

        assertEquals(List.of(organizationAnnouncement, ownBuildingAnnouncement), result);
    }

    @Test
    void acknowledgeAnnouncementCreatesSingleAcknowledgement() {
        Announcement announcement = Announcement.builder()
            .id("ann-1")
            .organizationId("org-1")
            .targetScope(TargetScope.ORGANIZATION)
            .requiresAcknowledgement(true)
            .build();
        when(announcementRepository.findById("ann-1")).thenReturn(Optional.of(announcement));
        when(acknowledgementRepository.findByAnnouncementIdAndAccountId("ann-1", "resident-1"))
            .thenReturn(Optional.empty());
        when(acknowledgementRepository.save(any(AnnouncementAcknowledgement.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        AnnouncementAcknowledgement result = service.acknowledgeAnnouncement(
            "ann-1",
            "org-1",
            "resident-1",
            AccountRole.RESIDENT
        );

        assertEquals("ann-1", result.getAnnouncementId());
        assertEquals("resident-1", result.getAccountId());
        assertEquals("org-1", result.getOrganizationId());
        assertNotNull(result.getAcknowledgedAt());
    }

    @Test
    void getAllAnnouncementsSortsActivePinnedAnnouncementsFirst() {
        Announcement regularAnnouncement = Announcement.builder()
            .id("ann-1")
            .organizationId("org-1")
            .targetScope(TargetScope.ORGANIZATION)
            .createdAt(LocalDateTime.now())
            .build();
        Announcement pinnedAnnouncement = Announcement.builder()
            .id("ann-2")
            .organizationId("org-1")
            .targetScope(TargetScope.ORGANIZATION)
            .pinned(true)
            .pinnedUntil(LocalDateTime.now().plusDays(1))
            .createdAt(LocalDateTime.now().minusDays(1))
            .build();

        when(announcementRepository.findByOrganizationId("org-1"))
            .thenReturn(List.of(regularAnnouncement, pinnedAnnouncement));

        List<Announcement> result = service.getAllAnnouncements("org-1", "admin-1", AccountRole.SYNDIC_ADMIN);

        assertEquals(List.of(pinnedAnnouncement, regularAnnouncement), result);
    }
}
