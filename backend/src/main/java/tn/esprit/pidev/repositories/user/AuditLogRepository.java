package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.AuditLog;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
}


