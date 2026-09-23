package tn.esprit.pidev.controllers.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.financial.ai.BankStatementDTO;
import tn.esprit.pidev.dto.financial.ai.ChatRequestDTO;
import tn.esprit.pidev.dto.financial.ai.ChatResponseDTO;
import tn.esprit.pidev.dto.financial.ai.FinancialAnalysisDTO;
import tn.esprit.pidev.dto.financial.ai.SmartBillAnalysisDTO;
import tn.esprit.pidev.dto.financial.ai.TransactionDTO;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.services.financial.OcrService;
import tn.esprit.pidev.services.financial.ai.FinancialAnalysisService;
import tn.esprit.pidev.services.financial.ai.FinancialChatbotService;
import tn.esprit.pidev.services.financial.ai.SmartBillAnalyzer;

import java.util.Map;
import java.util.Set;
import java.util.Arrays;
import java.util.List;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/financial-assistant")
@RequiredArgsConstructor
@Slf4j
public class FinancialAssistantController {

    private final OcrService ocrService;
    private final FinancialAnalysisService financialAnalysisService;
    private final FinancialChatbotService financialChatbotService;
    private final SmartBillAnalyzer smartBillAnalyzer;

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostMapping("/analyze-bank-statement")
    @Roles({AccountRole.RESIDENT, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> analyzeBankStatement(@RequestParam("file") MultipartFile file) {
        log.info("Analyzing bank statement upload: {} ({})", file.getOriginalFilename(), file.getSize());

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier trop volumineux (max 5MB)"));
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type de fichier non supporté (JPG, PNG, PDF uniquement)"));
        }

        try {
            // Extract bank statement data
            // For now, create a mock bank statement since full OCR implementation is pending
            BankStatementDTO bankStatement = createMockBankStatement();
            
            if (bankStatement.getTransactions() == null || bankStatement.getTransactions().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of(
                    "error", "Aucune transaction détectée dans le relevé bancaire",
                    "suggestion", "Vérifiez la qualité de l'image et assurez-vous qu'il s'agit d'un relevé bancaire complet"
                ));
            }

            // Analyze financial data
            FinancialAnalysisDTO analysis = financialAnalysisService.analyzeBankStatement(bankStatement);

            log.info("Bank statement analysis completed: {} transactions, health score: {}", 
                    bankStatement.getTransactions().size(), analysis.getFinancialHealthScore());

            return ResponseEntity.ok(Map.of(
                "bankStatement", bankStatement,
                "analysis", analysis,
                "message", "Analyse terminée avec succès"
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid bank statement file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("OCR processing failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during bank statement analysis", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur interne du serveur",
                "details", "Veuillez réessayer plus tard"
            ));
        }
    }

    @PostMapping("/chat")
    @Roles({AccountRole.RESIDENT, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> askFinancialQuestion(@RequestBody ChatRequestDTO request) {
        log.info("Financial chat question from user {}: {}", request.getUserId(), request.getQuestion());

        if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question vide"));
        }

        if (request.getQuestion().length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question trop longue (max 500 caractères)"));
        }

        try {
            ChatResponseDTO response = financialChatbotService.askFinancialQuestion(
                request.getQuestion(), 
                request.getUserId()
            );

            log.info("Financial chat response generated for user {}", request.getUserId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing financial chat question", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur interne du serveur",
                "details", "Veuillez réessayer plus tard"
            ));
        }
    }

    @PostMapping("/analyze-smart-bill")
    @Roles({AccountRole.RESIDENT, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> analyzeSmartBill(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId,
            @RequestParam("organizationId") String organizationId) {
        
        log.info("Analyzing smart bill for user {} in organization {}", userId, organizationId);

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier trop volumineux (max 5MB)"));
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Type de fichier non supporté (JPG, PNG, PDF uniquement)"));
        }

        try {
            SmartBillAnalysisDTO analysis = smartBillAnalyzer.analyzeBill(file, userId, organizationId);

            log.info("Smart bill analysis completed for user {}: category={}, amount={}", 
                    userId, analysis.getSmartCategory(), analysis.getBillData().getAmount());

            return ResponseEntity.ok(Map.of(
                "analysis", analysis,
                "message", "Analyse intelligente terminée avec succès"
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid smart bill file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Smart bill OCR processing failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during smart bill analysis", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Erreur interne du serveur",
                "details", "Veuillez réessayer plus tard"
            ));
        }
    }

    private BankStatementDTO createMockBankStatement() {
        // Mock bank statement for demo purposes
        List<TransactionDTO> transactions = Arrays.asList(
            TransactionDTO.builder()
                    .date(java.time.LocalDate.now().minusDays(5))
                    .description("Salaire")
                    .amount(3000.0)
                    .type("CREDIT")
                    .category("SALARY")
                    .build(),
            TransactionDTO.builder()
                    .date(java.time.LocalDate.now().minusDays(4))
                    .description("Loyer")
                    .amount(-800.0)
                    .type("DEBIT")
                    .category("HOUSING")
                    .build(),
            TransactionDTO.builder()
                    .date(java.time.LocalDate.now().minusDays(3))
                    .description("Courses")
                    .amount(-150.0)
                    .type("DEBIT")
                    .category("FOOD")
                    .build(),
            TransactionDTO.builder()
                    .date(java.time.LocalDate.now().minusDays(2))
                    .description("Transport")
                    .amount(-50.0)
                    .type("DEBIT")
                    .category("TRANSPORT")
                    .build()
        );

        return BankStatementDTO.builder()
                .accountNumber("123456789")
                .bankName("Banque de Tunisie")
                .balance(2000.0)
                .transactions(transactions)
                .statementDate(java.time.LocalDate.now())
                .build();
    }
}