package tn.esprit.pidev.controllers.organization;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.TenantRiskRequestDto;
import tn.esprit.pidev.dto.TenantRiskResponseDto;
import tn.esprit.pidev.entities.organization.Lease;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.services.organization.LeaseService;
import tn.esprit.pidev.services.organization.OrganizationService;
import tn.esprit.pidev.services.organization.TenantRiskService;
import tn.esprit.pidev.entities.organization.LeaseStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leases")
@RequiredArgsConstructor
public class LeaseController {

    private final LeaseService leaseService;
    private final OrganizationService organizationService;
    private final TenantRiskService tenantRiskService;

    // ─── AI Tenant Risk ─────────────────────────────────────────────────────────

    @PostMapping("/tenant-risk")
    public ResponseEntity<TenantRiskResponseDto> assessTenantRisk(@RequestBody TenantRiskRequestDto request) {
        return ResponseEntity.ok(tenantRiskService.assessRisk(
                request.getTenantAccountId(),
                request.getMonthlyRent() != null ? request.getMonthlyRent() : 0.0));
    }

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<Lease> create(@RequestBody Lease lease, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String organizationId = (String) request.getAttribute("organizationId");
        if ("SYNDIC_ADMIN".equals(role) && organizationId != null && !organizationId.isBlank()) {
            lease.setOrganizationId(organizationId);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(leaseService.createLease(lease));
    }

    @GetMapping
    public ResponseEntity<List<Lease>> getAll(HttpServletRequest request) {
        String role      = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");

        if ("SYNDIC_ADMIN".equals(role)) {
            List<String> orgIds = organizationService.getOrganizationsByManager(accountId)
                .stream().map(Organization::getId).collect(Collectors.toList());
            return ResponseEntity.ok(leaseService.getLeasesByOrganizationIds(orgIds));
        }
        if ("RESIDENT".equals(role)) {
            return ResponseEntity.ok(leaseService.getLeasesByAccount(accountId));
        }
        return ResponseEntity.ok(leaseService.getAllLeases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lease> getById(@PathVariable String id) {
        return ResponseEntity.ok(leaseService.getLeaseById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lease> update(
        @PathVariable String id,
        @RequestBody Lease lease) {
        return ResponseEntity.ok(leaseService.updateLease(id, lease));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        leaseService.deleteLease(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Status management ──────────────────────────────────────────────────────

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Lease> activate(@PathVariable String id) {
        return ResponseEntity.ok(leaseService.activateLease(id));
    }

    @PatchMapping("/{id}/terminate")
    public ResponseEntity<Lease> terminate(@PathVariable String id) {
        return ResponseEntity.ok(leaseService.terminateLease(id));
    }

    @PatchMapping("/{id}/expire")
    public ResponseEntity<Lease> expire(@PathVariable String id) {
        return ResponseEntity.ok(leaseService.expireLease(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Lease>> getByStatus(@PathVariable LeaseStatus status) {
        return ResponseEntity.ok(leaseService.getLeasesByStatus(status));
    }

    // ─── Queries by scope ───────────────────────────────────────────────────────

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Lease>> getByAccount(@PathVariable String accountId) {
        return ResponseEntity.ok(leaseService.getLeasesByAccount(accountId));
    }

    @GetMapping("/account/{accountId}/status/{status}")
    public ResponseEntity<List<Lease>> getByAccountAndStatus(
        @PathVariable String accountId,
        @PathVariable LeaseStatus status) {
        return ResponseEntity.ok(leaseService.getLeasesByAccountAndStatus(accountId, status));
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<Lease>> getByApartment(@PathVariable String apartmentId) {
        return ResponseEntity.ok(leaseService.getLeasesByApartment(apartmentId));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<Lease>> getByBuilding(@PathVariable String buildingId) {
        return ResponseEntity.ok(leaseService.getLeasesByBuilding(buildingId));
    }

    @GetMapping("/building/{buildingId}/status/{status}")
    public ResponseEntity<List<Lease>> getByBuildingAndStatus(
        @PathVariable String buildingId,
        @PathVariable LeaseStatus status) {
        return ResponseEntity.ok(leaseService.getLeasesByBuildingAndStatus(buildingId, status));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Lease>> getByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(leaseService.getLeasesByOrganization(organizationId));
    }

    @GetMapping("/organization/{organizationId}/status/{status}")
    public ResponseEntity<List<Lease>> getByOrganizationAndStatus(
        @PathVariable String organizationId,
        @PathVariable LeaseStatus status) {
        return ResponseEntity.ok(leaseService.getLeasesByOrganizationAndStatus(organizationId, status));
    }

    // ─── Ownership & expiry ─────────────────────────────────────────────────────

    @GetMapping("/owners")
    public ResponseEntity<List<Lease>> getOwnerLeases() {
        return ResponseEntity.ok(leaseService.getOwnerLeases());
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<Lease>> getTenantLeases() {
        return ResponseEntity.ok(leaseService.getTenantLeases());
    }

    @GetMapping("/expired")
    public ResponseEntity<List<Lease>> getExpired() {
        return ResponseEntity.ok(leaseService.getExpiredLeases());
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<List<Lease>> getExpiringSoon(
        @RequestParam(defaultValue = "30") int withinDays) {
        return ResponseEntity.ok(leaseService.getLeasesExpiringSoon(withinDays));
    }

    @GetMapping("/expiring-between")
    public ResponseEntity<List<Lease>> getExpiringBetween(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(leaseService.getLeasesExpiringBetween(from, to));
    }
}
