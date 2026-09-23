package tn.esprit.pidev.repositories.IncidentAlert;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.IncidentAlert.Alert;

import java.util.List;

public interface AlertRepository extends MongoRepository<Alert, String> {

    List<Alert> findByIncidentId(String incidentId);

    List<Alert> findByTargetRole(String target);
    Long countByIsReadFalse();
    List<Alert> findByIncidentIdInOrderByCreatedAtDesc(List<String> incidentIds);

}

