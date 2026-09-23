package tn.esprit.pidev.repositories.communityevents;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.communityevents.AnnouncementAcknowledgement;

import java.util.List;
import java.util.Optional;

public interface AnnouncementAcknowledgementRepository extends MongoRepository<AnnouncementAcknowledgement, String> {
    Optional<AnnouncementAcknowledgement> findByAnnouncementIdAndAccountId(String announcementId, String accountId);
    List<AnnouncementAcknowledgement> findByAnnouncementId(String announcementId);
    long countByAnnouncementId(String announcementId);
}
