import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { ResidentChargeService } from '@/app/pages/service/resident-charge.service';

export interface PaymentRecord {
    id: string;
    chargeId: string;
    paymentDate: string;
    method: string;
    amount: number;
}

@Component({
    selector: 'app-my-payments',
    standalone: true,
    imports: [CommonModule, TableModule, CardModule, TagModule, ButtonModule,
        IconFieldModule, InputIconModule, InputTextModule, FormsModule,
        SelectModule, ChipModule, TimelineModule, TooltipModule],
    template: `
        <div class="grid grid-cols-12 gap-4">
            <!-- Compact Header -->
            <div class="col-span-12">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div class="text-surface-500 font-medium mb-2 uppercase tracking-wide text-xs flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> FINANCIAL RECORDS
                        </div>
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-1">Payment History</h2>
                        <p class="text-sm text-surface-600 dark:text-surface-400">Last updated: {{ lastUpdated | date:'short' }}</p>
                    </div>
                    <div class="flex gap-2">
                        <p-button 
                            [label]="viewMode === 'table' ? 'Timeline View' : 'Table View'" 
                            [icon]="viewMode === 'table' ? 'pi pi-list' : 'pi pi-table'" 
                            size="small"
                            [outlined]="true"
                            (onClick)="toggleViewMode()" />
                        <p-button 
                            label="Export" 
                            icon="pi pi-download" 
                            severity="secondary" 
                            size="small"
                            [outlined]="true" />
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="col-span-12 lg:col-span-4">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">TOTAL PAYMENTS</span>
                        <i class="pi pi-credit-card text-xl text-blue-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ totalPayments }}
                    </div>
                    <div class="text-xs text-surface-600 dark:text-surface-400">All time</div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-4">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">TOTAL AMOUNT</span>
                        <i class="pi pi-money-bill text-xl text-green-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ totalAmount | currency:'TND' }}
                    </div>
                    <div class="text-xs text-green-600">Successfully processed</div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-4">
                <p-card styleClass="h-full shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-medium text-surface-600 dark:text-surface-400">THIS MONTH</span>
                        <i class="pi pi-calendar text-xl text-purple-500"></i>
                    </div>
                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-1">
                        {{ thisMonthAmount | currency:'TND' }}
                    </div>
                    <div class="text-xs text-purple-600">{{ thisMonthCount }} payments</div>
                </p-card>
            </div>

            <!-- Payment History -->
            <div class="col-span-12">
                <p-card>
                    <ng-template #header>
                        <div class="p-4 border-b border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-between flex-wrap gap-3 mb-3">
                                <div>
                                    <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Transaction History</h3>
                                    <p class="text-sm text-surface-600 dark:text-surface-400 mt-1">{{ filteredPayments().length }} transactions</p>
                                </div>
                            </div>
                            
                            <!-- Filters -->
                            <div class="grid grid-cols-12 gap-2">
                                <div class="col-span-12 md:col-span-6">
                                    <p-iconfield iconPosition="left">
                                        <p-inputicon styleClass="pi pi-search" />
                                        <input 
                                            pInputText 
                                            type="text" 
                                            [(ngModel)]="searchQuery"
                                            (ngModelChange)="applyFilters()"
                                            placeholder="Search payments..." 
                                            class="w-full text-sm" />
                                    </p-iconfield>
                                </div>
                                <div class="col-span-12 md:col-span-4">
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

                    <!-- Table View -->
                    <div *ngIf="viewMode === 'table'">
                        <p-table
                            [value]="filteredPayments()"
                            [paginator]="true"
                            [rows]="10"
                            [rowsPerPageOptions]="[10, 25, 50]"
                            [showCurrentPageReport]="true"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} payments"
                            styleClass="p-datatable-sm"
                            [rowHover]="true">

                            <ng-template #header>
                                <tr>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>

                            <ng-template #body let-payment>
                                <tr>
                                    <td>
                                        <div class="flex flex-col gap-1">
                                            <span class="font-semibold text-surface-900 dark:text-surface-0">
                                                {{ payment.paymentDate | date:'medium' }}
                                            </span>
                                            <span class="text-xs text-surface-600 dark:text-surface-400">
                                                {{ payment.paymentDate | date:'short' }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <i class="pi" [ngClass]="payment.method === 'WALLET' ? 'pi-wallet text-blue-500' : 'pi-credit-card text-purple-500'"></i>
                                            <span class="font-medium text-sm">{{ payment.method === 'WALLET' ? 'Wallet' : payment.method }}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="text-green-600 font-bold text-lg">{{ payment.amount | currency:'TND' }}</span>
                                    </td>
                                    <td>
                                        <p-tag value="COMPLETED" severity="success" icon="pi pi-check" />
                                    </td>
                                    <td>
                                        <p-button 
                                            icon="pi pi-download" 
                                            [rounded]="true"
                                            [text]="true"
                                            size="small"
                                            pTooltip="Download receipt"
                                            tooltipPosition="top"
                                            (onClick)="downloadReceipt(payment)" />
                                    </td>
                                </tr>
                            </ng-template>

                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="5" class="text-center py-8">
                                        <i class="pi pi-inbox text-4xl text-surface-400 mb-3 block"></i>
                                        <p class="text-surface-600 dark:text-surface-400">No payment history</p>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <!-- Timeline View -->
                    <div *ngIf="viewMode === 'timeline'" class="p-4">
                        <p-timeline [value]="timelinePayments()" align="alternate" styleClass="customized-timeline">
                            <ng-template #marker let-payment>
                                <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-md bg-green-500">
                                    <i class="pi pi-check"></i>
                                </span>
                            </ng-template>
                            <ng-template #content let-payment>
                                <p-card styleClass="shadow-md">
                                    <div class="flex flex-col gap-2">
                                        <div class="flex items-center justify-between">
                                            <span class="font-bold text-lg text-surface-900 dark:text-surface-0">
                                                {{ payment.amount | currency:'TND' }}
                                            </span>
                                            <div class="flex items-center gap-2">
                                                <i class="pi" [ngClass]="payment.method === 'WALLET' ? 'pi-wallet text-blue-500' : 'pi-credit-card text-purple-500'"></i>
                                                <span class="text-sm font-medium">{{ payment.method === 'WALLET' ? 'Wallet' : payment.method }}</span>
                                            </div>
                                        </div>
                                        <div class="text-sm text-surface-600 dark:text-surface-400">
                                            {{ payment.paymentDate | date:'full' }}
                                        </div>
                                        <div class="flex gap-2 mt-2">
                                            <p-button 
                                                label="Receipt" 
                                                icon="pi pi-download" 
                                                size="small"
                                                [text]="true"
                                                (onClick)="downloadReceipt(payment)" />
                                        </div>
                                    </div>
                                </p-card>
                            </ng-template>
                        </p-timeline>
                        <div *ngIf="filteredPayments().length === 0" class="text-center py-8">
                            <i class="pi pi-inbox text-4xl text-surface-400 mb-3 block"></i>
                            <p class="text-surface-600 dark:text-surface-400">No payment history</p>
                        </div>
                    </div>
                </p-card>
            </div>
        </div>
    `
})
export class MyPaymentsComponent implements OnInit {
    chargeService = inject(ResidentChargeService);
    
