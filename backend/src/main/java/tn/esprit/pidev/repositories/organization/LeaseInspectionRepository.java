package tn.esprit.pidev.repositories.organization;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.organization.LeaseInspection;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaseInspectionRepository extends MongoRepository<LeaseInspection, String> {

    // Find by lease
    List<LeaseInspection> findByLeaseId(String leaseId);

    Optional<LeaseInspection> findFirstByLeaseIdOrderByInspectionDateDesc(String leaseId);

    // Find by apartment
    List<LeaseInspection> findByApartmentId(String apartmentId);

    // Find by organization
    List<LeaseInspection> findByOrganizationId(String organizationId);

    List<LeaseInspection> findByOrganizationIdIn(List<String> organizationIds);

    // Find by inspection type
    List<LeaseInspection> findByInspectionType(InspectionType inspectionType);

    // Find by status
    List<LeaseInspection> findByStatus(LeaseInspectionStatus status);

    // Find by inspector
    List<LeaseInspection> findByInspectorAccountId(String inspectorAccountId);

    // Find by tenant
    List<LeaseInspection> findByTenantAccountId(String tenantAccountId);

    List<LeaseInspection> findByTenantAccountIdIn(List<String> tenantAccountIds);

    // Find by manager
    List<LeaseInspection> findByManagerAccountId(String managerAccountId);

    // Combined queries
    List<LeaseInspection> findByLeaseIdAndInspectionType(String leaseId, InspectionType inspectionType);

    List<LeaseInspection> findByLeaseIdAndStatus(String leaseId, LeaseInspectionStatus status);

    List<LeaseInspection> findByOrganizationIdAndStatus(String organizationId, LeaseInspectionStatus status);

    List<LeaseInspection> findByOrganizationIdAndInspectionType(String organizationId, InspectionType inspectionType);

    // Find by date range
    List<LeaseInspection> findByInspectionDateBetween(LocalDate from, LocalDate to);

    List<LeaseInspection> findByOrganizationIdAndInspectionDateBetween(String organizationId, LocalDate from, LocalDate to);

    List<LeaseInspection> findByLeaseIdAndInspectionDateBetween(String leaseId, LocalDate from, LocalDate to);

    // Check existence
    boolean existsByLeaseIdAndInspectionType(String leaseId, InspectionType inspectionType);

    boolean existsByLeaseIdAndInspectionTypeAndStatus(
        String leaseId, InspectionType inspectionType, LeaseInspectionStatus status);
}

