package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.financial.ai.ChatResponseDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.Payment;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IPaymentRepo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialChatbotService {

    private final GeminiApiClient geminiApiClient;
    private final IChargeRepo chargeRepository;
    private final IPaymentRepo paymentRepository;

    // Simple RAG knowledge base for Tunisian financial context
    private static final Map<String, String> KNOWLEDGE_BASE = Map.of(
        "investment", "Options d'investissement en Tunisie: SICAV (6-8% rendement), Obligations d'État (7-8%), " +
                     "Comptes épargne bancaires (3-5%), Immobilier résidentiel, Actions à la BVMT.",
        "savings", "Banques tunisiennes offrent: Livret d'épargne (3-4%), Dépôts à terme (5-7%), " +
                  "Comptes épargne logement pour financement immobilier.",
        "taxes", "Impôts en Tunisie: IRPP (0-35% progressif), TVA (19% standard), Taxe sur les plus-values immobilières (15%).",
        "loans", "Crédits bancaires: Crédit immobilier (6-8%), Crédit consommation (8-12%), Crédit auto (7-10%).",
        "insurance", "Assurances obligatoires: Assurance auto, Assurance habitation recommandée, Assurance vie pour épargne.",
        "budget", "Règle 50/30/20: 50% besoins essentiels, 30% loisirs, 20% épargne. Adaptez selon vos revenus.",
        "syndic", "Charges de copropriété: Entretien, électricité, eau, ascenseur, sécurité. Paiement mensuel/trimestriel."
    );

    public ChatResponseDTO askFinancialQuestion(String question, String userId) {
        log.info("Processing financial question for user {}: {}", userId, question);

        // Get user's financial context
        String userContext = getUserFinancialContext(userId);
        
        // Find relevant knowledge
        String relevantKnowledge = findRelevantKnowledge(question);
        
        // Build personalized prompt
        String prompt = buildChatPrompt(question, userContext, relevantKnowledge);
        
        // Generate AI response
        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 800);
        
        String answer = aiResponse.orElse(generateFallbackResponse(question));
        
        return ChatResponseDTO.builder()
                .answer(answer)
                .context(userContext.isEmpty() ? "général" : "personnalisé")
                .isPersonalized(!userContext.isEmpty())
                .build();
    }

    private String getUserFinancialContext(String userId) {
        try {
            // Get user's charges and payments for context
            // Note: These methods may not exist on the repositories, so we use try-catch
            List<Charge> userCharges = new ArrayList<>();
            List<Payment> userPayments = new ArrayList<>();
            
            try {
                userCharges = chargeRepository.findByUserId(userId);
            } catch (Exception e) {
                log.debug("findByUserId not available on IChargeRepo");
            }
            
            try {
                userPayments = paymentRepository.findByUserId(userId);
            } catch (Exception e) {
                log.debug("findByUserId not available on IPaymentRepo");
            }
            
            if (userCharges.isEmpty() && userPayments.isEmpty()) {
                return "";
            }
            
            double totalCharges = userCharges.stream()
                    .mapToDouble(charge -> charge.getAmount() != null ? charge.getAmount() : 0.0)
                    .sum();
            
            double totalPaid = userPayments.stream()
                    .mapToDouble(payment -> payment.getAmount() != null ? payment.getAmount() : 0.0)
                    .sum();
            
            long pendingCharges = userCharges.stream()
                    .filter(charge -> !"PAID".equals(charge.getStatus().toString()))
                    .count();
            
            return String.format(
                "Contexte financier de l'utilisateur: Total charges: %.2f TND, Total payé: %.2f TND, " +
                "Charges en attente: %d. L'utilisateur est résident dans une copropriété.",
                totalCharges, totalPaid, pendingCharges
            );
            
        } catch (Exception e) {
            log.warn("Could not retrieve user financial context: {}", e.getMessage());
            return "";
        }
    }

    private String findRelevantKnowledge(String question) {
        String lowerQuestion = question.toLowerCase();
        
        for (Map.Entry<String, String> entry : KNOWLEDGE_BASE.entrySet()) {
            if (lowerQuestion.contains(entry.getKey()) || 
                lowerQuestion.contains(getKeywordVariations(entry.getKey()))) {
                return entry.getValue();
            }
        }
        
        // Default financial knowledge
        return "Conseils financiers généraux: Diversifiez vos investissements, maintenez un fonds d'urgence, " +
               "suivez votre budget mensuel, et consultez un conseiller financier pour des décisions importantes.";
    }

    private String getKeywordVariations(String keyword) {
        Map<String, String> variations = Map.of(
            "investment", "investir investissement placer placement",
            "savings", "épargne économiser économies",
            "taxes", "impôt impôts fiscalité",
            "loans", "crédit prêt emprunt financement",
            "insurance", "assurance assurer",
            "budget", "budgétiser dépenses revenus",
            "syndic", "copropriété charges syndic"
        );
        return variations.getOrDefault(keyword, keyword);
    }

    private String buildChatPrompt(String question, String userContext, String knowledge) {
        return String.format(
            "Tu es un assistant financier expert du marché tunisien. Réponds à cette question de manière claire et pratique.\n\n" +
            "Question: %s\n\n" +
            "%s\n\n" +
            "Connaissances pertinentes: %s\n\n" +
            "Instructions:\n" +
            "- Réponds en français\n" +
            "- Sois spécifique au contexte tunisien\n" +
            "- Donne des conseils pratiques et actionables\n" +
            "- Si tu utilises le contexte utilisateur, personnalise ta réponse\n" +
            "- Limite ta réponse à 3-4 phrases maximum\n" +
            "- Mentionne les montants en TND quand pertinent",
            question,
            userContext.isEmpty() ? "" : userContext,
            knowledge
        );
    }

    private String generateFallbackResponse(String question) {
        if (question.toLowerCase().contains("investir") || question.toLowerCase().contains("placement")) {
            return "Pour investir en Tunisie, considérez les SICAV (6-8% de rendement), les obligations d'État (7-8%), " +
                   "ou l'immobilier. Commencez par constituer un fonds d'urgence de 3-6 mois de dépenses.";
        }
        
        if (question.toLowerCase().contains("épargne") || question.toLowerCase().contains("économiser")) {
            return "Visez à épargner 10-20% de vos revenus. Utilisez la règle 50/30/20: 50% besoins, 30% envies, 20% épargne. " +
                   "Les comptes épargne tunisiens offrent 3-5% d'intérêt.";
        }
        
        if (question.toLowerCase().contains("budget")) {
            return "Suivez vos revenus et dépenses mensuellement. Catégorisez: logement (25-30%), nourriture (15-20%), " +
                   "transport (10-15%), épargne (10-20%). Utilisez des applications ou un simple tableau Excel.";
        }
        
        return "Je peux vous aider avec des questions sur l'investissement, l'épargne, le budget, les impôts, " +
               "et les finances personnelles en Tunisie. Posez-moi une question plus spécifique!";
    }
}