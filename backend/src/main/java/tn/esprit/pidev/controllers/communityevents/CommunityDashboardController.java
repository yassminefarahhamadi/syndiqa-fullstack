package tn.esprit.pidev.controllers.communityevents;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.dto.CommunityDashboardResponse;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.communityevents.CommunityCsvExportService;
import tn.esprit.pidev.services.communityevents.CommunityDashboardService;

@RestController
@RequestMapping("/api/community-dashboard")
@RequiredArgsConstructor
public class CommunityDashboardController {

    private final CommunityDashboardService communityDashboardService;
    private final CommunityCsvExportService communityCsvExportService;

    @GetMapping
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public CommunityDashboardResponse getStats(HttpServletRequest request) {
        return communityDashboardService.getStats((String) request.getAttribute("organizationId"));
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<String> exportStats(HttpServletRequest request) {
        String csv = communityCsvExportService.exportDashboard(getStats(request));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("text/csv"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"community-dashboard.csv\"")
            .body(csv);
    }
}
