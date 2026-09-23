package tn.esprit.pidev.repositories.maintenance;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.maintenance.MaintenanceRequest;

import java.util.List;

public interface MaintenanceRequestRepository extends MongoRepository<MaintenanceRequest, String> {
	List<MaintenanceRequest> findByOrganizationId(String organizationId);
	List<MaintenanceRequest> findByReporterAccountId(String reporterAccountId);
}

