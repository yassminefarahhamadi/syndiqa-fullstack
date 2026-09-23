package tn.esprit.pidev.repositories.gamification;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.gamification.ForestStats;

@Repository
public interface ForestStatsRepository extends MongoRepository<ForestStats, String> {
}
