package tn.esprit.pidev.controllers.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.user.AdminService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ═══════════════════════════════════════════
    //  DASHBOARD
    // ═══════════════════════════════════════════

    @GetMapping("/dashboard")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ═══════════════════════════════════════════
    //  ACCOUNTS
    // ═══════════════════════════════════════════

    @GetMapping("/accounts")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<List<Account>> getAllAccounts(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String organizationId) {
        if (role != null) {
            return ResponseEntity.ok(adminService.getAccountsByRole(AccountRole.valueOf(role)));
        }
        if (organizationId != null) {
            return ResponseEntity.ok(adminService.getAccountsByOrganization(organizationId));
        }
        return ResponseEntity.ok(adminService.getAllAccounts());
    }

    @GetMapping("/syndic/residents")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<List<Account>> getSyndicResidents(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(adminService.getResidentsForOrganization(orgId));
    }

    @GetMapping("/syndic/residents-with-apartments")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<List<Map<String, Object>>> getResidentsWithApartments(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(adminService.getResidentsWithApartmentInfo(orgId));
    }

    @GetMapping("/accounts/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Account> getAccount(@PathVariable String id) {
        return ResponseEntity.ok(adminService.getAccountById(id));
    }

    @PostMapping("/accounts")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Account> createAccount(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String firstName = (String) body.get("firstName");
        String lastName = (String) body.get("lastName");
        String phone = (String) body.get("phone");
        AccountRole role = AccountRole.valueOf((String) body.get("role"));
        String organizationId = (String) body.get("organizationId");
        String password = (String) body.getOrDefault("password", "Temp123!");
        String jobTitle = (String) body.get("jobTitle");
        String department = (String) body.get("department");
        @SuppressWarnings("unchecked")
        List<String> specializations = (List<String>) body.get("specializations");

        Account account = adminService.createAccount(
                email, firstName, lastName, phone, role, organizationId,
                password, jobTitle, department, specializations);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PutMapping("/accounts/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Account> updateAccount(@PathVariable String id, @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        String phone = body.get("phone");
        AccountRole role = body.containsKey("role") ? AccountRole.valueOf(body.get("role")) : null;
        return ResponseEntity.ok(adminService.updateAccount(id, email, firstName, lastName, phone, role));
    }

    @PatchMapping("/accounts/{id}/status")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Account> updateAccountStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        AccountStatus status = AccountStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(adminService.updateAccountStatus(id, status));
    }

    @PostMapping("/accounts/{id}/reset-password")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        String newPassword = body.getOrDefault("password", "Reset123!");
        adminService.resetAccountPassword(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }



    // ═══════════════════════════════════════════
    //  FINANCE
    // ═══════════════════════════════════════════

    @GetMapping("/finance/summary")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Map<String, Object>> getFinanceSummary() {
        return ResponseEntity.ok(adminService.getFinanceSummary());
    }

    // ═══════════════════════════════════════════
    //  AUDIT LOGS
    // ═══════════════════════════════════════════

    @GetMapping("/audit-logs")
    @Roles({AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
