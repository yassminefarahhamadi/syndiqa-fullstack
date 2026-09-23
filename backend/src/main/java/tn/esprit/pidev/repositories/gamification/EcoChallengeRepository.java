package tn.esprit.pidev.repositories.gamification;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.gamification.EcoChallenge;

import java.util.List;

@Repository
public interface EcoChallengeRepository extends MongoRepository<EcoChallenge, String> {
    List<EcoChallenge> findByBuildingId(String buildingId);
    List<EcoChallenge> findByStatus(EcoChallenge.ChallengeStatus status);
}
