package tn.esprit.pidev.controllers.organization;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.InspectionComparisonDto;
import tn.esprit.pidev.dto.InspectionItemDto;
import tn.esprit.pidev.dto.LeaseInspectionDto;
import tn.esprit.pidev.dto.LeaseInspectionResponseDto;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.services.organization.LeaseInspectionService;
import tn.esprit.pidev.services.organization.OrganizationService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lease-inspections")
@RequiredArgsConstructor
public class LeaseInspectionController {

    private final LeaseInspectionService leaseInspectionService;
    private final OrganizationService organizationService;

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<LeaseInspectionResponseDto>> getAllInspections(HttpServletRequest request) {
        String role      = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");

        if ("SYNDIC_ADMIN".equals(role)) {
            List<String> orgIds = organizationService.getOrganizationsByManager(accountId)
                .stream().map(Organization::getId).collect(Collectors.toList());
            return ResponseEntity.ok(leaseInspectionService.getInspectionsByOrganizationIds(orgIds));
        }
        if ("RESIDENT".equals(role)) {
            return ResponseEntity.ok(leaseInspectionService.getInspectionsByTenantAccountId(accountId));
        }
        return ResponseEntity.ok(leaseInspectionService.getAllInspections());
    }

    @GetMapping("/tenant/{tenantAccountId}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getByTenant(@PathVariable String tenantAccountId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByTenantAccountId(tenantAccountId));
    }

    @PostMapping
    public ResponseEntity<LeaseInspectionResponseDto> createInspection(
            @RequestBody LeaseInspectionDto dto, HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String organizationId = (String) request.getAttribute("organizationId");
        if ("SYNDIC_ADMIN".equals(role) && organizationId != null && !organizationId.isBlank()) {
            dto.setOrganizationId(organizationId);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(leaseInspectionService.createInspection(dto));
    }

    @GetMapping("/{inspectionId}")
    public ResponseEntity<LeaseInspectionResponseDto> getInspectionById(@PathVariable String inspectionId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionById(inspectionId));
    }

    @GetMapping("/lease/{leaseId}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByLease(@PathVariable String leaseId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByLeaseId(leaseId));
    }

    @GetMapping("/lease/{leaseId}/latest")
    public ResponseEntity<LeaseInspectionResponseDto> getLatestInspectionForLease(@PathVariable String leaseId) {
        return ResponseEntity.ok(leaseInspectionService.getLatestInspection(leaseId));
    }

    // ─── Items INITIAL (pré-chargement pour inspection FINAL) ───────────────────

    @GetMapping("/lease/{leaseId}/initial-items")
    public ResponseEntity<List<InspectionItemDto>> getInitialItems(@PathVariable String leaseId) {
        return ResponseEntity.ok(leaseInspectionService.getInitialInspectionItems(leaseId));
    }

    // ─── Comparaison INITIAL → FINAL ────────────────────────────────────────────

    @GetMapping("/lease/{leaseId}/comparison")
    public ResponseEntity<InspectionComparisonDto> compareInspections(@PathVariable String leaseId) {
        return ResponseEntity.ok(leaseInspectionService.compareInspections(leaseId));
    }

    // ─── Autres queries ──────────────────────────────────────────────────────────

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByApartment(@PathVariable String apartmentId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByApartmentId(apartmentId));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByOrganizationId(organizationId));
    }

    @GetMapping("/type/{inspectionType}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByType(@PathVariable InspectionType inspectionType) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByType(inspectionType));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByStatus(@PathVariable LeaseInspectionStatus status) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByStatus(status));
    }

    @GetMapping("/inspector/{inspectorAccountId}")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByInspector(@PathVariable String inspectorAccountId) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByInspector(inspectorAccountId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getInspectionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(leaseInspectionService.getInspectionsByDateRange(from, to));
    }

    @GetMapping("/organization/{organizationId}/date-range")
    public ResponseEntity<List<LeaseInspectionResponseDto>> getOrganizationInspectionsByDateRange(
            @PathVariable String organizationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(leaseInspectionService.getOrganizationInspectionsByDateRange(organizationId, from, to));
    }

    // ─── Update & Delete ─────────────────────────────────────────────────────────

    @PutMapping("/{inspectionId}")
    public ResponseEntity<LeaseInspectionResponseDto> updateInspection(
            @PathVariable String inspectionId, @RequestBody LeaseInspectionDto dto) {
        return ResponseEntity.ok(leaseInspectionService.updateInspection(inspectionId, dto));
    }

    @PatchMapping("/{inspectionId}/status")
    public ResponseEntity<LeaseInspectionResponseDto> updateInspectionStatus(
            @PathVariable String inspectionId, @RequestParam LeaseInspectionStatus status) {
        return ResponseEntity.ok(leaseInspectionService.updateInspectionStatus(inspectionId, status));
    }

    @DeleteMapping("/{inspectionId}")
    public ResponseEntity<Void> deleteInspection(@PathVariable String inspectionId) {
        leaseInspectionService.deleteInspection(inspectionId);
        return ResponseEntity.noContent().build();
    }
}
