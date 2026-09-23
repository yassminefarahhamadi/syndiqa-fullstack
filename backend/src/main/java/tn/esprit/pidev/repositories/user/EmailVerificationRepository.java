package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.EmailVerification;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends MongoRepository<EmailVerification, String> {
    Optional<EmailVerification> findByTokenHash(String tokenHash);
    Optional<EmailVerification> findByAccountId(String accountId);
}


