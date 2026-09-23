import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { RoleBadgePipe } from '@/app/core/pipes/role-badge.pipe';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, RoleBadgePipe],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img src="logo-syndiQA.png" alt="SyndiQA Logo" style="height: 2.5rem; object-fit: contain;" />
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <!-- User identity display - clickable to go to profile -->
                    @if (auth.user(); as user) {
                        <button 
                            type="button" 
                            class="layout-topbar-action" 
                            (click)="goToProfile()" 
                            title="View Profile"
                            style="font-family: 'Fira Sans', sans-serif; font-size: 0.85rem; gap: 6px; cursor: pointer;">
                            <i class="pi pi-user"></i>
                            <span>{{ user.firstName }} {{ user.lastName }}</span>
                        </button>
                        <span class="layout-topbar-action" style="cursor: default; font-size: 0.7rem; opacity: 0.7;">
                            {{ user.role | roleBadge }}
                        </span>
                    }
                    <button type="button" class="layout-topbar-action" (click)="onLogout()" title="Logout">
                        <i class="pi pi-sign-out"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    auth = inject(AuthService);
    router = inject(Router);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    goToProfile() {
        const user = this.auth.user();
        if (!user) return;

        // Navigate based on role
        if (user.role === 'RESIDENT') {
            // For residents, go to their own profile dashboard
            this.router.navigate(['/pages/resident-dashboard']);
        } else if (user.role === 'SYNDIC_ADMIN') {
            // For syndic admins, go to their profile in the resident profile dashboard
            // Use user.id (the account ID)
            if (user.id) {
                this.router.navigate(['/pages/backoffice/residents/profile', user.id]);
            } else {
                // Fallback to syndic dashboard if no id
                this.router.navigate(['/pages/syndic-dashboard']);
            }
        } else if (user.role === 'PLATFORM_ADMIN') {
            // For platform admins, go to admin dashboard
            this.router.navigate(['/pages/admin/dashboard']);
        } else {
            // Default fallback
            this.router.navigate(['/pages/syndic-dashboard']);
        }
    }

    onLogout() {
        this.auth.logout();
    }
}
