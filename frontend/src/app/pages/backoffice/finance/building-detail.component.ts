import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthService } from '../../../core/auth/auth.service';
import { BuildingService } from '../../service/building.service';
import { ApartmentService } from '../../service/apartment.service';
import { ChargeService } from '../../service/charge.service';
import { ExpenseService } from '../../service/expense.service';
import { PaymentService } from '../../service/payment.service';
import { Building, Apartment } from '../../../models/financial.model';

interface FloorView {
    floorNumber: number;
    apartments: ApartmentDetailView[];
}

interface ApartmentDetailView {
    apartment: Apartment;
    residents: any[];
    charges: any[];
    payments: any[];
    totalDue: number;
    totalPaid: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
}

@Component({
    selector: 'app-building-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        TagModule,
        TabsModule,
        ToastModule,
        AvatarModule,
        ProgressBarModule
    ],
    providers: [MessageService],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <!-- Header with Back Button -->
            <div class="col-span-12">
                <div class="flex items-center gap-4 mb-4">
                    <p-button 
                        icon="pi pi-arrow-left" 
                        [text]="true" 
                        [rounded]="true"
                        (click)="goBack()" />
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            {{ building()?.name || 'Building Details' }}
                        </h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-1">
                            Interactive financial view by floor and apartment
                        </p>
                    </div>
                    <p-button 
                        label="Export Report" 
                        icon="pi pi-file-pdf" 
                        severity="secondary" />
                </div>
            </div>

            <!-- Building Summary KPIs -->
            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full border-l-4 border-green-500">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm">Total Revenue</span>
                            <i class="pi pi-dollar text-green-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ totalRevenue() | number:'1.3-3' }} TND
                        </div>
                        <div class="text-xs text-surface-500">
                            From {{ totalPayments() }} payments
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full border-l-4 border-red-500">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm">Total Expenses</span>
                            <i class="pi pi-shopping-cart text-red-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ totalExpenses() | number:'1.3-3' }} TND
                        </div>
                        <div class="text-xs text-surface-500">
                            {{ expenseCount() }} expense records
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full border-l-4 border-orange-500">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm">Outstanding</span>
                            <i class="pi pi-clock text-orange-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ totalPending() | number:'1.3-3' }} TND
                        </div>
                        <div class="text-xs text-surface-500">
                            {{ pendingCount() }} pending charges
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full border-l-4 border-blue-500">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400 text-sm">Collection Rate</span>
                            <i class="pi pi-percentage text-blue-500"></i>
                        </div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ collectionRate() }}%
                        </div>
                        <p-progressBar 
                            [value]="collectionRate()" 
                            [showValue]="false"
                            [style]="{'height': '6px'}" />
                    </div>
                </p-card>
            </div>

            <!-- Floor Navigator -->
            <div class="col-span-12">
                <p-card>
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                                Floor Navigator
                            </h3>
                            <p class="text-surface-600 dark:text-surface-400 mt-1">
                                {{ apartmentViews().length }} apartments across {{ floors().length }} floors
                            </p>
                        </div>
                    </ng-template>

                    <div class="flex flex-col gap-6" *ngIf="!loading(); else loadingTemplate">
                        <div *ngFor="let floor of floors()" class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                    <i class="pi pi-building mr-2"></i>
                                    Floor {{ floor.floorNumber }}
                                </h4>
                                <span class="text-sm text-surface-600 dark:text-surface-400">
                                    {{ floor.apartments.length }} apartments
                                </span>
                            </div>

                            <div class="grid grid-cols-12 gap-4">
                                <div 
                                    class="col-span-12 md:col-span-6 lg:col-span-4"
                                    *ngFor="let aptView of floor.apartments">
                                    <div 
                                        class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                                        [class.border-green-500]="aptView.status === 'PAID'"
                                        [class.border-orange-500]="aptView.status === 'PENDING'"
                                        [class.border-red-500]="aptView.status === 'OVERDUE'"
                                        (click)="viewApartmentDetail(aptView)">
                                        
                                        <div class="flex items-start justify-between mb-3">
                                            <div>
                                                <div class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                                    Apt {{ aptView.apartment.apartmentNumber || aptView.apartment.unitNumber }}
                                                </div>
                                                <div class="text-xs text-surface-600 dark:text-surface-400">
                                                    {{ aptView.apartment.surfaceM2 }} m²
                                                </div>
                                            </div>
                                            <p-tag 
                                                [value]="aptView.status" 
                                                [severity]="getStatusSeverity(aptView.status)" />
                                        </div>

                                        <div class="flex items-center gap-2 mb-3" *ngIf="aptView.residents.length > 0">
                                            <p-avatar 
                                                [label]="getInitials(aptView.residents[0])" 
                                                shape="circle" />
                                            <div class="flex-1 min-w-0">
                                                <div class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate">
                                                    {{ aptView.residents[0].firstName }} {{ aptView.residents[0].lastName }}
                                                </div>
                                                <div class="text-xs text-surface-600 dark:text-surface-400" *ngIf="aptView.residents.length > 1">
                                                    +{{ aptView.residents.length - 1 }} more
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex items-center justify-between text-sm pt-3 border-t border-surface-200 dark:border-surface-700">
                                            <span class="text-surface-600 dark:text-surface-400">Due:</span>
                                            <span class="font-semibold text-surface-900 dark:text-surface-0">
                                                {{ aptView.totalDue | number:'1.3-3' }} TND
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between text-sm">
                                            <span class="text-surface-600 dark:text-surface-400">Paid:</span>
                                            <span class="font-semibold text-green-600">
                                                {{ aptView.totalPaid | number:'1.3-3' }} TND
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Empty State -->
                        <div *ngIf="floors().length === 0" class="text-center py-12">
                            <i class="pi pi-inbox text-6xl text-surface-400 mb-4"></i>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
                                No Apartments Found
                            </h3>
                            <p class="text-surface-600 dark:text-surface-400 mb-4">
                                This building doesn't have any apartments yet.
                            </p>
                            <p-button label="Add Apartment" icon="pi pi-plus" />
                        </div>
                    </div>
                </p-card>
            </div>
        </div>

        <ng-template #loadingTemplate>
            <div class="flex items-center justify-center py-12">
                <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
            </div>
        </ng-template>

        <p-toast />
    `
})
export class BuildingDetailComponent implements OnInit {
    loading = signal(true);
    building = signal<Building | null>(null);
    apartmentViews = signal<ApartmentDetailView[]>([]);
    allCharges = signal<any[]>([]);
    allExpenses = signal<any[]>([]);
    allPayments = signal<any[]>([]);

    buildingId: string | null = null;

    floors = computed(() => {
        const apartments = this.apartmentViews();
        const floorMap = new Map<number, ApartmentDetailView[]>();
        
        apartments.forEach(apt => {
            const floor = apt.apartment.floorNumber || apt.apartment.floor || 0;
            if (!floorMap.has(floor)) {
                floorMap.set(floor, []);
            }
            floorMap.get(floor)!.push(apt);
        });

        return Array.from(floorMap.entries())
            .map(([floorNumber, apartments]) => ({ floorNumber, apartments }))
            .sort((a, b) => b.floorNumber - a.floorNumber); // Top floor first
    });

    totalRevenue = computed(() => 
        this.allPayments().reduce((sum, p) => sum + p.amount, 0)
    );

    totalExpenses = computed(() => 
        this.allExpenses().reduce((sum, e) => sum + e.amount, 0)
    );

    totalPending = computed(() => 
        this.allCharges()
            .filter(c => c.status === 'PENDING' || c.status === 'OVERDUE')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    pendingCount = computed(() => 
        this.allCharges().filter(c => c.status === 'PENDING' || c.status === 'OVERDUE').length
    );

    totalPayments = computed(() => this.allPayments().length);
    expenseCount = computed(() => this.allExpenses().length);

    collectionRate = computed(() => {
        const total = this.allCharges().reduce((sum, c) => sum + c.amount, 0);
        const collected = this.totalRevenue();
        return total > 0 ? Math.round((collected / total) * 100) : 0;
    });

    constructor(
        private route: ActivatedRoute,
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
        this.buildingId = this.route.snapshot.paramMap.get('id');
        if (this.buildingId) {
            this.loadBuildingData();
        }
    }

    async loadBuildingData() {
        try {
            this.loading.set(true);
            const organizationId = this.authService.organizationId();

            if (!organizationId || !this.buildingId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Missing required information'
                });
                return;
            }

            // Load building details
            const building = await this.buildingService.getById(this.buildingId).toPromise();
            if (!building) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Building not found'
                });
                return;
            }
            this.building.set(building);

            // Load all related data
            const [apartments, charges, expenses, payments] = await Promise.all([
                this.apartmentService.getByBuilding(this.buildingId).toPromise(),
                this.chargeService.getAll().toPromise(),
                this.expenseService.getAll().toPromise(),
                this.paymentService.getByOrganization(organizationId).toPromise()
            ]);

            this.allCharges.set((charges || []).filter(c => c.buildingId === this.buildingId));
            this.allExpenses.set((expenses || []).filter(e => e.buildingId === this.buildingId));
            this.allPayments.set((payments || []).filter(p => 
                this.allCharges().some(c => c.id === p.chargeId)
            ));

            // Build apartment views
            const aptViews: ApartmentDetailView[] = [];
            for (const apartment of apartments || []) {
                const aptCharges = this.allCharges().filter(c => c.apartmentId === apartment.id);
                const aptPayments = this.allPayments().filter(p => 
                    aptCharges.some(c => c.id === p.chargeId)
                );

                const totalDue = aptCharges.reduce((sum, c) => sum + c.amount, 0);
                const totalPaid = aptPayments.reduce((sum, p) => sum + p.amount, 0);

                let status: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID';
                if (totalDue > totalPaid) {
                    const hasOverdue = aptCharges.some(c => c.status === 'OVERDUE');
                    status = hasOverdue ? 'OVERDUE' : 'PENDING';
                }

                aptViews.push({
                    apartment,
                    residents: [], // TODO: Load residents when API is available
                    charges: aptCharges,
                    payments: aptPayments,
                    totalDue,
                    totalPaid,
                    status
                });
            }

            this.apartmentViews.set(aptViews);
        } catch (error) {
            console.error('Error loading building data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load building data'
            });
        } finally {
            this.loading.set(false);
        }
    }

    viewApartmentDetail(aptView: ApartmentDetailView) {
        this.router.navigate(['/pages/backoffice/finance/apartment', aptView.apartment.id]);
    }

    goBack() {
        this.router.navigate(['/pages/backoffice/finance/dashboard']);
    }

    getInitials(resident: any): string {
        if (!resident) return '?';
        const first = resident.firstName?.charAt(0) || '';
        const last = resident.lastName?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warn';
            case 'OVERDUE': return 'danger';
            default: return 'info';
        }
    }
}
