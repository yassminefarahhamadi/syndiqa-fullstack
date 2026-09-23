package tn.esprit.pidev.repositories.solarenergy;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;

import java.util.List;
import java.util.Optional;

public interface SolarSystemRepository extends MongoRepository<SolarSystem, String> {
    Optional<SolarSystem> findByBuildingId(String buildingId);
    Page<SolarSystem> findByBuildingIdIn(List<String> buildingIds, Pageable pageable);
}