    payments = signal<PaymentRecord[]>([]);
    lastUpdated = new Date();
    viewMode: 'table' | 'timeline' = 'table';
    
    // Filters
    searchQuery = '';
    sortBy = 'date_desc';

    sortOptions = [
        { label: 'Date (Newest)', value: 'date_desc' },
        { label: 'Date (Oldest)', value: 'date' },
        { label: 'Amount (High to Low)', value: 'amount_desc' },
        { label: 'Amount (Low to High)', value: 'amount' }
    ];

    // Computed values
    filteredPayments = computed(() => {
        let filtered = [...this.payments()];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.method?.toLowerCase().includes(query) ||
                p.paymentDate?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'date':
                    return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
                case 'date_desc':
                    return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
                case 'amount':
                    return a.amount - b.amount;
                case 'amount_desc':
                    return b.amount - a.amount;
                default:
                    return 0;
            }
        });

        return filtered;
    });

    timelinePayments = computed(() => {
        return this.filteredPayments().slice(0, 10); // Show last 10 for timeline
    });

    get totalPayments(): number {
        return this.payments().length;
    }

    get totalAmount(): number {
        return this.payments().reduce((sum, p) => sum + p.amount, 0);
    }

    get thisMonthAmount(): number {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.payments()
            .filter(p => new Date(p.paymentDate) >= firstDay)
            .reduce((sum, p) => sum + p.amount, 0);
    }

    get thisMonthCount(): number {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.payments()
            .filter(p => new Date(p.paymentDate) >= firstDay)
            .length;
    }

    ngOnInit() {
        this.chargeService.getMyPayments().subscribe({
            next: (data: any) => this.payments.set(data)
        });
    }

    applyFilters() {
        // Triggers computed signal recalculation
        this.payments.set([...this.payments()]);
    }

    resetFilters() {
        this.searchQuery = '';
        this.sortBy = 'date_desc';
        this.applyFilters();
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'table' ? 'timeline' : 'table';
    }

    downloadReceipt(payment: PaymentRecord) {
        // TODO: Implement receipt download
        console.log('Downloading receipt for payment:', payment);
    }
}
