package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.communityevents.AccountStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends MongoRepository<Account, String> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Account> findByOrganizationId(String organizationId);
    List<Account> findByRole(AccountRole role);
    List<Account> findByStatus(AccountStatus status);
    List<Account> findByOrganizationIdAndRole(String organizationId, AccountRole role);
    long countByRole(AccountRole role);
    long countByStatus(AccountStatus status);
}
