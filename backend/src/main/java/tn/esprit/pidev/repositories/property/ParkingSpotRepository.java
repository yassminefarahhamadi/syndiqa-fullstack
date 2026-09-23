package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.property.ParkingSpot;

import java.util.List;

@Repository
public interface ParkingSpotRepository extends MongoRepository<ParkingSpot, String> {
    List<ParkingSpot> findByBuildingId(String buildingId);
    List<ParkingSpot> findByOrganizationId(String organizationId);
}

