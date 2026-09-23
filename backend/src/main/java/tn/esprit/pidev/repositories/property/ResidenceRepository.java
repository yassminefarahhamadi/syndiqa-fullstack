package tn.esprit.pidev.repositories.property;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.property.Residence;

public interface ResidenceRepository extends MongoRepository<Residence, String> {
    // You can add custom queries later if needed
    java.util.List<Residence> findByOrganizationId(String organizationId);
}
