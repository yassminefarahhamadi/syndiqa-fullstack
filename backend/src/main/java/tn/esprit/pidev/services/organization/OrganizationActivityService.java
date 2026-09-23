package tn.esprit.pidev.services.organization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.organization.ActivityType;
import tn.esprit.pidev.entities.organization.OrganizationActivity;
import tn.esprit.pidev.repositories.organization.OrganizationActivityRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationActivityService {

    private final OrganizationActivityRepository activityRepository;

    public void log(String organizationId, ActivityType type, String description) {
        log(organizationId, type, description, null, null);
    }

    public void log(String organizationId, ActivityType type, String description,
                    String actorAccountId, String targetId) {
        if (organizationId == null || organizationId.isBlank()) return;
        try {
            activityRepository.save(OrganizationActivity.builder()
                .organizationId(organizationId)
                .type(type)
                .description(description)
                .actorAccountId(actorAccountId)
                .targetId(targetId)
                .build());
        } catch (Exception e) {
            log.warn("Failed to log activity {} for org {}: {}", type, organizationId, e.getMessage());
        }
    }

    public List<OrganizationActivity> getByOrganizationId(String organizationId) {
        return activityRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
    }

    public List<OrganizationActivity> getByOrganizationIds(List<String> organizationIds) {
        if (organizationIds == null || organizationIds.isEmpty()) return List.of();
        return activityRepository.findByOrganizationIdInOrderByCreatedAtDesc(organizationIds);
    }
}
