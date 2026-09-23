import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { BuildingService } from '../../service/building.service';
import { ApartmentService } from '../../service/apartment.service';
import { ChargeService } from '../../service/charge.service';
import { ExpenseService } from '../../service/expense.service';
import { PaymentService } from '../../service/payment.service';
import { Building, Apartment, FinancialSummary } from '../../../models/financial.model';

interface BuildingFinancialView {
    building: Building;
    apartments: Apartment[];
    charges: any[];
    expenses: any[];
    payments: any[];
    summary: FinancialSummary;
    expanded: boolean;
}

@Component({
    selector: 'app-syndic-financial-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        TagModule,
        ChartModule,
        TabsModule,
        AccordionModule,
        DataViewModule,
        DialogModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <!-- Header -->
            <div class="col-span-12">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Financial Management</h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-2">Manage finances across all your residences</p>
                    </div>
                    <p-button label="Generate Report" icon="pi pi-file-pdf" severity="secondary" />
                </div>
            </div>

            <!-- Overall Summary Cards -->
            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm font-medium">Total Revenue</span>
                            <i class="pi pi-arrow-up text-green-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ overallSummary().totalRevenue | currency:'TND' }}
                        </div>
                        <div class="text-sm text-green-500">
                            <i class="pi pi-arrow-up mr-1"></i>
                            <span>12% from last month</span>
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm font-medium">Total Expenses</span>
                            <i class="pi pi-arrow-down text-red-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ overallSummary().totalExpenses | currency:'TND' }}
                        </div>
                        <div class="text-sm text-red-500">
                            <i class="pi pi-arrow-up mr-1"></i>
                            <span>8% from last month</span>
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm font-medium">Pending Payments</span>
                            <i class="pi pi-clock text-orange-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ overallSummary().totalPending | currency:'TND' }}
                        </div>
                        <div class="text-sm text-surface-600 dark:text-surface-400">
                            {{ pendingCount() }} charges pending
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm font-medium">Collection Rate</span>
                            <i class="pi pi-percentage text-blue-500"></i>
                        </div>
                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ overallSummary().collectionRate }}%
                        </div>
                        <div class="text-sm text-green-500">
                            <i class="pi pi-arrow-up mr-1"></i>
                            <span>5% from last month</span>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Buildings Financial View -->
            <div class="col-span-12">
                <p-card>
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Buildings Financial Overview</h3>
                            <p class="text-surface-600 dark:text-surface-400 mt-1">Click on a building to view detailed financial information</p>
                        </div>
                    </ng-template>

                    <div class="grid grid-cols-12 gap-4" *ngIf="!loading(); else loadingTemplate">
                        <div class="col-span-12 lg:col-span-6 xl:col-span-4" *ngFor="let buildingView of buildingViews()">
                            <p-card styleClass="cursor-pointer hover:shadow-lg transition-shadow" (click)="navigateToBuilding(buildingView.building)">
                                <div class="flex flex-col gap-4">
                                    <div class="flex items-center justify-between">
                                        <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                            {{ buildingView.building.name }}
                                        </h4>
                                        <i class="pi pi-chevron-right"></i>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="flex flex-col">
                                            <span class="text-xs text-surface-600 dark:text-surface-400">Revenue</span>
                                            <span class="text-lg font-semibold text-green-600">
                                                {{ buildingView.summary.totalRevenue | currency:'TND' }}
                                            </span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-xs text-surface-600 dark:text-surface-400">Expenses</span>
                                            <span class="text-lg font-semibold text-red-600">
                                                {{ buildingView.summary.totalExpenses | currency:'TND' }}
                                            </span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-xs text-surface-600 dark:text-surface-400">Pending</span>
                                            <span class="text-lg font-semibold text-orange-600">
                                                {{ buildingView.summary.totalPending | currency:'TND' }}
                                            </span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-xs text-surface-600 dark:text-surface-400">Collection</span>
                                            <span class="text-lg font-semibold text-blue-600">
                                                {{ buildingView.summary.collectionRate }}%
                                            </span>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                        <i class="pi pi-building"></i>
                                        <span>{{ buildingView.apartments.length }} apartments</span>
                                    </div>
                                </div>
                            </p-card>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Building Detail Dialog -->
            <p-dialog 
                [(visible)]="showBuildingDetail" 
                [header]="(selectedBuilding() ? selectedBuilding()!.building.name : 'Building Details')"
                [modal]="true" 
                [style]="{width: '90vw', maxWidth: '1200px'}"
                [maximizable]="true">
                
                <div class="flex flex-col gap-6" *ngIf="selectedBuilding()">
                    <!-- Building Summary -->
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-3">
                            <p-card>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-green-600">
                                        {{ selectedBuilding()!.summary.totalRevenue | currency:'TND' }}
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">Total Revenue</div>
                                </div>
                            </p-card>
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <p-card>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-red-600">
                                        {{ selectedBuilding()!.summary.totalExpenses | currency:'TND' }}
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">Total Expenses</div>
                                </div>
                            </p-card>
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <p-card>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-orange-600">
                                        {{ selectedBuilding()!.summary.totalPending | currency:'TND' }}
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">Pending</div>
                                </div>
                            </p-card>
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <p-card>
                                <div class="text-center">
                                    <div class="text-2xl font-bold text-blue-600">
                                        {{ selectedBuilding()!.summary.collectionRate }}%
                                    </div>
                                    <div class="text-sm text-surface-600 dark:text-surface-400 mt-1">Collection Rate</div>
                                </div>
                            </p-card>
                        </div>
                    </div>

                    <!-- Tabs for different views -->
                    <p-tabs value="0">
                        <p-tablist>
                            <p-tab value="0">Apartments</p-tab>
                            <p-tab value="1">Charges</p-tab>
                            <p-tab value="2">Expenses</p-tab>
                            <p-tab value="3">Payments</p-tab>
                        </p-tablist>
                        <p-tabpanels>
                        <p-tabpanel value="0">
                            <p-table [value]="selectedBuilding()!.apartments" [paginator]="true" [rows]="10">
                                <ng-template #header>
                                    <tr>
                                        <th>Apartment</th>
                                        <th>Floor</th>
                                        <th>Surface (m²)</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-apartment>
                                    <tr>
                                        <td>{{ apartment.apartmentNumber || apartment.unitNumber }}</td>
                                        <td>{{ apartment.floorNumber || apartment.floor }}</td>
                                        <td>{{ apartment.surfaceM2 }}</td>
                                        <td>
                                            <p-tag [value]="apartment.status || 'OCCUPIED'" [severity]="getStatusSeverity(apartment.status)" />
                                        </td>
                                        <td>
                                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" (click)="viewApartmentDetails(apartment)" />
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>

                        <p-tabpanel value="1">
                            <p-table [value]="selectedBuilding()!.charges" [paginator]="true" [rows]="10">
                                <ng-template #header>
                                    <tr>
                                        <th>Label</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th>Paid Amount</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-charge>
                                    <tr>
                                        <td>{{ charge.label }}</td>
                                        <td>{{ charge.amount | currency:'TND' }}</td>
                                        <td>{{ charge.dueDate | date:'short' }}</td>
                                        <td>
                                            <p-tag [value]="charge.status" [severity]="getChargeSeverity(charge.status)" />
                                        </td>
                                        <td>{{ charge.paidAmount || 0 | currency:'TND' }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>

                        <p-tabpanel value="2">
                            <p-table [value]="selectedBuilding()!.expenses" [paginator]="true" [rows]="10">
                                <ng-template #header>
                                    <tr>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-expense>
                                    <tr>
                                        <td>{{ expense.description }}</td>
                                        <td>{{ expense.category }}</td>
                                        <td>{{ expense.amount | currency:'TND' }}</td>
                                        <td>{{ expense.expenseDate | date:'short' }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>

                        <p-tabpanel value="3">
                            <p-table [value]="selectedBuilding()!.payments" [paginator]="true" [rows]="10">
                                <ng-template #header>
                                    <tr>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Payment Date</th>
                                        <th>Charge ID</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-payment>
                                    <tr>
                                        <td>{{ payment.amount | currency:'TND' }}</td>
                                        <td>{{ payment.method }}</td>
                                        <td>{{ payment.paymentDate | date:'short' }}</td>
                                        <td class="text-xs text-surface-600">{{ payment.chargeId }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>
                        </p-tabpanels>
                    </p-tabs>
                </div>
            </p-dialog>
        </div>

        <ng-template #loadingTemplate>
            <div class="col-span-12 flex items-center justify-center py-12">
                <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
            </div>
        </ng-template>

        <p-toast />
    `
})
export class SyndicFinancialDashboardComponent implements OnInit {
    loading = signal(true);
    buildingViews = signal<BuildingFinancialView[]>([]);
    selectedBuilding = signal<BuildingFinancialView | null>(null);
    showBuildingDetail = false;

    overallSummary = computed(() => {
        const views = this.buildingViews();
        return views.reduce((acc, view) => ({
            totalRevenue: acc.totalRevenue + view.summary.totalRevenue,
            totalExpenses: acc.totalExpenses + view.summary.totalExpenses,
            totalPending: acc.totalPending + view.summary.totalPending,
            totalOverdue: acc.totalOverdue + view.summary.totalOverdue,
            collectionRate: views.length > 0 
                ? Math.round(views.reduce((sum, v) => sum + v.summary.collectionRate, 0) / views.length)
                : 0
        }), {
            totalRevenue: 0,
            totalExpenses: 0,
            totalPending: 0,
            totalOverdue: 0,
            collectionRate: 0
        });
    });

    pendingCount = computed(() => {
        return this.buildingViews().reduce((acc, view) => 
            acc + view.charges.filter(c => c.status === 'PENDING').length, 0
        );
    });

    constructor(
        private router: Router,
        private authService: AuthService,
        private buildingService: BuildingService,
        private apartmentService: ApartmentService,
        private chargeService: ChargeService,
        private expenseService: ExpenseService,
        private paymentService: PaymentService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadFinancialData();
    }

    async loadFinancialData() {
        try {
            // Only show loading on first visit (no cached data yet)
            if (this.buildingViews().length === 0) {
                this.loading.set(true);
            }
            const organizationId = this.authService.organizationId();
            
            if (!organizationId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Organization ID not found'
                });
                return;
            }

            // Load all data
            const [buildings, charges, expenses, payments] = await Promise.all([
                this.buildingService.getByOrganization(organizationId).toPromise(),
                this.chargeService.getAll().toPromise(),
                this.expenseService.getAll().toPromise(),
                this.paymentService.getByOrganization(organizationId).toPromise()
            ]);

            // Build financial views for each building
            const views: BuildingFinancialView[] = [];
            
            for (const building of buildings || []) {
                const apartments = await this.apartmentService.getByBuilding(building.id).toPromise() || [];
                const buildingCharges = (charges || []).filter(c => c.buildingId === building.id);
                const buildingExpenses = (expenses || []).filter(e => e.buildingId === building.id);
                const buildingPayments = (payments || []).filter(p => 
                    buildingCharges.some(c => c.id === p.chargeId)
                );

                const summary = this.calculateSummary(buildingCharges, buildingExpenses, buildingPayments);

                views.push({
                    building,
                    apartments,
                    charges: buildingCharges,
                    expenses: buildingExpenses,
                    payments: buildingPayments,
                    summary,
                    expanded: false
                });
            }

            this.buildingViews.set(views);
        } catch (error) {
            console.error('Error loading financial data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load financial data'
            });
        } finally {
            this.loading.set(false);
        }
    }

    calculateSummary(charges: any[], expenses: any[], payments: any[]): FinancialSummary {
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalPending = charges
            .filter(c => c.status === 'PENDING')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0);
        const totalOverdue = charges
            .filter(c => c.status === 'OVERDUE')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0);
        
        const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
        const collectionRate = totalCharges > 0 
            ? Math.round((totalRevenue / totalCharges) * 100)
            : 0;

        return {
            totalRevenue,
            totalExpenses,
            totalPending,
            totalOverdue,
            collectionRate
        };
    }

    toggleBuilding(buildingView: BuildingFinancialView) {
        this.selectedBuilding.set(buildingView);
        this.showBuildingDetail = true;
    }

    navigateToBuilding(building: Building) {
        this.router.navigate(['/pages/backoffice/finance/building', building.id]);
    }

    viewApartmentDetails(apartment: Apartment) {
        this.messageService.add({
            severity: 'info',
            summary: 'Apartment Details',
            detail: `Viewing details for ${apartment.apartmentNumber || apartment.unitNumber}`
        });
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status?.toUpperCase()) {
            case 'AVAILABLE': return 'success';
            case 'OCCUPIED': return 'info';
            case 'MAINTENANCE': return 'warn';
            default: return 'info';
        }
    }

    getChargeSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warn';
            case 'OVERDUE': return 'danger';
            case 'PARTIALLY_PAID': return 'info';
            default: return 'info';
        }
    }
}
