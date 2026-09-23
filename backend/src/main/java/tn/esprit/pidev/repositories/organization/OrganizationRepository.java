package tn.esprit.pidev.repositories.organization;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.entities.organization.OrganizationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends MongoRepository<Organization, String> {

    Optional<Organization> findByName(String name) ;

    List<Organization> findByStatus(OrganizationStatus status);

    List<Organization> findByManagerAccountId(String managerAccountId);

    List<Organization> findByMemberAccountIdsContaining(String accountId);

    List<Organization> findByCity(String city);

    boolean existsByName(String name);
}
