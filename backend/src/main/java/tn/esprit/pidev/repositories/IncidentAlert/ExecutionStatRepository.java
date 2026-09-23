package tn.esprit.pidev.repositories.IncidentAlert;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.IncidentAlert.ExecutionStat;

public interface ExecutionStatRepository extends MongoRepository<ExecutionStat, String> {
}
