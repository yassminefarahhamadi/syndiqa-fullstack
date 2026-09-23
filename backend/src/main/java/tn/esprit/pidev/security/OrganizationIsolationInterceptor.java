package tn.esprit.pidev.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Organization isolation interceptor.
 * Ensures that req.user.organizationId matches any organizationId
 * present in the request (parameter, path variable, or header).
 *
 * This is a belt-and-suspenders measure — service layer also validates.
 */
@Component
@Slf4j
public class OrganizationIsolationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                              Object handler) throws Exception {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            return true; // Let other guards handle auth
        }

        String userOrgId = jwtAuth.getOrganizationId();

        // Check organizationId in request parameters
        String reqOrgId = request.getParameter("organizationId");

        // Also check in path: /api/.../organizations/{orgId}/...
        // Only if the segment looks like a MongoDB ObjectId (24 hex chars)
        if (reqOrgId == null) {
            String path = request.getRequestURI();
            int orgIdx = path.indexOf("/organizations/");
            if (orgIdx != -1) {
                String afterOrg = path.substring(orgIdx + "/organizations/".length());
                int nextSlash = afterOrg.indexOf('/');
                String segment = nextSlash == -1 ? afterOrg : afterOrg.substring(0, nextSlash);
                if (segment.matches("[a-fA-F0-9]{24}")) {
                    reqOrgId = segment;
                }
            }
        }

        String userRole = jwtAuth.getRole();
        if ("PLATFORM_ADMIN".equals(userRole)) {
            return true;
        }

        if (reqOrgId != null && !reqOrgId.isBlank() && !reqOrgId.equals(userOrgId)) {
            log.warn("Organization isolation violation: user org {} tried to access org {}",
                    userOrgId, reqOrgId);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"statusCode\":403,\"error\":\"Forbidden\",\"message\":\"Access denied to this organization\"}");
            return false;
        }

        return true;
    }
}
