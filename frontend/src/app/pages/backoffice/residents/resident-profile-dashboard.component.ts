import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { KnobModule } from 'primeng/knob';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { TimelineModule } from 'primeng/timeline';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ChargeService } from '@/app/pages/service/charge.service';
import { PaymentService } from '@/app/pages/service/payment.service';
import { WalletService } from '@/app/pages/service/wallet.service';
import { ApartmentService } from '@/app/pages/service/apartment.service';
import { BuildingService } from '@/app/pages/service/building.service';

interface ResidentInfo {
    accountId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    nationalId?: string;
    birthDate?: string;
    moveInDate?: string;
    apartmentId: string | null;
    apartmentNumber: string | null;
    buildingId: string | null;
    buildingName: string | null;
    floorNumber: number | null;
    surfaceM2: number | null;
    organizationId?: string;
}

@Component({
    selector: 'app-resident-profile-dashboard',
    standalone: true,
    imports: [
        CommonModule, ButtonModule, CardModule, TabsModule, TableModule,
        TagModule, KnobModule, ChartModule, AvatarModule, TimelineModule, ToastModule
    ],
    template: `
        <p-toast />

        <!-- Back Button -->
        <div class="mb-4">
            <p-button 
                label="Back" 
                icon="pi pi-arrow-left" 
                [text]="true" 
                (onClick)="goBack()" />
        </div>

        <div *ngIf="loading()" class="flex items-center justify-center py-12">
            <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
        </div>

        <div *ngIf="!loading() && resident()">
            <!-- Header Section -->
            <div class="card mb-6">
                <div class="grid grid-cols-12 gap-6">
                    <!-- Left: Avatar & Basic Info -->
                    <div class="col-span-12 lg:col-span-4">
                        <div class="flex flex-col items-center text-center">
                            <!-- Large Avatar -->
                            <div class="mb-4">
                                <p-avatar 
                                    [label]="getInitials()" 
                                    styleClass="bg-gradient-to-br from-primary-500 to-primary-700 text-white"
                                    [style]="{ width: '120px', height: '120px', fontSize: '3rem' }"
                                    shape="circle" />
                            </div>
                            
                            <!-- Name & Email -->
                            <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                                {{ resident()!.firstName }} {{ resident()!.lastName }}
                            </h2>
                            <div class="flex items-center gap-2 text-surface-600 mb-2">
                                <i class="pi pi-envelope"></i>
                                <span>{{ resident()!.email }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-surface-600 mb-4">
                                <i class="pi pi-phone"></i>
                                <span>{{ resident()!.phone || 'N/A' }}</span>
                            </div>

                            <!-- Quick Actions -->
                            <div class="flex gap-2 w-full">
                                <p-button 
                                    label="Send Message" 
                                    icon="pi pi-envelope" 
                                    [outlined]="true"
                                    class="flex-1" />
                                <p-button 
                                    label="Call" 
                                    icon="pi pi-phone" 
                                    [outlined]="true"
                                    severity="success"
                                    class="flex-1" />
                            </div>
                        </div>
                    </div>

                    <!-- Right: Details Grid -->
                    <div class="col-span-12 lg:col-span-8">
                        <div class="grid grid-cols-12 gap-4">
                            <!-- Personal Information -->
                            <div class="col-span-12">
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                                    <i class="pi pi-user text-primary-500"></i>
                                    Personal Information
                                </h3>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                    <div class="text-surface-500 text-sm mb-1">National ID</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                        {{ resident()!.nationalId || 'Not provided' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                    <div class="text-surface-500 text-sm mb-1">Birth Date</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                        {{ resident()!.birthDate || 'Not provided' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                    <div class="text-surface-500 text-sm mb-1">Move-In Date</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                        {{ resident()!.moveInDate || 'Not provided' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                                    <div class="text-surface-500 text-sm mb-1">Resident Since</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">
                                        {{ getResidentDuration() }}
                                    </div>
                                </div>
                            </div>

                            <!-- Property Information -->
                            <div class="col-span-12 mt-4">
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                                    <i class="pi pi-home text-blue-500"></i>
                                    Property Information
                                </h3>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                    <div class="text-blue-600 dark:text-blue-400 text-sm mb-1">Building</div>
                                    <div class="font-bold text-lg text-surface-900 dark:text-surface-0">
                                        {{ resident()!.buildingName || 'N/A' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                    <div class="text-purple-600 dark:text-purple-400 text-sm mb-1">Apartment</div>
                                    <div class="font-bold text-lg text-surface-900 dark:text-surface-0">
                                        Apt {{ resident()!.apartmentNumber || 'N/A' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                                    <div class="text-green-600 dark:text-green-400 text-sm mb-1">Floor</div>
                                    <div class="font-bold text-lg text-surface-900 dark:text-surface-0">
                                        Floor {{ resident()!.floorNumber ?? 'N/A' }}
                                    </div>
                                </div>
                            </div>

                            <div class="col-span-12 md:col-span-6">
                                <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                                    <div class="text-orange-600 dark:text-orange-400 text-sm mb-1">Surface Area</div>
                                    <div class="font-bold text-lg text-surface-900 dark:text-surface-0">
                                        {{ resident()!.surfaceM2 ?? 'N/A' }} m²
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Financial Overview Cards -->
            <div class="grid grid-cols-12 gap-6 mb-6">
                <div class="col-span-12 lg:col-span-3">
                    <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-blue-100 text-sm mb-2">Wallet Balance</div>
                                <div class="text-3xl font-bold">
                                    {{ walletBalance() | currency:'TND':'symbol':'1.3-3' }}
                                </div>
                            </div>
                            <div class="flex items-center justify-center bg-white/20 rounded-full" style="width:3.5rem;height:3.5rem">
                                <i class="pi pi-wallet text-3xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-3">
                    <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-green-100 text-sm mb-2">Total Paid</div>
                                <div class="text-3xl font-bold">
                                    {{ totalPaid() | currency:'TND':'symbol':'1.3-3' }}
                                </div>
                            </div>
                            <div class="flex items-center justify-center bg-white/20 rounded-full" style="width:3.5rem;height:3.5rem">
                                <i class="pi pi-check-circle text-3xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-3">
                    <div class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-orange-100 text-sm mb-2">Outstanding</div>
                                <div class="text-3xl font-bold">
                                    {{ totalOutstanding() | currency:'TND':'symbol':'1.3-3' }}
                                </div>
                            </div>
                            <div class="flex items-center justify-center bg-white/20 rounded-full" style="width:3.5rem;height:3.5rem">
                                <i class="pi pi-clock text-3xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-3">
                    <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-purple-100 text-sm mb-2">Payment Score</div>
                                <div class="text-3xl font-bold">
                                    {{ paymentScore() }}%
                                </div>
                            </div>
                            <div class="flex items-center justify-center bg-white/20 rounded-full" style="width:3.5rem;height:3.5rem">
                                <i class="pi pi-star text-3xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs Section -->
            <div class="card">
                <p-tabs value="0">
                    <p-tablist>
                        <p-tab value="0">
                            <i class="pi pi-receipt mr-2"></i>
                            Charges ({{ charges().length }})
                        </p-tab>
                        <p-tab value="1">
                            <i class="pi pi-credit-card mr-2"></i>
                            Payments ({{ payments().length }})
                        </p-tab>
                        <p-tab value="2">
                            <i class="pi pi-chart-line mr-2"></i>
                            Financial History
                        </p-tab>
                        <p-tab value="3">
                            <i class="pi pi-clock mr-2"></i>
                            Activity Timeline
                        </p-tab>
                    </p-tablist>

                    <p-tabpanels>
                        <!-- Tab 1: Charges -->
                        <p-tabpanel value="0">
                            <p-table [value]="charges()" [rows]="10" [paginator]="true" [rowHover]="true">
                                <ng-template #header>
                                    <tr>
                                        <th>Label</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                        <th>Paid</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-charge>
                                    <tr>
                                        <td>{{ charge.label }}</td>
                                        <td class="font-bold">{{ charge.amount | currency:'TND':'symbol':'1.3-3' }}</td>
                                        <td>{{ charge.dueDate }}</td>
                                        <td>{{ charge.period }}</td>
                                        <td><p-tag [value]="charge.status" [severity]="getChargeSeverity(charge.status)" /></td>
                                        <td class="font-semibold" [class]="charge.paidAmount > 0 ? 'text-green-600' : 'text-surface-400'">
                                            {{ charge.paidAmount || 0 | currency:'TND':'symbol':'1.3-3' }}
                                        </td>
                                    </tr>
                                </ng-template>
                                <ng-template #emptymessage>
                                    <tr>
                                        <td colspan="6" class="text-center py-8">
                                            <i class="pi pi-inbox text-surface-300 text-4xl mb-3"></i>
                                            <div class="text-surface-500">No charges found</div>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>

                        <!-- Tab 2: Payments -->
                        <p-tabpanel value="1">
                            <p-table [value]="payments()" [rows]="10" [paginator]="true" [rowHover]="true">
                                <ng-template #header>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-payment>
                                    <tr>
                                        <td>{{ payment.paymentDate | date:'medium' }}</td>
                                        <td class="font-bold text-green-600">{{ payment.amount | currency:'TND':'symbol':'1.3-3' }}</td>
                                        <td>
                                            <div class="flex items-center gap-2">
                                                <i class="pi" [ngClass]="payment.method === 'WALLET' ? 'pi-wallet' : 'pi-credit-card'"></i>
                                                <span>{{ payment.method }}</span>
                                            </div>
                                        </td>
                                        <td><p-tag value="COMPLETED" severity="success" /></td>
                                    </tr>
                                </ng-template>
                                <ng-template #emptymessage>
                                    <tr>
                                        <td colspan="4" class="text-center py-8">
                                            <i class="pi pi-inbox text-surface-300 text-4xl mb-3"></i>
                                            <div class="text-surface-500">No payments found</div>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-tabpanel>

                        <!-- Tab 3: Financial History Chart -->
                        <p-tabpanel value="2">
                            <div class="mb-4">
                                <h3 class="text-xl font-bold mb-2">Payment History (Last 12 Months)</h3>
                                <p class="text-surface-600">Track payment trends over time</p>
                            </div>
                            <p-chart type="line" [data]="chartData()" [options]="chartOptions" height="300px" />
                        </p-tabpanel>

                        <!-- Tab 4: Activity Timeline -->
                        <p-tabpanel value="3">
                            <p-timeline [value]="timeline()" align="left">
                                <ng-template #content let-event>
                                    <div class="flex items-start gap-3">
                                        <div class="flex items-center justify-center rounded-full" 
                                             [class]="getTimelineIconClass(event.type)"
                                             style="width:2.5rem;height:2.5rem">
                                            <i [class]="getTimelineIcon(event.type)"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="font-semibold text-surface-900 dark:text-surface-0">{{ event.title }}</div>
                                            <div class="text-surface-600 text-sm">{{ event.description }}</div>
                                            <div class="text-surface-400 text-xs mt-1">{{ event.date | date:'medium' }}</div>
                                        </div>
                                    </div>
                                </ng-template>
                            </p-timeline>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </div>
        </div>

        <div *ngIf="!loading() && !resident()" class="card text-center py-12">
            <i class="pi pi-exclamation-triangle text-orange-500 text-5xl mb-4"></i>
            <h3 class="text-2xl font-bold mb-2">Resident Not Found</h3>
            <p class="text-surface-600 mb-4">The requested resident profile could not be found.</p>
            <p-button label="Go Back" icon="pi pi-arrow-left" (onClick)="goBack()" />
        </div>
    `,
    providers: [MessageService]
})
export class ResidentProfileDashboardComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private chargeService = inject(ChargeService);
    private paymentService = inject(PaymentService);
    private walletService = inject(WalletService);
    private apartmentService = inject(ApartmentService);
    private buildingService = inject(BuildingService);
    private messageService = inject(MessageService);

    loading = signal(true);
    resident = signal<ResidentInfo | null>(null);
    charges = signal<any[]>([]);
    payments = signal<any[]>([]);
    wallet = signal<any>(null);

    // Computed values
    walletBalance = computed(() => this.wallet()?.balance || 0);
    
    totalPaid = computed(() => {
        return this.charges().reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    });

    totalOutstanding = computed(() => {
        return this.charges()
            .filter(c => c.status !== 'PAID')
            .reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0);
    });

    paymentScore = computed(() => {
        const total = this.charges().length;
        if (total === 0) return 100;
        const paid = this.charges().filter(c => c.status === 'PAID').length;
        return Math.round((paid / total) * 100);
    });

    chartData = computed(() => {
        // Generate last 12 months data
        const months = [];
        const amounts = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            
            // Calculate payments for this month
            const monthPayments = this.payments().filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate.getMonth() === date.getMonth() && 
                       paymentDate.getFullYear() === date.getFullYear();
            });
            
            const total = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            amounts.push(total);
        }

        return {
            labels: months,
            datasets: [
                {
                    label: 'Payments (TND)',
                    data: amounts,
                    fill: true,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }
            ]
        };
    });

    chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: number) => value.toFixed(3) + ' TND'
                }
            }
        }
    };

    timeline = computed(() => {
        const events: any[] = [];

        // Add move-in event
        if (this.resident()?.moveInDate) {
            events.push({
                type: 'move-in',
                title: 'Moved In',
                description: `Started residency at ${this.resident()?.buildingName} - Apt ${this.resident()?.apartmentNumber}`,
                date: this.resident()?.moveInDate
            });
        }

        // Add payment events
        this.payments().slice(0, 5).forEach(payment => {
            events.push({
                type: 'payment',
                title: 'Payment Made',
                description: `Paid ${payment.amount.toFixed(3)} TND via ${payment.method}`,
                date: payment.paymentDate
            });
        });

        // Add charge events
        this.charges().slice(0, 3).forEach(charge => {
            if (charge.status === 'OVERDUE') {
                events.push({
                    type: 'overdue',
                    title: 'Charge Overdue',
                    description: `${charge.label} - ${charge.amount.toFixed(3)} TND`,
                    date: charge.dueDate
                });
            }
        });

        // Sort by date descending
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    ngOnInit() {
        const accountId = this.route.snapshot.paramMap.get('accountId');
        if (accountId) {
            this.loadResidentData(accountId);
        } else {
            this.loading.set(false);
        }
    }

    async loadResidentData(accountId: string) {
        try {
            // Load resident info with apartment details
            this.chargeService.getResidentsWithApartments().subscribe(residents => {
                const residentData = residents.find(r => r.accountId === accountId);
                
                if (residentData) {
                    this.resident.set({
                        accountId: residentData.accountId,
                        firstName: residentData.firstName,
                        lastName: residentData.lastName,
                        email: residentData.email,
                        apartmentId: residentData.apartmentId,
                        apartmentNumber: residentData.apartmentNumber,
                        buildingId: residentData.buildingId,
                        buildingName: residentData.buildingName,
                        floorNumber: residentData.floor,
                        surfaceM2: null
                    });
                }

                this.loading.set(false);
            });

            // Load charges
            this.chargeService.getAll().subscribe(allCharges => {
                const userCharges = allCharges.filter(c => c.userId === accountId);
                this.charges.set(userCharges);
            });

            // Load payments
            this.paymentService.getByUser(accountId).subscribe(payments => {
                this.payments.set(payments || []);
            });

            // Load wallet
            this.walletService.getByUser(accountId).subscribe(wallet => {
                this.wallet.set(wallet);
            });

        } catch (error) {
            console.error('Error loading resident data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load resident data'
            });
            this.loading.set(false);
        }
    }

    getInitials(): string {
        const r = this.resident();
        if (!r) return '?';
        return `${r.firstName.charAt(0)}${r.lastName.charAt(0)}`.toUpperCase();
    }

    getResidentDuration(): string {
        const moveInDate = this.resident()?.moveInDate;
        if (!moveInDate) return 'N/A';

        const start = new Date(moveInDate);
        const now = new Date();
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        
        if (months < 12) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
        }
    }

    getChargeSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
        switch (status) {
            case 'PAID': return 'success';
            case 'PENDING': return 'info';
            case 'PARTIALLY_PAID': return 'warn';
            case 'OVERDUE': return 'danger';
            default: return 'info';
        }
    }

    getTimelineIcon(type: string): string {
        switch (type) {
            case 'move-in': return 'pi pi-home';
            case 'payment': return 'pi pi-check-circle';
            case 'overdue': return 'pi pi-exclamation-triangle';
            default: return 'pi pi-circle';
        }
    }

    getTimelineIconClass(type: string): string {
        switch (type) {
            case 'move-in': return 'bg-blue-100 dark:bg-blue-800/30 text-blue-600';
            case 'payment': return 'bg-green-100 dark:bg-green-800/30 text-green-600';
            case 'overdue': return 'bg-red-100 dark:bg-red-800/30 text-red-600';
            default: return 'bg-surface-100 dark:bg-surface-800 text-surface-600';
        }
    }

    goBack() {
        this.router.navigate(['/pages/backoffice/finance/charges']);
    }
}
