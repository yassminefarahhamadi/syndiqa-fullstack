package tn.esprit.pidev.repositories.organization;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.organization.ActivityType;
import tn.esprit.pidev.entities.organization.OrganizationActivity;

import java.util.List;

public interface OrganizationActivityRepository extends MongoRepository<OrganizationActivity, String> {

    List<OrganizationActivity> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    List<OrganizationActivity> findByOrganizationIdInOrderByCreatedAtDesc(List<String> organizationIds);

    List<OrganizationActivity> findByOrganizationIdAndTypeOrderByCreatedAtDesc(
        String organizationId, ActivityType type);
}
