import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AiComparisonResult, AssignableStaffOption, MaintenanceTask, MaintenanceTaskService, TaskStatus } from '@/app/pages/service/maintenance-task.service';
import { MaintenanceRequestService } from '@/app/pages/service/maintenance-request.service';

interface Column {
    field: string;
    header: string;
}

interface RequestOption {
    label: string;
    value: string;
}

interface StaffDetails {
    accountId: string;
    fullName: string;
    jobTitle: string;
}

@Component({
    selector: 'app-maintenance-tasks',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
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
                        <p-button label="New Task" icon="pi pi-plus" severity="success" (onClick)="openNew()" />
                        <p-button
                            severity="danger"
                            label="Delete Selected"
                            icon="pi pi-trash"
                            outlined
                            (onClick)="deleteSelectedTasks()"
                            [disabled]="!selectedTasks || !selectedTasks.length"
                        />
                        <p-button label="Export CSV" icon="pi pi-download" severity="secondary" outlined (onClick)="exportCSV()" />
                    </div>

                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search tasks..." class="w-full md:w-80" />
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
            [value]="filteredTasks()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['title', 'description', 'maintenanceRequestId', 'assignedTo', 'scheduledDate', 'status']"
            [tableStyle]="{ width: '100%' }"
            [(selection)]="selectedTasks"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} maintenance tasks"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
            styleClass="p-datatable-gridlines"
        >
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="title">Title <p-sortIcon field="title" /></th>
                    <th pSortableColumn="maintenanceRequestId">Request ID <p-sortIcon field="maintenanceRequestId" /></th>
                    <th pSortableColumn="assignedTo">Assigned To <p-sortIcon field="assignedTo" /></th>
                    <th pSortableColumn="scheduledDate">Scheduled Date <p-sortIcon field="scheduledDate" /></th>
                    <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
                    <th></th>
                </tr>
            </ng-template>
            <ng-template #body let-task>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="task" /></td>
                    <td>
                        <div class="font-medium">{{ task.title || 'Sub-task' }}</div>
                        <small class="text-surface-500" *ngIf="task.description">{{ task.description }}</small>
                    </td>
                    <td>{{ task.maintenanceRequestId }}</td>
                    <td>
                        {{ resolveAssignee(task.assignedTo) }}
                    </td>
                    <td>{{ task.scheduledDate }}</td>
                    <td><p-tag [value]="formatStatus(task.status)" [severity]="getStatusSeverity(task.status)" /></td>
                    <td>
                        <div class="flex gap-2 justify-end flex-wrap">
                            <p-button icon="pi pi-eye" [rounded]="true" [outlined]="true" severity="secondary" (click)="openTaskDetails(task)" />
                            <p-button icon="pi pi-user" [rounded]="true" [outlined]="true" severity="contrast" (click)="openAssigneeDetails(task.assignedTo)" />
                            <p-button *ngIf="task.status !== 'COMPLETED'" icon="pi pi-camera" [rounded]="true" [outlined]="true" severity="help" pTooltip="Complete with AI" (click)="openAiCompletionDialog(task)" />
                            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (click)="editTask(task)" />
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteTask(task)" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="taskDialog" [style]="{ width: '500px' }" header="Maintenance Task" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div class="flex flex-col gap-2">
                        <label for="title" class="block font-bold">Task Title</label>
                        <input type="text" pInputText id="title" [(ngModel)]="task.title" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="description" class="block font-bold">Description</label>
                        <input type="text" pInputText id="description" [(ngModel)]="task.description" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="maintenanceRequestId" class="block font-bold">Maintenance Request ID</label>
                        <p-select
                            [(ngModel)]="task.maintenanceRequestId"
                            inputId="maintenanceRequestId"
                            [options]="requestOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select an existing request"
                            [filter]="true"
                            filterBy="label"
                            class="w-full"
                            styleClass="w-full"
                            appendTo="body"
                        ></p-select>
                        <small class="text-red-500" *ngIf="submitted && !task.maintenanceRequestId">Request ID is required.</small>
                        <small class="text-surface-500" *ngIf="!requestOptions.length">No maintenance requests found. Create a request first.</small>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="assignedTo" class="block font-bold">Assigned To</label>
                        <input type="text" pInputText id="assignedTo" [(ngModel)]="task.assignedTo" required class="w-full" />
                        <small class="text-red-500" *ngIf="submitted && !task.assignedTo">Assignee is required.</small>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6 flex flex-col gap-2">
                            <label for="scheduledDate" class="block font-bold">Scheduled Date</label>
                            <input type="date" pInputText id="scheduledDate" [(ngModel)]="task.scheduledDate" required class="w-full" />
                        </div>
                        <div class="col-span-6 flex flex-col gap-2">
                            <label for="estimatedMinutes" class="block font-bold">Estimated Minutes</label>
                            <input type="number" pInputText id="estimatedMinutes" [(ngModel)]="task.estimatedMinutes" class="w-full" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="status" class="block font-bold">Status</label>
                        <p-select
                            [(ngModel)]="task.status"
                            inputId="status"
                            [options]="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Status"
                            class="w-full"
                            styleClass="w-full"
                            appendTo="body"
                        ></p-select>
                    </div>

                    <div class="flex flex-col gap-2" *ngIf="task.status === 'BLOCKED'">
                        <label for="blockedReason" class="block font-bold">Blocked Reason</label>
                        <input type="text" pInputText id="blockedReason" [(ngModel)]="task.blockedReason" class="w-full" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="saveTask()" [loading]="loading" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="assigneeDialog" [style]="{ width: '460px', maxWidth: '95vw' }" header="Staff Details" [modal]="true">
            <ng-template #content>
                <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-4" *ngIf="selectedAssignee; else assigneeNotFoundTpl">
                    <div class="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-surface-200 dark:border-surface-700">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                                <i class="pi pi-user"></i>
                            </div>
                            <div>
                                <div class="text-xs uppercase tracking-wide text-surface-500">Assigned Staff</div>
                                <div class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ selectedAssignee.fullName }}</div>
                            </div>
                        </div>
                        <p-tag [value]="selectedAssignee.jobTitle || '-'" severity="info"></p-tag>
                    </div>

                    <div class="grid grid-cols-12 gap-3 text-sm">
                        <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                            <div class="text-surface-500">Full Name</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0 mt-1">{{ selectedAssignee.fullName }}</div>
                        </div>

                        <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                            <div class="text-surface-500">Job Title</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0 mt-1">{{ selectedAssignee.jobTitle }}</div>
                        </div>

                        <div class="col-span-12 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                            <div class="text-surface-500">Account ID</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0 mt-1 break-all">{{ selectedAssignee.accountId }}</div>
                        </div>
                    </div>
                </div>

                <ng-template #assigneeNotFoundTpl>
                    <div class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-4 text-surface-500 text-sm">
                        No detailed information found for this assignee.
                    </div>
                </ng-template>
            </ng-template>

            <ng-template #footer>
                <p-button label="Close" icon="pi pi-times" text (click)="assigneeDialog = false" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="taskDetailsDialog" [style]="{ width: '680px', maxWidth: '95vw' }" header="Task Details" [modal]="true">
            <ng-template #content>
                <div class="grid grid-cols-12 gap-3 text-sm" *ngIf="selectedTask">
                    <div class="col-span-12 rounded-xl border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-surface-500">Title</div>
                        <div class="font-medium mt-1">{{ selectedTask.title || '-' }}</div>
                        <div class="text-surface-500 mt-2">{{ selectedTask.description || '-' }}</div>
                    </div>

                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Task ID</div>
                        <div class="font-medium mt-1 break-all">{{ selectedTask.id || '-' }}</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Request ID</div>
                        <div class="font-medium mt-1 break-all">{{ selectedTask.maintenanceRequestId || '-' }}</div>
                    </div>

                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Assigned To</div>
                        <div class="font-medium mt-1">{{ resolveAssignee(selectedTask.assignedTo) }}</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Status</div>
                        <div class="mt-1"><p-tag [value]="formatStatus(selectedTask.status)" [severity]="getStatusSeverity(selectedTask.status)" /></div>
                    </div>

                    <div class="col-span-6 md:col-span-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Order</div>
                        <div class="font-medium mt-1">{{ selectedTask.orderIndex || '-' }}</div>
                    </div>
                    <div class="col-span-6 md:col-span-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Estimate</div>
                        <div class="font-medium mt-1">{{ selectedTask.estimatedMinutes || '-' }} min</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Blocked Reason</div>
                        <div class="font-medium mt-1">{{ selectedTask.blockedReason || '-' }}</div>
                    </div>

                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Scheduled Date</div>
                        <div class="font-medium mt-1">{{ selectedTask.scheduledDate || '-' }}</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Started Date</div>
                        <div class="font-medium mt-1">{{ selectedTask.startedDate || '-' }}</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Completed Date</div>
                        <div class="font-medium mt-1">{{ selectedTask.completedDate || '-' }}</div>
                    </div>
                    <div class="col-span-12 md:col-span-6 rounded-xl bg-surface-50 dark:bg-surface-800/60 p-3">
                        <div class="text-surface-500">Updated At</div>
                        <div class="font-medium mt-1">{{ selectedTask.updatedAt || '-' }}</div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Close" icon="pi pi-times" text (click)="taskDetailsDialog = false" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="aiCompletionDialog" [style]="{ width: '720px', maxWidth: '96vw' }" header="Complete Task — AI Verification" [modal]="true" [closable]="!aiCompletionLoading">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div class="rounded-2xl border border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-900/40" *ngIf="aiTargetTask">
                        <div class="text-xs uppercase tracking-wide text-surface-500 mb-1">Task</div>
                        <div class="font-semibold">{{ aiTargetTask.title || 'Subtask' }}</div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="block font-bold">Upload "After" Photo <span class="text-red-500">*</span></label>
                        <input #afterPhotoInput type="file" accept="image/*" (change)="onAfterPhotoSelected($event)" class="hidden" [disabled]="aiCompletionLoading" />
                        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                            <p-button
                                type="button"
                                label="Choose File"
                                icon="pi pi-upload"
                                severity="secondary"
                                [outlined]="true"
                                (onClick)="afterPhotoInput.click()"
                                [disabled]="aiCompletionLoading"
                            />
                            <span class="text-sm" [ngClass]="afterPhotoFile ? 'text-surface-900 dark:text-surface-0' : 'text-surface-500'">
                                {{ afterPhotoFile?.name || 'No file selected' }}
                            </span>
                        </div>
                        <small class="text-surface-500">Accepted formats: image files only.</small>
                    </div>
                    <div *ngIf="afterPhotoPreview && aiBeforeImageUrl" class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <div class="text-xs font-bold uppercase text-surface-500">Before</div>
                            <img [src]="aiBeforeImageUrl" alt="Before" class="w-full h-40 object-cover rounded-xl border border-surface-200" />
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
export class MaintenanceTasksComponent implements OnInit {
    taskDialog = false;
    assigneeDialog = false;
    taskDetailsDialog = false;
    loading = false;

