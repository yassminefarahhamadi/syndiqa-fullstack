package tn.esprit.pidev.controllers.financial;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.financial.Wallet;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.IWalletService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletRestController {

    private final IWalletService walletService;

    @GetMapping("/my-wallet")
    @Roles({AccountRole.RESIDENT})
    public ResponseEntity<Wallet> getMyWallet(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        return ResponseEntity.ok(walletService.getWallet(orgId, accountId));
    }

    @PostMapping("/top-up")
    @Roles({AccountRole.RESIDENT})
    public ResponseEntity<Wallet> topUpWallet(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {

        String orgId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");

        Object rawAmount = payload.get("amount");
        if (rawAmount == null) {
            throw new IllegalArgumentException("amount is required");
        }
        Double amount = Double.valueOf(rawAmount.toString());
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        String method = (String) payload.getOrDefault("method", "Credit Card");

        return ResponseEntity.ok(walletService.addFunds(orgId, accountId, amount, method));
    }

    @GetMapping("/admin/{userId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Wallet> getResidentWallet(@PathVariable String userId, HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(walletService.getWallet(orgId, userId));
    }
}
