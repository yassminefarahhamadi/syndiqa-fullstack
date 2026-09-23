package tn.esprit.pidev.repositories.communityevents;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;

import java.util.List;

public interface CommunityEventRepository extends MongoRepository<CommunityEvent, String> {
    List<CommunityEvent> findByOrganizationId(String organizationId);
    List<CommunityEvent> findByBuildingId(String buildingId);
}
