import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface OrganizationStats {
    totalOrganizations: number;
    totalMembers: number;
    totalBuildings: number;
    totalLeases: number;
    activeLeases: number;
    pendingLeases: number;
    terminatedLeases: number;
    expiredLeases: number;
    leasesExpiringSoon: number;
    totalInspections: number;
    initialInspections: number;
    finalInspections: number;
    completedInspections: number;
    pendingInspections: number;
    disputedInspections: number;
}

@Component({
    selector: 'app-organization-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule, ButtonModule, ToastModule, TooltipModule, ProgressSpinnerModule, RouterModule],
    providers: [MessageService],
    templateUrl: './organization-dashboard.component.html'
})
export class OrganizationDashboardComponent implements OnInit {

    private readonly API = 'http://localhost:8089/api/organizations/stats/summary';

    stats: OrganizationStats | null = null;
    loading = false;

    leaseChartData: any;
    leaseChartOptions: any;
    inspectionTypeChartData: any;
    inspectionStatusChartData: any;
    inspectionChartOptions: any;

    constructor(private http: HttpClient, private messageService: MessageService, private authService: AuthService) {}

    get leasesUrl(): string {
        return this.authService.isPlatformAdmin() ? '/pages/admin/leases' : '/pages/backoffice/leases';
    }

    get inspectionsUrl(): string {
        return this.authService.isPlatformAdmin() ? '/pages/admin/lease-inspections' : '/pages/backoffice/lease-inspections';
    }

    get organizationsUrl(): string {
        return this.authService.isPlatformAdmin() ? '/pages/admin/organizations' : '/pages/backoffice/organizations';
    }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.loading = true;
        this.http.get<OrganizationStats>(this.API).subscribe({
            next: (data) => {
                this.stats = data;
                this.buildCharts();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les statistiques.' });
                this.loading = false;
            }
        });
    }

    private buildCharts(): void {
        if (!this.stats) return;

        // Doughnut — répartition des baux par statut
        this.leaseChartData = {
            labels: ['Actifs', 'En attente', 'Résiliés', 'Expirés'],
            datasets: [{
                data: [
                    this.stats.activeLeases,
                    this.stats.pendingLeases,
                    this.stats.terminatedLeases,
                    this.stats.expiredLeases
                ],
                backgroundColor: ['#22c55e', '#f97316', '#ef4444', '#94a3b8'],
                borderWidth: 0
            }]
        };
        this.leaseChartOptions = {
            plugins: { legend: { position: 'bottom', labels: { color: '#64748b', padding: 16 } } },
            cutout: '68%'
        };

        // Bar — inspections par type (INITIAL vs FINAL)
        this.inspectionTypeChartData = {
            labels: ['INITIAL', 'FINAL'],
            datasets: [{
                label: 'Nombre',
                data: [this.stats.initialInspections, this.stats.finalInspections],
                backgroundColor: ['#3b82f6', '#8b5cf6'],
                borderRadius: 6
            }]
        };

        // Bar — inspections par statut
        this.inspectionStatusChartData = {
            labels: ['Complétées', 'En attente', 'Contestées'],
            datasets: [{
                label: 'Nombre',
                data: [this.stats.completedInspections, this.stats.pendingInspections, this.stats.disputedInspections],
                backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
                borderRadius: 6
            }]
        };

        this.inspectionChartOptions = {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#64748b', stepSize: 1 }, grid: { color: '#e2e8f0' } },
                x: { ticks: { color: '#64748b' }, grid: { display: false } }
            }
        };
    }

    get completionRate(): number {
        if (!this.stats || this.stats.totalInspections === 0) return 0;
        return Math.round((this.stats.completedInspections / this.stats.totalInspections) * 100);
    }
}
