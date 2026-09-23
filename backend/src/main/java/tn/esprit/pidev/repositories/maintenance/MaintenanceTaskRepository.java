package tn.esprit.pidev.repositories.maintenance;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.maintenance.MaintenanceTask;

import java.util.Collection;
import java.util.List;

public interface MaintenanceTaskRepository extends MongoRepository<MaintenanceTask, String> {
	List<MaintenanceTask> findByMaintenanceRequestIdOrderByOrderIndexAsc(String maintenanceRequestId);
	List<MaintenanceTask> findByMaintenanceRequestIdIn(Collection<String> maintenanceRequestIds);
	List<MaintenanceTask> findByAssignedTo(String assignedTo);
	long deleteByMaintenanceRequestId(String maintenanceRequestId);
}

