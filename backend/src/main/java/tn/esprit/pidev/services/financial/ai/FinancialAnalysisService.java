package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.financial.ai.BankStatementDTO;
import tn.esprit.pidev.dto.financial.ai.FinancialAnalysisDTO;
import tn.esprit.pidev.dto.financial.ai.TransactionDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialAnalysisService {

    private final GeminiApiClient geminiApiClient;

    public FinancialAnalysisDTO analyzeBankStatement(BankStatementDTO bankStatement) {
        log.info("Analyzing bank statement with {} transactions", bankStatement.getTransactions().size());

        // Calculate basic metrics
        double totalIncome = bankStatement.getTransactions().stream()
                .filter(tx -> "CREDIT".equals(tx.getType()) && tx.getAmount() != null)
                .mapToDouble(TransactionDTO::getAmount)
                .sum();

        double totalExpenses = bankStatement.getTransactions().stream()
                .filter(tx -> "DEBIT".equals(tx.getType()) && tx.getAmount() != null)
                .mapToDouble(tx -> Math.abs(tx.getAmount()))
                .sum();

        double savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        // Group expenses by category
        Map<String, Double> expensesByCategory = bankStatement.getTransactions().stream()
                .filter(tx -> "DEBIT".equals(tx.getType()) && tx.getAmount() != null)
                .collect(Collectors.groupingBy(
                        TransactionDTO::getCategory,
                        Collectors.summingDouble(tx -> Math.abs(tx.getAmount()))
                ));

        // Generate AI insights
        String financialHealthScore = calculateHealthScore(savingsRate, totalIncome, totalExpenses);
        List<String> recommendations = generateRecommendations(bankStatement, expensesByCategory, savingsRate);
        List<String> investmentSuggestions = generateInvestmentSuggestions(totalIncome - totalExpenses, bankStatement.getBalance());
        String summary = generateSummary(bankStatement, totalIncome, totalExpenses, savingsRate);

        return FinancialAnalysisDTO.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .savingsRate(savingsRate)
                .financialHealthScore(financialHealthScore)
                .expensesByCategory(expensesByCategory)
                .recommendations(recommendations)
                .investmentSuggestions(investmentSuggestions)
                .summary(summary)
                .build();
    }

    private String calculateHealthScore(double savingsRate, double income, double expenses) {
        if (savingsRate >= 20) return "EXCELLENT";
        if (savingsRate >= 10) return "GOOD";
        if (savingsRate >= 0) return "AVERAGE";
        return "POOR";
    }

    private List<String> generateRecommendations(BankStatementDTO statement, Map<String, Double> expenses, double savingsRate) {
        String prompt = String.format(
                "Tu es un conseiller financier tunisien. Analyse ces données financières et donne 3-4 recommandations pratiques:\n\n" +
                "Revenus: %.2f TND\n" +
                "Dépenses: %.2f TND\n" +
                "Taux d'épargne: %.1f%%\n" +
                "Répartition des dépenses: %s\n\n" +
                "Donne des conseils spécifiques et pratiques pour améliorer la situation financière. " +
                "Réponds en français avec une liste de recommandations courtes et actionables.",
                statement.getTransactions().stream().filter(tx -> "CREDIT".equals(tx.getType())).mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0).sum(),
                expenses.values().stream().mapToDouble(Double::doubleValue).sum(),
                savingsRate,
                expenses.toString()
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 800);
        
        if (aiResponse.isPresent()) {
            return Arrays.asList(aiResponse.get().split("\n"))
                    .stream()
                    .filter(line -> !line.trim().isEmpty())
                    .map(line -> line.replaceAll("^[•\\-\\*\\d\\.\\)\\s]+", "").trim())
                    .filter(line -> !line.isEmpty())
                    .collect(Collectors.toList());
        }

        // Fallback recommendations
        List<String> fallback = new ArrayList<>();
        if (savingsRate < 10) {
            fallback.add("Essayez d'économiser au moins 10% de vos revenus chaque mois");
        }
        double totalIncome = statement.getTransactions().stream()
                .filter(tx -> "CREDIT".equals(tx.getType()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0)
                .sum();
        if (expenses.getOrDefault("FOOD", 0.0) > totalIncome * 0.3) {
            fallback.add("Vos dépenses alimentaires sont élevées - considérez cuisiner plus à la maison");
        }
        fallback.add("Suivez vos dépenses quotidiennes pour identifier les économies possibles");
        return fallback;
    }

    private List<String> generateInvestmentSuggestions(double availableFunds, Double currentBalance) {
        if (availableFunds <= 0) {
            return Arrays.asList("Concentrez-vous d'abord sur l'équilibrage de votre budget avant d'investir");
        }

        String prompt = String.format(
                "Tu es un conseiller en investissement tunisien. Une personne a %.2f TND disponibles pour investir " +
                "avec un solde bancaire de %.2f TND. Donne 3-4 suggestions d'investissement adaptées au marché tunisien:\n\n" +
                "Considère: SICAV, obligations d'État, immobilier, épargne bancaire, etc.\n" +
                "Réponds en français avec des suggestions concrètes et les rendements approximatifs.",
                availableFunds,
                currentBalance != null ? currentBalance : 0.0
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 600);
        
        if (aiResponse.isPresent()) {
            return Arrays.asList(aiResponse.get().split("\n"))
                    .stream()
                    .filter(line -> !line.trim().isEmpty())
                    .map(line -> line.replaceAll("^[•\\-\\*\\d\\.\\)\\s]+", "").trim())
                    .filter(line -> !line.isEmpty())
                    .collect(Collectors.toList());
        }

        // Fallback suggestions
        List<String> fallback = new ArrayList<>();
        if (availableFunds > 5000) {
            fallback.add("SICAV diversifiées (rendement 6-8% annuel)");
            fallback.add("Obligations d'État tunisiennes (rendement 7-8% annuel)");
        } else {
            fallback.add("Compte épargne bancaire (3-5% annuel) pour commencer");
        }
        fallback.add("Gardez 3-6 mois de dépenses en fonds d'urgence");
        return fallback;
    }

    private String generateSummary(BankStatementDTO statement, double income, double expenses, double savingsRate) {
        String prompt = String.format(
                "Résume en 2-3 phrases la situation financière de cette personne:\n\n" +
                "Revenus: %.2f TND\n" +
                "Dépenses: %.2f TND\n" +
                "Taux d'épargne: %.1f%%\n" +
                "Nombre de transactions: %d\n\n" +
                "Donne un résumé encourageant et constructif en français.",
                income, expenses, savingsRate, statement.getTransactions().size()
        );

        Optional<String> aiResponse = geminiApiClient.callGemini(prompt, 300);
        
        return aiResponse.orElse(String.format(
                "Vos revenus s'élèvent à %.2f TND avec des dépenses de %.2f TND, " +
                "ce qui représente un taux d'épargne de %.1f%%. " +
                "Il y a des opportunités d'amélioration pour optimiser votre situation financière.",
                income, expenses, savingsRate
        ));
    }
}