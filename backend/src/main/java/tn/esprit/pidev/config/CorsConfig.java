package tn.esprit.pidev.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS is now handled by SecurityConfig via the security filter chain.
 * This class is kept as a placeholder to avoid missing-class issues.
 *
 * @see tn.esprit.pidev.security.SecurityConfig#corsConfigurationSource()
 */
@Configuration
public class CorsConfig {
    // Intentionally empty — CORS config moved to SecurityConfig
}
