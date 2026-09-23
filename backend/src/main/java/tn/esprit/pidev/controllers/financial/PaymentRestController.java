package tn.esprit.pidev.controllers.financial;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.financial.Payment;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.repositories.financial.IPaymentRepo;
import tn.esprit.pidev.security.Roles;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentRestController {

    private final IPaymentRepo paymentRepo;

    @GetMapping("/my-payments")
    @Roles({AccountRole.RESIDENT})
    public ResponseEntity<List<Payment>> getMyPayments(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        return ResponseEntity.ok(paymentRepo.findByOrganizationIdAndUserId(orgId, accountId));
    }

    @GetMapping("/all")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Payment>> getAllPayments(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(paymentRepo.findByOrganizationId(orgId));
    }

    @GetMapping("/charge/{chargeId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Payment>> getPaymentsByCharge(@PathVariable String chargeId, HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(paymentRepo.findByOrganizationIdAndChargeId(orgId, chargeId));
    }

    @GetMapping("/organization/{organizationId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Payment>> getPaymentsByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(paymentRepo.findByOrganizationId(organizationId));
    }

    @GetMapping("/user/{userId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.RESIDENT})
    public ResponseEntity<List<Payment>> getPaymentsByUser(@PathVariable String userId, HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(paymentRepo.findByOrganizationIdAndUserId(orgId, userId));
    }
}
