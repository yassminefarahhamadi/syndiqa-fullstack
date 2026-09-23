package tn.esprit.pidev.repositories.user;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.user.StaffProfile;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffProfileRepository extends MongoRepository<StaffProfile, String> {
    Optional<StaffProfile> findByAccountId(String accountId);

    List<StaffProfile> findByDepartment(String department);
    List<StaffProfile> findByOrganizationIdAndDepartment(String organizationId, String department);
    List<StaffProfile> findByOrganizationId(String organizationId);
}


