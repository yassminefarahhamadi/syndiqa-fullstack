package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.financial.Expense;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.IExpenseService;

import java.util.List;

/**
 * Expense REST Controller — JWT-authenticated, org-isolated.
 * Expenses are syndicate-managed: only PLATFORM_ADMIN and SYNDIC_ADMIN.
 */
@RestController
@RequestMapping("/expense")
@RequiredArgsConstructor
public class ExpenseRestController {

    private final IExpenseService expenseService;

    @PostMapping
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Expense> addExpense(@RequestBody Expense expense, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        Expense created = expenseService.addExpense(orgId, expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Expense>> getAllExpenses(HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(expenseService.getAllExpenses(orgId));
    }

    @GetMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Expense> getExpenseById(@PathVariable String id, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(expenseService.getExpenseById(orgId, id));
    }

    @GetMapping("/building/{buildingId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<Expense>> getExpensesByBuilding(@PathVariable String buildingId, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(expenseService.getExpensesByBuilding(orgId, buildingId));
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Expense> updateExpense(@PathVariable String id, @RequestBody Expense expense, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        return ResponseEntity.ok(expenseService.updateExpense(orgId, id, expense));
    }

    @DeleteMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<Void> deleteExpense(@PathVariable String id, HttpServletRequest request) {
        String orgId = getOrganizationId(request);
        expenseService.deleteExpense(orgId, id);
        return ResponseEntity.noContent().build();
    }

    private String getOrganizationId(HttpServletRequest request) {
        return (String) request.getAttribute("organizationId");
    }
}
