import { Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { DatePickerModule } from 'primeng/datepicker';
import { Charge, ChargeService, ResidentApartmentInfo } from '@/app/pages/service/charge.service';
import { BuildingService } from '@/app/pages/service/building.service';
import { ApartmentService } from '@/app/pages/service/apartment.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { DateUtilsService } from '@/app/core/utils/date-utils.service';

@Component({
    selector: 'app-charges',
    standalone: true,
    imports: [
        CommonModule, TableModule, FormsModule, ButtonModule, RippleModule,
        ToastModule, ToolbarModule, InputTextModule, SelectModule,
        InputNumberModule, DialogModule, TagModule, InputIconModule,
        IconFieldModule, ConfirmDialogModule, DatePickerModule
    ],
    template: `
        <p-toast />

        <!-- Page Header -->
        <div class="grid grid-cols-12 gap-6 mb-6">
            <div class="col-span-12">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Charge Management</h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-2">Create, manage, and track all property charges</p>
                    </div>
                    <div class="flex gap-2">
                        <p-button label="Mark Overdue" icon="pi pi-clock" severity="warn" [outlined]="true" (onClick)="auditOverdue()" />
                        <p-button label="New Charge" icon="pi pi-plus" severity="success" (onClick)="openNew()" />
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-3">
                <div class="card bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-blue-600 dark:text-blue-400 font-medium mb-2">Total Charges</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ chargeService.charges().length }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-receipt text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <div class="card bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-green-600 dark:text-green-400 font-medium mb-2">Total Amount</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ getTotalAmount() | currency:'TND':'symbol':'1.3-3' }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-money-bill text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <div class="card bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-amber-600 dark:text-amber-400 font-medium mb-2">Pending</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ getPendingCount() }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-amber-100 dark:bg-amber-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-clock text-amber-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-3">
                <div class="card bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block text-red-600 dark:text-red-400 font-medium mb-2">Overdue</span>
                            <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                                {{ getOverdueCount() }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-800/50 rounded-full" style="width:3rem;height:3rem">
                            <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
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
                            (onClick)="deleteSelectedCharges()"
                            [disabled]="!selectedCharges || !selectedCharges.length" />
                        <p-button 
                            label="Export CSV" 
                            icon="pi pi-download" 
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="exportCSV()" />
                    </div>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search charges..." class="w-80" />
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
                                <span class="text-xs text-surface-500 ml-auto">{{ option.apartmentCount }} apartments</span>
                            </div>
                        </ng-template>
                    </p-select>

                    <p-select
                        [ngModel]="selectedApartmentId()"
                        (ngModelChange)="selectedApartmentId.set($event)"
                        [options]="apartmentOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Apartments"
                        [showClear]="true"
                        [disabled]="!selectedBuildingId()"
                        (onChange)="onApartmentChange()"
                        class="w-64"
                        appendTo="body">
                        <ng-template #selectedItem let-option>
                            <div class="flex items-center gap-2" *ngIf="option">
                                <i class="pi pi-home text-blue-500"></i>
                                <span>{{ option.label }}</span>
                            </div>
                        </ng-template>
                        <ng-template #item let-option>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-home text-blue-500"></i>
                                <span>{{ option.label }}</span>
                                <span class="text-xs text-surface-500 ml-auto">Floor {{ option.floor }}</span>
                            </div>
                        </ng-template>
                    </p-select>

                    <p-select
                        [ngModel]="selectedStatus()"
                        (ngModelChange)="selectedStatus.set($event)"
                        [options]="statuses"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Statuses"
                        [showClear]="true"
                        (onChange)="applyFilters()"
                        class="w-48"
                        appendTo="body" />

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
            [value]="filteredCharges()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['label', 'status', 'period', 'residentName']"
            [tableStyle]="{ 'min-width': '80rem' }"
            [(selection)]="selectedCharges"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} charges"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            styleClass="p-datatable-gridlines"
        >
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="label" style="min-width: 14rem">Charge Label <p-sortIcon field="label" /></th>
                    <th pSortableColumn="residentName" style="min-width: 14rem">Resident <p-sortIcon field="residentName" /></th>
                    <th pSortableColumn="amount" style="min-width: 10rem">Amount <p-sortIcon field="amount" /></th>
                    <th pSortableColumn="paidAmount" style="min-width: 10rem">Paid <p-sortIcon field="paidAmount" /></th>
                    <th pSortableColumn="dueDate" style="min-width: 10rem">Due Date <p-sortIcon field="dueDate" /></th>
                    <th pSortableColumn="period" style="min-width: 10rem">Period <p-sortIcon field="period" /></th>
                    <th pSortableColumn="status" style="min-width: 10rem">Status <p-sortIcon field="status" /></th>
                    <th style="min-width: 8rem">Actions</th>
                </tr>
            </ng-template>

            <ng-template #body let-charge>
                <tr [class]="charge.status === 'OVERDUE' ? 'bg-red-50 dark:bg-red-900/10' : ''">
                    <td style="width: 3rem"><p-tableCheckbox [value]="charge" /></td>
                    <td>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file-edit text-primary-500"></i>
                            <span class="font-medium">{{ charge.label }}</span>
                        </div>
                    </td>
                    <td>
                        <div class="flex items-center gap-2">
                            <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-800/30 rounded-full cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-700/40 transition-colors" 
                                 style="width:2rem;height:2rem"
                                 (click)="viewResidentProfile(charge.userId)"
                                 title="View resident profile">
                                <i class="pi pi-user text-primary-600 text-sm"></i>
                            </div>
                            <div class="cursor-pointer hover:text-primary-600 transition-colors" (click)="viewResidentProfile(charge.userId)">
                                <div class="font-medium text-surface-900 dark:text-surface-0">
                                    {{ getResidentName(charge.userId) }}
                                </div>
                                <div class="text-surface-500 text-xs">{{ getResidentEmail(charge.userId) }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="font-bold text-surface-900 dark:text-surface-0">{{ charge.amount | currency:'TND':'symbol':'1.3-3' }}</td>
                    <td>
                        <span [class]="charge.paidAmount > 0 ? 'text-green-600 font-semibold' : 'text-surface-400'">
                            {{ (charge.paidAmount || 0) | currency:'TND':'symbol':'1.3-3' }}
                        </span>
                    </td>
                    <td>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-calendar text-surface-400 text-sm"></i>
                            <span>{{ charge.dueDate }}</span>
                        </div>
                    </td>
                    <td>
                        <span class="text-primary-600 font-medium">{{ charge.period }}</span>
                    </td>
                    <td>
                        <p-tag [value]="getStatusLabel(charge.status)" [severity]="getSeverity(charge.status)" />
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <p-button 
                                icon="pi pi-bell" 
                                [rounded]="true" 
                                [outlined]="true" 
                                severity="warn" 
                                (click)="sendNotification(charge)" 
                                title="Send Notification"
                                *ngIf="charge.status === 'PENDING' || charge.status === 'OVERDUE'" />
                            <p-button icon="pi pi-user" [rounded]="true" [outlined]="true" severity="secondary" (click)="viewResidentProfile(charge.userId)" title="View Profile" />
                            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="info" (click)="editCharge(charge)" />
                            <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (click)="deleteCharge(charge)" />
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="9" class="text-center py-12">
                        <div class="flex flex-col items-center gap-3">
                            <i class="pi pi-inbox text-surface-300 dark:text-surface-600" style="font-size: 3rem"></i>
                            <div class="text-surface-500 font-medium">No charges found</div>
                            <p-button label="Create First Charge" icon="pi pi-plus" (onClick)="openNew()" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ═══════════════════════════════════════════ -->
        <!--  CREATE / EDIT DIALOG                       -->
        <!-- ═══════════════════════════════════════════ -->
        <p-dialog
            [(visible)]="chargeDialog"
            [style]="{ width: '520px', maxHeight: '85vh' }"
            header="{{ charge.id ? 'Edit Charge' : 'New Charge' }}"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [contentStyle]="{ 'overflow': 'visible' }">

            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2" style="max-height: 60vh; overflow-y: auto; overflow-x: hidden; padding-right: 8px;">

                    <!-- Label -->
                    <div class="flex flex-col gap-2">
                        <label for="label" class="font-semibold text-surface-900 dark:text-surface-0">
                            Charge Label <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            pInputText
                            id="label"
                            [(ngModel)]="charge.label"
                            placeholder="e.g. October Maintenance Fee"
                            [class.ng-invalid]="submitted && !charge.label"
                            class="w-full" />
                        <small class="text-red-500" *ngIf="submitted && !charge.label">Label is required.</small>
                    </div>

                    <!-- Building Selector (Filter residents by building) -->
                    <div class="flex flex-col gap-2">
                        <label for="dialogBuilding" class="font-semibold text-surface-900 dark:text-surface-0">
                            Select Building <span class="text-surface-500">(Optional - Filter residents)</span>
                        </label>
                        <p-select
                            [(ngModel)]="selectedDialogBuildingId"
                            inputId="dialogBuilding"
                            [options]="buildingOptions()"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="All Buildings"
                            [showClear]="true"
                            (onChange)="onDialogBuildingChange()"
                            class="w-full"
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
                                    <span class="text-xs text-surface-500 ml-auto">{{ option.apartmentCount }} apartments</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="text-surface-500">
                            <i class="pi pi-info-circle mr-1"></i>
                            Select a building to show only residents from that building
                        </small>
                    </div>

                    <!-- Resident with Apartment Info -->
                    <div class="flex flex-col gap-2">
                        <label for="resident" class="font-semibold text-surface-900 dark:text-surface-0">
                            Assign to Resident <span class="text-red-500">*</span>
                        </label>
                        <p-select
                            [(ngModel)]="charge.userId"
                            inputId="resident"
                            [options]="filteredResidentOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select a resident to bill"
                            [filter]="true"
                            filterPlaceholder="Search residents..."
                            [showClear]="true"
                            class="w-full"
                            appendTo="body"
                            [class.ng-invalid]="submitted && !charge.userId">
                            <ng-template #item let-option>
                                <div class="flex items-center gap-3 py-2">
                                    <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-800/30 rounded-full" style="width:2.5rem;height:2.5rem">
                                        <i class="pi pi-user text-primary-600"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-semibold text-surface-900 dark:text-surface-0">{{ option.label }}</div>
                                        <div class="text-xs text-surface-500">{{ option.email }}</div>
                                        <div class="text-xs text-primary-600" *ngIf="option.apartmentInfo">
                                            <i class="pi pi-home mr-1"></i>{{ option.apartmentInfo }}
                                        </div>
                                    </div>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="text-red-500" *ngIf="submitted && !charge.userId">Please select a resident.</small>
                        <small class="text-surface-500">
                            <i class="pi pi-info-circle mr-1"></i>
                            {{ selectedDialogBuildingId ? 'Showing residents from selected building only' : 'Showing all residents - select a building to filter' }}
                        </small>
                    </div>

                    <!-- Building & Apartment (Auto-filled, Read-only) -->
                    <div class="grid grid-cols-2 gap-4" *ngIf="charge.userId && getResidentApartmentInfo(charge.userId)">
                        <div class="flex flex-col gap-2">
                            <label class="font-semibold text-surface-900 dark:text-surface-0">Building</label>
                            <div class="p-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-building text-primary-500"></i>
                                    <span class="text-sm">{{ getResidentApartmentInfo(charge.userId)?.buildingName || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="font-semibold text-surface-900 dark:text-surface-0">Apartment</label>
                            <div class="p-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-home text-blue-500"></i>
                                    <span class="text-sm">{{ getResidentApartmentInfo(charge.userId)?.apartmentNumber || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Amount + Due Date -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="amount" class="font-semibold text-surface-900 dark:text-surface-0">
                                Amount (TND) <span class="text-red-500">*</span>
                            </label>
                            <p-inputnumber
                                id="amount"
                                [(ngModel)]="charge.amount"
                                mode="currency"
                                currency="TND"
                                locale="fr-TN"
                                [minFractionDigits]="3"
                                [class.ng-invalid]="submitted && !charge.amount"
                                class="w-full" />
                            <small class="text-red-500" *ngIf="submitted && !charge.amount">Amount is required.</small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="dueDate" class="font-semibold text-surface-900 dark:text-surface-0">
                                Due Date <span class="text-red-500">*</span>
                            </label>
                            <p-datepicker
                                id="dueDate"
                                [(ngModel)]="dueDateObj"
                                dateFormat="yy-mm-dd"
                                placeholder="Select due date"
                                [showIcon]="true"
                                appendTo="body"
                                [class.ng-invalid]="submitted && !dueDateObj"
                                class="w-full" />
                            <small class="text-red-500" *ngIf="submitted && !dueDateObj">Due date is required.</small>
                        </div>
                    </div>

                    <!-- Period & Status -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="period" class="font-semibold text-surface-900 dark:text-surface-0">Billing Period</label>
                            <p-select
                                [(ngModel)]="charge.period"
                                inputId="period"
                                [options]="periods"
                                placeholder="Select billing period"
                                appendTo="body"
                                class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="status" class="font-semibold text-surface-900 dark:text-surface-0">
                                Status <span class="text-red-500">*</span>
                            </label>
                            <p-select
                                [(ngModel)]="charge.status"
                                inputId="status"
                                [options]="statusOptions"
                                placeholder="Select status"
                                appendTo="body"
                                [class.ng-invalid]="submitted && !charge.status"
                                class="w-full">
                                <ng-template #item let-option>
                                    <div class="flex items-center gap-2">
                                        <i [class]="getStatusIcon(option.value)" [class.text-green-500]="option.value === 'PAID'" [class.text-orange-500]="option.value === 'PENDING'" [class.text-red-500]="option.value === 'OVERDUE'" [class.text-blue-500]="option.value === 'PARTIALLY_PAID'"></i>
                                        <span>{{ option.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                            <small class="text-red-500" *ngIf="submitted && !charge.status">Status is required.</small>
                        </div>
                    </div>

                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (click)="hideDialog()" />
                <p-button label="{{ charge.id ? 'Update' : 'Create Charge' }}" icon="pi pi-check" (click)="saveCharge()" [loading]="loading" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class ChargesComponent implements OnInit {
    chargeDialog = false;
    loading = false;
    submitted = false;

    charge: Partial<Charge> = {};
    dueDateObj: Date | null = null;
    selectedCharges: Charge[] | null = null;

    // Filtering
    selectedBuildingId = signal<string | null>(null);
    selectedApartmentId = signal<string | null>(null);
    selectedStatus = signal<string | null>(null);

    // Data signals
    buildings = signal<any[]>([]);
    apartments = signal<any[]>([]);
    allApartments = signal<any[]>([]);

    // Dialog-specific building selection
    selectedDialogBuildingId: string | null = null;

    // Computed options
    buildingOptions = computed(() => {
        return this.buildings().map(b => ({
            label: b.name,
            value: b.id,
            apartmentCount: this.allApartments().filter(a => a.buildingId === b.id).length
        }));
    });

    apartmentOptions = computed(() => {
        const buildingId = this.selectedBuildingId();
        if (!buildingId) return [];
        return this.allApartments()
            .filter(a => a.buildingId === buildingId)
            .map(a => ({
                label: `Apt ${a.apartmentNumber || a.unitNumber}`,
                value: a.id,
                floor: a.floorNumber || a.floor || 0
            }));
    });

    filteredCharges = computed(() => {
        let charges = this.chargeService.charges();

        // Filter by building (via resident-apartment mapping)
        const buildingId = this.selectedBuildingId();
        if (buildingId) {
            // Get all resident IDs that live in this building
            const residentIdsInBuilding = Array.from(this.residentApartmentMap.values())
                .filter(r => r.buildingId === buildingId)
                .map(r => r.accountId);
            
            charges = charges.filter(c => c.userId && residentIdsInBuilding.includes(c.userId));
        }

        // Filter by apartment (via resident-apartment mapping)
        const apartmentId = this.selectedApartmentId();
        if (apartmentId) {
            // Get all resident IDs that live in this apartment
            const residentIdsInApartment = Array.from(this.residentApartmentMap.values())
                .filter(r => r.apartmentId === apartmentId)
                .map(r => r.accountId);
            
            charges = charges.filter(c => c.userId && residentIdsInApartment.includes(c.userId));
        }

        // Filter by status
        const status = this.selectedStatus();
        if (status) {
            charges = charges.filter(c => c.status === status);
        }

        return charges;
    });

    residentOptions: { label: string; value: string; email: string; apartmentInfo?: string }[] = [];
    allResidentOptions: { label: string; value: string; email: string; apartmentInfo?: string }[] = [];
    residentMap: Map<string, { name: string; email: string }> = new Map();
    residentApartmentMap: Map<string, ResidentApartmentInfo> = new Map();

    // Computed filtered resident options for dialog
    get filteredResidentOptions() {
        if (!this.selectedDialogBuildingId) {
            return this.allResidentOptions;
        }
        
        // Filter residents by selected building
        const residentIdsInBuilding = Array.from(this.residentApartmentMap.values())
            .filter(r => r.buildingId === this.selectedDialogBuildingId)
            .map(r => r.accountId);
        
        return this.allResidentOptions.filter(r => residentIdsInBuilding.includes(r.value));
    }

    statuses = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { label: 'Overdue', value: 'OVERDUE' }
    ];

    periods: string[] = [];

    statusOptions = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Paid', value: 'PAID' },
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Partially Paid', value: 'PARTIALLY_PAID' }
    ];

    @ViewChild('dt') dt!: Table;

    http = inject(HttpClient);
    chargeService = inject(ChargeService);
    buildingService = inject(BuildingService);
    apartmentService = inject(ApartmentService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);
    router = inject(Router);
    dateUtils = inject(DateUtilsService);

    ngOnInit() {
        // Generate dynamic billing periods
        this.periods = this.dateUtils.generateBillingPeriods(2);
        
        this.loadData();
    }

    async loadData() {
        const organizationId = this.authService.organizationId();
        if (!organizationId) return;

        // Load all data
        this.chargeService.getAll().subscribe();
        
        this.buildingService.getByOrganization(organizationId).subscribe(buildings => {
            this.buildings.set(buildings || []);
        });

        this.apartmentService.getAll().subscribe(apartments => {
            this.allApartments.set(apartments || []);
        });

        // Load residents with apartment mapping
        this.chargeService.getResidentsWithApartments().subscribe(residents => {
            console.log('📊 Raw residents data from API:', residents);
            
            // Build resident options with apartment info
            const options = residents.map(r => {
                let apartmentInfo = '';
                if (r.buildingName && r.apartmentNumber) {
                    apartmentInfo = `${r.buildingName} - Apt ${r.apartmentNumber}`;
                } else if (r.apartmentNumber) {
                    apartmentInfo = `Apt ${r.apartmentNumber}`;
                }
                
                return {
                    label: `${r.firstName} ${r.lastName}`,
                    value: r.accountId,
                    email: r.email,
                    apartmentInfo: apartmentInfo || undefined
                };
            });

            // Store both filtered and all options
            this.allResidentOptions = options;
            this.residentOptions = options;

            // Build resident name/email map
            this.residentMap = new Map(
                residents.map(r => [r.accountId, { 
                    name: `${r.firstName} ${r.lastName}`, 
                    email: r.email 
                }])
            );

            console.log('📊 Resident Map populated:', this.residentMap.size, 'residents');
            console.log('📊 Resident Map entries:', Array.from(this.residentMap.entries()));
            console.log('📊 Sample charge userIds:', this.chargeService.charges().slice(0, 5).map(c => ({ id: c.id, userId: c.userId })));

            // Build resident-apartment mapping
            this.residentApartmentMap = new Map(
                residents.map(r => [r.accountId, r])
            );
        });
    }

    onBuildingChange() {
        this.selectedApartmentId.set(null);
        this.applyFilters();
    }

    onApartmentChange() {
        this.applyFilters();
    }

    applyFilters() {
        // Filters are applied via computed signal (reactive)
    }

    clearFilters() {
        this.selectedBuildingId.set(null);
        this.selectedApartmentId.set(null);
        this.selectedStatus.set(null);
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedBuildingId() || this.selectedApartmentId() || this.selectedStatus());
    }

    getTotalAmount(): number {
        return this.chargeService.charges().reduce((sum, c) => sum + (c.amount || 0), 0);
    }

    getPendingCount(): number {
        return this.chargeService.charges().filter(c => c.status === 'PENDING').length;
    }

    getOverdueCount(): number {
        return this.chargeService.charges().filter(c => c.status === 'OVERDUE').length;
    }

    exportCSV() { this.dt.exportCSV(); }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getResidentName(userId?: string): string {
        if (!userId) return '—';
        const resident = this.residentMap.get(userId);
        return resident?.name ?? 'Unknown Resident';
    }

    getResidentEmail(userId?: string): string {
        if (!userId) return '';
        return this.residentMap.get(userId)?.email ?? '';
    }

    getResidentApartmentInfo(userId?: string): { buildingName: string; apartmentNumber: string } | null {
        if (!userId) return null;
        const info = this.residentApartmentMap.get(userId);
        if (!info || !info.apartmentNumber || !info.buildingName) return null;
        return {
            buildingName: info.buildingName,
            apartmentNumber: info.apartmentNumber
        };
    }

    getSeverity(status?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
        switch (status) {
            case 'PAID': return 'success';
            case 'PARTIALLY_PAID': return 'warn';
            case 'OVERDUE': return 'danger';
            case 'PENDING': return 'info';
            default: return 'secondary';
        }
    }

    getStatusIcon(status?: string): string {
        switch (status) {
            case 'PAID': return 'pi pi-check-circle';
            case 'PARTIALLY_PAID': return 'pi pi-info-circle';
            case 'OVERDUE': return 'pi pi-exclamation-triangle';
            case 'PENDING': return 'pi pi-clock';
            default: return 'pi pi-circle';
        }
    }

    getStatusLabel(status?: string): string {
        switch (status) {
            case 'PAID': return 'Paid';
            case 'PARTIALLY_PAID': return 'Partial';
            case 'OVERDUE': return 'Overdue';
            case 'PENDING': return 'Pending';
            default: return status ?? '—';
        }
    }

    openNew() {
        this.charge = { status: 'PENDING' };
        this.dueDateObj = null;
        this.submitted = false;
        this.selectedDialogBuildingId = null;
        this.chargeDialog = true;
    }

    editCharge(charge: Charge) {
        this.charge = { ...charge };
        // Parse existing dueDate string back to Date object
        this.dueDateObj = charge.dueDate ? new Date(charge.dueDate) : null;
        
        // Set dialog building based on resident's building
        if (charge.userId) {
            const residentInfo = this.residentApartmentMap.get(charge.userId);
            this.selectedDialogBuildingId = residentInfo?.buildingId || null;
        } else {
            this.selectedDialogBuildingId = null;
        }
        
        this.chargeDialog = true;
    }

    hideDialog() {
        this.chargeDialog = false;
        this.submitted = false;
        this.charge = {};
        this.dueDateObj = null;
        this.selectedDialogBuildingId = null;
    }

    onDialogBuildingChange() {
        // Clear resident selection when building changes
        this.charge.userId = undefined;
    }

    deleteCharge(charge: Charge) {
        this.confirmationService.confirm({
            message: `Delete charge "${charge.label}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.chargeService.delete(charge.id!).subscribe({
                    next: () => this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Charge removed', life: 3000 }),
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete charge' })
                });
            }
        });
    }

    sendNotification(charge: Charge) {
        this.confirmationService.confirm({
            message: `Send payment reminder to resident for "${charge.label}"?`,
            header: 'Send Notification',
            icon: 'pi pi-bell',
            acceptLabel: 'Send',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-warning',
            accept: () => {
                this.loading = true;
                this.http.post(`http://localhost:8089/api/charge-notifications/${charge.id}/send`, {})
                    .subscribe({
                        next: () => {
                            this.loading = false;
                            this.messageService.add({ 
                                severity: 'success', 
                                summary: 'Notification Sent', 
                                detail: 'Email and SMS notification sent to resident', 
                                life: 5000 
                            });
                        },
                        error: (err) => {
                            this.loading = false;
                            this.messageService.add({ 
                                severity: 'error', 
                                summary: 'Error', 
                                detail: err.error?.error || 'Failed to send notification' 
                            });
                        }
                    });
            }
        });
    }

    deleteSelectedCharges() {
        this.confirmationService.confirm({
            message: `Delete ${this.selectedCharges?.length} selected charges?`,
            header: 'Confirm Bulk Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.selectedCharges?.forEach(c => this.chargeService.delete(c.id!).subscribe());
                this.selectedCharges = null;
                this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Selected charges removed', life: 3000 });
            }
        });
    }

    auditOverdue() {
        this.chargeService.auditOverdue().subscribe({
            next: (res: any) => {
                this.messageService.add({
                    severity: 'info', summary: 'Overdue Audit',
                    detail: `${res.markedOverdue} charge(s) marked as overdue.`, life: 4000
                });
                this.chargeService.getAll().subscribe();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Audit failed' })
        });
    }

    viewResidentProfile(userId?: string) {
        if (!userId) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'No Resident', 
                detail: 'This charge has no associated resident' 
            });
            return;
        }
        this.router.navigate(['/pages/backoffice/residents/profile', userId]);
    }

    saveCharge() {
        this.submitted = true;

        if (!this.charge.label?.trim() || !this.charge.amount || !this.dueDateObj || !this.charge.userId || !this.charge.status) {
            return;
        }

        // Convert Date object to YYYY-MM-DD string for backend
        const d = this.dueDateObj;
        this.charge.dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        this.loading = true;

        if (this.charge.id) {
            this.chargeService.update(this.charge.id, this.charge as Charge).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Charge updated successfully', life: 3000 });
                    this.hideDialog();
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed' });
                }
            });
        } else {
            this.chargeService.create(this.charge as Charge).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Charge created successfully', life: 3000 });
                    this.hideDialog();
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Creation failed' });
                }
            });
        }
    }
}
