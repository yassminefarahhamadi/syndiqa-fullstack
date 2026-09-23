package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.property.Equipment;

import java.util.List;

@Repository
public interface EquipmentRepository extends MongoRepository<Equipment, String> {
    List<Equipment> findByBuildingId(String buildingId);
    List<Equipment> findByOrganizationId(String organizationId);
}

