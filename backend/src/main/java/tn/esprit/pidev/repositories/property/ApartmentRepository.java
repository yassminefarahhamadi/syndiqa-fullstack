package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.property.Apartment;

import java.util.List;

public interface ApartmentRepository extends MongoRepository<Apartment, String> {
    List<Apartment> findByBuildingId(String buildingId);
    List<Apartment> findByOrganizationId(String organizationId);
}
