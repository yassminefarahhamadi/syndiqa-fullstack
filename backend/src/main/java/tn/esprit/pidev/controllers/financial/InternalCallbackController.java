package tn.esprit.pidev.controllers.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.services.financial.IChargeService;
import tn.esprit.pidev.services.financial.IWalletService;

import java.util.Map;

/**
 * Internal callback endpoint — called by the Payment Microservice after Stripe confirms.
 * Protected by a shared secret header instead of JWT.
 * NOT exposed to the public — only the payment service calls this.
 */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalCallbackController {

    private final IChargeService chargeService;
    private final IWalletService walletService;

    @Value("${app.internal-secret}")
    private String internalSecret;

    /**
     * Called after Stripe confirms a CHARGE payment.
     * Marks the charge as PAID in the main backend.
     */
    @PostMapping("/payment-settled")
    public ResponseEntity<Map<String, String>> paymentSettled(
            @RequestHeader("X-Internal-Secret") String secret,
            @RequestBody Map<String, Object> body) {

        if (!internalSecret.equals(secret)) {
            log.warn("Internal callback rejected — invalid secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        String type = (String) body.get("type");
        String organizationId = (String) body.get("organizationId");
        String payerId = (String) body.get("payerId");
        Number rawAmount = (Number) body.get("amountTnd");

        if (type == null || organizationId == null || payerId == null || rawAmount == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required fields: type, organizationId, payerId, amountTnd"));
        }
        double amountTnd = rawAmount.doubleValue();

        try {
            if ("CHARGE".equalsIgnoreCase(type)) {
                String chargeId = (String) body.get("referenceId");
                chargeService.processPayment(organizationId, payerId, chargeId, amountTnd, "STRIPE");
                log.info("Internal: charge {} marked PAID for payer {}", chargeId, payerId);
                return ResponseEntity.ok(Map.of("status", "charge_paid"));

            } else if ("TOP_UP".equalsIgnoreCase(type)) {
                walletService.addFunds(organizationId, payerId, amountTnd, "STRIPE");
                log.info("Internal: wallet topped up {} TND for payer {}", amountTnd, payerId);
                return ResponseEntity.ok(Map.of("status", "wallet_topped_up"));

            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unknown type: " + type));
            }
        } catch (Exception e) {
            log.error("Internal callback error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
