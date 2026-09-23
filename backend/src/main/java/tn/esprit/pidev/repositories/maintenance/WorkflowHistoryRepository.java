package tn.esprit.pidev.repositories.maintenance;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.maintenance.WorkflowHistory;

public interface WorkflowHistoryRepository extends MongoRepository<WorkflowHistory, String> {
}

