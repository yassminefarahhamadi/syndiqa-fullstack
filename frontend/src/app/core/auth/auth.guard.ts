import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard: requires a valid JWT token.
 * Redirects to /auth/login if not authenticated.
 */
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasValidToken()) {
        return true;
    }
    return router.createUrlTree(['/auth/login']);
};

/**
 * Guard: restricts to PLATFORM_ADMIN only.
 * Redirects to the user's default dashboard if wrong role.
 */
export const platformAdminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isPlatformAdmin()) {
        return true;
    }
    // Redirect to their own dashboard — component MUST NOT mount
    return router.createUrlTree([auth.getDefaultRoute()]);
};

/**
 * Guard: restricts to SYNDIC_ADMIN only.
 * Redirects to the user's default dashboard if wrong role.
 */
export const syndicAdminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isSyndicAdmin()) {
        return true;
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};

/**
 * Guard: restricts to RESIDENT only.
 * Redirects to the user's default dashboard if wrong role.
 */
export const residentGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isResident()) {
        return true;
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};

/**
 * Guard: restricts to back-office roles (PLATFORM_ADMIN, SYNDIC_ADMIN).
 * Redirects to /auth/access (access denied) if wrong role.
 */
export const backOfficeGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isBackOffice()) {
        return true;
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};

/**
 * Guard: restricts to front-office roles (RESIDENT).
 */
export const frontOfficeGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isFrontOffice()) {
        return true;
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};

/**
 * Guard: if already logged in, redirect away from login page.
 */
export const noAuthGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasValidToken()) {
        return router.createUrlTree([auth.getDefaultRoute()]);
    }
    return true;
};

/**
 * Guard: restricts to TECHNICAL_STAFF and SYNDIC_ADMIN.
 */
export const techGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.hasValidToken()) {
        return router.createUrlTree(['/auth/login']);
    }
    if (auth.isTechnicalStaff() || auth.isSyndicAdmin()) {
        return true;
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};
