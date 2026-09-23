import { Component, OnInit, inject, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { AuthService } from '@/app/core/auth/auth.service';
import { ResidentCharge, ResidentChargeService } from '@/app/pages/service/resident-charge.service';

@Component({
    selector: 'app-my-charges',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, RippleModule,
        ToastModule, InputTextModule, SelectModule, InputNumberModule,
        DialogModule, TagModule, IconFieldModule, InputIconModule,
        MultiSelectModule, CheckboxModule, TooltipModule, ChipModule,
        CardModule, ProgressBarModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="grid grid-cols-12 gap-4">

            <!-- Compact Header -->
            <div class="col-span-12">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div class="text-surface-500 font-medium mb-2 uppercase tracking-wide text-xs flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> FINANCIAL RECORDS
                        </div>
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-1">My Invoices & Charges</h2>
                        <p class="text-sm text-surface-600 dark:text-surface-400">Last updated: {{ lastUpdated | date:'short' }}</p>
                    </div>
                    <div class="flex gap-2">
                        <p-button 
                            label="Export" 
                            icon="pi pi-download" 
                            severity="secondary" 
                            size="small"
                            [outlined]="true" />
                        <p-button 
                            label="Top Up Wallet" 
                            icon="pi pi-plus-circle" 
                            size="small"
                            (onClick)="openTopUpDialog()" />
                    </div>
                </div>
            </div>

            <!-- Compact Overview Cards -->
            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">WALLET BALANCE</span>
                        <i class="pi pi-wallet text-xl text-blue-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ wallet ? (wallet.balance | currency:'TND') : '—' }}
                    </div>
                    <div class="text-xs text-surface-600 dark:text-surface-400">Available funds</div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">TOTAL OUTSTANDING</span>
                        <i class="pi pi-exclamation-circle text-xl text-red-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ totalOutstanding | currency:'TND' }}
                    </div>
                    <div class="text-xs text-red-600">{{ unpaidCount }} unpaid charges</div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">PAID THIS MONTH</span>
                        <i class="pi pi-check-circle text-xl text-green-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ paidThisMonth | currency:'TND' }}
                    </div>
                    <div class="text-xs text-green-600">{{ paidCount }} payments</div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">OVERDUE</span>
                        <i class="pi pi-exclamation-triangle text-xl text-orange-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ overdueAmount | currency:'TND' }}
                    </div>
                    <div class="text-xs text-orange-600">{{ overdueCount }} overdue</div>
                </p-card>
            </div>

            <!-- Enhanced Charges Table -->
            <div class="col-span-12">
                <p-card>
                    <ng-template #header>
                        <div class="p-4 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-between flex-wrap gap-3 mb-3">
                                <div>
                                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Active Invoices</h3>
                                    <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">{{ filteredCharges().length }} of {{ allCharges().length }} charges</p>
                                </div>
                                <div class="flex gap-2">
                                    <p-button 
                                        label="Pay Selected" 
                                        icon="pi pi-credit-card" 
                                        size="small"
                                        [disabled]="selectedCharges.length === 0"
                                        (onClick)="paySelectedCharges()" />
                                    <p-button 
                                        label="Select All Payable" 
                                        icon="pi pi-check-square" 
                                        size="small"
                                        [outlined]="true"
                                        (onClick)="selectAllPayable()" />
                                </div>
                            </div>
                            
                            <!-- Filters -->
                            <div class="grid grid-cols-12 gap-2">
                                <div class="col-span-12 md:col-span-4">
                                    <p-iconfield iconPosition="left">
                                        <p-inputicon styleClass="pi pi-search" />
                                        <input 
                                            pInputText 
                                            type="text" 
                                            [(ngModel)]="searchQuery"
                                            (ngModelChange)="applyFilters()"
                                            placeholder="Search invoices..." 
                                            class="w-full text-sm" />
                                    </p-iconfield>
                                </div>
                                <div class="col-span-12 md:col-span-3">
                                    <p-multiselect 
                                        [(ngModel)]="selectedStatuses"
                                        [options]="statusOptions"
                                        (ngModelChange)="applyFilters()"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Filter by status"
                                        [maxSelectedLabels]="2"
                                        styleClass="w-full text-sm"
                                        display="chip" />
                                </div>
                                <div class="col-span-12 md:col-span-3">
                                    <p-select 
                                        [(ngModel)]="sortBy"
                                        [options]="sortOptions"
                                        (ngModelChange)="applyFilters()"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Sort by"
                                        styleClass="w-full text-sm" />
                                </div>
                                <div class="col-span-12 md:col-span-2">
                                    <p-button 
                                        label="Reset" 
                                        icon="pi pi-filter-slash" 
                                        [outlined]="true"
                                        size="small"
                                        styleClass="w-full"
                                        (onClick)="resetFilters()" />
                                </div>
                            </div>
                        </div>
                    </ng-template>

                    <p-table
                        [value]="filteredCharges()"
                        [(selection)]="selectedCharges"
                        [paginator]="true"
                        [rows]="10"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} charges"
                        styleClass="p-datatable-sm"
                        dataKey="id">

                        <ng-template #header>
                            <tr>
                                <th style="width: 3rem">
                                    <p-checkbox 
                                        [(ngModel)]="selectAllChecked"
                                        (onChange)="toggleSelectAll($event)"
                                        [binary]="true" />
                                </th>
                                <th>Invoice Details</th>
                                <th>Period</th>
                                <th>Due Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-charge>
                            <tr [class.bg-red-50]="charge.status === 'OVERDUE'" [class.dark:bg-red-900/10]="charge.status === 'OVERDUE'">
                                <td>
                                    <p-checkbox 
                                        [(ngModel)]="charge.selected"
                                        (onChange)="onChargeSelect()"
                                        [binary]="true"
                                        [disabled]="charge.status === 'PAID'" />
                                </td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ charge.label }}</span>
                                        <span class="text-xs text-surface-600 dark:text-surface-400">{{ charge.period }}</span>
                                    </div>
                                </td>
                                <td>
                                    <p-chip [label]="charge.period" size="small" styleClass="text-xs" />
                                </td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span [class.text-red-600]="isOverdue(charge.dueDate)" [class.font-semibold]="isOverdue(charge.dueDate)">
                                            {{ charge.dueDate | date:'short' }}
                                        </span>
                                        <span class="text-xs text-surface-600 dark:text-surface-400" *ngIf="getDaysUntilDue(charge.dueDate) !== null">
                                            {{ getDaysUntilDue(charge.dueDate)! > 0 ? getDaysUntilDue(charge.dueDate) + ' days left' : 'Overdue by ' + getAbsoluteDays(getDaysUntilDue(charge.dueDate)!) + ' days' }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span class="font-bold text-surface-900 dark:text-surface-0">{{ charge.amount | currency:'TND' }}</span>
                                        <span class="text-xs text-green-600" *ngIf="charge.paidAmount && charge.paidAmount > 0">
                                            Paid: {{ charge.paidAmount | currency:'TND' }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag 
                                        [value]="getStatusLabel(charge.status)" 
                                        [severity]="getSeverity(charge.status)"
                                        [icon]="getStatusIcon(charge.status)" />
                                </td>
                                <td class="text-center">
                                    <div class="flex gap-1 justify-center">
                                        <p-button 
                                            *ngIf="charge.status !== 'PAID'"
                                            icon="pi pi-credit-card" 
                                            [rounded]="true"
                                            [text]="true"
                                            size="small"
                                            severity="success"
                                            pTooltip="Pay now"
                                            tooltipPosition="top"
                                            (onClick)="openPaymentDialog(charge)" />
                                        <p-button 
                                            icon="pi pi-eye" 
                                            [rounded]="true"
                                            [text]="true"
                                            size="small"
                                            pTooltip="View details"
                                            tooltipPosition="top"
                                            (onClick)="viewChargeDetails(charge)" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="7" class="text-center py-8">
                                    <i class="pi pi-inbox text-4xl text-surface-400 mb-3 block"></i>
                                    <p class="text-surface-600 dark:text-surface-400">No charges found</p>
                                    <p class="text-sm text-surface-500 dark:text-surface-500 mt-1">You're all caught up!</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </div>
        </div>

        <!-- ═══════════════════════════════════════════ -->
        <!--  CHARGE DETAILS DIALOG                      -->
        <!-- ═══════════════════════════════════════════ -->
        <p-dialog 
            [(visible)]="chargeDetailsDialog" 
            [header]="'Invoice Details'"
            [modal]="true" 
            [style]="{width: '600px'}"
            [draggable]="false"
            [resizable]="false">
            <div *ngIf="selectedCharge" class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm text-surface-600 dark:text-surface-400">Invoice Label</label>
                        <div class="font-semibold text-lg">{{ selectedCharge.label }}</div>
                    </div>
                    <div>
                        <label class="text-sm text-surface-600 dark:text-surface-400">Status</label>
                        <div class="mt-1">
                            <p-tag 
                                [value]="getStatusLabel(selectedCharge.status)" 
                                [severity]="getSeverity(selectedCharge.status)" />
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm text-surface-600 dark:text-surface-400">Amount</label>
                        <div class="font-bold text-2xl text-surface-900 dark:text-surface-0">
                            {{ selectedCharge.amount | currency:'TND' }}
                        </div>
                    </div>
                    <div>
                        <label class="text-sm text-surface-600 dark:text-surface-400">Due Date</label>
                        <div class="font-semibold text-lg" [class.text-red-600]="isOverdue(selectedCharge.dueDate)">
                            {{ selectedCharge.dueDate | date:'medium' }}
                        </div>
                    </div>
                </div>

                <div>
                    <label class="text-sm text-surface-600 dark:text-surface-400">Period</label>
                    <div class="mt-1">
                        <p-chip [label]="selectedCharge.period" />
                    </div>
                </div>

                <div *ngIf="selectedCharge.paidAmount && selectedCharge.paidAmount > 0">
                    <label class="text-sm text-surface-600 dark:text-surface-400">Payment Progress</label>
                    <div class="mt-2">
                        <div class="flex justify-between text-sm mb-2">
                            <span>{{ selectedCharge.paidAmount | currency:'TND' }} of {{ selectedCharge.amount | currency:'TND' }}</span>
                            <span class="font-semibold">{{ (selectedCharge.paidAmount / selectedCharge.amount * 100).toFixed(0) }}%</span>
                        </div>
                        <p-progressbar 
                            [value]="selectedCharge.paidAmount / selectedCharge.amount * 100" 
                            [showValue]="false" />
                    </div>
                </div>
            </div>
            <ng-template #footer>
                <p-button 
                    label="Close" 
                    severity="secondary" 
                    [outlined]="true"
                    (onClick)="chargeDetailsDialog = false" />
                <p-button 
                    *ngIf="selectedCharge && selectedCharge.status !== 'PAID'"
                    label="Pay Now" 
                    icon="pi pi-credit-card" 
                    (onClick)="openPaymentDialogFromDetails()" />
            </ng-template>
        </p-dialog>
        <!-- ═══════════════════════════════════════════ -->
        <!--  PAY CHARGE DIALOG                          -->
        <!-- ═══════════════════════════════════════════ -->
        <p-dialog [(visible)]="paymentDialog" [modal]="true" [style]="{ width: '500px' }"
            header="Pay Invoice with Stripe" [draggable]="false" [resizable]="false">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">

                    <!-- Invoice summary -->
                    <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                        <div class="flex justify-between mb-2">
                            <span class="text-surface-500 text-sm">Invoice</span>
                            <span class="font-semibold text-sm">{{ selectedCharge?.label }}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-surface-500 text-sm">Period</span>
                            <span class="font-semibold text-sm">{{ selectedCharge?.period }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-surface-500 text-sm">Amount Due</span>
                            <span class="font-bold text-lg">{{ remainingAmount | currency:'TND' }}</span>
                        </div>
                    </div>

                    <!-- Wallet balance info -->
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-wallet text-blue-600"></i>
                                <span class="font-semibold text-blue-900 dark:text-blue-100">Wallet Balance</span>
                            </div>
                            <span class="font-bold text-blue-900 dark:text-blue-100">{{ wallet?.balance | currency:'TND' }}</span>
                        </div>
                    </div>

                    <!-- Payment method selection -->
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold">Payment Method</label>
                        <div class="flex gap-3">
                            <!-- Wallet option -->
                            <div class="flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all"
                                [class.border-blue-500]="selectedMethod === 'WALLET'"
                                [class.bg-blue-50]="selectedMethod === 'WALLET'"
                                [class.dark:bg-blue-900/20]="selectedMethod === 'WALLET'"
                                [class.border-surface-200]="selectedMethod !== 'WALLET'"
                                [class.dark:border-surface-700]="selectedMethod !== 'WALLET'"
                                (click)="selectedMethod = 'WALLET'">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-wallet text-blue-500"></i>
                                    <span class="font-medium text-sm">Wallet</span>
                                </div>
                                <div class="text-xs text-surface-500 mt-1">
                                    {{ wallet?.balance | currency:'TND' }}
                                </div>
                            </div>
                            <!-- Stripe option -->
                            <div class="flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all"
                                [class.border-purple-500]="selectedMethod === 'STRIPE'"
                                [class.bg-purple-50]="selectedMethod === 'STRIPE'"
                                [class.dark:bg-purple-900/20]="selectedMethod === 'STRIPE'"
                                [class.border-surface-200]="selectedMethod !== 'STRIPE'"
                                [class.dark:border-surface-700]="selectedMethod !== 'STRIPE'"
                                (click)="selectedMethod = 'STRIPE'">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-credit-card text-purple-500"></i>
                                    <span class="font-medium text-sm">Stripe</span>
                                </div>
                                <div class="text-xs text-surface-500 mt-1">Secure payment</div>
                            </div>
                        </div>

                        <!-- Wallet insufficient warning -->
                        <div *ngIf="selectedMethod === 'WALLET' && wallet && wallet.balance < remainingAmount"
                            class="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 dark:bg-orange-900/20 rounded p-2">
                            <i class="pi pi-exclamation-triangle"></i>
                            Insufficient balance. Top up your wallet or use Stripe.
                        </div>
                    </div>

                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" [text]="true" severity="secondary" (click)="paymentDialog = false" />
                <p-button
                    [label]="selectedMethod === 'STRIPE' ? 'Pay with Stripe' : 'Pay from Wallet'"
                    [icon]="selectedMethod === 'STRIPE' ? 'pi pi-external-link' : 'pi pi-check'"
                    (click)="processPayment()"
                    [loading]="loading"
                    [disabled]="selectedMethod === 'WALLET' && wallet && wallet.balance < remainingAmount" />
            </ng-template>
        </p-dialog>

        <!-- ═══════════════════════════════════════════ -->
        <!--  TOP UP WALLET DIALOG (via Stripe)          -->
        <!-- ═══════════════════════════════════════════ -->
        <p-dialog [(visible)]="topUpDialog" [modal]="true" [style]="{ width: '500px' }"
            header="Top Up Wallet with Stripe" [draggable]="false" [resizable]="false">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="pi pi-info-circle text-blue-600"></i>
                            <span class="font-semibold text-blue-900 dark:text-blue-100">Current Balance</span>
                        </div>
                        <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {{ wallet?.balance | currency:'TND' }}
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <i class="pi pi-credit-card text-purple-500 text-xl"></i>
                        <div>
                            <div class="font-semibold text-sm text-purple-900 dark:text-purple-100">Stripe Secure Payment</div>
                            <div class="text-xs text-purple-800 dark:text-purple-200">Funds added to your wallet after payment</div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-semibold">Amount to Add (TND)</label>
                        <p-inputnumber
                            [(ngModel)]="topUpAmount"
                            mode="currency"
                            currency="TND"
                            locale="fr-TN"
                            [min]="10"
                            [max]="10000"
                            fluid
                            placeholder="Enter amount" />
                        <small class="text-surface-600 dark:text-surface-400">Minimum: 10 TND | Maximum: 10,000 TND</small>
                    </div>

                    <div *ngIf="topUpAmount && topUpAmount >= 10" class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-surface-600 dark:text-surface-400">Amount</span>
                            <span class="font-semibold">{{ topUpAmount | currency:'TND' }}</span>
                        </div>
                        <div class="border-t border-surface-200 dark:border-surface-700 my-2"></div>
                        <div class="flex justify-between font-bold text-green-600">
                            <span>New Wallet Balance</span>
                            <span>{{ (wallet?.balance || 0) + topUpAmount | currency:'TND' }}</span>
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" [text]="true" severity="secondary" (click)="topUpDialog = false" />
                <p-button 
                    label="Pay with Stripe" 
                    icon="pi pi-external-link" 
                    (click)="processTopUp()" 
                    [loading]="topUpLoading"
                    [disabled]="!topUpAmount || topUpAmount < 10 || topUpAmount > 10000" />
            </ng-template>
        </p-dialog>
    `
})
export class MyChargesComponent implements OnInit {
    chargeService = inject(ResidentChargeService);
    messageService = inject(MessageService);
    auth = inject(AuthService);
    route = inject(ActivatedRoute);

    @ViewChild('dt') dt!: Table;

    // UI State
    paymentDialog = false;
    loading = false;
    topUpDialog = false;
    topUpLoading = false;
    chargeDetailsDialog = false;
    lastUpdated = new Date();

    // Data
    wallet: any = null;
    selectedCharge: ResidentCharge | null = null;
    selectedMethod: 'WALLET' | 'STRIPE' = 'WALLET';
    remainingAmount = 0;
    topUpAmount = 100;

    // Filters & Selection
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

    // Computed values using signals
    allCharges = computed(() => this.chargeService.myCharges());

    filteredCharges = computed(() => {
        let filtered = [...this.allCharges()];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c => 
                c.label?.toLowerCase().includes(query) ||
                c.period?.toLowerCase().includes(query)
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

    ngOnInit() {
        this.chargeService.getMyCharges().subscribe();
        this.loadWallet();

        // Handle Stripe redirect back
        this.route.queryParams.subscribe(params => {
            if (params['status'] === 'success') {
                const sessionId = params['session_id'];
                if (sessionId) {
                    this.chargeService.verifyStripePayment(sessionId).subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Payment Confirmed',
                                detail: 'Your transaction was successfully verified and balance has been updated.',
                                life: 6000
                            });
                            // Reload Data to get the new wallet and charges
                            this.chargeService.getMyCharges().subscribe();
                            this.loadWallet();
                        },
                        error: () => {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Processing',
                                detail: 'Your payment is being processed by the provider.'
                            });
                        }
                    });
                }
            } else if (params['status'] === 'cancelled') {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Payment Cancelled',
                    detail: 'You cancelled the payment. No charges were made.',
                    life: 5000
                });
            }
        });
    }

    loadWallet() {
        this.chargeService.getMyWallet().subscribe({
            next: (data: any) => this.wallet = data,
            error: () => {}
        });
    }

    get totalOutstanding(): number {
        return this.allCharges()
            .filter(c => c.status === 'PENDING' || c.status === 'PARTIALLY_PAID' || c.status === 'OVERDUE')
            .reduce((sum, c) => sum + ((c.amount || 0) - (c.paidAmount || 0)), 0);
    }

    get unpaidCount(): number {
        return this.allCharges()
            .filter(c => c.status === 'PENDING' || c.status === 'PARTIALLY_PAID' || c.status === 'OVERDUE')
            .length;
    }

    get paidThisMonth(): number {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.allCharges()
            .filter(c => c.status === 'PAID' && new Date(c.dueDate) >= firstDay)
            .reduce((sum, c) => sum + (c.paidAmount || c.amount || 0), 0);
    }

    get paidCount(): number {
        return this.allCharges().filter(c => c.status === 'PAID').length;
    }

    get overdueAmount(): number {
        return this.allCharges()
            .filter(c => c.status === 'OVERDUE')
            .reduce((sum, c) => sum + ((c.amount || 0) - (c.paidAmount || 0)), 0);
    }

    get overdueCount(): number {
        return this.allCharges().filter(c => c.status === 'OVERDUE').length;
    }

    // Filter & Selection Methods
    applyFilters() {
        // Triggers computed signal recalculation
        this.chargeService.getMyCharges().subscribe();
    }

    resetFilters() {
        this.searchQuery = '';
        this.selectedStatuses = [];
        this.sortBy = 'dueDate';
        this.applyFilters();
    }

    toggleSelectAll(event: any) {
        if (event.checked) {
            this.selectAllPayable();
        } else {
            this.filteredCharges().forEach(c => (c as any).selected = false);
            this.selectedCharges = [];
        }
    }

    selectAllPayable() {
        const payableCharges = this.filteredCharges().filter(c => 
            c.status !== 'PAID'
        );
        payableCharges.forEach(c => (c as any).selected = true);
        this.selectedCharges = payableCharges;
        this.selectAllChecked = payableCharges.length > 0;
    }

    onChargeSelect() {
        this.selectedCharges = this.filteredCharges().filter(c => (c as any).selected);
        this.selectAllChecked = this.selectedCharges.length === this.filteredCharges().length;
    }

    paySelectedCharges() {
        if (this.selectedCharges.length === 0) return;

        this.messageService.add({
            severity: 'info',
            summary: 'Bulk Payment',
            detail: `Processing ${this.selectedCharges.length} charges...`
        });

        // For now, open payment dialog for first charge
        // In production, implement bulk payment logic
        if (this.selectedCharges.length > 0) {
            this.openPaymentDialog(this.selectedCharges[0]);
        }
    }

    viewChargeDetails(charge: ResidentCharge) {
        this.selectedCharge = charge;
        this.chargeDetailsDialog = true;
    }

    openPaymentDialogFromDetails() {
        if (this.selectedCharge) {
            this.chargeDetailsDialog = false;
            this.openPaymentDialog(this.selectedCharge);
        }
    }

    // Date Utilities
    isOverdue(dueDate: string): boolean {
        return new Date(dueDate) < new Date();
    }

    getDaysUntilDue(dueDate: string): number | null {
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

    getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'PAID': return 'success';
            case 'PARTIALLY_PAID': return 'info';
            case 'OVERDUE': return 'danger';
            case 'PENDING': return 'warn';
            default: return 'secondary';
        }
    }

    getStatusLabel(status: string): string {
        const map: Record<string, string> = {
            PAID: 'Paid', PARTIALLY_PAID: 'Partial', OVERDUE: 'Overdue', PENDING: 'Pending'
        };
        return map[status] ?? status;
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'PAID': return 'pi pi-check';
            case 'PENDING': return 'pi pi-clock';
            case 'OVERDUE': return 'pi pi-exclamation-triangle';
            case 'PARTIALLY_PAID': return 'pi pi-info-circle';
            default: return 'pi pi-info-circle';
        }
    }

    openPaymentDialog(charge: ResidentCharge) {
        this.selectedCharge = charge;
        this.remainingAmount = charge.amount - (charge.paidAmount || 0);
        this.selectedMethod = 'WALLET';
        this.paymentDialog = true;
    }

    openTopUpDialog() {
        this.topUpAmount = 100;
        this.topUpDialog = true;
    }

    processPayment() {
        if (!this.selectedCharge?.id) return;
        this.loading = true;

        if (this.selectedMethod === 'WALLET') {
            // Direct wallet deduction via main backend
            this.chargeService.payCharge(this.selectedCharge.id, this.remainingAmount, 'WALLET')
                .subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Paid', detail: 'Payment successful!', life: 4000 });
                        this.paymentDialog = false;
                        this.loading = false;
                        this.loadWallet();
                        this.chargeService.getMyCharges().subscribe();
                    },
                    error: (err: any) => {
                        this.loading = false;
                        this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Payment failed' });
                    }
                });
        } else {
            // Stripe checkout — call payment microservice
            const payerId = this.auth.user()?.id ?? '';
            const orgId = this.auth.user()?.organizationId ?? '';
            this.chargeService.createStripeCheckout(this.selectedCharge.id, this.remainingAmount, payerId, 'CHARGE', orgId)
                .subscribe({
                    next: (res: any) => {
                        this.loading = false;
                        this.paymentDialog = false;
                        // Redirect to Stripe checkout page
                        window.location.href = res.checkoutUrl;
                    },
                    error: (err: any) => {
                        this.loading = false;
                        this.messageService.add({ severity: 'error', summary: 'Stripe Error', detail: err.error?.message || 'Could not initiate Stripe payment' });
                    }
                });
        }
    }

    processTopUp() {
        if (!this.topUpAmount || this.topUpAmount < 10) return;
        this.topUpLoading = true;

        const payerId = this.auth.user()?.id ?? '';
        const orgId = this.auth.user()?.organizationId ?? '';
        // Use charge ID as "TOP_UP" reference
        this.chargeService.createStripeCheckout('TOP_UP', this.topUpAmount, payerId, 'TOP_UP', orgId)
            .subscribe({
                next: (res: any) => {
                    this.topUpLoading = false;
                    this.topUpDialog = false;
                    window.location.href = res.checkoutUrl;
                },
                error: (err: any) => {
                    this.topUpLoading = false;
                    this.messageService.add({ severity: 'error', summary: 'Stripe Error', detail: err.error?.message || 'Could not initiate top-up' });
                }
            });
    }
}
