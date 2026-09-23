package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.ResidentProfile;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentProfileRepository extends MongoRepository<ResidentProfile, String> {
    Optional<ResidentProfile> findByAccountId(String accountId);
    List<ResidentProfile> findByOrganizationId(String organizationId);
}



