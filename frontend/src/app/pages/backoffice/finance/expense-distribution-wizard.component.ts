import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ExpenseService, Expense } from '@/app/pages/service/expense.service';
import { ChargeService } from '@/app/pages/service/charge.service';
import { BuildingService } from '@/app/pages/service/building.service';
import { ApartmentService } from '@/app/pages/service/apartment.service';
import { AuthService } from '@/app/core/auth/auth.service';

interface DistributionPreview {
    apartmentId: string;
    apartmentNumber: string;
    buildingName: string;
    residentName: string;
    amount: number;
}

@Component({
    selector: 'app-expense-distribution-wizard',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, StepsModule, TableModule,
        SelectModule, InputTextModule, DatePickerModule, ToastModule,
        CardModule, TagModule, MessageModule
    ],
    template: `
        <p-toast />

        <div class="card mb-6">
            <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 mb-2">Distribute Expenses to Residents</h2>
            <p class="text-surface-600 dark:text-surface-400">Convert expenses into resident charges with smart distribution</p>
        </div>

        <p-steps [model]="steps" [(activeIndex)]="activeStep" [readonly]="false" class="mb-6" />

        <!-- STEP 1: Select Expenses -->
        <div class="card" *ngIf="activeStep === 0">
            <h3 class="text-xl font-bold mb-4">Step 1: Select Expenses to Distribute</h3>
            
            <div class="flex gap-3 mb-4">
                <p-select
                    [ngModel]="filterBuildingId()"
                    (ngModelChange)="filterBuildingId.set($event)"
                    [options]="buildingOptions()"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by Building"
                    [showClear]="true"
                    class="w-64"
                    appendTo="body" />
                
                <p-select
                    [ngModel]="filterCategory()"
                    (ngModelChange)="filterCategory.set($event)"
                    [options]="categoryOptions"
                    placeholder="Filter by Category"
                    [showClear]="true"
                    class="w-64"
                    appendTo="body" />
            </div>

            <p-table 
                [value]="filteredExpenses()" 
                [(selection)]="selectedExpenses" 
                dataKey="id" 
                [rowHover]="true"
                [rows]="10"
                [paginator]="true"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
                [rowsPerPageOptions]="[10, 20, 50]">
                <ng-template #header>
                    <tr>
                        <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                        <th pSortableColumn="description">Description <p-sortIcon field="description" /></th>
                        <th pSortableColumn="amount">Amount <p-sortIcon field="amount" /></th>
                        <th pSortableColumn="category">Category <p-sortIcon field="category" /></th>
                        <th>Building</th>
                        <th pSortableColumn="expenseDate">Date <p-sortIcon field="expenseDate" /></th>
                    </tr>
                </ng-template>
                <ng-template #body let-expense>
                    <tr>
                        <td><p-tableCheckbox [value]="expense" /></td>
                        <td>{{ expense.description }}</td>
                        <td class="font-bold">{{ expense.amount | currency:'TND':'symbol':'1.3-3' }}</td>
                        <td><p-tag [value]="expense.category" severity="info" /></td>
                        <td>{{ getBuildingName(expense.buildingId) }}</td>
                        <td>{{ expense.expenseDate }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6" class="text-center py-8">
                            <div class="flex flex-col items-center gap-3">
                                <i class="pi pi-inbox text-surface-300 dark:text-surface-600" style="font-size: 2rem"></i>
                                <div class="text-surface-500">No expenses found matching the filters</div>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <div class="flex justify-between mt-6">
                <p-button label="Cancel" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="cancel()" />
                <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="goToStep2()" [disabled]="!selectedExpenses || selectedExpenses.length === 0" />
            </div>
        </div>

        <!-- STEP 2: Configure Distribution -->
        <div class="card" *ngIf="activeStep === 1">
            <h3 class="text-xl font-bold mb-4">Step 2: Configure Distribution</h3>

            <div class="grid grid-cols-12 gap-6 mb-6">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                        <div class="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Amount</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ getTotalAmount() | currency:'TND':'symbol':'1.3-3' }}
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                        <div class="text-sm text-purple-600 dark:text-purple-400 mb-1">Selected Expenses</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ selectedExpenses.length || 0 }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <div>
                    <label class="block font-semibold mb-2">Distribution Method</label>
                    <p-select
                        [(ngModel)]="distributionMethod"
                        [options]="distributionMethods"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select method"
                        class="w-full"
                        appendTo="body">
                        <ng-template #item let-option>
                            <div>
                                <div class="font-semibold">{{ option.label }}</div>
                                <div class="text-xs text-surface-500">{{ option.description }}</div>
                            </div>
                        </ng-template>
                    </p-select>
                </div>

                <div>
                    <label class="block font-semibold mb-2">Distribute To</label>
                    <p-select
                        [(ngModel)]="distributionTarget"
                        [options]="distributionTargets"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select target"
                        class="w-full"
                        (onChange)="onTargetChange()"
                        appendTo="body" />
                </div>

                <div *ngIf="distributionTarget === 'building'">
                    <label class="block font-semibold mb-2">Select Building</label>
                    <p-select
                        [(ngModel)]="targetBuildingId"
                        [options]="buildingOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select building"
                        class="w-full"
                        appendTo="body" />
                </div>

                <div *ngIf="distributionTarget === 'apartment'">
                    <label class="block font-semibold mb-2">Select Apartment</label>
                    <p-select
                        [(ngModel)]="targetApartmentId"
                        [options]="apartmentOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select apartment"
                        class="w-full"
                        appendTo="body" />
                </div>

                <div>
                    <label class="block font-semibold mb-2">Charge Label</label>
                    <input type="text" pInputText [(ngModel)]="chargeLabel" placeholder="e.g., March 2026 - Common Expenses" class="w-full" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-semibold mb-2">Due Date</label>
                        <p-datepicker [(ngModel)]="dueDate" dateFormat="yy-mm-dd" [showIcon]="true" class="w-full" appendTo="body" />
                    </div>
                    <div>
                        <label class="block font-semibold mb-2">Period</label>
                        <input type="text" pInputText [(ngModel)]="period" placeholder="e.g., March 2026" class="w-full" />
                    </div>
                </div>
            </div>

            <div class="flex justify-between mt-6">
                <p-button label="Back" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="activeStep = 0" />
                <p-button label="Preview Distribution" icon="pi pi-eye" (onClick)="generatePreview()" [loading]="loading" />
            </div>
        </div>

        <!-- STEP 3: Preview & Confirm -->
        <div class="card" *ngIf="activeStep === 2">
            <h3 class="text-xl font-bold mb-4">Step 3: Preview & Confirm</h3>

            <p-message severity="info" text="Review the distribution below. Click Confirm to create charges for all residents." class="mb-4" />

            <div class="grid grid-cols-12 gap-6 mb-6">
                <div class="col-span-12 lg:col-span-4">
                    <div class="card bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                        <div class="text-sm text-green-600 dark:text-green-400 mb-1">Total Amount</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ getTotalAmount() | currency:'TND':'symbol':'1.3-3' }}
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-4">
                    <div class="card bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                        <div class="text-sm text-blue-600 dark:text-blue-400 mb-1">Apartments</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ previewData.length }}
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-4">
                    <div class="card bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                        <div class="text-sm text-purple-600 dark:text-purple-400 mb-1">Per Apartment</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ getAmountPerApartment() | currency:'TND':'symbol':'1.3-3' }}
                        </div>
                    </div>
                </div>
            </div>

            <p-table [value]="previewData" [rows]="10" [paginator]="true">
                <ng-template #header>
                    <tr>
                        <th>Apartment</th>
                        <th>Building</th>
                        <th>Resident</th>
                        <th>Amount</th>
                    </tr>
                </ng-template>
                <ng-template #body let-preview>
                    <tr>
                        <td>{{ preview.apartmentNumber }}</td>
                        <td>{{ preview.buildingName }}</td>
                        <td>{{ preview.residentName }}</td>
                        <td class="font-bold text-green-600">{{ preview.amount | currency:'TND':'symbol':'1.3-3' }}</td>
                    </tr>
                </ng-template>
            </p-table>

            <div class="flex justify-between mt-6">
                <p-button label="Back" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="activeStep = 1" />
                <p-button label="Confirm & Create Charges" icon="pi pi-check" severity="success" (onClick)="confirmDistribution()" [loading]="loading" />
            </div>
        </div>
    `,
    providers: [MessageService]
})
export class ExpenseDistributionWizardComponent implements OnInit {
    // Services
    expenseService = inject(ExpenseService);
    chargeService = inject(ChargeService);
    buildingService = inject(BuildingService);
    apartmentService = inject(ApartmentService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    router = inject(Router);

    // Wizard steps
    steps = [
        { label: 'Select Expenses' },
        { label: 'Configure' },
        { label: 'Preview & Confirm' }
    ];
    activeStep = 0;

    // Step 1: Expense selection
    selectedExpenses: Expense[] = [];
    filterBuildingId = signal<string | null>(null);
    filterCategory = signal<string | null>(null);

    // Step 2: Distribution configuration
    distributionMethod = 'equal';
    distributionTarget = 'building';
    targetBuildingId: string | null = null;
    targetApartmentId: string | null = null;
    chargeLabel = '';
    dueDate: Date | null = null;
    period = '';

    // Step 3: Preview
    previewData: DistributionPreview[] = [];
    loading = false;

    // Data
    buildings = signal<any[]>([]);
    apartments = signal<any[]>([]);
    residents = signal<any[]>([]);

    // Options
    distributionMethods = [
        { label: 'Equal Split', value: 'equal', description: 'Divide equally among all apartments' },
        { label: 'By Apartment Size', value: 'proportional', description: 'Bigger apartments pay more' },
        { label: 'Fixed Amount', value: 'fixed', description: 'Each apartment pays the full amount' }
    ];

    distributionTargets = [
        { label: 'All Apartments in Organization', value: 'organization' },
        { label: 'All Apartments in Specific Building', value: 'building' },
        { label: 'Specific Apartment Only', value: 'apartment' }
    ];

    categoryOptions = [
        'ELEVATOR', 'MAINTENANCE', 'PLUMBING', 'ELECTRICAL', 'UTILITIES',
        'CLEANING', 'SECURITY', 'INSURANCE', 'GREEN_SPACES', 'ADMINISTRATIVE',
        'STEG', 'SONEDE', 'OTHER'
    ];

    // Computed
    buildingOptions = computed(() => {
        return this.buildings().map(b => ({
            label: b.name,
            value: b.id
        }));
    });

    apartmentOptions = computed(() => {
        return this.apartments().map(a => ({
            label: `Apt ${a.unitNumber || a.apartmentNumber} - ${this.getBuildingName(a.buildingId)}`,
            value: a.id
        }));
    });

    filteredExpenses = computed(() => {
        let expenses = this.expenseService.expenses();

        const buildingId = this.filterBuildingId();
        if (buildingId) {
            expenses = expenses.filter(e => e.buildingId === buildingId);
        }

        const category = this.filterCategory();
        if (category) {
            expenses = expenses.filter(e => e.category === category);
        }

        return expenses;
    });

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        const organizationId = this.authService.organizationId();
        if (!organizationId) return;

        this.expenseService.getAll().subscribe();
        
        this.buildingService.getByOrganization(organizationId).subscribe(buildings => {
            this.buildings.set(buildings || []);
        });

        this.apartmentService.getAll().subscribe(apartments => {
            this.apartments.set(apartments || []);
        });

        this.chargeService.getResidentsWithApartments().subscribe(residents => {
            this.residents.set(residents || []);
        });
    }

