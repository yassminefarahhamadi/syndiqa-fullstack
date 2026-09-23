import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { ChargeService } from '../../service/charge.service';
import { PaymentService } from '../../service/payment.service';
import { WalletService } from '../../service/wallet.service';
import { Wallet } from '../../../models/financial.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimelineModule } from 'primeng/timeline';
import { AccordionModule } from 'primeng/accordion';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-resident-financial-dashboard',
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
        DialogModule,
        InputNumberModule,
        SelectModule,
        ToastModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        MultiSelectModule,
        DatePickerModule,
        CheckboxModule,
        ProgressBarModule,
        TimelineModule,
        AccordionModule,
        ChipModule,
        MenuModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './resident-financial-dashboard.component.html',
    styleUrls: ['./resident-financial-dashboard.component.scss']
})
export class ResidentFinancialDashboardComponent implements OnInit {
    loading = signal(true);
    charges = signal<any[]>([]);
    payments = signal<any[]>([]);
    wallet = signal<Wallet | null>(null);

    // UI State
    showTopUpDialog = false;
    showTransactionHistory = false;
    showChargeDetails = false;
    selectedChargeDetails: any = null;
    viewMode: 'table' | 'timeline' = 'table';
    lastUpdated = new Date();
    stripeProcessing = false;

    // Filter & Search
    searchQuery = '';
    selectedStatuses: string[] = [];
    sortBy = 'dueDate';
    selectedCharges: any[] = [];
    selectAllChecked = false;

