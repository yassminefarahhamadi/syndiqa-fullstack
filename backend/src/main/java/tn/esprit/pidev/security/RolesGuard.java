package tn.esprit.pidev.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import tn.esprit.pidev.entities.user.AccountRole;

import java.util.Arrays;

/**
 * Interceptor that enforces @Roles annotations on controller methods.
 * Reads the role from the SecurityContext and checks against the allowed roles.
 */
@Component
@Slf4j
public class RolesGuard implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                              Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        Roles rolesAnnotation = handlerMethod.getMethodAnnotation(Roles.class);
        if (rolesAnnotation == null) {
            return true; // No role restriction
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"statusCode\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
            return false;
        }

        AccountRole userRole = AccountRole.valueOf(jwtAuth.getRole());
        boolean hasRole = Arrays.asList(rolesAnnotation.value()).contains(userRole);

        if (!hasRole) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"statusCode\":403,\"error\":\"Forbidden\",\"message\":\"Insufficient role privileges\"}");
            return false;
        }

        return true;
    }
}

