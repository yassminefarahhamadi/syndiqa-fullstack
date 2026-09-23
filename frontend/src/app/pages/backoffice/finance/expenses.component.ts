import { Component, OnInit, signal, computed, ViewChild, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Expense, ExpenseService } from '@/app/pages/service/expense.service';
import { BuildingService } from '@/app/pages/service/building.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { Router } from '@angular/router';
import { ExpenseCategoryHelper } from '@/app/core/constants/expense-categories';
import { HttpClient } from '@angular/common/http';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    template: `
        <p-toast />
        
        <!-- Page Header -->
        <div class="grid grid-cols-12 gap-6 mb-6">
            <div class="col-span-12">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Expense Management</h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-2">Track and manage organization expenses</p>
                    </div>
                    <div class="flex gap-2">
                        <p-button 
                            label="Distribute to Residents" 
                            icon="pi pi-share-alt" 
                            severity="info"
                            [outlined]="true"
                            (onClick)="navigateToDistribution()" />
                        <p-button 
                            label="New Expense" 
                            icon="pi pi-plus" 
                            severity="success" 
                            (onClick)="openNew()" />
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-4">
                <div class="card bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-purple-600 dark:text-purple-400 font-medium mb-2">Total Expenses</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ expenseService.expenses().length }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-wallet text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-4">
                <div class="card bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-red-600 dark:text-red-400 font-medium mb-2">Total Amount</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ getTotalExpenses() | currency:'TND':'symbol':'1.3-3' }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-money-bill text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-4">
                <div class="card bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-teal-600 dark:text-teal-400 font-medium mb-2">This Month</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ getThisMonthExpenses() | currency:'TND':'symbol':'1.3-3' }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-teal-100 dark:bg-teal-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-calendar text-teal-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions Toolbar with Filters -->
        <div class="card mb-6">
            <div class="flex flex-col gap-4">
                <!-- Top Row: Actions and Search -->
                <div class="flex items-center justify-between">
                    <div class="flex gap-2">
                        <p-button 
                            label="Delete Selected" 
                            icon="pi pi-trash" 
                            severity="danger"
                            [outlined]="true"
                            (onClick)="deleteSelectedExpenses()"
                            [disabled]="!selectedExpenses || !selectedExpenses.length" />
                        <p-button 
                            label="Export CSV" 
                            icon="pi pi-download" 
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="exportCSV()" />
                    </div>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search expenses..." class="w-80" />
                    </p-iconfield>
                </div>

                <!-- Bottom Row: Filters -->
                <div class="flex items-center gap-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <span class="text-surface-600 dark:text-surface-400 font-medium">Filter by:</span>
                    
                    <p-select
                        [ngModel]="selectedBuildingId()"
                        (ngModelChange)="selectedBuildingId.set($event)"
                        [options]="buildingOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Buildings"
                        [showClear]="true"
                        (onChange)="onBuildingChange()"
                        class="w-64"
                        appendTo="body">
                        <ng-template #selectedItem let-option>
                            <div class="flex items-center gap-2" *ngIf="option">
                                <i class="pi pi-building text-primary-500"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </ng-template>
                        <ng-template #item let-option>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-building text-primary-500"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </ng-template>
                    </p-select>

                    <p-select
                        [ngModel]="selectedCategory()"
                        (ngModelChange)="selectedCategory.set($event)"
                        [options]="categoryOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Categories"
                        [showClear]="true"
                        (onChange)="onCategoryChange()"
                        class="w-64"
                        appendTo="body">
                        <ng-template #selectedItem let-option>
                            <div class="flex items-center gap-2" *ngIf="option">
                                <i [class]="getCategoryIcon(option.value)" class="text-primary-500"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </ng-template>
                        <ng-template #item let-option>
                            <div class="flex items-center gap-2">
                                <i [class]="getCategoryIcon(option.value)" class="text-primary-500"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </ng-template>
                    </p-select>

                    <p-button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        [text]="true"
                        severity="secondary"
                        (onClick)="clearFilters()"
                        [disabled]="!hasActiveFilters()" />
                </div>
            </div>
        </div>

        <p-table
            #dt
            [value]="filteredExpenses()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['description', 'category']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedExpenses"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            styleClass="p-datatable-gridlines"
        >
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th pSortableColumn="description" style="min-width: 16rem">
                        Description
                        <p-sortIcon field="description" />
                    </th>
                    <th pSortableColumn="amount" style="min-width: 12rem">
                        Amount
                        <p-sortIcon field="amount" />
                    </th>
                    <th pSortableColumn="category" style="min-width:12rem">
                        Category
                        <p-sortIcon field="category" />
                    </th>
                    <th pSortableColumn="expenseDate" style="min-width: 12rem">
                        Date
                        <p-sortIcon field="expenseDate" />
                    </th>
                    <th style="min-width: 10rem">Actions</th>
                </tr>
            </ng-template>
            <ng-template #body let-expense>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="expense" />
                    </td>
                    <td>
                        <div class="flex items-center gap-2">
                            <i [class]="getCategoryIcon(expense.category)" class="text-primary-500"></i>
                            <span class="font-medium">{{ expense.description }}</span>
                        </div>
                    </td>
                    <td class="font-bold text-red-600">{{ expense.amount | currency: 'TND':'symbol':'1.3-3' }}</td>
                    <td>
                        <p-tag [value]="formatCategoryLabel(expense.category)" [severity]="getCategorySeverity(expense.category)" />
                    </td>
                    <td>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                            <span>{{ expense.expenseDate }}</span>
                        </div>
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" (click)="editExpense(expense)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (click)="deleteExpense(expense)" />
                        </div>
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center py-12">
                        <div class="flex flex-col items-center gap-3">
                            <i class="pi pi-inbox text-surface-300 dark:text-surface-600" style="font-size: 3rem"></i>
                            <div class="text-surface-500 font-medium">No expenses found</div>
                            <p-button label="Create First Expense" icon="pi pi-plus" (onClick)="openNew()" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ═══════════════════════════════════════════ -->
        <!--  CREATE / EDIT EXPENSE DIALOG               -->
        <!-- ═══════════════════════════════════════════ -->
        <p-dialog
            [(visible)]="expenseDialog"
            [style]="{ width: '520px', maxHeight: '90vh' }"
            header="{{ expense.id ? 'Edit Expense' : 'New Expense' }}"
            [modal]="true"
            [draggable]="false"
            [resizable]="false">

            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2" style="max-height: 70vh; overflow-y: auto;">

                    <!-- AI OCR Upload Section -->
                    <div class="flex flex-col gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-sparkles text-blue-600 text-xl"></i>
                                <span class="font-bold text-blue-900 dark:text-blue-100">AI Bill Scanner</span>
                            </div>
                            <p-tag value="STEG Bills" severity="info" [rounded]="true" />
                        </div>
                        
                        <p class="text-sm text-surface-600 dark:text-surface-400 mb-3">
                            Upload a STEG electricity bill (PDF) and AI will automatically extract the data
                        </p>

                        <div class="flex flex-col gap-3">
                            <!-- File Input -->
                            <label for="billUpload" class="cursor-pointer">
                                <div class="flex items-center justify-center gap-3 p-4 bg-white dark:bg-surface-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                    <i class="pi pi-cloud-upload text-blue-600 text-2xl"></i>
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">
                                            {{ uploadedFile ? uploadedFile.name : 'Click to upload PDF' }}
                                        </span>
                                        <span class="text-xs text-surface-500">PDF files only, max 10MB</span>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    id="billUpload" 
                                    accept=".pdf"
                                    (change)="onFileSelected($event)"
                                    class="hidden" />
                            </label>

                            <!-- Process Button -->
                            <p-button 
                                label="Scan Bill with AI" 
                                icon="pi pi-bolt" 
                                severity="info"
                                [disabled]="!uploadedFile || processingOCR"
                                [loading]="processingOCR"
                                (onClick)="processWithAI()"
                                class="w-full" />
                        </div>

                        <small class="text-xs text-surface-500 mt-2">
                            <i class="pi pi-info-circle mr-1"></i>
                            Supports STEG electricity bills. AI will extract amount, date, and description.
                        </small>
                    </div>

                    <div class="flex items-center gap-2 my-2">
                        <div class="flex-1 border-t border-surface-200 dark:border-surface-700"></div>
                        <span class="text-xs text-surface-500 font-medium">OR ENTER MANUALLY</span>
                        <div class="flex-1 border-t border-surface-200 dark:border-surface-700"></div>
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col gap-2">
                        <label for="description" class="font-semibold text-surface-900 dark:text-surface-0">
                            Description <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            pInputText
                            id="description"
                            [(ngModel)]="expense.description"
                            placeholder="e.g. Elevator maintenance"
                            [class.ng-invalid]="submitted && !expense.description"
                            class="w-full"
                            autofocus />
                        <small class="text-red-500" *ngIf="submitted && !expense.description">Description is required.</small>
                    </div>

                    <!-- Amount + Date -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="amount" class="font-semibold text-surface-900 dark:text-surface-0">
                                Amount (TND) <span class="text-red-500">*</span>
                            </label>
                            <p-inputnumber
                                id="amount"
                                [(ngModel)]="expense.amount"
                                mode="currency"
                                currency="TND"
                                locale="fr-TN"
                                [minFractionDigits]="3"
                                [class.ng-invalid]="submitted && !expense.amount"
                                class="w-full" />
                            <small class="text-red-500" *ngIf="submitted && !expense.amount">Amount is required.</small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="expenseDate" class="font-semibold text-surface-900 dark:text-surface-0">
                                Date <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                pInputText
                                id="expenseDate"
                                [(ngModel)]="expense.expenseDate"
                                [class.ng-invalid]="submitted && !expense.expenseDate"
                                class="w-full" />
                            <small class="text-red-500" *ngIf="submitted && !expense.expenseDate">Date is required.</small>
                        </div>
                    </div>

                    <!-- Category -->
                    <div class="flex flex-col gap-2">
                        <label for="category" class="font-semibold text-surface-900 dark:text-surface-0">
                            Category <span class="text-red-500">*</span>
                        </label>
                        <p-select
                            [(ngModel)]="expense.category"
                            inputId="category"
                            [options]="categoryOptions()"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select category"
                            [class.ng-invalid]="submitted && !expense.category"
                            class="w-full"
                            appendTo="body">
                            <ng-template #item let-option>
                                <div class="flex items-center gap-2">
                                    <i [class]="getCategoryIcon(option.value)" class="text-primary-500"></i>
                                    <span>{{ option.label }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="text-red-500" *ngIf="submitted && !expense.category">Category is required.</small>
                    </div>

                    <!-- Building (Optional) -->
                    <div class="flex flex-col gap-2">
                        <label for="building" class="font-semibold text-surface-900 dark:text-surface-0">
                            Building <span class="text-surface-500">(Optional)</span>
                        </label>
                        <p-select
                            [(ngModel)]="expense.buildingId"
                            inputId="building"
                            [options]="buildingOptions()"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="All buildings"
                            [showClear]="true"
                            class="w-full"
                            appendTo="body">
                            <ng-template #item let-option>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-primary-500"></i>
                                    <span>{{ option.label }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="text-surface-500">
                            <i class="pi pi-info-circle mr-1"></i>
                            Leave empty for organization-wide expenses
                        </small>
                    </div>

                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (click)="hideDialog()" />
                <p-button label="{{ expense.id ? 'Update' : 'Create Expense' }}" icon="pi pi-check" (click)="saveExpense()" [loading]="loading" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class ExpensesComponent implements OnInit {
    expenseDialog: boolean = false;
    loading: boolean = false;
    processingOCR: boolean = false;
    uploadedFile: File | null = null;

    expense: Partial<Expense> = {};
    selectedExpenses!: Expense[] | null;
    submitted: boolean = false;

    // Filtering
    selectedBuildingId = signal<string | null>(null);
    selectedCategory = signal<string | null>(null);

    // Data signals
    buildings = signal<any[]>([]);

    // Computed options
    buildingOptions = computed(() => {
        return this.buildings().map(b => ({
            label: b.name,
            value: b.id
        }));
    });

    categoryOptions = computed(() => {
        return this.categories.map(c => ({
            label: this.formatCategoryLabel(c),
            value: c
        }));
    });

    // Filtered expenses
    filteredExpenses = computed(() => {
        let expenses = this.expenseService.expenses();

        // Filter by building
        const buildingId = this.selectedBuildingId();
        if (buildingId) {
            expenses = expenses.filter(e => e.buildingId === buildingId);
        }

        // Filter by category
        const category = this.selectedCategory();
        if (category) {
            expenses = expenses.filter(e => e.category === category);
        }

        return expenses;
    });

    categories: string[] = ExpenseCategoryHelper.getCategories();

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    expenseService = inject(ExpenseService);
    buildingService = inject(BuildingService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);
    router = inject(Router);
    http = inject(HttpClient);

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadData();

        this.cols = [
            { field: 'description', header: 'Description' },
            { field: 'amount', header: 'Amount' },
            { field: 'category', header: 'Category' },
            { field: 'expenseDate', header: 'Date' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    async loadData() {
        const organizationId = this.authService.organizationId();
        if (!organizationId) return;

        this.expenseService.getAll().subscribe();
        
        this.buildingService.getByOrganization(organizationId).subscribe(buildings => {
            this.buildings.set(buildings || []);
        });
    }

    formatCategoryLabel(category: string): string {
        return category
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }

    onBuildingChange() {
        // Filters are applied via computed signal (reactive)
    }

    onCategoryChange() {
        // Filters are applied via computed signal (reactive)
    }

    clearFilters() {
        this.selectedBuildingId.set(null);
        this.selectedCategory.set(null);
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedBuildingId() || this.selectedCategory());
    }

    navigateToDistribution() {
        this.router.navigate(['/pages/expenses/distribute']);
    }

    getTotalExpenses(): number {
        return this.expenseService.expenses().reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    getThisMonthExpenses(): number {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.expenseService.expenses()
            .filter(e => {
                const expenseDate = new Date(e.expenseDate);
                return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    getCategoryIcon(category: string): string {
        return ExpenseCategoryHelper.getCategoryIcon(category);
    }

    getCategorySeverity(category: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        return ExpenseCategoryHelper.getCategorySeverity(category);
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.expense = { category: 'MAINTENANCE' };
        this.submitted = false;
        this.expenseDialog = true;
    }

    editExpense(expense: Expense) {
        this.expense = { ...expense };
        this.expenseDialog = true;
    }

    deleteSelectedExpenses() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected expenses?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedExpenses?.map(e => e.id!) || [];
                ids.forEach(id => {
                    this.expenseService.delete(id).subscribe();
                });
                this.selectedExpenses = null;
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Expenses Deleted', life: 3000 });
            }
        });
    }

    hideDialog() {
        this.expenseDialog = false;
        this.submitted = false;
    }

    deleteExpense(expense: Expense) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + expense.description + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.expenseService.delete(expense.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Expense Deleted', life: 3000 });
                });
            }
        });
    }

    saveExpense() {
        this.submitted = true;
        
        if (this.expense.description?.trim() && this.expense.amount && this.expense.expenseDate) {
            this.loading = true;
            if (this.expense.id) {
                this.expenseService.update(this.expense.id, this.expense as Expense).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Expense Updated', life: 3000 });
                        this.hideAndLog();
                    },
                    error: () => this.loading = false
                });
            } else {
                this.expenseService.create(this.expense as Expense).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Expense Created', life: 3000 });
                        this.hideAndLog();
                    },
                    error: () => this.loading = false
                });
            }
        }
    }

    private hideAndLog() {
        this.expenseDialog = false;
        this.loading = false;
        this.expense = {};
        this.uploadedFile = null;
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Validate file type
            if (file.type !== 'application/pdf') {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Invalid File', 
                    detail: 'Please upload a PDF file', 
                    life: 3000 
                });
                return;
            }
            
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'File Too Large', 
                    detail: 'File size must be less than 10MB', 
                    life: 3000 
                });
                return;
            }
            
            this.uploadedFile = file;
            this.messageService.add({ 
                severity: 'info', 
                summary: 'File Selected', 
                detail: `${file.name} ready to scan`, 
                life: 2000 
            });
        }
    }

    processWithAI() {
        if (!this.uploadedFile) return;

        this.processingOCR = true;
        const formData = new FormData();
        formData.append('file', this.uploadedFile);

        this.http.post<any>('http://localhost:8089/api/ai/ocr/steg-bill', formData).subscribe({
            next: (result) => {
                this.processingOCR = false;
                
                // Auto-fill the form with extracted data
                if (result.amount) {
                    this.expense.amount = result.amount;
                }
                if (result.date) {
                    this.expense.expenseDate = result.date;
                }
                if (result.description) {
                    this.expense.description = result.description;
                }
                
                // Set category to UTILITIES for STEG bills
                this.expense.category = 'UTILITIES';
                
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'AI Scan Complete', 
                    detail: 'Bill data extracted successfully!', 
                    life: 3000 
                });
            },
            error: (err) => {
                this.processingOCR = false;
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'AI Scan Failed', 
                    detail: err.error?.message || 'Could not process the bill. Please enter manually.', 
                    life: 5000 
                });
            }
        });
    }
}
