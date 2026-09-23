package tn.esprit.pidev.controllers.organization;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.entities.organization.OrganizationActivity;
import tn.esprit.pidev.services.organization.OrganizationActivityService;
import tn.esprit.pidev.services.organization.OrganizationService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationActivityController {

    private final OrganizationActivityService activityService;
    private final OrganizationService organizationService;

    @GetMapping("/{id}/activities")
    public ResponseEntity<List<OrganizationActivity>> getActivities(@PathVariable String id) {
        return ResponseEntity.ok(activityService.getByOrganizationId(id));
    }

    @GetMapping("/activities")
    public ResponseEntity<List<OrganizationActivity>> getMyActivities(HttpServletRequest request) {
        String role      = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");

        if ("SYNDIC_ADMIN".equals(role)) {
            List<String> orgIds = organizationService.getOrganizationsByManager(accountId)
                .stream().map(Organization::getId).collect(Collectors.toList());
            return ResponseEntity.ok(activityService.getByOrganizationIds(orgIds));
        }
        if ("PLATFORM_ADMIN".equals(role)) {
            // Retourner toutes les activités pour toutes les orgs
            List<String> allIds = organizationService.getAllOrganizations()
                .stream().map(Organization::getId).collect(Collectors.toList());
            return ResponseEntity.ok(activityService.getByOrganizationIds(allIds));
        }
        return ResponseEntity.ok(List.of());
    }
}
