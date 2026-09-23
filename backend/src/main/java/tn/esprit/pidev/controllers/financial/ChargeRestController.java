package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.IChargeService;

import java.util.List;
import java.util.Map;

/**
 * Charge REST Controller — JWT-authenticated, org-isolated.
 *
 * Permission matrix:
 *   Create charge        → PLATFORM_ADMIN, SYNDIC_ADMIN
 *   View all charges     → PLATFORM_ADMIN, SYNDIC_ADMIN
 *   View own charges     → PLATFORM_ADMIN, SYNDIC_ADMIN, RESIDENT_OWNER, RESIDENT_TENANT
 *   Make payment         → RESIDENT_OWNER, RESIDENT_TENANT
 *   View all (building)  → PLATFORM_ADMIN, SYNDIC_ADMIN
 *   Mark overdue         → PLATFORM_ADMIN, SYNDIC_ADMIN
 */
@RestController
@RequestMapping("/charge")
@RequiredArgsConstructor
public class ChargeRestController {

    private final IChargeService chargeService;

    @PostMapping
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Charge> addCharge(@RequestBody Charge charge, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        Charge created = chargeService.addCharge(orgId, charge);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Charge>> getAllCharges(HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(chargeService.getAllCharges(orgId));
    }

    @GetMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.RESIDENT})
    public ResponseEntity<Charge> getChargeById(@PathVariable String id, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(chargeService.getChargeById(orgId, id));
    }

    @GetMapping("/user/{userId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.RESIDENT})
    public ResponseEntity<List<Charge>> getChargesByUser(@PathVariable String userId, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        // IDOR protection: residents can only view their own charges
        String role = (String) request.getAttribute("role");
        if ("RESIDENT".equals(role)) {
            String accountId = getAccountId(request);
            if (!userId.equals(accountId)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(chargeService.getChargesByUser(orgId, userId));
    }

    @GetMapping("/my-charges")
    @Roles({AccountRole.RESIDENT})
    public ResponseEntity<List<Charge>> getMyCharges(HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        String accountId = getAccountId(request);
        return ResponseEntity.ok(chargeService.getChargesByUser(orgId, accountId));
    }

    @GetMapping("/building/{buildingId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Charge>> getChargesByBuilding(@PathVariable String buildingId, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(chargeService.getChargesByBuilding(orgId, buildingId));
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Charge> updateCharge(@PathVariable String id, @RequestBody Charge charge, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(chargeService.updateCharge(orgId, id, charge));
    }

    @DeleteMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Void> deleteCharge(@PathVariable String id, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        chargeService.deleteCharge(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{chargeId}/pay")
    @Roles({AccountRole.RESIDENT})
    public ResponseEntity<Charge> processPayment(
            @PathVariable String chargeId,
            @RequestBody Map<String, Object> paymentBody,
            HttpServletRequest request) {

        String orgId = getOrganizationId(request);
        String accountId = getAccountId(request);
        Double amount = ((Number) paymentBody.get("amount")).doubleValue();
        String method = (String) paymentBody.get("method");

        Charge paid = chargeService.processPayment(orgId, accountId, chargeId, amount, method);
        return ResponseEntity.ok(paid);
    }

    @PostMapping("/audit-overdue")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Map<String, Object>> markOverdueCharges(HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        int count = chargeService.markOverdueCharges(orgId);
        return ResponseEntity.ok(Map.of("markedOverdue", count));
    }

    private String getOrganizationId(HttpServletRequest request) {
        return (String) request.getAttribute("organizationId");
    }

    private String getAccountId(HttpServletRequest request) {
        return (String) request.getAttribute("accountId");
    }
}
