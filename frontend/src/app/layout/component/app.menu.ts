import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/app/core/auth/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu implements OnInit {
    private auth = inject(AuthService);
    model: MenuItem[] = [];

    ngOnInit() {
        const role = this.auth.role();

        const platformHome: MenuItem = {
            label: 'Home',
            items: [{ label: 'Global Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/pages/admin/dashboard'] }]
        };

        const syndicHome: MenuItem = {
            label: 'Home',
            items: [{ label: 'Syndicate Hub', icon: 'pi pi-fw pi-home', routerLink: ['/pages/syndic-dashboard'] }]
        };

        const residentHome: MenuItem = {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/pages/resident-dashboard'] }]
        };

        const platformAdminSection: MenuItem = {
            label: 'Platform Administration',
            items: [
                { label: 'Organizations', icon: 'pi pi-fw pi-building', routerLink: ['/pages/admin/organizations'] },
                { label: 'Leases', icon: 'pi pi-fw pi-address-book', routerLink: ['/pages/admin/leases'] },
                { label: 'Lease Inspections', icon: 'pi pi-fw pi-file-check', routerLink: ['/pages/admin/lease-inspections'] },
                { label: 'Global Accounts', icon: 'pi pi-fw pi-users', routerLink: ['/pages/admin/accounts'] },
                { label: 'Aggregate Revenue', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pages/admin/finance'] },
                { label: 'Maintenance Requests', icon: 'pi pi-fw pi-wrench', routerLink: ['/pages/admin/maintenance/requests'] },
                { label: 'Maintenance Tasks', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/admin/maintenance/tasks'] },
                { label: 'Community Dashboard', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/community-dashboard'] },
                { label: 'System Audit Logs', icon: 'pi pi-fw pi-history', routerLink: ['/pages/admin/audit-logs'] },

            ]
        };

        const organizationSection: MenuItem = {
            label: 'Organisation',
            items: [
                { label: 'Mes Organisations', icon: 'pi pi-fw pi-building', routerLink: ['/pages/backoffice/organizations'] },
                { label: 'Baux', icon: 'pi pi-fw pi-address-book', routerLink: ['/pages/backoffice/leases'] },
                { label: 'États des lieux', icon: 'pi pi-fw pi-file-check', routerLink: ['/pages/backoffice/lease-inspections'] }
            ]
        };

        const residentOrganizationSection: MenuItem = {
            label: 'Organisation',
            items: [
                { label: 'Mon Organisation', icon: 'pi pi-fw pi-building', routerLink: ['/pages/my-organization'] },
                { label: 'Mes Baux', icon: 'pi pi-fw pi-address-book', routerLink: ['/pages/my-leases'] },
                { label: 'Mes États des lieux', icon: 'pi pi-fw pi-file-check', routerLink: ['/pages/my-lease-inspections'] }
            ]
        };

        const syndicAdminSection: MenuItem = {
            label: 'Syndicate Management',
            items: [
                { label: 'Financial Dashboard', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/backoffice/finance/dashboard'] },
                { label: 'Financial Charges', icon: 'pi pi-fw pi-receipt', routerLink: ['/pages/backoffice/finance/charges'] },
                { label: 'Distribute to Residents', icon: 'pi pi-fw pi-share-alt', routerLink: ['/pages/expenses/distribute'] },
                { label: 'Expense Tracking', icon: 'pi pi-fw pi-wallet', routerLink: ['/pages/backoffice/finance/expenses'] },
                { label: 'AI Risk Analytics', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/dashboard/analytics'] },
                { label: 'Maintenance Requests', icon: 'pi pi-fw pi-wrench', routerLink: ['/pages/backoffice/maintenance/requests'] },
                { label: 'Assigned Tasks', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/backoffice/maintenance/tasks'] },
            ]
        };

        const adminCommunitySection: MenuItem = {
            label: 'Community',
            items: [
                { label: 'Community Dashboard', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/community-dashboard'] },
                { label: 'Community Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/pages/community-events'] },
                { label: 'Announcements', icon: 'pi pi-fw pi-megaphone', routerLink: ['/pages/announcements'] }
            ]
        };
 const IncidentSection: MenuItem = {
            label: 'Incidents',
            items: [
             { label: 'Incidents Management', icon: 'pi pi-exclamation-triangle', routerLink: ['/pages/backoffice/incidentAlert/adminIncidents'] },
                { label: 'Incident Statistics', icon: 'pi pi-fw pi-chart-line', routerLink: ['/pages/backoffice/incidentAlert/incidentStats'] },
                 ]
        };
         const IncidentPlatform: MenuItem = {
            label: 'Incident & Alert',
            items: [
                { label: 'Performance Statistics', icon: 'pi pi-fw pi-chart-line', routerLink: ['/pages/admin/exstats'] }
                 ]
        };
        const solarIoTSection: MenuItem = {
            label: 'Solar IoT & Energy',
            items: [
                { label: 'Solar Systems', icon: 'pi pi-fw pi-sun', routerLink: ['/pages/backoffice/solarenergy/systems'] },
                { label: 'Energy Readings', icon: 'pi pi-fw pi-bolt', routerLink: ['/pages/backoffice/solarenergy/readings'] },
                { label: 'Energy Reports', icon: 'pi pi-fw pi-chart-line', routerLink: ['/pages/backoffice/solarenergy/reports'] },
                { label: 'AI Prediction', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/backoffice/solarenergy/prediction'] },
                { label: 'Energy Engagement', icon: 'pi pi-fw pi-trophy', routerLink: ['/pages/backoffice/solarenergy/engagement'] }
            ]
        };

        const propertyManagementSection: MenuItem = {
            label: 'Property Management',
            items: [
                { label: 'Residences', icon: 'pi pi-fw pi-home', routerLink: ['/pages/backoffice/property/residences'] },
                { label: 'AI Building', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/backoffice/property/building-analyzer'] },
                { label: 'AI Price Prediction', icon: 'pi pi-fw pi-dollar', routerLink: ['/pages/backoffice/property/price-prediction'] }
            ]
        };

        const residentSection: MenuItem = {
            label: 'Resident Portal',
            items: [
                { label: 'My Finances', icon: 'pi pi-fw pi-wallet', routerLink: ['/pages/my-finances'] },
                { label: 'My Invoices & Charges', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pages/my-charges'] },
                { label: 'Payment History', icon: 'pi pi-fw pi-credit-card', routerLink: ['/pages/my-payments'] },
                { label: 'Resident Incidents', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/pages/resident-incidents'] },
                { label: 'My Maintenance', icon: 'pi pi-fw pi-wrench', routerLink: ['/pages/my-maintenance'] }
            ]
        };

        const residentCommunitySection: MenuItem = {
            label: 'Community',
            items: [
                { label: 'Overview', icon: 'pi pi-fw pi-th-large', routerLink: ['/pages/community-overview'] },
                { label: 'Community Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/pages/resident-events'] },
                { label: 'Announcements', icon: 'pi pi-fw pi-megaphone', routerLink: ['/pages/resident-announcements'] }
            ]
        };

        const aiFinancialSection: MenuItem = {
            label: 'AI Financial Tools',
            items: [
                { label: 'AI Assistant', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/ai-assistant'] },
                { label: 'Bank Statement Analysis', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/pages/bank-analysis'] }
            ]
        };

        const techSolarIoTSection: MenuItem = {
            label: 'Solar IoT & Energy',
            items: [
                { label: 'Solar Systems', icon: 'pi pi-fw pi-sun', routerLink: ['/pages/backoffice/solarenergy/systems'] },
                { label: 'Energy Readings', icon: 'pi pi-fw pi-bolt', routerLink: ['/pages/backoffice/solarenergy/readings'] },
                { label: 'Energy Reports', icon: 'pi pi-fw pi-chart-line', routerLink: ['/pages/backoffice/solarenergy/reports'] },
                { label: 'AI Prediction', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/backoffice/solarenergy/prediction'] }
            ]
        };

        const residentSolarIoTSection: MenuItem = {
            label: 'Solar IoT & Energy',
            items: [
                { label: 'Energy Reports', icon: 'pi pi-fw pi-chart-line', routerLink: ['/pages/backoffice/solarenergy/reports'] },
                { label: 'AI Prediction', icon: 'pi pi-fw pi-sparkles', routerLink: ['/pages/backoffice/solarenergy/prediction'] },
                { label: 'Energy Engagement', icon: 'pi pi-fw pi-trophy', routerLink: ['/pages/backoffice/solarenergy/engagement'] }
            ]
        };

        if (role === 'PLATFORM_ADMIN' || role === 'PLATFORM_OWNER_ADMIN') {
            this.model = [platformHome, platformAdminSection, propertyManagementSection, solarIoTSection , IncidentPlatform];
        } else if (role === 'SYNDIC_ADMIN') {
           this.model = [syndicHome,syndicAdminSection,platformHome,platformAdminSection,adminCommunitySection,propertyManagementSection,solarIoTSection,IncidentSection];   } else if (role === 'SYNDIC_ADMIN') {
            this.model = [syndicHome, organizationSection, syndicAdminSection, propertyManagementSection, solarIoTSection];
        } else if (role === 'RESIDENT') {
            this.model = [residentHome, residentOrganizationSection, residentSection, aiFinancialSection, residentSolarIoTSection, residentCommunitySection,solarIoTSection];
        } else if (role === 'TECHNICAL_STAFF') {
            this.model = [
                syndicHome, // Assuming tech staff lands on root dashboard
                {
                    label: 'Technical Operations',
                    items: [
                        { label: 'Active Tasks', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/backoffice/maintenance/tasks'] }
                    ]
                },
                techSolarIoTSection,
                {
                    label: 'Resolved Incidents',
                    items: [
                        { label: 'My Resolved Incidents', icon: 'pi pi-fw pi-list-check', routerLink: ['/pages/technician-resolved'] }
                    ]
                }
            ];
        } else {
            this.model = [];
        }
    }
}
