package tn.esprit.pidev.services.organization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.pidev.dto.TenantRiskResponseDto;
import tn.esprit.pidev.entities.user.Profile;
import tn.esprit.pidev.repositories.user.ProfileRepository;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantRiskService {

    private final ProfileRepository profileRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.python.url:http://localhost:5000}")
    private String pythonBaseUrl;

    public TenantRiskResponseDto assessRisk(String tenantAccountId, double monthlyRent) {
        Profile profile = profileRepository.findByAccountId(tenantAccountId);

        if (profile == null) {
            return TenantRiskResponseDto.builder()
                    .prediction(-1).riskScore(-1)
                    .label("NO_PROFILE").status("no_profile")
                    .build();
        }

        double monthlyIncome     = profile.getSalary();
        double annualIncome      = monthlyIncome * 12;
        double yearsEmployed     = profile.getYearsEmployed();
        double creditHistoryYears = profile.getCreditHistoryLength() / 12.0;
        double hasPaymentInc     = profile.getHasPaymentIncidents() ? 1.0 : 0.0;
        double rentToIncomeRatio = monthlyIncome > 0 ? monthlyRent / monthlyIncome : 0.5;

        Map<String, Object> payload = new HashMap<>();
        payload.put("income",               annualIncome);
        payload.put("rentToIncomeRatio",     rentToIncomeRatio);
        payload.put("hasPaymentIncidents",   hasPaymentInc);
        payload.put("yearsEmployed",         yearsEmployed);
        payload.put("creditHistoryLength",   creditHistoryYears);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    pythonBaseUrl + "/predict", payload, Map.class);

            if (response == null) return buildErrorResponse();

            int    mlPrediction = ((Number) response.get("prediction")).intValue();
            double mlRiskScore  = ((Number) response.get("riskScore")).doubleValue();

            // ── Règles métier post-ML ────────────────────────────────────────
            // Le modèle ML a été entraîné sur des données de prêt US et ignore
            // certains signaux forts présents dans le profil locataire.
            // Ces pénalités corrigent les cas évidents qu'il rate.

            double adjustedScore = mlRiskScore;

            // Règle A : ratio dépenses/salaire > 70% → budget trop serré
            if (monthlyIncome > 0) {
                double expenseRatio = profile.getMonthlyExpenses() / monthlyIncome;
                if (expenseRatio >= 0.70) adjustedScore += 0.30;
                else if (expenseRatio >= 0.50) adjustedScore += 0.10;
            }

            // Règle B : incident de paiement + emploi récent (< 2 ans) → double signal rouge
            if (profile.getHasPaymentIncidents() && yearsEmployed < 2) {
                adjustedScore += 0.25;
            }

            // Règle C : historique crédit < 1 an → hors distribution du modèle
            if (creditHistoryYears < 1.0) {
                adjustedScore += 0.15;
            }

            adjustedScore = Math.min(adjustedScore, 1.0);

            int    prediction = adjustedScore >= 0.5 ? 1 : 0;
            String label      = prediction == 0 ? "BON_LOCATAIRE" : "LOCATAIRE_RISQUE";

            return TenantRiskResponseDto.builder()
                    .prediction(prediction)
                    .riskScore(adjustedScore)
                    .label(label)
                    .status("success")
                    .build();

        } catch (Exception e) {
            log.warn("AI risk service unavailable: {}", e.getMessage());
            return buildErrorResponse();
        }
    }

    private TenantRiskResponseDto buildErrorResponse() {
        return TenantRiskResponseDto.builder()
                .prediction(-1).riskScore(-1)
                .label("UNAVAILABLE").status("error")
                .build();
    }
}
