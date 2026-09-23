package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.dto.financial.SyndicDashboardDTO;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.SyndicDashboardService;

@RestController
@RequestMapping("/api/v1/syndic")
@RequiredArgsConstructor
public class SyndicDashboardController {

    private final SyndicDashboardService dashboardService;

    @GetMapping("/dashboard")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<SyndicDashboardDTO> getDashboard(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        SyndicDashboardDTO dashboard = dashboardService.getDashboard(orgId);
        return ResponseEntity.ok(dashboard);
    }
}
