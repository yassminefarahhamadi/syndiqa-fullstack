package tn.esprit.pidev.repositories.communityevents;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.communityevents.Announcement;

import java.util.List;

public interface AnnouncementRepository extends MongoRepository<Announcement, String> {
    List<Announcement> findByOrganizationId(String organizationId);
    List<Announcement> findByOrganizationIdAndBuildingId(String organizationId, String buildingId);
}
