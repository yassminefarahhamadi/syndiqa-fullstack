package tn.esprit.pidev.services.financial;

import tn.esprit.pidev.entities.financial.Wallet;

public interface IWalletService {
    Wallet getWallet(String organizationId, String userId);
    Wallet addFunds(String organizationId, String userId, Double amount, String method);
    Wallet deductFunds(String organizationId, String userId, Double amount, String chargeId);
}
