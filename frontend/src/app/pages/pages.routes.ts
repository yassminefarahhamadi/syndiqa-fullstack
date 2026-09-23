import { ExecutionStat } from '@/app/pages/service/ExecutionStat.service';
import { StatsComponent } from './backoffice/incidentAlert/StatsComponent.component';
import { Routes } from '@angular/router';
import { platformAdminGuard, syndicAdminGuard, residentGuard, authGuard, techGuard, backOfficeGuard } from '@/app/core/auth/auth.guard';

export default [
    {
        path: 'events',
        redirectTo: 'community-events',
        pathMatch: 'full'
    },
    {
        path: 'community-dashboard',
        canActivate: [backOfficeGuard],
        loadComponent: () => import('./community-dashboard/community-dashboard.component').then(m => m.CommunityDashboardComponent)
    },
    {
        path: 'community-events',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./community-events/community-events.component').then(m => m.CommunityEventsComponent)
    },
    {
        path: 'announcements',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./announcements/announcements.component').then(m => m.AnnouncementsComponent)
    },

    // ═══════════════════════════════════════════════════════
    //  SYNDIC_ADMIN — Scoped to syndicate-level operations
    // ═══════════════════════════════════════════════════════
    // Syndic dashboard (dedicated route for role-based redirect)
    {
        path: 'syndic-dashboard',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
    },

    {
        path: 'backoffice/finance',
        canActivate: [syndicAdminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./backoffice/finance/syndic-financial-dashboard.component').then(m => m.SyndicFinancialDashboardComponent) },
            { path: 'charges', loadComponent: () => import('./backoffice/finance/charges.component').then(m => m.ChargesComponent) },
            { path: 'expenses', loadComponent: () => import('./backoffice/finance/expenses.component').then(m => m.ExpensesComponent) },
            { path: 'building/:id', loadComponent: () => import('./backoffice/finance/building-detail.component').then(m => m.BuildingDetailComponent) },
            { path: 'apartment/:id', loadComponent: () => import('./backoffice/finance/apartment-detail.component').then(m => m.ApartmentDetailComponent) },
            { path: 'resident/:accountId', loadComponent: () => import('./backoffice/finance/resident-profile.component').then(m => m.ResidentProfileComponent) }
        ]
    },
    {
        path: 'dashboard/analytics',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('../features/financial/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent)
    },
    {
        path: 'charges/distribute',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('../features/financial/distribution-wizard/distribution-wizard.component').then(m => m.DistributionWizardComponent)
    },
    {
        path: 'backoffice/maintenance',
        canActivate: [techGuard],
        children: [
            { path: '', redirectTo: 'requests', pathMatch: 'full' },
            { path: 'requests', loadComponent: () => import('./backoffice/maintenance/maintenance.component').then(m => m.MaintenanceComponent) },
            { path: 'tasks', loadComponent: () => import('./backoffice/maintenance/maintenance-tasks.component').then(m => m.MaintenanceTasksComponent) }
        ]
    },
     {
        path: 'backoffice/incidentAlert',
        canActivate: [syndicAdminGuard],
        children: [
            { path: '', redirectTo: 'adminIncidents', pathMatch: 'full' },
            { path: 'adminIncidents', loadComponent: () => import('./backoffice/incidentAlert/admin-incident-dashboard.component').then(m => m.AdminIncidentComponent) },
            { path: 'incidentStats', loadComponent: () => import('./backoffice/incidentAlert/incidentStats.component').then(m => m.incidentStats) }

        ]
    },
    {
        path: 'backoffice/solarenergy',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'systems', pathMatch: 'full' },
            { path: 'systems', loadComponent: () => import('./backoffice/solarenergy/solar-systems.component').then(m => m.SolarSystemsComponent) },
            { path: 'readings', loadComponent: () => import('./backoffice/solarenergy/energy-readings.component').then(m => m.EnergyReadingsComponent) },
            { path: 'reports', loadComponent: () => import('./backoffice/solarenergy/energy-reports.component').then(m => m.EnergyReportsComponent) },
            { path: 'prediction', loadComponent: () => import('./backoffice/solarenergy/energy-prediction.component').then(m => m.EnergyPredictionComponent) },
            { path: 'engagement', loadComponent: () => import('./backoffice/solarenergy/engagement.component').then(m => m.EngagementComponent) }
        ]
    },

    // ═══════════════════════════════════════════════════════
    //  PROPERTY MANAGEMENT — Assets & Buildings
    // ═══════════════════════════════════════════════════════
    {
        path: 'backoffice/property',
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'residences', pathMatch: 'full' },
            { path: 'analytics', loadComponent: () => import('./backoffice/property/property-analytics').then(m => m.PropertyAnalyticsComponent) },
            { path: 'analytics-advanced', loadComponent: () => import('./backoffice/property/property-analytics-advanced').then(m => m.PropertyAnalyticsAdvancedComponent) },
            { path: 'map-overview', loadComponent: () => import('./backoffice/property/property-map-overview').then(m => m.PropertyMapOverviewComponent) },
            { path: 'hierarchy-tree', loadComponent: () => import('./backoffice/property/hierarchical-asset-tree').then(m => m.HierarchicalAssetTreeComponent) },
            { path: 'hierarchy-tree/:residenceId', loadComponent: () => import('./backoffice/property/hierarchical-asset-tree').then(m => m.HierarchicalAssetTreeComponent) },
            { path: 'floor-plan/:residenceId', loadComponent: () => import('./backoffice/property/residence-floor-plan').then(m => m.ResidenceFloorPlanComponent) },
            { path: 'residences', loadComponent: () => import('./backoffice/property/residence-complete').then(m => m.ResidenceListComponent) },
            { path: 'residences/new', loadComponent: () => import('./backoffice/property/residence-complete').then(m => m.ResidenceFormComponent) },
            { path: 'building-analyzer', loadComponent: () => import('./backoffice/property/building-analyzer.component').then(m => m.BuildingAnalyzerComponent) },
            { path: 'price-prediction', loadComponent: () => import('./backoffice/property/apartment-price-prediction.component').then(m => m.ApartmentPricePredictionComponent) },
            { path: 'residences/:id', loadComponent: () => import('./backoffice/property/residence-complete').then(m => m.ResidenceFormComponent) },
            { path: 'buildings-by-residence/:residenceId', loadComponent: () => import('./backoffice/property/building-complete').then(m => m.BuildingListComponent) },
            { path: 'buildings', loadComponent: () => import('./backoffice/property/building-complete').then(m => m.BuildingListComponent) },
            { path: 'buildings/new', loadComponent: () => import('./backoffice/property/building-complete').then(m => m.BuildingFormComponent) },
            { path: 'buildings/:id', loadComponent: () => import('./backoffice/property/building-complete').then(m => m.BuildingFormComponent) },
            { path: 'apartments', loadComponent: () => import('./backoffice/property/apartment-complete').then(m => m.ApartmentListComponent) },
            { path: 'apartments/new', loadComponent: () => import('./backoffice/property/apartment-complete').then(m => m.ApartmentFormComponent) },
            { path: 'apartments/:id', loadComponent: () => import('./backoffice/property/apartment-complete').then(m => m.ApartmentFormComponent) },
            { path: 'parking', loadComponent: () => import('./backoffice/property/parking-spot-complete').then(m => m.ParkingSpotListComponent) },
            { path: 'parking/new', loadComponent: () => import('./backoffice/property/parking-spot-complete').then(m => m.ParkingSpotFormComponent) },
            { path: 'parking/:id', loadComponent: () => import('./backoffice/property/parking-spot-complete').then(m => m.ParkingSpotFormComponent) },
            { path: 'equipment', loadComponent: () => import('./backoffice/property/equipment-complete').then(m => m.EquipmentListComponent) },
            { path: 'equipment/new', loadComponent: () => import('./backoffice/property/equipment-complete').then(m => m.EquipmentFormComponent) },
            { path: 'equipment/:id', loadComponent: () => import('./backoffice/property/equipment-complete').then(m => m.EquipmentFormComponent) },
            { path: 'common-areas', loadComponent: () => import('./backoffice/property/common-area-complete').then(m => m.CommonAreaListComponent) },
            { path: 'common-areas/new', loadComponent: () => import('./backoffice/property/common-area-complete').then(m => m.CommonAreaFormComponent) },
            { path: 'common-areas/:id', loadComponent: () => import('./backoffice/property/common-area-complete').then(m => m.CommonAreaFormComponent) }
        ]
    },

    // ═══════════════════════════════════════════════════════
    //  SYNDIC_ADMIN — Organization / Lease / Inspection
    // ═══════════════════════════════════════════════════════
    {
        path: 'backoffice/organizations/dashboard',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/organizations/organization-dashboard.component').then(m => m.OrganizationDashboardComponent)
    },
    {
        path: 'backoffice/organizations',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/organizations/listorga.component').then(m => m.OrganizationListComponent)
    },
    {
        path: 'backoffice/leases',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/organizations/listlease.component').then(m => m.LeaseListComponent)
    },
    {
        path: 'backoffice/lease-inspections',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/organizations/lease-inspection-list.component').then(m => m.LeaseInspectionListComponent)
    },

    // ═══════════════════════════════════════════════════════
    //  RESIDENT — Organization / Lease / Inspection (lecture)
    // ═══════════════════════════════════════════════════════
    {
        path: 'my-organization',
        canActivate: [residentGuard],
        loadComponent: () => import('./backoffice/organizations/listorga.component').then(m => m.OrganizationListComponent)
    },
    {
        path: 'my-leases',
        canActivate: [residentGuard],
        loadComponent: () => import('./backoffice/organizations/listlease.component').then(m => m.LeaseListComponent)
    },
    {
        path: 'my-lease-inspections',
        canActivate: [residentGuard],
        loadComponent: () => import('./backoffice/organizations/lease-inspection-list.component').then(m => m.LeaseInspectionListComponent)
    },

    // ═══════════════════════════════════════════════════════
    //  PROFILS FINANCIERS
    // ═══════════════════════════════════════════════════════
    {
        path: 'backoffice/profiles',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/profiles/profile-list.component').then(m => m.ProfileListComponent)
    },
    {
        path: 'my-profile',
        canActivate: [residentGuard],
        loadComponent: () => import('./backoffice/profiles/profile-list.component').then(m => m.ProfileListComponent)
    },

    // ═══════════════════════════════════════════════════════
    //  PLATFORM_ADMIN — God-mode panel (ironclad guard)
    // ═══════════════════════════════════════════════════════
    {
        path: 'admin',
        canActivate: [platformAdminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./backoffice/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
            { path: 'organizations/dashboard', loadComponent: () => import('./backoffice/organizations/organization-dashboard.component').then(m => m.OrganizationDashboardComponent) },
            { path: 'organizations', loadComponent: () => import('./backoffice/organizations/listorga.component').then(m => m.OrganizationListComponent) },
            { path: 'leases', loadComponent: () => import('./backoffice/organizations/listlease.component').then(m => m.LeaseListComponent) },
            { path: 'lease-inspections', loadComponent: () => import('./backoffice/organizations/lease-inspection-list.component').then(m => m.LeaseInspectionListComponent) },
            { path: 'accounts', loadComponent: () => import('./backoffice/admin/admin-accounts.component').then(m => m.AdminAccountsComponent) },
            { path: 'profiles', loadComponent: () => import('./backoffice/profiles/profile-list.component').then(m => m.ProfileListComponent) },
            { path: 'finance', loadComponent: () => import('./backoffice/admin/admin-finance.component').then(m => m.AdminFinanceComponent) },
            { path: 'audit-logs', loadComponent: () => import('./backoffice/admin/admin-audit.component').then(m => m.AdminAuditComponent) },
            { path: 'exstats', loadComponent: () => import('./backoffice/incidentAlert/StatsComponent.component').then(m => m.StatsComponent) },

            { path: 'maintenance', redirectTo: 'maintenance/requests', pathMatch: 'full' },
            { path: 'maintenance/requests', loadComponent: () => import('./backoffice/maintenance/maintenance.component').then(m => m.MaintenanceComponent) },
            { path: 'maintenance/tasks', loadComponent: () => import('./backoffice/maintenance/maintenance-tasks.component').then(m => m.MaintenanceTasksComponent) }
        ]
    },

    // ═══════════════════════════════════════════════════════
    //  RESIDENT — Front office (ironclad guard)
    // ═══════════════════════════════════════════════════════
    {
        path: 'resident-dashboard',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/resident-dashboard.component').then(m => m.ResidentDashboardComponent)
    },
    {
        path: 'my-charges',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/my-charges.component').then(m => m.MyChargesComponent)
    },
    {
        path: 'my-payments',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/my-payments.component').then(m => m.MyPaymentsComponent)
    },
     {
        path: 'resident-incidents',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/my-incidents.component').then(m => m.MyIncidentsComponent)
    },
    {
        path: 'technician-resolved',
        canActivate: [techGuard],
        loadComponent: () => import('./frontoffice/resident/technician-resolved.component').then(m => m.TechnicianResolvedComponent)
    },
 
   

    {
        path: 'community-overview',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/community-overview.component').then(m => m.CommunityOverviewComponent)
    },
    {
        path: 'resident-events',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/resident-events.component').then(m => m.ResidentEventsComponent)
    },
    {
        path: 'resident-announcements',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/resident-announcements.component').then(m => m.ResidentAnnouncementsComponent)
    },
    {
        path: 'my-maintenance',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/resident/my-maintenance.component').then(m => m.MyMaintenanceComponent)
    },

      {
        path: 'backoffice/financial-assistant',
        canActivate: [syndicAdminGuard],
        loadComponent: () => import('./backoffice/financial-assistant/syndic-financial-assistant.component').then(m => m.SyndicFinancialAssistantComponent)
    },
    {
        path: 'ai-assistant',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent)
    },
    {
        path: 'bank-analysis',
        canActivate: [residentGuard],
        loadComponent: () => import('./frontoffice/bank-analysis/bank-analysis.component').then(m => m.BankAnalysisComponent)
    },

    { path: '**', redirectTo: '/notfound' }
] as Routes;