    getBuildingName(buildingId?: string): string {
        if (!buildingId) return 'N/A';
        const building = this.buildings().find(b => b.id === buildingId);
        return building?.name || 'Unknown';
    }

    getTotalAmount(): number {
        return this.selectedExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    }

    getAmountPerApartment(): number {
        if (this.previewData.length === 0) return 0;
        return this.getTotalAmount() / this.previewData.length;
    }

    goToStep2() {
        if (!this.selectedExpenses || this.selectedExpenses.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No Selection', detail: 'Please select at least one expense' });
            return;
        }

        // Auto-detect distribution settings from selected expenses
        this.autoDetectSettings();
        this.activeStep = 1;
    }

    autoDetectSettings() {
        // If all expenses have the same buildingId, pre-select that building
        const buildingIds = this.selectedExpenses.map(e => e.buildingId).filter(id => id);
        const uniqueBuildings = [...new Set(buildingIds)];
        
        if (uniqueBuildings.length === 1) {
            this.distributionTarget = 'building';
            this.targetBuildingId = uniqueBuildings[0] || null;
        }

        // If any expense has apartmentId, suggest apartment-specific distribution
        const hasApartmentId = this.selectedExpenses.some(e => e.apartmentId);
        if (hasApartmentId) {
            this.distributionTarget = 'apartment';
            this.distributionMethod = 'fixed';
        }

        // Generate default label
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        this.chargeLabel = `${currentMonth} - Common Expenses`;
        this.period = currentMonth;

        // Set default due date (end of next month)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(0); // Last day of next month
        this.dueDate = nextMonth;
    }

