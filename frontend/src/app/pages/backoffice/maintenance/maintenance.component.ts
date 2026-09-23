import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthService } from '@/app/core/auth/auth.service';
import { ExpenseService } from '@/app/pages/service/expense.service';
import {
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceRequest,
    MaintenanceRequestService,
    MaintenanceSeverity,
    MaintenanceStatus
} from '@/app/pages/service/maintenance-request.service';
import {
    AiComparisonResult,
    AssignableStaffOption,
    MaintenanceTask,
    MaintenanceTaskService,
    TaskStatus
} from '@/app/pages/service/maintenance-task.service';

interface Column {
    field: string;
    header: string;
}

interface StaffOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-maintenance',
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
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    template: `
        <p-toast />
        <div class="card mb-6">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex gap-2 flex-wrap">
                        <p-button label="New Request" icon="pi pi-plus" severity="success" (onClick)="openNew()" />
                        <p-button
                            severity="danger"
                            label="Delete Selected"
                            icon="pi pi-trash"
                            outlined
                            (onClick)="deleteSelectedRequests()"
                            [disabled]="!selectedRequests || !selectedRequests.length"
                        />
                        <p-button label="Export CSV" icon="pi pi-download" severity="secondary" outlined (onClick)="exportCSV()" />
                    </div>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search maintenance requests..." class="w-full md:w-80" />
                    </p-iconfield>
                </div>

                <div class="flex items-center gap-3 pt-3 border-t border-surface-200 dark:border-surface-700 flex-wrap">
                    <span class="text-surface-600 dark:text-surface-400 font-medium">Filter by:</span>

                    <p-select
                        [(ngModel)]="selectedStatusFilter"
                        [options]="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Statuses"
                        [showClear]="true"
                        class="w-52"
                        appendTo="body"
                    ></p-select>

                    <p-select
                        [(ngModel)]="selectedPriorityFilter"
                        [options]="priorityOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Priorities"
                        [showClear]="true"
                        class="w-52"
                        appendTo="body"
                    ></p-select>

                    <p-select
                        [(ngModel)]="selectedCategoryFilter"
                        [options]="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Categories"
                        [showClear]="true"
                        class="w-56"
                        appendTo="body"
                    ></p-select>

                    <p-select
                        [(ngModel)]="selectedSeverityFilter"
                        [options]="severityOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All Severities"
                        [showClear]="true"
                        class="w-52"
                        appendTo="body"
                    ></p-select>

                    <p-button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        [text]="true"
                        severity="secondary"
                        (onClick)="clearFilters()"
                        [disabled]="!hasActiveFilters()"
                    />
                </div>
            </div>
        </div>

        <p-table
            #dt
            [value]="filteredRequests()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['maintenanceCode', 'title', 'apartmentId', 'priority', 'status', 'category', 'severity']"
            [tableStyle]="{ width: '100%' }"
            [(selection)]="selectedRequests"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} maintenance requests"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            styleClass="p-datatable-gridlines"
        >
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="maintenanceCode">Code <p-sortIcon field="maintenanceCode" /></th>
                    <th pSortableColumn="title">Title <p-sortIcon field="title" /></th>
                    <th pSortableColumn="apartmentId">Apartment <p-sortIcon field="apartmentId" /></th>
                    <th pSortableColumn="priority">Priority <p-sortIcon field="priority" /></th>
                    <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-request>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="request" /></td>
                    <td>
                        <span class="font-medium">{{ request.maintenanceCode || '-' }}</span>
                    </td>
                    <td>
                        <span class="font-medium">{{ request.title }}</span>
                    </td>
                    <td>{{ request.apartmentId }}</td>
                    <td><p-tag [value]="formatPriority(request.priority)" [severity]="getPrioritySeverity(request.priority)" /></td>
                    <td><p-tag [value]="formatStatus(request.status)" [severity]="getStatusSeverity(request.status)" /></td>
                    <td>
                        <div class="flex gap-2 justify-end flex-wrap">
                            <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (click)="openMaintenanceDetails(request)" />
                            <p-button label="Subdiviser" icon="pi pi-sitemap" severity="help" [outlined]="true" (click)="openSubdivideDialog(request)" />
                            <p-button
                                *ngIf="request.status === 'COMPLETED'"
                                label="Add Expense"
                                icon="pi pi-wallet"
                                severity="info"
                                [outlined]="true"
                                (click)="openExpenseDialog(request)"
                            />
                            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (click)="editRequest(request)" />
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteRequest(request)" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="expenseDialog" [style]="{ width: '440px', maxWidth: '95vw' }" header="Add Expense From Maintenance" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-3 text-sm" *ngIf="expenseTargetRequest">
                        <div class="text-surface-500">Maintenance</div>
                        <div class="font-semibold mt-1">{{ expenseTargetRequest.title }}</div>
                        <div class="text-surface-500 mt-1">Code: {{ expenseTargetRequest.maintenanceCode || '-' }}</div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="expenseAmount" class="block font-bold">Amount (TND)</label>
                        <input type="number" pInputText id="expenseAmount" [(ngModel)]="expenseAmount" min="0" step="0.001" class="w-full" placeholder="e.g. 120.500" />
                        <small class="text-red-500" *ngIf="expenseSubmitted && (!expenseAmount || expenseAmount <= 0)">Please enter a valid amount.</small>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideExpenseDialog()" />
                <p-button label="Add Expense" icon="pi pi-check" (click)="submitExpenseFromMaintenance()" [loading]="expenseSaving" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="requestDialog" [style]="{ width: '760px', maxWidth: '96vw' }" header="Maintenance Request" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <section class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-900/40">
                        <div class="text-xs uppercase tracking-wide text-surface-500 mb-3">Request details</div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="title" class="block font-bold">Title</label>
                                <input type="text" pInputText id="title" [(ngModel)]="request.title" required autofocus class="w-full" />
                                <small class="text-red-500" *ngIf="submitted && !request.title">Title is required.</small>
                            </div>
                            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
                                <label for="reportedBy" class="block font-bold">Reported By</label>
                                <input type="text" pInputText id="reportedBy" [(ngModel)]="request.reportedBy" [readonly]="!request.id" required class="w-full" />
                            </div>
                            <div class="col-span-12 flex flex-col gap-2">
                                <label for="description" class="block font-bold">Description</label>
                                <input type="text" pInputText id="description" [(ngModel)]="request.description" required class="w-full" />
                                <small class="text-red-500" *ngIf="submitted && !request.description">Description is required.</small>
                            </div>
                            <div class="col-span-12" *ngIf="request.id">
                                <label for="maintenanceCode" class="block font-bold mb-2">Maintenance Code</label>
                                <input type="text" pInputText id="maintenanceCode" [ngModel]="request.maintenanceCode" readonly class="w-full" />
                            </div>
                            <div class="col-span-12 flex flex-col gap-2">
                                <label class="block font-bold">Photo of Issue <span class="text-red-500" *ngIf="!request.id">*</span></label>
                                <div *ngIf="request.beforeImageUrl && request.id" class="mb-2">
                                    <img [src]="request.beforeImageUrl" alt="Current before photo" class="w-40 h-28 object-cover rounded-xl border border-surface-200" />
                                </div>
                                <input #beforePhotoInput type="file" accept="image/*" (change)="onBeforePhotoSelected($event)" class="hidden" />
                                <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <p-button
                                        type="button"
                                        label="Choose File"
                                        icon="pi pi-upload"
                                        severity="secondary"
                                        [outlined]="true"
                                        (onClick)="beforePhotoInput.click()"
                                    />
                                    <span class="text-sm" [ngClass]="beforePhotoFile ? 'text-surface-900 dark:text-surface-0' : 'text-surface-500'">
                                        {{ beforePhotoFile?.name || 'No file selected' }}
                                    </span>
                                </div>
                                <small class="text-surface-500">Accepted formats: image files only.</small>
                                <img *ngIf="beforePhotoPreview" [src]="beforePhotoPreview" alt="Preview" class="w-40 h-28 object-cover rounded-xl border border-surface-200 mt-1" />
                                <small class="text-red-500" *ngIf="submitted && !request.id && !beforePhotoFile && !request.beforeImageUrl">Photo is required.</small>
                            </div>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs uppercase tracking-wide text-surface-500 mb-3">Location</div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="residenceId" class="block font-bold">Residence</label>
                                <input type="text" pInputText id="residenceId" [(ngModel)]="request.residenceId" class="w-full" />
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="buildingId" class="block font-bold">Building</label>
                                <input type="text" pInputText id="buildingId" [(ngModel)]="request.buildingId" class="w-full" />
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="apartmentId" class="block font-bold">Apartment</label>
                                <input type="text" pInputText id="apartmentId" [(ngModel)]="request.apartmentId" required class="w-full" />
                            </div>
                            <div class="col-span-12 flex flex-col gap-2">
                                <label for="locationDetails" class="block font-bold">Location Details</label>
                                <input type="text" pInputText id="locationDetails" [(ngModel)]="request.locationDetails" class="w-full" />
                            </div>
                        </div>
                    </section>

                    <section class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="text-xs uppercase tracking-wide text-surface-500 mb-3">Classification</div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="priority" class="block font-bold">Priority</label>
                                <p-select [(ngModel)]="request.priority" inputId="priority" [options]="priorityOptions" optionLabel="label" optionValue="value" class="w-full" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="severity" class="block font-bold">Severity</label>
                                <p-select [(ngModel)]="request.severity" inputId="severity" [options]="severityOptions" optionLabel="label" optionValue="value" class="w-full" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="category" class="block font-bold">Category</label>
                                <p-select [(ngModel)]="request.category" inputId="category" [options]="categoryOptions" optionLabel="label" optionValue="value" class="w-full" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                                <label for="status" class="block font-bold">Status</label>
                                <p-select [(ngModel)]="request.status" inputId="status" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                            <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                                <label for="dueAt" class="block font-bold">Due At</label>
                                <input type="datetime-local" pInputText id="dueAt" [(ngModel)]="request.dueAt" class="w-full" />
                            </div>
                        </div>
                    </section>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveRequest()" [loading]="loading" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="taskDialog" [style]="{ width: '620px' }" [header]="editingTaskId ? 'Edit Task' : 'Add Maintenance Task'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-8 flex flex-col gap-2">
                            <label for="taskTitle" class="block font-bold">Task Title</label>
                            <input type="text" pInputText id="taskTitle" [(ngModel)]="task.title" class="w-full" />
                        </div>
                        <div class="col-span-4 flex flex-col gap-2">
                            <label for="taskOrder" class="block font-bold">Order</label>
                            <input type="number" pInputText id="taskOrder" [(ngModel)]="task.orderIndex" class="w-full" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="taskDescription" class="block font-bold">Description</label>
                        <input type="text" pInputText id="taskDescription" [(ngModel)]="task.description" class="w-full" />
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-7 flex flex-col gap-2">
                            <label for="assignedTo" class="block font-bold">Assigned To</label>
                            <p-select
                                [(ngModel)]="task.assignedTo"
                                inputId="assignedTo"
                                [options]="staffOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select staff member"
                                [filter]="true"
                                filterBy="label"
                                class="w-full"
                                styleClass="w-full"
                                appendTo="body"
                            ></p-select>
                            <small class="text-red-500" *ngIf="taskSubmitted && !task.assignedTo">Assigned staff is required.</small>
                        </div>
                        <div class="col-span-5 flex flex-col gap-2">
                            <label for="estimatedMinutes" class="block font-bold">Estimated Minutes</label>
                            <input type="number" pInputText id="estimatedMinutes" [(ngModel)]="task.estimatedMinutes" class="w-full" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6 flex flex-col gap-2">
                            <label for="scheduledDate" class="block font-bold">Scheduled Date</label>
                            <input type="date" pInputText id="scheduledDate" [(ngModel)]="task.scheduledDate" required class="w-full" />
                        </div>
                        <div class="col-span-6 flex flex-col gap-2">
                            <label for="taskStatus" class="block font-bold">Status</label>
                            <p-select [(ngModel)]="task.status" inputId="taskStatus" [options]="taskStatusOptions" optionLabel="label" optionValue="value" class="w-full" styleClass="w-full" appendTo="body"></p-select>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2" *ngIf="task.status === 'BLOCKED'">
                        <label for="blockedReason" class="block font-bold">Blocked Reason</label>
                        <input type="text" pInputText id="blockedReason" [(ngModel)]="task.blockedReason" class="w-full" />
                    </div>

                    <small class="text-surface-500" *ngIf="!staffOptions.length">No assignable staff found for this organization.</small>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideTaskDialog()" />
                <p-button [label]="editingTaskId ? 'Save Changes' : 'Save Task'" icon="pi pi-check" (click)="saveTask()" [loading]="taskLoading" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="subdivideDialog" [style]="{ width: '900px' }" header="Panel de gestion des tasks" [modal]="true">
            <ng-template #content>
                <div class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4 mb-4">
                    <div class="flex items-start justify-between gap-4">
                        <div *ngIf="selectedRequestForTasks">
                            <div class="text-xs uppercase tracking-wide text-surface-500">Task Panel</div>
                            <div class="text-lg font-semibold mt-1">{{ selectedRequestForTasks.title }}</div>
                            <div class="text-sm text-surface-500 mt-1">{{ selectedRequestForTasks.description }}</div>
                        </div>

                        <div class="flex items-center gap-3">
                            <div
                                class="relative w-16 h-16 rounded-full flex items-center justify-center"
                                [style.background]="getTaskProgressRing()"
                                title="Completion"
                            >
                                <div class="w-12 h-12 rounded-full bg-surface-0 dark:bg-surface-900 flex items-center justify-center shadow-sm">
                                    <span class="text-xs font-semibold">{{ getTaskCompletionPercent() }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-2 text-center">
                            <div class="text-xs text-surface-500">Total</div>
                            <div class="font-semibold">{{ requestTasks.length }}</div>
                        </div>
                        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-2 text-center">
                            <div class="text-xs text-surface-500">Completed</div>
                            <div class="font-semibold text-green-600">{{ countTasksByStatus('COMPLETED') }}</div>
                        </div>
                        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-2 text-center">
                            <div class="text-xs text-surface-500">In Progress</div>
                            <div class="font-semibold text-amber-600">{{ countTasksByStatus('IN_PROGRESS') }}</div>
                        </div>
                        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-2 text-center">
                            <div class="text-xs text-surface-500">Pending</div>
                            <div class="font-semibold text-blue-600">{{ countTasksByStatus('PENDING') }}</div>
                        </div>
                        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-2 text-center">
                            <div class="text-xs text-surface-500">Blocked</div>
                            <div class="font-semibold text-red-600">{{ countTasksByStatus('BLOCKED') }}</div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end mb-4 gap-2">
                    <p-button label="Refresh" icon="pi pi-refresh" [outlined]="true" (click)="reloadTaskPanel()" [loading]="requestTasksLoading" />
                    <p-button label="New Subtask" icon="pi pi-plus" (click)="openTaskDialog(selectedRequestForTasks!)" [disabled]="!selectedRequestForTasks" />
                </div>

                <p-table [value]="requestTasks" [loading]="requestTasksLoading" [rows]="6" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-gridlines">
                    <ng-template #header>
                        <tr>
                            <th>Order</th>
                            <th>Title</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Scheduled</th>
                            <th>Progress Dates</th>
                            <th style="width: 12rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-taskRow>
                        <tr>
                            <td>{{ taskRow.orderIndex || '-' }}</td>
                            <td>
                                <div class="font-medium">{{ taskRow.title || '-' }}</div>
                                <small class="text-surface-500">{{ taskRow.description || '-' }}</small>
                                <small *ngIf="taskRow.blockedReason" class="text-red-500 block mt-1">Blocked: {{ taskRow.blockedReason }}</small>
                            </td>
                            <td>{{ resolveStaffName(taskRow.assignedTo) }}</td>
                            <td><p-tag [value]="formatTaskStatus(taskRow.status)" [severity]="getTaskStatusSeverity(taskRow.status)" /></td>
                            <td>{{ taskRow.scheduledDate || '-' }}</td>
                            <td>
                                <div class="text-xs">Started: {{ taskRow.startedDate || '-' }}</div>
                                <div class="text-xs">Done: {{ taskRow.completedDate || '-' }}</div>
                            </td>
                            <td>
                                <div class="flex gap-2">
                                    <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (click)="openTaskDetails(taskRow)" />
                                    <p-button
                                        *ngIf="taskRow.status !== 'COMPLETED'"
                                        icon="pi pi-camera"
                                        [rounded]="true"
                                        [outlined]="true"
                                        severity="help"
                                        pTooltip="Complete with AI"
                                        (click)="openAiCompletionDialog(taskRow)"
                                    />
                                    <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (click)="editTask(taskRow)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteTask(taskRow)" />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="taskDetailsDialog" [style]="{ width: '700px', maxWidth: '96vw' }" header="Task Details" [modal]="true">
            <ng-template #content>
                <div *ngIf="taskDetails" class="flex flex-col gap-4 text-sm">
                    <div class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <div class="text-xs uppercase tracking-wide text-surface-500">Subtask</div>
                                <div class="text-xl font-semibold mt-1">{{ taskDetails.title || '-' }}</div>
                                <div class="text-surface-500 mt-1">{{ taskDetails.description || '-' }}</div>
                            </div>
                            <p-tag [value]="formatTaskStatus(taskDetails.status)" [severity]="getTaskStatusSeverity(taskDetails.status)" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Task ID</div>
                            <div class="font-medium mt-1">{{ taskDetails.id || '-' }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Maintenance Request ID</div>
                            <div class="font-medium mt-1">{{ taskDetails.maintenanceRequestId || '-' }}</div>
                        </div>
                        <div class="col-span-6 md:col-span-3 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Order</div>
                            <div class="font-medium mt-1">{{ taskDetails.orderIndex || '-' }}</div>
                        </div>
                        <div class="col-span-6 md:col-span-3 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Estimate</div>
                            <div class="font-medium mt-1">{{ taskDetails.estimatedMinutes || '-' }} min</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Assigned To</div>
                            <div class="font-medium mt-1">{{ resolveStaffName(taskDetails.assignedTo) }}</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Scheduled Date</div>
                            <div class="font-medium mt-1">{{ formatDateTime(taskDetails.scheduledDate) }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Started Date</div>
                            <div class="font-medium mt-1">{{ formatDateTime(taskDetails.startedDate) }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Completed Date</div>
                            <div class="font-medium mt-1">{{ formatDateTime(taskDetails.completedDate) }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Blocked Reason</div>
                            <div class="font-medium mt-1">{{ taskDetails.blockedReason || '-' }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Created At</div>
                            <div class="font-medium mt-1">{{ formatDateTime(taskDetails.createdAt) }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                            <div class="text-xs text-surface-500">Updated At</div>
                            <div class="font-medium mt-1">{{ formatDateTime(taskDetails.updatedAt) }}</div>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Close" icon="pi pi-times" text (click)="taskDetailsDialog = false" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="maintenanceDetailsDialog" [style]="{ width: '920px', maxWidth: '96vw' }" header="Maintenance Details" [modal]="true">
            <ng-template #content>
                <div *ngIf="maintenanceDetails" class="flex flex-col gap-5 text-sm">
                    <div class="rounded-3xl p-5 bg-surface-900 text-surface-0 shadow-lg">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div>
                                <div class="text-xs uppercase tracking-[0.18em] text-surface-400">Maintenance Sheet</div>
                                <div class="text-2xl lg:text-3xl font-semibold mt-2 leading-tight">{{ maintenanceDetails.title || '-' }}</div>
                                <div class="text-surface-300 mt-2 max-w-3xl">{{ maintenanceDetails.description || '-' }}</div>
                                <div class="text-xs text-surface-400 mt-3">Code: {{ maintenanceDetails.maintenanceCode || '-' }}</div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <p-tag [value]="formatStatus(maintenanceDetails.status)" [severity]="getStatusSeverity(maintenanceDetails.status)"></p-tag>
                                <p-tag [value]="formatPriority(maintenanceDetails.priority)" [severity]="getPrioritySeverity(maintenanceDetails.priority)"></p-tag>
                                <p-tag [value]="humanizeEnum(maintenanceDetails.severity)" [severity]="getSeverityTagSeverity(maintenanceDetails.severity)"></p-tag>
                                <p-tag [value]="humanizeEnum(maintenanceDetails.category)" severity="info"></p-tag>
                            </div>
                        </div>
                        <div *ngIf="maintenanceDetails.beforeImageUrl" class="mt-4">
                            <div class="text-xs text-surface-400 mb-2">Issue Photo (Before)</div>
                            <img [src]="maintenanceDetails.beforeImageUrl" alt="Before" class="w-48 h-32 object-cover rounded-xl border border-surface-600 cursor-pointer" (click)="openImageInNewTab(maintenanceDetails.beforeImageUrl!)" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                        <div class="col-span-6 md:col-span-3 rounded-2xl border border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-900">
                            <div class="text-xs text-surface-500">Progress</div>
                            <div class="text-xl font-semibold mt-1">{{ (maintenanceDetails.progressPercent ?? 0) | number: '1.0-0' }}%</div>
                        </div>
                        <div class="col-span-6 md:col-span-3 rounded-2xl border border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-900">
                            <div class="text-xs text-surface-500">Subtasks</div>
                            <div class="text-xl font-semibold mt-1">{{ maintenanceDetails.subTaskCount ?? 0 }}</div>
                        </div>
                        <div class="col-span-6 md:col-span-3 rounded-2xl border border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-900">
                            <div class="text-xs text-surface-500">Completed</div>
                            <div class="text-xl font-semibold mt-1">{{ maintenanceDetails.completedSubTaskCount ?? 0 }}</div>
                        </div>
                        <div class="col-span-6 md:col-span-3 rounded-2xl border border-surface-200 dark:border-surface-700 p-3 bg-surface-50 dark:bg-surface-900">
                            <div class="text-xs text-surface-500">Remaining</div>
                            <div class="text-xl font-semibold mt-1">{{ (maintenanceDetails.subTaskCount ?? 0) - (maintenanceDetails.completedSubTaskCount ?? 0) }}</div>
                        </div>
                    </div>

                    <div class="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                        <div class="h-full rounded-full bg-amber-500 transition-all duration-300" [style.width.%]="maintenanceDetails.progressPercent ?? 0"></div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                            <div class="font-semibold mb-3">Identity & Source</div>
                            <div class="space-y-2">
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Request ID</span><span class="font-medium text-right">{{ maintenanceDetails.id || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Organization</span><span class="font-medium text-right">{{ maintenanceDetails.organizationId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Source</span><span class="font-medium text-right">{{ humanizeEnum(maintenanceDetails.source) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Category</span><span class="font-medium text-right">{{ humanizeEnum(maintenanceDetails.category) }}</span></div>
                            </div>
                        </div>

                        <div class="col-span-12 md:col-span-6 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                            <div class="font-semibold mb-3">Reporter & Location</div>
                            <div class="space-y-2">
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Reported By</span><span class="font-medium text-right">{{ maintenanceDetails.reportedBy || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Reporter Account</span><span class="font-medium text-right">{{ maintenanceDetails.reporterAccountId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Residence</span><span class="font-medium text-right">{{ maintenanceDetails.residenceId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Building</span><span class="font-medium text-right">{{ maintenanceDetails.buildingId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Apartment</span><span class="font-medium text-right">{{ maintenanceDetails.apartmentId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Location Details</span><span class="font-medium text-right">{{ maintenanceDetails.locationDetails || '-' }}</span></div>
                            </div>
                        </div>

                        <div class="col-span-12 md:col-span-6 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                            <div class="font-semibold mb-3">Lifecycle</div>
                            <div class="space-y-2">
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Created At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.createdAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Updated At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.updatedAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Due At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.dueAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Acknowledged At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.acknowledgedAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Started At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.startedAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Resolved At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.resolvedAt) }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Verified At</span><span class="font-medium text-right">{{ formatDateTime(maintenanceDetails.verifiedAt) }}</span></div>
                            </div>
                        </div>

                        <div class="col-span-12 md:col-span-6 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                            <div class="font-semibold mb-3">Audit</div>
                            <div class="space-y-2">
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Created By</span><span class="font-medium text-right">{{ maintenanceDetails.createdByAccountId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Last Updated By</span><span class="font-medium text-right">{{ maintenanceDetails.lastUpdatedByAccountId || '-' }}</span></div>
                                <div class="flex justify-between gap-3"><span class="text-surface-500">Closed By</span><span class="font-medium text-right">{{ maintenanceDetails.closedByAccountId || '-' }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Close" icon="pi pi-times" text (click)="maintenanceDetailsDialog = false" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="aiCompletionDialog" [style]="{ width: '720px', maxWidth: '96vw' }" header="Complete Task — AI Verification" [modal]="true" [closable]="!aiCompletionLoading">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-900/40" *ngIf="aiTargetTask">
                        <div class="text-xs uppercase tracking-wide text-surface-500 mb-1">Task</div>
                        <div class="font-semibold">{{ aiTargetTask.title || 'Subtask' }}</div>
                        <div class="text-sm text-surface-500 mt-1">{{ aiTargetTask.description || '' }}</div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="block font-bold">Upload "After" Photo <span class="text-red-500">*</span></label>
                        <input type="file" accept="image/*" (change)="onAfterPhotoSelected($event)" class="w-full" [disabled]="aiCompletionLoading" />
                        <small class="text-surface-500">Take a photo showing the current state after repair.</small>
                    </div>

                    <div *ngIf="afterPhotoPreview" class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <div class="text-xs font-bold uppercase text-surface-500">Before</div>
                            <img [src]="getBeforeImageForAi()" alt="Before" class="w-full h-40 object-cover rounded-xl border border-surface-200" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <div class="text-xs font-bold uppercase text-surface-500">After</div>
                            <img [src]="afterPhotoPreview" alt="After" class="w-full h-40 object-cover rounded-xl border border-surface-200" />
                        </div>
                    </div>

                    <div class="flex justify-center" *ngIf="afterPhotoFile && !aiResult">
                        <p-button label="Analyze with AI" icon="pi pi-sparkles" (onClick)="runAiComparison()" [loading]="aiCompletionLoading" severity="help" />
                    </div>

                    <div *ngIf="aiResult" class="rounded-2xl border-2 p-5" [ngClass]="aiResult.approved ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="text-3xl font-bold" [ngClass]="aiResult.approved ? 'text-green-600' : 'text-amber-600'">{{ aiResult.score | number: '1.0-0' }}%</div>
                            <p-tag [value]="aiResult.approved ? 'APPROVED' : 'NEEDS REVIEW'" [severity]="aiResult.approved ? 'success' : 'warn'" />
                        </div>
                        <div class="text-sm" [ngClass]="aiResult.approved ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">{{ aiResult.conclusion }}</div>
                        <div *ngIf="!aiResult.approved" class="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <i class="pi pi-exclamation-triangle"></i>
                            AI score is below 90%. You can still force-complete if the work is satisfactory.
                        </div>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideAiCompletionDialog()" [disabled]="aiCompletionLoading" />
                <p-button *ngIf="aiResult?.approved" label="Confirm Completion" icon="pi pi-check" severity="success" (onClick)="confirmAiCompletion()" />
                <p-button *ngIf="aiResult && !aiResult.approved" label="Force Complete" icon="pi pi-exclamation-triangle" severity="warn" (onClick)="confirmAiCompletion()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class MaintenanceComponent implements OnInit {
    requestDialog = false;
    loading = false;

    taskDialog = false;
    taskLoading = false;
    editingTaskId: string | null = null;

    subdivideDialog = false;
    requestTasksLoading = false;
    maintenanceDetailsDialog = false;
    taskDetailsDialog = false;
    expenseDialog = false;
    expenseSaving = false;

    request: Partial<MaintenanceRequest> = {};
    task: Partial<MaintenanceTask> = {};
    maintenanceDetails: MaintenanceRequest | null = null;
    taskDetails: MaintenanceTask | null = null;
    expenseTargetRequest: MaintenanceRequest | null = null;
    expenseAmount: number | null = null;
    expenseSubmitted = false;

    beforePhotoFile: File | null = null;
    beforePhotoPreview: string | null = null;

    aiCompletionDialog = false;
    aiCompletionLoading = false;
    aiResult: AiComparisonResult | null = null;
    afterPhotoFile: File | null = null;
    afterPhotoPreview: string | null = null;
    aiTargetTask: MaintenanceTask | null = null;

    selectedRequests!: MaintenanceRequest[] | null;
    selectedRequestForTasks: MaintenanceRequest | null = null;
    requestTasks: MaintenanceTask[] = [];

    submitted = false;
    taskSubmitted = false;
    staffOptions: StaffOption[] = [];

    selectedStatusFilter: MaintenanceStatus | null = null;
    selectedPriorityFilter: MaintenancePriority | null = null;
    selectedCategoryFilter: MaintenanceCategory | null = null;
    selectedSeverityFilter: MaintenanceSeverity | null = null;

    priorityOptions: { label: string; value: MaintenancePriority }[] = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' }
    ];

    categoryOptions: { label: string; value: MaintenanceCategory }[] = [
        { label: 'Plumbing', value: 'PLUMBING' },
        { label: 'Electrical', value: 'ELECTRICAL' },
        { label: 'Elevator', value: 'ELEVATOR' },
        { label: 'HVAC', value: 'HVAC' },
        { label: 'Cleaning', value: 'CLEANING' },
        { label: 'Structural', value: 'STRUCTURAL' },
        { label: 'Security', value: 'SECURITY' },
        { label: 'Other', value: 'OTHER' }
    ];

    severityOptions: { label: string; value: MaintenanceSeverity }[] = [
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
        { label: 'Critical', value: 'CRITICAL' }
    ];

    statusOptions: { label: string; value: MaintenanceStatus }[] = [
        { label: 'Open', value: 'OPEN' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Verified', value: 'VERIFIED' }
    ];

    taskStatusOptions: { label: string; value: TaskStatus }[] = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Blocked', value: 'BLOCKED' }
    ];

    @ViewChild('dt') dt!: Table;
    cols: Column[] = [];

    maintenanceService = inject(MaintenanceRequestService);
    maintenanceTaskService = inject(MaintenanceTaskService);
    expenseService = inject(ExpenseService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);

    ngOnInit() {
        this.maintenanceService.getAll().subscribe();
        this.loadAssignableStaff();
        this.cols = [
            { field: 'maintenanceCode', header: 'Code' },
            { field: 'title', header: 'Title' },
            { field: 'apartmentId', header: 'Apartment' },
            { field: 'priority', header: 'Priority' },
            { field: 'status', header: 'Status' }
        ];
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.request = {
            title: '',
            description: '',
            reportedBy: this.getConnectedUserFullName(),
            apartmentId: '',
            buildingId: '',
            residenceId: '',
            locationDetails: '',
            priority: 'MEDIUM',
            category: 'OTHER',
            severity: 'MEDIUM',
            status: 'OPEN'
        };
        this.submitted = false;
        this.beforePhotoFile = null;
        this.beforePhotoPreview = null;
        this.requestDialog = true;
    }

    editRequest(request: MaintenanceRequest) {
        this.request = { ...request };
        this.requestDialog = true;
    }

    hideDialog() {
        this.requestDialog = false;
        this.submitted = false;
    }

    deleteRequest(request: MaintenanceRequest) {
        if (!request.id) {
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${request.title}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.maintenanceService.delete(request.id!).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Maintenance Request Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    deleteSelectedRequests() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected maintenance requests?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedRequests?.map((item) => item.id).filter((id): id is string => !!id) || [];
                ids.forEach((id) => this.maintenanceService.delete(id).subscribe());
                this.selectedRequests = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Maintenance Requests Deleted',
                    life: 3000
                });
            }
        });
    }

    saveRequest() {
        this.submitted = true;

        if (!this.isFormValid()) {
            return;
        }

        this.loading = true;

        if (this.request.id) {
            this.maintenanceService.update(this.request.id, this.request as MaintenanceRequest).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Maintenance Request Updated', life: 3000 });
                    this.hideAndReset();
                },
                error: () => (this.loading = false)
            });
            return;
        }

        const createPayload: MaintenanceRequest = {
            ...(this.request as MaintenanceRequest),
            reportedBy: this.getConnectedUserFullName() || this.request.reportedBy || 'Unknown User',
            organizationId: this.authService.organizationId() ?? undefined
        };

        this.maintenanceService.create(createPayload, this.beforePhotoFile ?? undefined).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Maintenance Request Created', life: 3000 });
                this.hideAndReset();
            },
            error: () => (this.loading = false)
        });
    }

    openTaskDialog(request: MaintenanceRequest) {
        if (!request.id) {
            return;
        }

        this.selectedRequestForTasks = request;
        this.editingTaskId = null;
        this.task = {
            maintenanceRequestId: request.id,
            title: '',
            description: '',
            orderIndex: this.requestTasks.length + 1,
            assignedTo: '',
            estimatedMinutes: undefined,
            blockedReason: '',
            scheduledDate: new Date().toISOString().slice(0, 10),
            status: 'PENDING'
        };
        this.taskSubmitted = false;
        this.taskDialog = true;
    }

    editTask(taskToEdit: MaintenanceTask) {
        this.editingTaskId = taskToEdit.id || null;
        this.task = { ...taskToEdit };
        this.taskDialog = true;
        this.taskSubmitted = false;
    }

    hideTaskDialog() {
        this.taskDialog = false;
        this.taskSubmitted = false;
        this.taskLoading = false;
        this.task = {};
        this.editingTaskId = null;
    }

    saveTask() {
        this.taskSubmitted = true;

        if (!this.isTaskFormValid() || !this.selectedRequestForTasks?.id) {
            return;
        }

        this.taskLoading = true;

        const payload: MaintenanceTask = {
            maintenanceRequestId: this.selectedRequestForTasks.id,
            title: this.task.title?.trim() || 'Sub-task',
            description: this.task.description?.trim() || undefined,
            orderIndex: this.task.orderIndex,
            assignedTo: this.task.assignedTo!,
            estimatedMinutes: this.task.estimatedMinutes,
            blockedReason: this.task.status === 'BLOCKED' ? this.task.blockedReason?.trim() || '' : undefined,
            scheduledDate: this.task.scheduledDate!,
            status: this.task.status!
        };

        const request$ = this.editingTaskId
            ? this.maintenanceTaskService.update(this.editingTaskId, { ...payload, id: this.editingTaskId })
            : this.maintenanceTaskService.createForRequest(this.selectedRequestForTasks.id, payload);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: this.editingTaskId ? 'Maintenance Task Updated' : 'Maintenance Task Created',
                    life: 3000
                });
                this.hideTaskDialog();
                this.reloadTaskPanel();
                this.maintenanceService.getAll().subscribe();
            },
            error: () => {
                this.taskLoading = false;
            }
        });
    }

    deleteTask(taskToDelete: MaintenanceTask) {
        if (!taskToDelete.id) {
            return;
        }

        this.confirmationService.confirm({
            message: `Delete subtask ${taskToDelete.title || taskToDelete.id}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.maintenanceTaskService.delete(taskToDelete.id!).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Task deleted', life: 2500 });
                    this.reloadTaskPanel();
                    this.maintenanceService.getAll().subscribe();
                });
            }
        });
    }

    openSubdivideDialog(request: MaintenanceRequest) {
        if (!request.id) {
            return;
        }

        this.selectedRequestForTasks = request;
        this.subdivideDialog = true;
        this.reloadTaskPanel();
    }

    reloadTaskPanel() {
        if (!this.selectedRequestForTasks?.id) {
            this.requestTasks = [];
            return;
        }

        this.requestTasksLoading = true;
        this.maintenanceTaskService.getByRequestId(this.selectedRequestForTasks.id).subscribe({
            next: (tasks) => {
                this.requestTasks = tasks;
                this.requestTasksLoading = false;
            },
            error: () => {
                this.requestTasksLoading = false;
            }
        });
    }

    filteredRequests(): MaintenanceRequest[] {
        let requests = this.maintenanceService.requests();

        if (this.selectedStatusFilter) {
            requests = requests.filter((request) => request.status === this.selectedStatusFilter);
        }

        if (this.selectedPriorityFilter) {
            requests = requests.filter((request) => request.priority === this.selectedPriorityFilter);
        }

        if (this.selectedCategoryFilter) {
            requests = requests.filter((request) => request.category === this.selectedCategoryFilter);
        }

        if (this.selectedSeverityFilter) {
            requests = requests.filter((request) => request.severity === this.selectedSeverityFilter);
        }

        return requests;
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedStatusFilter || this.selectedPriorityFilter || this.selectedCategoryFilter || this.selectedSeverityFilter);
    }

    clearFilters() {
        this.selectedStatusFilter = null;
        this.selectedPriorityFilter = null;
        this.selectedCategoryFilter = null;
        this.selectedSeverityFilter = null;
        this.dt?.filterGlobal('', 'contains');
    }

    openMaintenanceDetails(request: MaintenanceRequest) {
        this.maintenanceDetails = { ...request };
        this.maintenanceDetailsDialog = true;
    }

    openExpenseDialog(request: MaintenanceRequest) {
        this.expenseTargetRequest = request;
        this.expenseAmount = null;
        this.expenseSubmitted = false;
        this.expenseDialog = true;
    }

    hideExpenseDialog() {
        this.expenseDialog = false;
        this.expenseSaving = false;
        this.expenseSubmitted = false;
        this.expenseAmount = null;
        this.expenseTargetRequest = null;
    }

    submitExpenseFromMaintenance() {
        this.expenseSubmitted = true;

        if (!this.expenseTargetRequest || !this.expenseAmount || this.expenseAmount <= 0) {
            return;
        }

        this.expenseSaving = true;

        const today = new Date().toISOString().slice(0, 10);
        const request = this.expenseTargetRequest;

        this.expenseService.create({
            organizationId: request.organizationId || this.authService.organizationId() || undefined,
            buildingId: request.buildingId || undefined,
            apartmentId: request.apartmentId || undefined,
            description: `Maintenance ${request.maintenanceCode || request.id || ''} - ${request.title}`.trim(),
            amount: this.expenseAmount,
            category: 'MAINTENANCE',
            expenseDate: today
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Expense Added',
                    detail: 'Expense was added to expenses tracking.',
                    life: 3000
                });
                this.hideExpenseDialog();
            },
            error: () => {
                this.expenseSaving = false;
            }
        });
    }

    openTaskDetails(task: MaintenanceTask) {
        this.taskDetails = { ...task };
        this.taskDetailsDialog = true;
    }

    resolveStaffName(accountId?: string): string {
        if (!accountId) {
            return '-';
        }

        const found = this.staffOptions.find((staff) => staff.value === accountId);
        return found ? found.label : accountId;
    }

    countTasksByStatus(status: TaskStatus): number {
        return this.requestTasks.filter((task) => task.status === status).length;
    }

    getTaskCompletionPercent(): number {
        if (!this.requestTasks.length) {
            return 0;
        }

        return Math.round((this.countTasksByStatus('COMPLETED') / this.requestTasks.length) * 100);
    }

    getTaskProgressRing(): string {
        const percent = this.getTaskCompletionPercent();
        return `conic-gradient(#14b8a6 ${percent}%, #e5e7eb ${percent}% 100%)`;
    }

    formatPriority(priority: MaintenancePriority): string {
        switch (priority) {
            case 'LOW':
                return 'Low';
            case 'MEDIUM':
                return 'Medium';
            case 'HIGH':
                return 'High';
            default:
                return priority;
        }
    }

    formatStatus(status?: MaintenanceStatus): string {
        switch (status) {
            case 'OPEN':
                return 'Open';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'COMPLETED':
                return 'Completed';
            case 'CLOSED':
                return 'Closed';
            case 'VERIFIED':
                return 'Verified';
            default:
                return 'Open';
        }
    }

    formatTaskStatus(status?: TaskStatus): string {
        switch (status) {
            case 'PENDING':
                return 'Pending';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'COMPLETED':
                return 'Completed';
            case 'BLOCKED':
                return 'Blocked';
            default:
                return 'Pending';
        }
    }

    getPrioritySeverity(priority: MaintenancePriority): 'success' | 'warn' | 'danger' {
        switch (priority) {
            case 'LOW':
                return 'success';
            case 'MEDIUM':
                return 'warn';
            case 'HIGH':
                return 'danger';
            default:
                return 'warn';
        }
    }

    getStatusSeverity(status?: MaintenanceStatus): 'info' | 'warn' | 'success' {
        switch (status) {
            case 'OPEN':
                return 'info';
            case 'IN_PROGRESS':
                return 'warn';
            case 'COMPLETED':
            case 'CLOSED':
            case 'VERIFIED':
                return 'success';
            default:
                return 'info';
        }
    }

    getTaskStatusSeverity(status?: TaskStatus): 'info' | 'warn' | 'success' | 'danger' {
        switch (status) {
            case 'PENDING':
                return 'info';
            case 'IN_PROGRESS':
                return 'warn';
            case 'COMPLETED':
                return 'success';
            case 'BLOCKED':
                return 'danger';
            default:
                return 'info';
        }
    }

    humanizeEnum(value?: string): string {
        if (!value) {
            return '-';
        }
        return value
            .toLowerCase()
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    getSeverityTagSeverity(severity?: MaintenanceSeverity): 'success' | 'warn' | 'danger' {
        switch (severity) {
            case 'LOW':
                return 'success';
            case 'MEDIUM':
                return 'warn';
            case 'HIGH':
            case 'CRITICAL':
                return 'danger';
            default:
                return 'warn';
        }
    }

    formatDateTime(value?: string): string {
        if (!value) {
            return '-';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleString();
    }

    private isFormValid(): boolean {
        const hasPhoto = !!(this.request.id || this.beforePhotoFile || this.request.beforeImageUrl);
        return !!(
            this.request.title?.trim() &&
            this.request.description?.trim() &&
            this.request.reportedBy?.trim() &&
            this.request.apartmentId?.trim() &&
            this.request.priority &&
            hasPhoto
        );
    }

    private getConnectedUserFullName(): string {
        const user = this.authService.user();
        if (!user) {
            return '';
        }

        return `${user.firstName} ${user.lastName}`.trim();
    }

    private hideAndReset() {
        this.requestDialog = false;
        this.loading = false;
        this.request = {};
        this.submitted = false;
        this.beforePhotoFile = null;
        this.beforePhotoPreview = null;
    }

    private isTaskFormValid(): boolean {
        return !!(
            this.task.assignedTo?.trim() &&
            this.task.scheduledDate &&
            this.task.status &&
            (this.task.status !== 'BLOCKED' || this.task.blockedReason?.trim())
        );
    }

    private loadAssignableStaff() {
        this.maintenanceTaskService.getAssignableStaff().subscribe({
            next: (staff) => {
                this.staffOptions = staff.map((item: AssignableStaffOption) => ({
                    value: item.accountId,
                    label: `${item.fullName} (${item.jobTitle})`
                }));
            },
            error: () => {
                this.staffOptions = [];
            }
        });
    }

    onBeforePhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.beforePhotoFile = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => this.beforePhotoPreview = e.target?.result as string;
            reader.readAsDataURL(this.beforePhotoFile);
        }
    }

    onAfterPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.afterPhotoFile = input.files[0];
            this.aiResult = null;
            const reader = new FileReader();
            reader.onload = (e) => this.afterPhotoPreview = e.target?.result as string;
            reader.readAsDataURL(this.afterPhotoFile);
        }
    }

    openAiCompletionDialog(task: MaintenanceTask) {
        this.aiTargetTask = task;
        this.afterPhotoFile = null;
        this.afterPhotoPreview = null;
        this.aiResult = null;
        this.aiCompletionLoading = false;
        this.aiCompletionDialog = true;
    }

    hideAiCompletionDialog() {
        this.aiCompletionDialog = false;
        this.aiCompletionLoading = false;
        this.aiResult = null;
        this.afterPhotoFile = null;
        this.afterPhotoPreview = null;
        this.aiTargetTask = null;
    }

    getBeforeImageForAi(): string {
        return this.selectedRequestForTasks?.beforeImageUrl || '';
    }

    runAiComparison() {
        if (!this.aiTargetTask?.id || !this.afterPhotoFile) {
            return;
        }

        this.aiCompletionLoading = true;
        this.maintenanceTaskService.completeWithPhoto(this.aiTargetTask.id, this.afterPhotoFile).subscribe({
            next: (result) => {
                this.aiResult = result;
                this.aiCompletionLoading = false;
            },
            error: () => {
                this.aiCompletionLoading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'AI comparison failed. Please try again.', life: 4000 });
            }
        });
    }

    confirmAiCompletion() {
        if (!this.aiTargetTask?.id) {
            return;
        }

        this.maintenanceTaskService.confirmCompletion(this.aiTargetTask.id).subscribe({
            next: () => {
                const msg = this.aiResult?.approved
                    ? 'Task completed — AI approved!'
                    : 'Task force-completed despite low AI score.';
                this.messageService.add({ severity: 'success', summary: 'Task Completed', detail: msg, life: 3000 });
                this.hideAiCompletionDialog();
                this.reloadTaskPanel();
                this.maintenanceService.getAll().subscribe();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to confirm completion.', life: 3000 });
            }
        });
    }

    openImageInNewTab(url: string) {
        window.open(url, '_blank');
    }
}
