package tn.esprit.pidev.repositories.communityevents;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.communityevents.EventFeedback;

import java.util.List;
import java.util.Optional;

public interface EventFeedbackRepository extends MongoRepository<EventFeedback, String> {
    List<EventFeedback> findByEventId(String eventId);
    List<EventFeedback> findByOrganizationId(String organizationId);
    Optional<EventFeedback> findByEventIdAndAccountId(String eventId, String accountId);
    long countByEventId(String eventId);
}
