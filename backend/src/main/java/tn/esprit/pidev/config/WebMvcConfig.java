package tn.esprit.pidev.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import tn.esprit.pidev.security.BuildingScopeGuard;
import tn.esprit.pidev.security.OrganizationIsolationInterceptor;
import tn.esprit.pidev.security.RolesGuard;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final RolesGuard rolesGuard;
    private final BuildingScopeGuard buildingScopeGuard;
    private final OrganizationIsolationInterceptor organizationIsolationInterceptor;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rolesGuard)
            .addPathPatterns("/**")
            .excludePathPatterns("/auth/register", "/auth/login", "/auth/verify-email",
                "/auth/accept-invite", "/auth/forgot-password", "/auth/reset-password",
                "/auth/refresh", "/auth/logout",
                "/uploads/**", "/api/buildings/analyze");  // Exclude public AI endpoint

        registry.addInterceptor(organizationIsolationInterceptor)
            .addPathPatterns("/**")
            .excludePathPatterns("/auth/**", "/uploads/**", "/api/buildings/analyze");  // Exclude public AI endpoint

        registry.addInterceptor(buildingScopeGuard)
            .addPathPatterns("/**")
            .excludePathPatterns("/auth/**", "/uploads/**", "/api/buildings/analyze");  // Exclude public AI endpoint
    }

    /**
     * Serves uploaded files (e.g. inspection photos) as static resources
     * URL pattern: http://localhost:8089/uploads/inspections/xxx.jpg
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + uploadDir + "/");
    }
}
