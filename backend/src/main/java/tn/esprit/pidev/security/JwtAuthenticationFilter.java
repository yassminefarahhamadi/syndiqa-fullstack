package tn.esprit.pidev.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tn.esprit.pidev.services.user.TokenService;

import java.io.IOException;

/**
 * JWT authentication filter — runs once per request.
 * 1. Extracts Bearer token from Authorization header
 * 2. Parses and validates the JWT
 * 3. Checks account status is ACTIVE (rejects SUSPENDED/ARCHIVED with 403)
 * 4. Sets SecurityContext with JwtAuthenticationToken
 * 5. Attaches accountId, organizationId, role to request attributes
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            try {
                Claims claims = tokenService.parseAccessToken(token);

                String accountId = claims.getSubject();
                String organizationId = claims.get("organizationId", String.class);
                String role = claims.get("role", String.class);
                String status = claims.get("status", String.class);

                // Reject non-ACTIVE accounts
                if (!"ACTIVE".equals(status)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"statusCode\":403,\"error\":\"Forbidden\",\"message\":\"Account is " +
                            status.toLowerCase() + "\"}"
                    );
                    return;
                }

                // Set security context
                JwtAuthenticationToken authToken = new JwtAuthenticationToken(
                        accountId, organizationId, role, status);
                SecurityContextHolder.getContext().setAuthentication(authToken);

                // Attach to request attributes for easy access in controllers
                request.setAttribute("accountId", accountId);
                request.setAttribute("organizationId", organizationId);
                request.setAttribute("role", role);

            } catch (Exception e) {
                log.debug("JWT validation failed: {}", e.getMessage());
                // Don't set authentication — Spring Security will reject as 401
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

