package tn.esprit.pidev.controllers.financial;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.dto.financial.CreditResultDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.FinancialIntegrationService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/integration")
@RequiredArgsConstructor
public class FinancialIntegrationController {

    private final FinancialIntegrationService integrationService;

    @PostMapping("/credit")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<CreditResultDTO> testApplyCredit(@RequestBody CreditRequest req) {
        CreditResultDTO result = integrationService.applyCredit(
                req.getOrgId(), req.getAccountId(), req.getAmount(), req.getSource());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/fee")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Charge> testApplyFee(@RequestBody FeeRequest req) {
        LocalDate due = req.getDueDate() != null ? req.getDueDate() : LocalDate.now().plusDays(7);
        Charge charge = integrationService.applyFee(
                req.getOrgId(), req.getAccountId(), req.getAmount(), req.getSource(), due);
        return ResponseEntity.ok(charge);
    }

    @Data
    static class CreditRequest {
        private String orgId;
        private String accountId;
        private Double amount;
        private String source;
    }

    @Data
    static class FeeRequest {
        private String orgId;
        private String accountId;
        private Double amount;
        private String source;
        private LocalDate dueDate;
    }
}
