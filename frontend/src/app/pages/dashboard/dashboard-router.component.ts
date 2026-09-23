import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@/app/core/auth/auth.service';

/**
 * Zero-UI component that acts as a role-based router.
 * It reads the user's role from AuthService and immediately
 * navigates to the correct dashboard. No template is rendered.
 * This eliminates the "wrong dashboard flash" problem.
 */
@Component({
    selector: 'app-dashboard-router',
    standalone: true,
    template: `
        <div class="flex items-center justify-center py-32">
            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>
    `
})
export class DashboardRouterComponent implements OnInit {
    private auth = inject(AuthService);
    private router = inject(Router);

    ngOnInit() {
        const role = this.auth.role();

        if (role === 'PLATFORM_ADMIN' || role === 'PLATFORM_OWNER_ADMIN') {
            this.router.navigate(['/pages/admin/dashboard'], { replaceUrl: true });
        } else if (role === 'SYNDIC_ADMIN') {
            // Syndic admin stays here — load the syndic dashboard inline
            // We navigate to a dedicated syndic dashboard route
            this.router.navigate(['/pages/syndic-dashboard'], { replaceUrl: true });
        } else if (role === 'RESIDENT') {
            this.router.navigate(['/pages/resident-dashboard'], { replaceUrl: true });
        } else if (role === 'TECHNICAL_STAFF') {
            this.router.navigate(['/pages/backoffice/maintenance/tasks'], { replaceUrl: true });
        } else {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
        }
    }
}
