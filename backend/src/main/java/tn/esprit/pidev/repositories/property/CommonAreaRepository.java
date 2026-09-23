package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.property.CommonArea;

import java.util.List;

@Repository
public interface CommonAreaRepository extends MongoRepository<CommonArea, String> {
    List<CommonArea> findByBuildingId(String buildingId);
    List<CommonArea> findByOrganizationId(String organizationId);
}

