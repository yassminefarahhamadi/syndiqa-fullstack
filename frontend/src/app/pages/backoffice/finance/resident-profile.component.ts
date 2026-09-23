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
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { AuthService } from '../../../core/auth/auth.service';
import { ChargeService } from '../../service/charge.service';
import { PaymentService } from '../../service/payment.service';
import { WalletService } from '../../service/wallet.service';

interface ResidentInfo {
    accountId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    apartmentId?: string;
    apartmentNumber?: string;
}

@Component({
    selector: 'app-resident-profile',
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
        ChartModule,
        KnobModule
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
                            Resident Financial Profile
                        </h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-1">
                            Complete financial history and risk assessment
                        </p>
                    </div>
                    <p-button 
                        label="Send Reminder" 
                        icon="pi pi-send" 
                        severity="secondary" />
                </div>
            </div>

            <!-- Resident Info Card -->
            <div class="col-span-12 lg:col-span-4">
                <p-card>
                    <div class="flex flex-col items-center gap-4">
                        <p-avatar 
                            [label]="getInitials()" 
                            size="xlarge" 
                            shape="circle"
                            styleClass="text-3xl" />
                        
                        <div class="text-center">
                            <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0">
                                {{ residentInfo()?.firstName }} {{ residentInfo()?.lastName }}
                            </h3>
                            <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
                                {{ residentInfo()?.email }}
                            </p>
                            <p class="text-surface-600 dark:text-surface-400 text-sm" *ngIf="residentInfo()?.phone">
                                {{ residentInfo()?.phone }}
                            </p>
                        </div>

                        <div class="w-full pt-4 border-t border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Apartment</span>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">
                                    {{ residentInfo()?.apartmentNumber || 'N/A' }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Account ID</span>
                                <span class="text-xs text-surface-600 dark:text-surface-400 font-mono">
                                    {{ residentInfo()?.accountId?.substring(0, 8) }}...
                                </span>
                            </div>
                        </div>
                    </div>
                </p-card>

                <!-- Risk Assessment Card -->
                <p-card styleClass="mt-4">
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                Risk Assessment
                            </h3>
                        </div>
                    </ng-template>

                    <div class="flex flex-col items-center gap-4">
                        <p-knob 
                            [(ngModel)]="riskScore" 
                            [readonly]="true"
                            [size]="150"
                            [strokeWidth]="8"
                            [valueColor]="getRiskColor()"
                            valueTemplate="{value}%" />
                        
                        <div class="text-center">
                            <p-tag 
                                [value]="getRiskLevel()" 
                                [severity]="getRiskSeverity()"
                                styleClass="text-lg px-4 py-2" />
                            <p class="text-surface-600 dark:text-surface-400 text-sm mt-2">
                                {{ getRiskDescription() }}
                            </p>
                        </div>

                        <div class="w-full pt-4 border-t border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">On-time Payments</span>
                                <span class="font-semibold text-green-600">
                                    {{ onTimePayments() }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Late Payments</span>
                                <span class="font-semibold text-orange-600">
                                    {{ latePayments() }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-surface-600 dark:text-surface-400 text-sm">Missed Payments</span>
                                <span class="font-semibold text-red-600">
                                    {{ missedPayments() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </p-card>

                <!-- Wallet Card -->
                <p-card styleClass="mt-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <span class="text-white/80 text-sm">Wallet Balance</span>
                            <i class="pi pi-wallet text-white/80"></i>
                        </div>
                        <div class="text-3xl font-bold">
                            {{ walletBalance() | number:'1.3-3' }} TND
                        </div>
                        <p-button 
                            label="View Wallet" 
                            [outlined]="true"
                            severity="secondary"
                            styleClass="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" />
                    </div>
                </p-card>
            </div>

            <!-- Financial Data -->
            <div class="col-span-12 lg:col-span-8">
                <!-- Summary Cards -->
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

                <!-- Payment History Chart -->
                <p-card styleClass="mb-4">
                    <ng-template #header>
                        <div class="p-6 border-b border-surface-200 dark:border-surface-700">
                            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                                Payment History
                            </h3>
                        </div>
                    </ng-template>
                    <p-chart type="line" [data]="paymentChartData" [options]="paymentChartOptions" />
                </p-card>

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
                                            <th>Status</th>
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
                                            <td>
                                                <p-tag value="COMPLETED" severity="success" />
                                            </td>
                                            <td class="text-xs text-surface-600 dark:text-surface-400">
                                                {{ payment.id }}
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-tabpanel>
                        </p-tabpanels>
                    </p-tabs>
                </p-card>
            </div>
        </div>

        <p-toast />
    `
})
export class ResidentProfileComponent implements OnInit {
    loading = signal(true);
    residentInfo = signal<ResidentInfo | null>(null);
    charges = signal<any[]>([]);
    payments = signal<any[]>([]);
    walletBalance = signal(0);
    riskScore = 85; // Default, will be calculated

    accountId: string | null = null;

    paymentChartData: any;
    paymentChartOptions: any;

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

    onTimePayments = computed(() => 
        this.payments().filter(p => {
            const charge = this.charges().find(c => c.id === p.chargeId);
            return charge && new Date(p.paymentDate) <= new Date(charge.dueDate);
        }).length
    );

    latePayments = computed(() => 
        this.payments().filter(p => {
            const charge = this.charges().find(c => c.id === p.chargeId);
            return charge && new Date(p.paymentDate) > new Date(charge.dueDate);
        }).length
    );

    missedPayments = computed(() => 
        this.overdueCharges().length
    );

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private chargeService: ChargeService,
        private paymentService: PaymentService,
        private walletService: WalletService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.accountId = this.route.snapshot.paramMap.get('accountId');
        if (this.accountId) {
            this.loadResidentData();
        }
        this.initializeChart();
    }

    async loadResidentData() {
        try {
            this.loading.set(true);

            if (!this.accountId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Account ID not found'
                });
                return;
            }

            // Load charges and payments for this resident
            const [allCharges, userPayments, wallet] = await Promise.all([
                this.chargeService.getAll().toPromise(),
                this.paymentService.getByUser(this.accountId).toPromise(),
                this.walletService.getByUser(this.accountId).toPromise()
            ]);

            // Filter charges for this user
            const userCharges = (allCharges || []).filter(c => c.userId === this.accountId);
            
            this.charges.set(userCharges);
            this.payments.set(userPayments || []);
            this.walletBalance.set(wallet?.balance || 0);

            // Calculate risk score
            this.calculateRiskScore();

            // Update chart
            this.updateChart();

            // TODO: Load resident info from account service when available
            this.residentInfo.set({
                accountId: this.accountId,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+216 12 345 678',
                apartmentNumber: 'A-101'
            });

        } catch (error) {
            console.error('Error loading resident data:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load resident data'
            });
        } finally {
            this.loading.set(false);
        }
    }

    calculateRiskScore() {
        const total = this.charges().length;
        if (total === 0) {
            this.riskScore = 100;
            return;
        }

        const onTime = this.onTimePayments();
        const late = this.latePayments();
        const missed = this.missedPayments();

        // Score calculation: 100 - (late * 5) - (missed * 10)
        this.riskScore = Math.max(0, Math.min(100, 100 - (late * 5) - (missed * 10)));
    }

    initializeChart() {
        this.paymentChartData = {
            labels: [],
            datasets: [{
                label: 'Payments (TND)',
                data: [],
                fill: true,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4
            }]
        };

        this.paymentChartOptions = {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: number) => `${value} TND`
                    }
                }
            }
        };
    }

    updateChart() {
        // Group payments by month
        const monthlyData = new Map<string, number>();
        
        this.payments().forEach(payment => {
            const date = new Date(payment.paymentDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + payment.amount);
        });

        const sortedMonths = Array.from(monthlyData.keys()).sort();
        
        this.paymentChartData = {
            labels: sortedMonths.map(m => {
                const [year, month] = m.split('-');
                return `${month}/${year}`;
            }),
            datasets: [{
                label: 'Payments (TND)',
                data: sortedMonths.map(m => monthlyData.get(m)),
                fill: true,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4
            }]
        };
    }

    goBack() {
        this.router.navigate(['/pages/backoffice/finance/dashboard']);
    }

    getInitials(): string {
        const info = this.residentInfo();
        if (!info) return '?';
        const first = info.firstName?.charAt(0) || '';
        const last = info.lastName?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getRiskColor(): string {
        if (this.riskScore >= 80) return '#22c55e';
        if (this.riskScore >= 50) return '#f97316';
        return '#ef4444';
    }

    getRiskLevel(): string {
        if (this.riskScore >= 80) return 'LOW RISK';
        if (this.riskScore >= 50) return 'MEDIUM RISK';
        return 'HIGH RISK';
    }

    getRiskSeverity(): 'success' | 'warn' | 'danger' {
        if (this.riskScore >= 80) return 'success';
        if (this.riskScore >= 50) return 'warn';
        return 'danger';
    }

    getRiskDescription(): string {
        if (this.riskScore >= 80) return 'Excellent payment history';
        if (this.riskScore >= 50) return 'Some late payments detected';
        return 'Multiple missed payments';
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
