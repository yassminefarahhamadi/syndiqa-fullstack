package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.Payment;

import java.util.List;

@Repository
public interface IPaymentRepo extends MongoRepository<Payment, String> {
    List<Payment> findByOrganizationId(String organizationId);
    List<Payment> findByOrganizationIdAndUserId(String organizationId, String userId);
    List<Payment> findByOrganizationIdAndChargeId(String organizationId, String chargeId);
    List<Payment> findByUserId(String userId);
    List<Payment> findByChargeIdIn(List<String> chargeIds);
}