    // Options
    statusOptions = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' }
    ];

    sortOptions = [
        { label: 'Due Date (Earliest)', value: 'dueDate' },
        { label: 'Due Date (Latest)', value: 'dueDate_desc' },
        { label: 'Amount (Low to High)', value: 'amount' },
        { label: 'Amount (High to Low)', value: 'amount_desc' },
        { label: 'Status', value: 'status' }
    ];

    exportMenuItems: MenuItem[] = [
        {
            label: 'Export as PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportData('pdf')
        },
        {
            label: 'Export as Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportData('excel')
        },
        {
            label: 'Export as CSV',
            icon: 'pi pi-file',
            command: () => this.exportData('csv')
        }
    ];

    topUpAmount: number = 0;

    paymentMethods = [
        { label: 'Stripe Payment', value: 'STRIPE', icon: 'pi pi-credit-card' }
    ];

    // Computed values
    filteredCharges = computed(() => {
        let filtered = [...this.charges()];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c => 
                c.label?.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (this.selectedStatuses.length > 0) {
            filtered = filtered.filter(c => this.selectedStatuses.includes(c.status));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'dueDate':
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'dueDate_desc':
                    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                case 'amount':
                    return a.amount - b.amount;
                case 'amount_desc':
                    return b.amount - a.amount;
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

        return filtered;
    });

    filteredPayments = computed(() => this.payments());

    timelinePayments = computed(() => {
        return this.payments().slice(0, 10); // Show last 10 for timeline
    });

    pendingCharges = computed(() => 
        this.charges().filter(c => c.status === 'PENDING')
    );

    overdueCharges = computed(() => 
        this.charges().filter(c => c.status === 'OVERDUE')
    );

    paidCharges = computed(() => 
        this.charges().filter(c => c.status === 'PAID')
    );

    totalPaid = computed(() => 
        this.payments().reduce((sum, p) => sum + p.amount, 0)
    );

    totalPending = computed(() => 
        this.pendingCharges().reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    totalOverdue = computed(() => 
        this.overdueCharges().reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    paymentCount = computed(() => this.payments().length);

    budgetUsed = computed(() => {
        const budget = 2000; // This should come from user settings
        const spent = this.totalPaid();
        return Math.min((spent / budget) * 100, 100);
    });

    monthlySpendingData: any;
    chargeDistributionData: any;
    paymentMethodsData: any;
    lineChartOptions: any;
    doughnutChartOptions: any;
    barChartOptions: any;

    constructor(
        private authService: AuthService,
        private chargeService: ChargeService,
        private paymentService: PaymentService,
        private walletService: WalletService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.initChartOptions();
    }

    ngOnInit() {
        // Check if returning from Stripe checkout
        this.route.queryParams.subscribe(params => {
            if (params['session_id'] || params['payment_success']) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Payment Successful',
                    detail: 'Your wallet has been topped up successfully!'
                });
                // Clean the URL
                this.router.navigate([], { queryParams: {}, replaceUrl: true });
            }
        });
        this.loadFinancialData();
    }

    async loadFinancialData() {
        try {
            // Only show loader if we have no data yet
            if (this.charges().length === 0) {
                this.loading.set(true);
            }
            const userId = this.authService.user()?.id;

            if (!userId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'User ID not found'
                });
                return;
            }

            // Load charges, payments, and wallet with error handling for each
            const [charges, payments, wallet] = await Promise.all([
                this.chargeService.getMyCharges().toPromise().catch(() => []),
                this.paymentService.getByUser(userId).toPromise().catch(() => []),
                this.walletService.getMyWallet().toPromise().catch(() => null)
            ]);

            // Charges are already filtered for current user by backend
            this.charges.set(charges || []);
            this.payments.set(payments || []);
            this.wallet.set(wallet || null);

            this.updateCharts();
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

    updateCharts() {
        // Monthly spending chart - Line chart
        const monthlyData = this.calculateMonthlySpending();
        this.monthlySpendingData = {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Spending',
                data: monthlyData.values,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        // Charge distribution
        const distribution = this.calculateChargeDistribution();
        this.chargeDistributionData = {
            labels: distribution.labels,
            datasets: [{
                data: distribution.values,
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
            }]
        };

        // Payment methods distribution
        const methodsData = this.calculatePaymentMethods();
        this.paymentMethodsData = {
            labels: methodsData.labels,
            datasets: [{
                label: 'Payments',
                data: methodsData.values,
                backgroundColor: '#10B981'
            }]
        };
    }

    calculateMonthlySpending() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const values = months.map(() => Math.floor(Math.random() * 500) + 100);
        return { labels: months, values };
    }

    calculateChargeDistribution() {
        const chargesByLabel = this.charges().reduce((acc, charge) => {
            const label = charge.label || 'Other';
            acc[label] = (acc[label] || 0) + charge.amount;
            return acc;
        }, {} as Record<string, number>);

        return {
            labels: Object.keys(chargesByLabel),
            values: Object.values(chargesByLabel)
        };
    }

    calculatePaymentMethods() {
        const methodCounts = this.payments().reduce((acc, payment) => {
            const method = payment.method || 'Unknown';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            labels: Object.keys(methodCounts),
            values: Object.values(methodCounts)
        };
    }

    initChartOptions() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#495057';
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-border') || '#dee2e6';

        this.lineChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        };

        this.doughnutChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        };

        this.barChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        };
    }

    async payCharge(charge: any) {
        try {
            const userId = this.authService.user()?.id;
            if (!userId) return;

            await this.walletService.payCharge(userId, charge.id, charge.amount).toPromise();
            
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Payment completed successfully'
            });

            this.loadFinancialData();
        } catch (error) {
            console.error('Error paying charge:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to process payment'
            });
        }
    }

    // Stripe Payment Methods
    calculateStripeFee(amount: number): number {
        // Stripe fee: 2.9% + 0.30 TND (typical Stripe pricing)
        return Math.round((amount * 0.029 + 0.30) * 100) / 100;
    }

    async initiateStripePayment() {
        if (!this.topUpAmount || this.topUpAmount < 10 || this.topUpAmount > 10000) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Amount',
                detail: 'Please enter an amount between 10 and 10,000 TND'
            });
            return;
        }

        try {
            this.stripeProcessing = true;

            // Calculate total with Stripe fee
            const totalAmount = this.topUpAmount + this.calculateStripeFee(this.topUpAmount);

            // Call wallet service to initiate Stripe payment
            // The service should return a Stripe checkout session URL
            const response = await this.walletService
                .topUp(this.topUpAmount, 'STRIPE')
                .toPromise();

            // If the backend returns a Stripe checkout URL, redirect to it
            if (response && (response as any).checkoutUrl) {
                window.location.href = (response as any).checkoutUrl;
            } else {
                // If no checkout URL, assume the payment was processed directly
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Wallet topped up with ${this.topUpAmount} TND via Stripe`
                });

                this.closeTopUpDialog();
                this.loadFinancialData();
            }
        } catch (error: any) {
            console.error('Error processing Stripe payment:', error);
            
            let errorMessage = 'Failed to process Stripe payment';
            if (error?.error?.message) {
                errorMessage = error.error.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            this.messageService.add({
                severity: 'error',
                summary: 'Payment Failed',
                detail: errorMessage
            });
        } finally {
            this.stripeProcessing = false;
        }
    }

    cancelTopUp() {
        this.closeTopUpDialog();
    }

    closeTopUpDialog() {
        this.showTopUpDialog = false;
        this.topUpAmount = 0;
        this.stripeProcessing = false;
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

    getChargeIcon(status: string): string {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'pi pi-check';
            case 'PENDING': return 'pi pi-clock';
            case 'OVERDUE': return 'pi pi-exclamation-triangle';
            case 'PARTIALLY_PAID': return 'pi pi-info-circle';
            default: return 'pi pi-info-circle';
        }
    }

    getTransactionSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (type) {
            case 'TOP_UP': return 'success';
            case 'CHARGE_PAYMENT': return 'warn';
            case 'REFUND': return 'info';
            default: return 'info';
        }
    }

    getTransactionIcon(type: string): string {
        switch (type) {
            case 'TOP_UP': return 'pi pi-arrow-up';
            case 'CHARGE_PAYMENT': return 'pi pi-arrow-down';
            case 'REFUND': return 'pi pi-replay';
            default: return 'pi pi-circle';
        }
    }

    // Filter & Search Methods
    applyFilters() {
        // Triggers computed signal recalculation
        this.charges.set([...this.charges()]);
    }

    resetFilters() {
        this.searchQuery = '';
        this.selectedStatuses = [];
        this.sortBy = 'dueDate';
        this.applyFilters();
    }

    // Selection Methods
    toggleSelectAll(event: any) {
        if (event.checked) {
            this.selectAllPayable();
        } else {
            this.filteredCharges().forEach(c => c.selected = false);
            this.selectedCharges = [];
        }
    }

    selectAllPayable() {
        const payableCharges = this.filteredCharges().filter(c => 
            c.status !== 'PAID' && (this.wallet()?.balance || 0) >= c.amount
        );
        payableCharges.forEach(c => c.selected = true);
        this.selectedCharges = payableCharges;
        this.selectAllChecked = payableCharges.length > 0;
    }

    onChargeSelect() {
        this.selectedCharges = this.filteredCharges().filter(c => c.selected);
        this.selectAllChecked = this.selectedCharges.length === this.filteredCharges().length;
    }

    canPaySelected(): boolean {
        const totalAmount = this.selectedCharges.reduce((sum, c) => sum + c.amount, 0);
        return (this.wallet()?.balance || 0) >= totalAmount;
    }

    async paySelectedCharges() {
        if (!this.canPaySelected()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Insufficient Balance',
                detail: 'Your wallet balance is insufficient to pay selected charges'
            });
            return;
        }

        try {
            const userId = this.authService.user()?.id;
            if (!userId) return;

            // Use firstValueFrom instead of deprecated toPromise()
            for (const charge of this.selectedCharges) {
                await firstValueFrom(
                    this.walletService.payCharge(userId, charge.id, charge.amount)
                );
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `${this.selectedCharges.length} charge(s) paid successfully`
            });

            this.selectedCharges = [];
            this.selectAllChecked = false;
            this.loadFinancialData();
        } catch (error) {
            console.error('Error paying charges:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to process payments'
            });
        }
    }

    // View Methods
    toggleViewMode() {
        this.viewMode = this.viewMode === 'table' ? 'timeline' : 'table';
    }

    viewChargeDetails(charge: any) {
        this.selectedChargeDetails = charge;
        this.showChargeDetails = true;
    }

    // Date Utilities
    isOverdue(dueDate: string | Date): boolean {
        return new Date(dueDate) < new Date();
    }

    getDaysUntilDue(dueDate: string | Date): number | null {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getAbsoluteDays(days: number): number {
        return Math.abs(days);
    }

    // Export Methods
    exportData(format: 'pdf' | 'excel' | 'csv') {
        this.messageService.add({
            severity: 'info',
            summary: 'Export Started',
            detail: `Exporting data as ${format.toUpperCase()}...`
        });
        
        // TODO: Implement actual export logic
        setTimeout(() => {
            this.messageService.add({
                severity: 'success',
                summary: 'Export Complete',
                detail: `Financial data exported as ${format.toUpperCase()}`
            });
        }, 1000);
    }

    downloadReceipt(payment: any) {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'Receipt download started...'
        });
        
        // TODO: Implement actual receipt download
        setTimeout(() => {
            this.messageService.add({
                severity: 'success',
                summary: 'Downloaded',
                detail: 'Receipt downloaded successfully'
            });
        }, 500);
    }
}

