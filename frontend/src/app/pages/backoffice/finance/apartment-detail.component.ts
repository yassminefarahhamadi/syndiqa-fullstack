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
import { TimelineModule } from 'primeng/timeline';
import { AuthService } from '../../../core/auth/auth.service';
import { ApartmentService } from '../../service/apartment.service';
import { ChargeService } from '../../service/charge.service';
import { PaymentService } from '../../service/payment.service';
import { Apartment } from '../../../models/financial.model';

@Component({
    selector: 'app-apartment-detail',
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
        TimelineModule
    ],
    providers: [MessageService],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <!-- Header -->
            <div class="col-span-12">
                <div class="flex items-center gap-4 mb-4">
                    <p-button 
                        icon="pi pi-arrow-left" 
                        [text]="true" 
                        [rounded]="true"
                        (click)="goBack()" />
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                            Apartment {{ apartment()?.apartmentNumber || apartment()?.unitNumber }}
                        </h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-1">
                            Complete financial profile for this unit
                        </p>
                    </div>
                </div>
            </div>

            <!-- Apartment Info Card -->
            <div class="col-span-12 lg:col-span-4">
                <p-card>
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                Unit Information
                            </h3>
                        </div>
                    </ng-template>

                    <div class="flex flex-col gap-4" *ngIf="apartment()">
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Floor</span>
                            <span class="font-semibold text-surface-900 dark:text-surface-0">
                                {{ apartment()!.floorNumber || apartment()!.floor }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Surface</span>
                            <span class="font-semibold text-surface-900 dark:text-surface-0">
                                {{ apartment()!.surfaceM2 }} m²
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Type</span>
                            <span class="font-semibold text-surface-900 dark:text-surface-0">
                                {{ apartment()!.type || 'Standard' }}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-surface-600 dark:text-surface-400">Status</span>
                            <p-tag 
                                [value]="apartment()!.status || 'OCCUPIED'" 
                                [severity]="getStatusSeverity(apartment()!.status || 'OCCUPIED')" />
                        </div>
                    </div>
                </p-card>

                <!-- Residents Card -->
                <p-card styleClass="mt-4">
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                Residents
                            </h3>
                        </div>
                    </ng-template>

                    <div class="flex flex-col gap-3" *ngIf="residents().length > 0; else noResidents">
                        <div 
                            class="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800"
                            *ngFor="let resident of residents()"
                            (click)="viewResidentProfile(resident)">
                            <p-avatar 
                                [label]="getInitials(resident)" 
                                shape="circle" />
                            <div class="flex-1">
                                <div class="font-semibold text-surface-900 dark:text-surface-0">
                                    {{ resident.firstName }} {{ resident.lastName }}
                                </div>
                                <div class="text-xs text-surface-600 dark:text-surface-400">
                                    {{ resident.email }}
                                </div>
                            </div>
                            <i class="pi pi-chevron-right text-surface-400"></i>
                        </div>
                    </div>

                    <ng-template #noResidents>
                        <div class="text-center py-6">
                            <i class="pi pi-users text-4xl text-surface-400 mb-2"></i>
                            <p class="text-surface-600 dark:text-surface-400">
                                No residents assigned
                            </p>
                        </div>
                    </ng-template>
                </p-card>
            </div>

            <!-- Financial Summary -->
            <div class="col-span-12 lg:col-span-8">
                <div class="grid grid-cols-12 gap-4 mb-4">
                    <div class="col-span-12 md:col-span-6">
                        <p-card styleClass="h-full border-l-4 border-blue-500">
                            <div class="flex flex-col gap-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Total Charged</span>
                                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                    {{ totalCharged() | number:'1.3-3' }} TND
                                </div>
                                <div class="text-xs text-surface-500">
                                    {{ charges().length }} charges
                                </div>
                            </div>
                        </p-card>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <p-card styleClass="h-full border-l-4 border-green-500">
                            <div class="flex flex-col gap-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Total Paid</span>
                                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                    {{ totalPaid() | number:'1.3-3' }} TND
                                </div>
                                <div class="text-xs text-surface-500">
                                    {{ payments().length }} payments
                                </div>
                            </div>
                        </p-card>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <p-card styleClass="h-full border-l-4 border-orange-500">
                            <div class="flex flex-col gap-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Outstanding</span>
                                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                    {{ outstanding() | number:'1.3-3' }} TND
                                </div>
                                <div class="text-xs text-surface-500">
                                    {{ pendingCharges().length }} pending
                                </div>
                            </div>
                        </p-card>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <p-card styleClass="h-full border-l-4 border-red-500">
                            <div class="flex flex-col gap-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Overdue</span>
                                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                    {{ overdueAmount() | number:'1.3-3' }} TND
                                </div>
                                <div class="text-xs text-surface-500">
                                    {{ overdueCharges().length }} overdue
                                </div>
                            </div>
                        </p-card>
                    </div>
                </div>

                <!-- Tabs for Charges and Payments -->
                <p-card>
                    <p-tabs value="0">
                        <p-tablist>
                            <p-tab value="0">
                                Charges ({{ charges().length }})
                            </p-tab>
                            <p-tab value="1">
                                Payments ({{ payments().length }})
                            </p-tab>
                            <p-tab value="2">
                                Timeline
                            </p-tab>
                        </p-tablist>
                        <p-tabpanels>
                            <p-tabpanel value="0">
                                <p-table 
                                    [value]="charges()" 
                                    [paginator]="true" 
                                    [rows]="10"
                                    [loading]="loading()">
                                    <ng-template #header>
                                        <tr>
                                            <th>Label</th>
                                            <th>Amount</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th>Paid</th>
                                            <th>Actions</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-charge>
                                        <tr>
                                            <td>
                                                <div class="font-medium">{{ charge.label }}</div>
                                                <div class="text-xs text-surface-600 dark:text-surface-400">
                                                    {{ charge.category }}
                                                </div>
                                            </td>
                                            <td class="font-semibold">
                                                {{ charge.amount | number:'1.3-3' }} TND
                                            </td>
                                            <td>{{ charge.dueDate | date:'short' }}</td>
                                            <td>
                                                <p-tag 
                                                    [value]="charge.status" 
                                                    [severity]="getChargeSeverity(charge.status)" />
                                            </td>
                                            <td class="text-green-600 font-semibold">
                                                {{ charge.paidAmount || 0 | number:'1.3-3' }} TND
                                            </td>
                                            <td>
                                                <p-button 
                                                    icon="pi pi-eye" 
                                                    [text]="true" 
                                                    [rounded]="true" />
                                            </td>
                                        </tr>
                                    </ng-template>
                                    <ng-template #emptymessage>
                                        <tr>
                                            <td colspan="6" class="text-center py-8">
                                                <i class="pi pi-inbox text-4xl text-surface-400 mb-2"></i>
                                                <p class="text-surface-600 dark:text-surface-400">
                                                    No charges found
                                                </p>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-tabpanel>

                            <p-tabpanel value="1">
                                <p-table 
                                    [value]="payments()" 
                                    [paginator]="true" 
                                    [rows]="10"
                                    [loading]="loading()">
                                    <ng-template #header>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Charge</th>
                                            <th>Reference</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template #body let-payment>
                                        <tr>
                                            <td>{{ payment.paymentDate | date:'short' }}</td>
                                            <td class="font-semibold text-green-600">
                                                {{ payment.amount | number:'1.3-3' }} TND
                                            </td>
                                            <td>
                                                <i [class]="getPaymentMethodIcon(payment.method)" class="mr-2"></i>
                                                {{ payment.method }}
                                            </td>
                                            <td class="text-xs text-surface-600 dark:text-surface-400">
                                                {{ payment.chargeId }}
                                            </td>
                                            <td class="text-xs text-surface-600 dark:text-surface-400">
                                                {{ payment.id }}
                                            </td>
                                        </tr>
                                    </ng-template>
                                    <ng-template #emptymessage>
                                        <tr>
                                            <td colspan="5" class="text-center py-8">
                                                <i class="pi pi-inbox text-4xl text-surface-400 mb-2"></i>
                                                <p class="text-surface-600 dark:text-surface-400">
                                                    No payments found
                                                </p>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-tabpanel>

                            <p-tabpanel value="2">
                                <p-timeline 
                                    [value]="timeline()" 
                                    align="alternate"
                                    styleClass="customized-timeline">
                                    <ng-template #content let-event>
                                        <p-card>
                                            <div class="flex flex-col gap-2">
                                                <div class="flex items-center gap-2">
                                                    <i [class]="event.icon" [style.color]="event.color"></i>
                                                    <span class="font-semibold">{{ event.title }}</span>
                                                </div>
                                                <div class="text-sm text-surface-600 dark:text-surface-400">
                                                    {{ event.description }}
                                                </div>
                                                <div class="text-xs text-surface-500">
                                                    {{ event.date | date:'medium' }}
                                                </div>
                                            </div>
                                        </p-card>
                                    </ng-template>
                                </p-timeline>
                            </p-tabpanel>
                        </p-tabpanels>
                    </p-tabs>
                </p-card>
            </div>
        </div>

        <p-toast />
    `
})
export class ApartmentDetailComponent implements OnInit {
    loading = signal(true);
    apartment = signal<Apartment | null>(null);
    residents = signal<any[]>([]);
    charges = signal<any[]>([]);
    payments = signal<any[]>([]);

    apartmentId: string | null = null;

    totalCharged = computed(() => 
        this.charges().reduce((sum, c) => sum + c.amount, 0)
    );

    totalPaid = computed(() => 
        this.payments().reduce((sum, p) => sum + p.amount, 0)
    );

    outstanding = computed(() => 
        this.charges()
            .filter(c => c.status === 'PENDING')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    overdueAmount = computed(() => 
        this.charges()
            .filter(c => c.status === 'OVERDUE')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    pendingCharges = computed(() => 
        this.charges().filter(c => c.status === 'PENDING')
    );

    overdueCharges = computed(() => 
        this.charges().filter(c => c.status === 'OVERDUE')
    );

    timeline = computed(() => {
        const events: any[] = [];
        
        this.charges().forEach(charge => {
            events.push({
                title: 'Charge Created',
                description: `${charge.label} - ${charge.amount} TND`,
                date: charge.createdAt,
                icon: 'pi pi-file',
                color: '#3b82f6'
            });
        });

        this.payments().forEach(payment => {
            events.push({
                title: 'Payment Received',
                description: `${payment.amount} TND via ${payment.method}`,
                date: payment.paymentDate,
                icon: 'pi pi-check-circle',
                color: '#22c55e'
            });
        });

        return events.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    });

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private apartmentService: ApartmentService,
        private chargeService: ChargeService,
        private paymentService: PaymentService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.apartmentId = this.route.snapshot.paramMap.get('id');
        if (this.apartmentId) {
            this.loadApartmentData();
        }
    }

    async loadApartmentData() {
        try {
            this.loading.set(true);
            const organizationId = this.authService.organizationId();

            if (!organizationId || !this.apartmentId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Missing required information'
                });
                return;
            }

            // Load apartment details
            const apartment = await this.apartmentService.getById(this.apartmentId).toPromise();
            if (!apartment) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Apartment not found'
                });
                return;
            }
            this.apartment.set(apartment);

            // Load charges and payments
            const [allCharges, allPayments] = await Promise.all([
                this.chargeService.getAll().toPromise(),
                this.paymentService.getByOrganization(organizationId).toPromise()
            ]);

            const aptCharges = (allCharges || []).filter(c => c.apartmentId === this.apartmentId);
            const aptPayments = (allPayments || []).filter(p => 
                aptCharges.some(c => c.id === p.chargeId)
            );

            this.charges.set(aptCharges);
            this.payments.set(aptPayments);

            // TODO: Load residents when API is available
            this.residents.set([]);

        } catch (error) {
            console.error('Error loading apartment data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load apartment data'
            });
        } finally {
            this.loading.set(false);
        }
    }

    viewResidentProfile(resident: any) {
        this.router.navigate(['/pages/backoffice/finance/resident', resident.accountId]);
    }

    goBack() {
        if (this.apartment()?.buildingId) {
            this.router.navigate(['/pages/backoffice/finance/building', this.apartment()!.buildingId]);
        } else {
            this.router.navigate(['/pages/backoffice/finance/dashboard']);
        }
    }

    getInitials(resident: any): string {
        if (!resident) return '?';
        const first = resident.firstName?.charAt(0) || '';
        const last = resident.lastName?.charAt(0) || '';
        return (first + last).toUpperCase();
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

    getPaymentMethodIcon(method: string): string {
        switch (method?.toUpperCase()) {
            case 'CREDIT_CARD': return 'pi pi-credit-card';
            case 'WALLET': return 'pi pi-wallet';
            case 'BANK_TRANSFER': return 'pi pi-building';
            case 'CASH': return 'pi pi-money-bill';
            default: return 'pi pi-dollar';
        }
    }
}
