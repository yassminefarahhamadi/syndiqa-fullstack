package tn.esprit.pidev.repositories.organization;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.organization.Lease;
import tn.esprit.pidev.entities.organization.LeaseStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaseRepository extends MongoRepository<Lease, String> {

    List<Lease> findByAccountId(String accountId);

    List<Lease> findByApartmentId(String apartmentId);

    List<Lease> findByBuildingId(String buildingId);

    List<Lease> findByOrganizationId(String organizationId);

    List<Lease> findByOrganizationIdIn(List<String> organizationIds);

    List<Lease> findByStatus(LeaseStatus status);

    List<Lease> findByAccountIdAndStatus(String accountId, LeaseStatus status);

    Optional<Lease> findFirstByAccountIdAndStatus(String accountId, LeaseStatus status);

    List<Lease> findByBuildingIdAndStatus(String buildingId, LeaseStatus status);

    List<Lease> findByOrganizationIdAndStatus(String organizationId, LeaseStatus status);

    List<Lease> findByIsOwner(boolean isOwner);

    List<Lease> findByEndDateBefore(LocalDate date);

    List<Lease> findByEndDateBetween(LocalDate from, LocalDate to);

    List<Lease> findByAccountIdIn(List<String> accountIds);

    boolean existsByAccountIdAndApartmentIdAndStatus(String accountId, String apartmentId, LeaseStatus status);

    long countByOrganizationIdAndStatus(String organizationId, LeaseStatus status);

    List<Lease> findByStatusAndEndDateBefore(LeaseStatus status, LocalDate date);
}
