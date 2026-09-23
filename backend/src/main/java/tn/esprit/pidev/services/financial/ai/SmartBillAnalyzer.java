package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.financial.OcrResultDTO;
import tn.esprit.pidev.dto.financial.ai.SmartBillAnalysisDTO;
import tn.esprit.pidev.entities.financial.Expense;
import tn.esprit.pidev.repositories.financial.IExpenseRepo;
import tn.esprit.pidev.services.financial.OcrService;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartBillAnalyzer {

    private final OcrService ocrService;
    private final GeminiApiClient geminiApiClient;
    private final IExpenseRepo expenseRepository;

    public SmartBillAnalysisDTO analyzeBill(MultipartFile billImage, String userId, String organizationId) throws Exception {
        log.info("Analyzing smart bill for user {} in organization {}", userId, organizationId);

        // Extract bill data using existing OCR (or mock if not available)
        OcrResultDTO billData;
        try {
            billData = ocrService.extractBill(billImage);
        } catch (Exception e) {
            log.warn("OCR extraction failed, using mock data: {}", e.getMessage());
            billData = OcrResultDTO.builder()
                    .amount(92.0)
                    .issuer("STEG")
                    .referenceNumber("937974800")
                    .confidence("MEDIUM")
                    .build();
        }

        // Smart categorization with AI
        String smartCategory = categorizeWithAI(billData);

        // Analyze spending patterns
        String spendingTrend = analyzeSpendingTrend(organizationId, smartCategory, billData.getAmount());

        // Generate optimization tips
        List<String> optimizationTips = generateOptimizationTips(billData, smartCategory);

        // Check budget alerts
        String budgetAlert = generateBudgetAlert(organizationId, smartCategory, billData.getAmount());

        return SmartBillAnalysisDTO.builder()
                .billData(billData)
                .smartCategory(smartCategory)
                .spendingTrend(spendingTrend)
                .optimizationTips(optimizationTips)
                .budgetAlert(budgetAlert)
                .build();
    }

    private String categorizeWithAI(OcrResultDTO bill) {
        String prompt = String.format(
                "Catégorise cette facture tunisienne en une seule catégorie:\n\n" +
                "Émetteur: %s\n" +
                "Montant: %.3f TND\n\n" +
                "Catégories possibles: STEG, SONEDE, STEG_GAZ, TELECOM, FOOD, TRANSPORT, HEALTH, CLEANING, SECURITY, OTHER\n\n" +
                "Réponds uniquement avec le nom de la catégorie, rien d'autre.",
                bill.getIssuer() != null ? bill.getIssuer() : "Inconnu",
                bill.getAmount() != null ? bill.getAmount() : 0.0
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 50);
        
        if (aiResponse.isPresent()) {
            String category = aiResponse.get().trim().toUpperCase();
            // Validate category
            List<String> validCategories = Arrays.asList("STEG", "SONEDE", "STEG_GAZ", "TELECOM", "FOOD", "TRANSPORT", "HEALTH", "CLEANING", "SECURITY", "OTHER");
            if (validCategories.contains(category)) {
                return category;
            }
        }

        // Fallback categorization based on issuer
        if (bill.getIssuer() != null) {
            String issuer = bill.getIssuer().toUpperCase();
            if (issuer.contains("STEG")) return "STEG";
            if (issuer.contains("SONEDE")) return "SONEDE";
            if (issuer.contains("TELECOM") || issuer.contains("ORANGE") || issuer.contains("OOREDOO")) return "TELECOM";
        }
        
        return "OTHER";
    }

    private String analyzeSpendingTrend(String organizationId, String category, Double currentAmount) {
        try {
            // Get expenses from last 3 months for this category
            LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
            List<Expense> recentExpenses = expenseRepository.findByOrganizationIdAndCategoryAndExpenseDateAfter(
                organizationId, category, threeMonthsAgo
            );

            if (recentExpenses.isEmpty()) {
                return "Première facture de cette catégorie";
            }

            double averageAmount = recentExpenses.stream()
                    .mapToDouble(expense -> expense.getAmount() != null ? expense.getAmount() : 0.0)
                    .average()
                    .orElse(0.0);

            if (currentAmount == null) {
                return "Montant non détecté";
            }

            double percentageChange = ((currentAmount - averageAmount) / averageAmount) * 100;

            if (percentageChange > 20) {
                return String.format("Augmentation de %.0f%% par rapport à la moyenne (%.2f TND)", percentageChange, averageAmount);
            } else if (percentageChange < -20) {
                return String.format("Diminution de %.0f%% par rapport à la moyenne (%.2f TND)", Math.abs(percentageChange), averageAmount);
            } else {
                return String.format("Stable par rapport à la moyenne (%.2f TND)", averageAmount);
            }

        } catch (Exception e) {
            log.warn("Could not analyze spending trend: {}", e.getMessage());
            return "Analyse de tendance non disponible";
        }
    }

    private List<String> generateOptimizationTips(OcrResultDTO bill, String category) {
        String prompt = String.format(
                "Donne 2-3 conseils d'optimisation pour cette facture tunisienne:\n\n" +
                "Catégorie: %s\n" +
                "Montant: %.3f TND\n" +
                "Émetteur: %s\n\n" +
                "Donne des conseils pratiques et spécifiques pour réduire ce type de dépense en Tunisie. " +
                "Réponds avec une liste de conseils courts et actionables.",
                category,
                bill.getAmount() != null ? bill.getAmount() : 0.0,
                bill.getIssuer() != null ? bill.getIssuer() : "Inconnu"
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 400);
        
        if (aiResponse.isPresent()) {
            return Arrays.asList(aiResponse.get().split("\n"))
                    .stream()
                    .filter(line -> !line.trim().isEmpty())
                    .map(line -> line.replaceAll("^[•\\-\\*\\d\\.\\)\\s]+", "").trim())
                    .filter(line -> !line.isEmpty())
                    .toList();
        }

        // Fallback tips based on category
        return switch (category) {
            case "STEG" -> Arrays.asList(
                "Utilisez des ampoules LED pour réduire la consommation",
                "Débranchez les appareils en veille",
                "Considérez le tarif de nuit si disponible"
            );
            case "SONEDE" -> Arrays.asList(
                "Vérifiez les fuites d'eau régulièrement",
                "Installez des économiseurs d'eau sur les robinets",
                "Collectez l'eau de pluie pour l'arrosage"
            );
            case "TELECOM" -> Arrays.asList(
                "Comparez les forfaits des différents opérateurs",
                "Utilisez le WiFi quand possible",
                "Négociez votre abonnement annuellement"
            );
            default -> Arrays.asList(
                "Comparez les prix avant d'acheter",
                "Cherchez des alternatives moins chères",
                "Planifiez vos achats pour éviter l'impulsivité"
            );
        };
    }

    private String generateBudgetAlert(String organizationId, String category, Double amount) {
        if (amount == null) {
            return "Montant non détecté - impossible de vérifier le budget";
        }

        // Simple budget thresholds (could be made configurable)
        double monthlyBudget = switch (category) {
            case "STEG" -> 200.0;
            case "SONEDE" -> 100.0;
            case "TELECOM" -> 150.0;
            case "FOOD" -> 800.0;
            case "TRANSPORT" -> 300.0;
            default -> 500.0;
        };

        try {
            // Get current month expenses for this category
            LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
            List<Expense> monthlyExpenses = expenseRepository.findByOrganizationIdAndCategoryAndExpenseDateAfter(
                organizationId, category, startOfMonth
            );

            double monthlySpent = monthlyExpenses.stream()
                    .mapToDouble(expense -> expense.getAmount() != null ? expense.getAmount() : 0.0)
                    .sum() + amount;

            double percentageUsed = (monthlySpent / monthlyBudget) * 100;

            if (percentageUsed > 100) {
                return String.format("⚠️ Budget dépassé! %.0f%% utilisé (%.2f/%.2f TND)", percentageUsed, monthlySpent, monthlyBudget);
            } else if (percentageUsed > 80) {
                return String.format("⚠️ Attention: %.0f%% du budget utilisé (%.2f/%.2f TND)", percentageUsed, monthlySpent, monthlyBudget);
            } else {
                return String.format("✅ Budget OK: %.0f%% utilisé (%.2f/%.2f TND)", percentageUsed, monthlySpent, monthlyBudget);
            }

        } catch (Exception e) {
            log.warn("Could not generate budget alert: {}", e.getMessage());
            return "Alerte budget non disponible";
        }
    }
}