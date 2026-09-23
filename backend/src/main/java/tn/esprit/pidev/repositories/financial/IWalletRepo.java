package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.Wallet;

import java.util.Optional;

@Repository
public interface IWalletRepo extends MongoRepository<Wallet, String> {
    Optional<Wallet> findByUserIdAndOrganizationId(String userId, String organizationId);
}
