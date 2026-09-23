package tn.esprit.pidev.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

/**
 * Custom authentication token wrapping JWT claims.
 * Stored in SecurityContextHolder after JWT validation.
 */
public class JwtAuthenticationToken extends AbstractAuthenticationToken {

    private final String accountId;
    private final String organizationId;
    private final String role;
    private final String status;

    public JwtAuthenticationToken(String accountId, String organizationId, String role, String status) {
        super(List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        this.accountId = accountId;
        this.organizationId = organizationId;
        this.role = role;
        this.status = status;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return accountId;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public String getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }
}
