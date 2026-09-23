package tn.esprit.pidev.services.communityevents;

import tn.esprit.pidev.entities.communityevents.Announcement;

import tn.esprit.pidev.entities.communityevents.AnnouncementAcknowledgement;
import tn.esprit.pidev.entities.user.AccountRole;

import java.util.List;

public interface AnnouncementService {
    Announcement createAnnouncement(Announcement announcement);
    List<Announcement> getAllAnnouncements(String organizationId, String accountId, AccountRole role);
    Announcement getAnnouncementById(String id, String organizationId, String accountId, AccountRole role);
    Announcement updateAnnouncement(String id, Announcement announcementDetails, String organizationId);
    void deleteAnnouncement(String id, String organizationId);
    AnnouncementAcknowledgement acknowledgeAnnouncement(String id, String organizationId, String accountId, AccountRole role);
    List<AnnouncementAcknowledgement> getAcknowledgements(String id, String organizationId);
    boolean isPinActive(Announcement announcement);
}