    task: Partial<MaintenanceTask> = {};
    selectedTask: MaintenanceTask | null = null;
    selectedTasks!: MaintenanceTask[] | null;
    submitted = false;
    requestOptions: RequestOption[] = [];
    assigneeLabelById: Record<string, string> = {};
    assigneeDetailsByKey: Record<string, StaffDetails> = {};
    selectedAssignee: StaffDetails | null = null;
    selectedStatusFilter: TaskStatus | null = null;

    aiCompletionDialog = false;
    aiCompletionLoading = false;
    aiResult: AiComparisonResult | null = null;
    afterPhotoFile: File | null = null;
    afterPhotoPreview: string | null = null;
    aiTargetTask: MaintenanceTask | null = null;
    aiBeforeImageUrl: string | null = null;

    statusOptions: { label: string; value: TaskStatus }[] = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Blocked', value: 'BLOCKED' }
    ];

    @ViewChild('dt') dt!: Table;
    cols: Column[] = [];

    taskService = inject(MaintenanceTaskService);
    requestService = inject(MaintenanceRequestService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);

    ngOnInit() {
        this.taskService.getAll().subscribe();
        this.taskService.getAssignableStaff().subscribe({
            next: (staff) => {
                this.assigneeLabelById = staff.reduce((acc, item: AssignableStaffOption) => {
                    acc[item.accountId] = `${item.fullName} (${item.jobTitle})`;
                    return acc;
                }, {} as Record<string, string>);

                this.assigneeDetailsByKey = staff.reduce((acc, item: AssignableStaffOption) => {
                    const label = `${item.fullName} (${item.jobTitle})`;
                    const details: StaffDetails = {
                        accountId: item.accountId,
                        fullName: item.fullName,
                        jobTitle: item.jobTitle
                    };

                    acc[item.accountId] = details;
                    acc[label] = details;
                    return acc;
                }, {} as Record<string, StaffDetails>);
            },
            error: () => {
                this.assigneeLabelById = {};
                this.assigneeDetailsByKey = {};
            }
        });
        this.requestService.getAll().subscribe((requests) => {
            this.requestOptions = requests.map((request) => ({
                value: request.id ?? '',
                label: `${request.id ?? 'N/A'} - ${request.title} (${request.apartmentId})`
            })).filter((option) => !!option.value);
        });
        this.cols = [
            { field: 'title', header: 'Title' },
            { field: 'maintenanceRequestId', header: 'Request ID' },
            { field: 'assignedTo', header: 'Assigned To' },
            { field: 'scheduledDate', header: 'Scheduled Date' },
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
        this.task = {
            title: '',
            description: '',
            maintenanceRequestId: '',
            assignedTo: '',
            scheduledDate: new Date().toISOString().slice(0, 10),
            estimatedMinutes: undefined,
            blockedReason: '',
            status: 'PENDING'
        };
        this.submitted = false;
        this.taskDialog = true;
    }

    editTask(task: MaintenanceTask) {
        this.task = { ...task };
        this.taskDialog = true;
    }

    hideDialog() {
        this.taskDialog = false;
        this.submitted = false;
    }

    deleteTask(task: MaintenanceTask) {
        if (!task.id) {
            return;
        }

        this.confirmationService.confirm({
            message: `Are you sure you want to delete task ${task.id}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.taskService.delete(task.id!).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Maintenance Task Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    deleteSelectedTasks() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected maintenance tasks?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedTasks?.map((item) => item.id).filter((id): id is string => !!id) || [];
                ids.forEach((id) => this.taskService.delete(id).subscribe());
                this.selectedTasks = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Maintenance Tasks Deleted',
                    life: 3000
                });
            }
        });
    }

    saveTask() {
        this.submitted = true;

        if (!this.isFormValid()) {
            return;
        }

        this.loading = true;

        if (this.task.id) {
            this.taskService.update(this.task.id, this.task as MaintenanceTask).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Maintenance Task Updated', life: 3000 });
                    this.hideAndReset();
                },
                error: () => (this.loading = false)
            });
            return;
        }

        this.taskService.create(this.task as MaintenanceTask).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Maintenance Task Created', life: 3000 });
                this.hideAndReset();
            },
            error: () => (this.loading = false)
        });
    }

    filteredTasks(): MaintenanceTask[] {
        let tasks = this.taskService.tasks();

        if (this.selectedStatusFilter) {
            tasks = tasks.filter((task) => task.status === this.selectedStatusFilter);
        }

        return tasks;
    }

    hasActiveFilters(): boolean {
        return !!this.selectedStatusFilter;
    }

    clearFilters() {
        this.selectedStatusFilter = null;
        this.dt?.filterGlobal('', 'contains');
    }

    openTaskDetails(task: MaintenanceTask) {
        this.selectedTask = { ...task };
        this.taskDetailsDialog = true;
    }

    formatStatus(status: TaskStatus): string {
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
                return status;
        }
    }

    getStatusSeverity(status: TaskStatus): 'info' | 'warn' | 'success' | 'danger' {
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

    private isFormValid(): boolean {
        return !!(
            this.task.maintenanceRequestId?.trim() &&
            this.task.assignedTo?.trim() &&
            this.task.scheduledDate &&
            this.task.status
        );
    }

    private hideAndReset() {
        this.taskDialog = false;
        this.loading = false;
        this.task = {};
        this.submitted = false;
    }

    resolveAssignee(assignedTo: string): string {
        return this.assigneeLabelById[assignedTo] ?? assignedTo;
    }

    openAssigneeDetails(assignedTo: string) {
        this.selectedAssignee = this.assigneeDetailsByKey[assignedTo] ?? null;
        this.assigneeDialog = true;
    }

    openAiCompletionDialog(task: MaintenanceTask) {
        this.aiTargetTask = task;
        this.afterPhotoFile = null;
        this.afterPhotoPreview = null;
        this.aiResult = null;
        this.aiCompletionLoading = false;
        this.aiBeforeImageUrl = null;
        // Look up the parent request to get beforeImageUrl
        const requests = this.requestService.requests();
        const parentReq = requests.find(r => r.id === task.maintenanceRequestId);
        this.aiBeforeImageUrl = parentReq?.beforeImageUrl ?? null;
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

    runAiComparison() {
        if (!this.aiTargetTask?.id || !this.afterPhotoFile) return;
        this.aiCompletionLoading = true;
        this.taskService.completeWithPhoto(this.aiTargetTask.id, this.afterPhotoFile).subscribe({
            next: (result) => { this.aiResult = result; this.aiCompletionLoading = false; },
            error: () => { this.aiCompletionLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'AI comparison failed.', life: 4000 }); }
        });
    }

    confirmAiCompletion() {
        if (!this.aiTargetTask?.id) return;
        this.taskService.confirmCompletion(this.aiTargetTask.id).subscribe({
            next: () => {
                const msg = this.aiResult?.approved ? 'Task completed — AI approved!' : 'Task force-completed despite low AI score.';
                this.messageService.add({ severity: 'success', summary: 'Task Completed', detail: msg, life: 3000 });
                this.hideAiCompletionDialog();
                this.taskService.getAll().subscribe();
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to confirm completion.', life: 3000 }); }
        });
    }
}
