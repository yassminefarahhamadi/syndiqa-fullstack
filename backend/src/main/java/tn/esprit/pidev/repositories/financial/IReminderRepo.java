package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.Reminder;

import java.util.List;

@Repository
public interface IReminderRepo extends MongoRepository<Reminder, String> {
    List<Reminder> findByOrganizationIdAndStatus(String organizationId, String status);
}
