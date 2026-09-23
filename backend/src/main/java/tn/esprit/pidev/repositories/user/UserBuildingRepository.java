package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.Building;

import java.util.List;

@Repository
public interface UserBuildingRepository extends MongoRepository<Building, String> {
    List<Building> findByOrganizationId(String organizationId);
}

