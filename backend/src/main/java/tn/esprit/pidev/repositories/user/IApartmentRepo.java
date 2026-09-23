package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.Apartment;

import java.util.List;

@Repository
public interface IApartmentRepo extends MongoRepository<Apartment, String> {
    List<Apartment> findByOrganizationId(String organizationId);
}
