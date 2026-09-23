package tn.esprit.pidev.repositories.communityevents;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.enums.ParticipationStatus;

import java.util.List;
import java.util.Optional;

public interface EventParticipationRepository extends MongoRepository<EventParticipation, String> {
    List<EventParticipation> findByEventId(String eventId);
    List<EventParticipation> findByAccountId(String accountId);
    long countByEventIdAndStatus(String eventId, ParticipationStatus status);
    Optional<EventParticipation> findByEventIdAndAccountId(String eventId, String accountId);
}
