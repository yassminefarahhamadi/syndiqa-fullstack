package tn.esprit.pidev.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.StaffProfile;
import tn.esprit.pidev.repositories.user.StaffProfileRepository;

/**
 * Building scope guard for TECHNICAL_STAFF.
 * Validates that the requested buildingId is in their StaffProfile.assignedBuildingIds.
 *
 * Activated when the request contains a "buildingId" parameter or path variable.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BuildingScopeGuard implements HandlerInterceptor {

    private final StaffProfileRepository staffProfileRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                              Object handler) throws Exception {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            return true; // Let other guards handle auth
        }

        AccountRole role = AccountRole.valueOf(jwtAuth.getRole());

        // Only applies to TECHNICAL_STAFF
        if (role != AccountRole.TECHNICAL_STAFF) {
            return true;
        }

        // Check for buildingId in request parameters or path
        String buildingId = request.getParameter("buildingId");
        if (buildingId == null) {
            // Try to extract from path: /api/.../buildings/{buildingId}/...
            String path = request.getRequestURI();
            int buildingIdx = path.indexOf("/buildings/");
            if (buildingIdx != -1) {
                String afterBuildings = path.substring(buildingIdx + "/buildings/".length());
                int nextSlash = afterBuildings.indexOf('/');
                buildingId = nextSlash == -1 ? afterBuildings : afterBuildings.substring(0, nextSlash);
            }
        }

        if (buildingId == null || buildingId.isBlank()) {
            return true; // No building scope to check
        }

        StaffProfile profile = staffProfileRepository.findByAccountId(jwtAuth.getAccountId())
                .orElse(null);

        if (profile == null || !profile.getAssignedBuildingIds().contains(buildingId)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"statusCode\":403,\"error\":\"Forbidden\",\"message\":\"Not assigned to this building\"}");
            return false;
        }

        return true;
    }
}

