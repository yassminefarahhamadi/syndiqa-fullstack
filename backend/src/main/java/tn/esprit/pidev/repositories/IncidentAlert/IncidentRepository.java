package tn.esprit.pidev.repositories.IncidentAlert;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.IncidentAlert.Incident;

import java.util.List;

public interface IncidentRepository extends MongoRepository<Incident, String> {

    List<Incident> findByCategory(String category);

    List<Incident> findByStatus(String status);
    long countByStatus(String status);

    List<Incident> findByBuildingId(String buildingId);
    List<Incident> findByOrganizationId(String organizationId);
    List<Incident> findByAssignedToAndStatus(String userId, String status);
    List<Incident> findByFinalSeverity(String finalSeverity);
    List<Incident> findByUserId(String userId);
    long countByFinalSeverity(String severity);  // or userSeverity if you want

    List<Incident> findByBuildingIdInOrderByReportedAtDesc(List<String> buildingIds);
    List<Incident> findByBuildingIdIn(List<String> buildingIds);
}

