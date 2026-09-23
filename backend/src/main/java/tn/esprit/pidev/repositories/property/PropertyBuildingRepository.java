package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.property.Building;

import java.util.List;

public interface PropertyBuildingRepository extends MongoRepository<Building, String> {
    List<Building> findByResidenceId(String residenceId);
    List<Building> findByOrganizationId(String organizationId);
}
