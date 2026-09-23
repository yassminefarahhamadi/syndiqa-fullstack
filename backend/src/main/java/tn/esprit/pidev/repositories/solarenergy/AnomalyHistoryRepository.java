package tn.esprit.pidev.repositories.solarenergy;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.solarenergy.AnomalyHistory;

import java.util.List;

public interface AnomalyHistoryRepository extends MongoRepository<AnomalyHistory, String> {
    List<AnomalyHistory> findBySolarSystemIdOrderByTimestampDesc(String solarSystemId);
}
