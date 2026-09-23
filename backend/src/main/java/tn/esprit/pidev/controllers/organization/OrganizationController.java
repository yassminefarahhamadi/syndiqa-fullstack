package tn.esprit.pidev.controllers.organization;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.entities.organization.OrganizationStatus;
import tn.esprit.pidev.entities.user.SubscriptionPlan;
import tn.esprit.pidev.services.organization.OrganizationService;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Organization> create(@RequestBody Organization organization) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(organizationService.createOrganization(organization));
    }

    @GetMapping
    public ResponseEntity<List<Organization>> getAll() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Organization> getById(@PathVariable String id) {
        return ResponseEntity.ok(organizationService.getOrganizationById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Organization> update(
        @PathVariable String id,
        @RequestBody Organization organization) {
        return ResponseEntity.ok(organizationService.updateOrganization(id, organization));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Status management ──────────────────────────────────────────────────────

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<Organization> suspend(@PathVariable String id) {
        return ResponseEntity.ok(organizationService.suspendOrganization(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Organization> activate(@PathVariable String id) {
        return ResponseEntity.ok(organizationService.activateOrganization(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Organization>> getByStatus(@PathVariable OrganizationStatus status) {
        return ResponseEntity.ok(organizationService.getOrganizationsByStatus(status));
    }

    // ─── Subscription ───────────────────────────────────────────────────────────

    @PatchMapping("/{id}/subscription")
    public ResponseEntity<Organization> updateSubscription(
        @PathVariable String id,
        @RequestParam SubscriptionPlan plan) {
        return ResponseEntity.ok(organizationService.updateSubscriptionPlan(id, plan));
    }

    // ─── Members ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/members/{accountId}")
    public ResponseEntity<Organization> addMember(
        @PathVariable String id,
        @PathVariable String accountId) {
        return ResponseEntity.ok(organizationService.addMember(id, accountId));
    }

    @DeleteMapping("/{id}/members/{accountId}")
    public ResponseEntity<Organization> removeMember(
        @PathVariable String id,
        @PathVariable String accountId) {
        return ResponseEntity.ok(organizationService.removeMember(id, accountId));
    }

    @GetMapping("/member/{accountId}")
    public ResponseEntity<List<Organization>> getByMember(@PathVariable String accountId) {
        return ResponseEntity.ok(organizationService.getOrganizationsByMember(accountId));
    }

    // ─── Buildings ──────────────────────────────────────────────────────────────

    @PostMapping("/{id}/buildings/{buildingId}")
    public ResponseEntity<Organization> addBuilding(
        @PathVariable String id,
        @PathVariable String buildingId) {
        return ResponseEntity.ok(organizationService.addBuilding(id, buildingId));
    }

    @DeleteMapping("/{id}/buildings/{buildingId}")
    public ResponseEntity<Organization> removeBuilding(
        @PathVariable String id,
        @PathVariable String buildingId) {
        return ResponseEntity.ok(organizationService.removeBuilding(id, buildingId));
    }

    // ─── Manager ────────────────────────────────────────────────────────────────

    @GetMapping("/manager/{managerAccountId}")
    public ResponseEntity<List<Organization>> getByManager(@PathVariable String managerAccountId) {
        return ResponseEntity.ok(organizationService.getOrganizationsByManager(managerAccountId));
    }
}
