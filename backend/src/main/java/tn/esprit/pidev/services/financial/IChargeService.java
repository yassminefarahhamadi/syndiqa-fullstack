package tn.esprit.pidev.services.financial;

import tn.esprit.pidev.entities.financial.Charge;

import java.util.List;

public interface IChargeService {

    Charge addCharge(String organizationId, Charge charge);
    Charge updateCharge(String organizationId, String id, Charge charge);
    void deleteCharge(String organizationId, String id);
    List<Charge> getAllCharges(String organizationId);
    Charge getChargeById(String organizationId, String id);
    List<Charge> getChargesByUser(String organizationId, String userId);
    List<Charge> getChargesByBuilding(String organizationId, String buildingId);

    // BUSINESS SERVICE 1: Intelligent Payment Processing
    Charge processPayment(String organizationId, String userId, String chargeId, Double amount, String method);

    // BUSINESS SERVICE 2: Automatic Overdue Audit
    int markOverdueCharges(String organizationId);
}