    onTargetChange() {
        // Reset selections when target changes
        if (this.distributionTarget !== 'building') {
            this.targetBuildingId = null;
        }
        if (this.distributionTarget !== 'apartment') {
            this.targetApartmentId = null;
        }
    }

    generatePreview() {
        // Validation
        if (!this.chargeLabel || !this.dueDate || !this.period) {
            this.messageService.add({ severity: 'warn', summary: 'Missing Information', detail: 'Please fill all required fields' });
            return;
        }

        if (this.distributionTarget === 'building' && !this.targetBuildingId) {
            this.messageService.add({ severity: 'warn', summary: 'No Building Selected', detail: 'Please select a building' });
            return;
        }

        if (this.distributionTarget === 'apartment' && !this.targetApartmentId) {
            this.messageService.add({ severity: 'warn', summary: 'No Apartment Selected', detail: 'Please select an apartment' });
            return;
        }

        this.loading = true;

        // Generate preview based on target
        let targetResidents = this.residents();

        if (this.distributionTarget === 'building') {
            targetResidents = targetResidents.filter(r => r.buildingId === this.targetBuildingId);
        } else if (this.distributionTarget === 'apartment') {
            targetResidents = targetResidents.filter(r => r.apartmentId === this.targetApartmentId);
        }

        // Calculate amount per apartment
        const totalAmount = this.getTotalAmount();
        const amountPerApartment = this.distributionMethod === 'equal' 
            ? totalAmount / targetResidents.length 
            : totalAmount; // For fixed method

        // Generate preview data
        this.previewData = targetResidents.map(r => ({
            apartmentId: r.apartmentId,
            apartmentNumber: r.apartmentNumber || 'N/A',
            buildingName: r.buildingName || 'N/A',
            residentName: `${r.firstName} ${r.lastName}`,
            amount: amountPerApartment
        }));

        this.loading = false;
        this.activeStep = 2;
    }

    confirmDistribution() {
        this.loading = true;

        // Create charges for each resident in preview
        const chargePromises = this.previewData.map(preview => {
            const resident = this.residents().find(r => r.apartmentId === preview.apartmentId);
            if (!resident) return Promise.resolve();

            const charge = {
                userId: resident.accountId,
                label: this.chargeLabel,
                amount: preview.amount,
                dueDate: this.formatDate(this.dueDate!),
                period: this.period,
                status: 'PENDING'
            };

            return this.chargeService.create(charge).toPromise();
        });

        Promise.all(chargePromises).then(() => {
            this.loading = false;
            this.messageService.add({ 
                severity: 'success', 
                summary: 'Success', 
                detail: `${this.previewData.length} charges created successfully` 
            });

            setTimeout(() => {
                this.router.navigate(['/pages/backoffice/finance/charges']);
            }, 1500);
        }).catch(error => {
            this.loading = false;
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to create charges' 
            });
        });
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    cancel() {
        this.router.navigate(['/pages/backoffice/finance/expenses']);
    }
}
