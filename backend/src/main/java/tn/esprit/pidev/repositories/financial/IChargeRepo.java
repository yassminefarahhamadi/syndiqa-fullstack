package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IChargeRepo extends MongoRepository<Charge, String> {
    List<Charge> findByOrganizationId(String organizationId);
    List<Charge> findByOrganizationIdAndUserId(String organizationId, String userId);
    List<Charge> findByOrganizationIdAndBuildingId(String organizationId, String buildingId);
    List<Charge> findByOrganizationIdAndStatus(String organizationId, ChargeStatus status);
    List<Charge> findByOrganizationIdAndStatusAndDueDateBefore(String organizationId, ChargeStatus status, LocalDate date);
    Optional<Charge> findByIdAndOrganizationId(String id, String organizationId);
    List<Charge> findByUserId(String userId);

    List<Charge> findAllByLabel(String label);}
