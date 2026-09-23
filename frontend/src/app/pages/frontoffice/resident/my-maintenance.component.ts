import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import {
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceRequest,
    MaintenanceRequestService,
    MaintenanceSeverity,
    MaintenanceStatus
} from '../../service/maintenance-request.service';
import { MaintenanceTask, MaintenanceTaskService, TaskStatus } from '../../service/maintenance-task.service';
import { catchError, finalize, of, timeout } from 'rxjs';

@Component({
    selector: 'app-my-maintenance',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, SelectModule, TagModule, ToastModule, DialogModule, InputTextModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0 flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-1 mt-0">My Maintenance</h1>
                        <p class="text-surface-600 dark:text-surface-400 m-0">Track all your requests and submit new issues in one place.</p>
                    </div>
                    <button pButton type="button" label="New Request" icon="pi pi-plus" (click)="openNewRequestDialog()"></button>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <div *ngIf="maintenanceLoading" class="text-surface-500">Loading requests...</div>

                    <div *ngIf="!maintenanceLoading && myRequests.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div
                            *ngFor="let request of myRequests"
                            class="rounded-2xl p-5 bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-700/70 shadow-sm min-h-[220px] flex flex-col justify-between"
                        >
                            <div>
                                <div class="flex items-center justify-between gap-2 mb-3">
                                    <div class="text-xs uppercase tracking-wide text-surface-400">Maintenance</div>
                                    <div class="text-xs text-surface-400">{{ formatStatus(request.status) }}</div>
                                </div>

                                <div class="text-surface-900 dark:text-surface-0 text-lg font-semibold leading-tight line-clamp-2">{{ request.title }}</div>
                                <div class="text-sm text-surface-500 mt-2 leading-relaxed line-clamp-3">{{ request.description }}</div>

                                <div class="mt-2 text-xs text-surface-500" *ngIf="request.maintenanceCode">
                                    Code: <span class="font-medium text-surface-700 dark:text-surface-200">{{ request.maintenanceCode }}</span>
                                </div>

                                <div class="mt-4 pt-3 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                                    Apartment: <span class="font-medium text-surface-700 dark:text-surface-200">{{ request.apartmentId }}</span>
                                </div>
                            </div>

                            <div class="flex items-center justify-between mt-4 gap-2">
                                <div class="flex items-center gap-2">
                                    <p-tag [value]="formatPriority(request.priority)" [severity]="getPrioritySeverity(request.priority)"></p-tag>
                                    <p-tag [value]="formatStatus(request.status)" [severity]="getStatusSeverity(request.status)"></p-tag>
                                    <p-tag *ngIf="request.severity" [value]="request.severity"></p-tag>
                                </div>
                                <button pButton type="button" label="Details" [outlined]="true" (click)="openDetails(request)"></button>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!maintenanceLoading && !myRequests.length" class="text-surface-500">
                        No maintenance requests yet.
                    </div>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl m-0">My Tasks</h2>
                    </div>

                    <div *ngIf="tasksLoading" class="text-surface-500">Loading tasks...</div>

                    <div *ngIf="!tasksLoading && maintenanceTasks.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div *ngFor="let task of maintenanceTasks" class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div class="text-sm text-surface-500">Task #{{ task.orderIndex || '-' }}</div>
                                <p-tag [value]="formatTaskStatus(task.status)" [severity]="getTaskStatusSeverity(task.status)"></p-tag>
                            </div>

                            <div class="text-base font-semibold text-surface-800 dark:text-surface-100">{{ task.title || 'Sub-task' }}</div>
                            <div class="text-sm text-surface-500 mt-1" *ngIf="task.description">{{ task.description }}</div>

                            <div class="text-sm text-surface-600 dark:text-surface-300">
                                Request ID: <span class="font-medium">{{ task.maintenanceRequestId }}</span>
                            </div>
                            <div class="text-sm text-surface-600 dark:text-surface-300 mt-1" *ngIf="task.estimatedMinutes">
                                Estimate: <span class="font-medium">{{ task.estimatedMinutes }} min</span>
                            </div>
                            <div class="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                Scheduled: <span class="font-medium">{{ task.scheduledDate }}</span>
                            </div>
                            <div class="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                Started: <span class="font-medium">{{ task.startedDate || '-' }}</span>
                            </div>
                            <div class="text-sm text-surface-600 dark:text-surface-300 mt-1">
                                Completed: <span class="font-medium">{{ task.completedDate || '-' }}</span>
                            </div>
                            <div class="text-sm text-red-500 mt-1" *ngIf="task.blockedReason">
                                Blocked reason: <span class="font-medium">{{ task.blockedReason }}</span>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!tasksLoading && !maintenanceTasks.length" class="text-surface-500">
                        No maintenance tasks yet.
                    </div>
                </div>
            </div>
        </div>

        <p-dialog [(visible)]="showNewRequestForm" [modal]="true" [draggable]="false" [resizable]="false" [dismissableMask]="true" [style]="{ width: '40rem', maxWidth: '95vw' }" [header]="editingRequestId ? 'Edit Maintenance Request' : 'New Maintenance Request'" (onHide)="closeNewRequestDialog()">
            <ng-template #content>
                <form #requestForm="ngForm" class="grid grid-cols-12 gap-4" novalidate>
                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="title">Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            pInputText
                            class="w-full"
                            maxlength="100"
                            required
                            [(ngModel)]="newRequest.title"
                            #titleModel="ngModel"
                            placeholder="Issue title (e.g. Water leakage in kitchen)"
                        />
                        <small class="text-red-500 block mt-1" *ngIf="(titleModel.invalid && (titleModel.touched || submitAttempted))">Title is required.</small>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="apartment">Apartment</label>
                        <input
                            id="apartment"
                            name="apartment"
                            type="text"
                            pInputText
                            class="w-full"
                            required
                            minlength="2"
                            maxlength="40"
                            [(ngModel)]="newRequest.apartmentId"
                            #apartmentModel="ngModel"
                            placeholder="e.g. Building C - 405"
                        />
                        <small class="text-red-500 block mt-1" *ngIf="(apartmentModel.invalid && (apartmentModel.touched || submitAttempted))">Apartment is required.</small>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="priority">Priority</label>
                        <p-select id="priority" name="priority" class="w-full" [(ngModel)]="newRequest.priority" [options]="priorityOptions"></p-select>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="severity">Severity</label>
                        <p-select
                            id="severity"
                            name="severity"
                            class="w-full"
                            [(ngModel)]="newRequest.severity"
                            [options]="severityOptions"
                            optionLabel="label"
                            optionValue="value"
                        ></p-select>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="category">Category</label>
                        <p-select
                            id="category"
                            name="category"
                            class="w-full"
                            [(ngModel)]="newRequest.category"
                            [options]="categoryOptions"
                            optionLabel="label"
                            optionValue="value"
                        ></p-select>
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="dueAt">Due At</label>
                        <input id="dueAt" name="dueAt" type="datetime-local" pInputText class="w-full" [(ngModel)]="newRequest.dueAt" />
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="residenceId">Residence</label>
                        <input id="residenceId" name="residenceId" type="text" pInputText class="w-full" [(ngModel)]="newRequest.residenceId" />
                    </div>

                    <div class="col-span-12 lg:col-span-6">
                        <label class="block font-medium mb-2" for="buildingId">Building</label>
                        <input id="buildingId" name="buildingId" type="text" pInputText class="w-full" [(ngModel)]="newRequest.buildingId" />
                    </div>

                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="locationDetails">Location Details</label>
                        <input id="locationDetails" name="locationDetails" type="text" pInputText class="w-full" [(ngModel)]="newRequest.locationDetails" />
                    </div>

                    <div class="col-span-12">
                        <label class="block font-medium mb-2" for="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="5"
                            class="w-full p-3 border border-surface-300 rounded-border"
                            required
                            minlength="10"
                            maxlength="600"
                            [(ngModel)]="newRequest.description"
                            #descriptionModel="ngModel"
                            placeholder="Describe what happened, when it started, and any urgency details"
                        ></textarea>
                        <small class="text-red-500 block mt-1" *ngIf="(descriptionModel.invalid && (descriptionModel.touched || submitAttempted))">Description is required (min 10 characters).</small>
                    </div>

                    <div class="col-span-12">
                        <label class="block font-medium mb-2">Photo of Issue <span class="text-red-500">*</span></label>
                        <div *ngIf="newRequest.beforeImageUrl && editingRequestId" class="mb-2">
                            <img [src]="newRequest.beforeImageUrl" alt="Current photo" class="w-36 h-24 object-cover rounded-xl border border-surface-200" />
                        </div>
                        <input type="file" accept="image/*" (change)="onBeforePhotoSelected($event)" class="w-full" />
                        <img *ngIf="beforePhotoPreview" [src]="beforePhotoPreview" alt="Preview" class="w-36 h-24 object-cover rounded-xl border border-surface-200 mt-2" />
                        <small class="text-red-500 block mt-1" *ngIf="submitAttempted && !editingRequestId && !beforePhotoFile">Photo is required.</small>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <button pButton type="button" severity="secondary" label="Clear" [outlined]="true" (click)="clearForm()"></button>
                    <button pButton type="button" severity="secondary" label="Cancel" text (click)="closeNewRequestDialog()"></button>
                    <button pButton type="button" [label]="editingRequestId ? 'Save Changes' : 'Submit Request'" [loading]="submitting" [disabled]="isSubmitDisabled()" (click)="submitRequest()"></button>
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="showDetailsDialog" [modal]="true" [draggable]="false" [resizable]="false" [dismissableMask]="true" [style]="{ width: '38rem', maxWidth: '95vw' }" header="Maintenance Details">
            <ng-template #content>
                <div *ngIf="selectedRequest as request" class="flex flex-col gap-4">
                    <div>
                        <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold">{{ request.title }}</div>
                        <div class="text-sm text-surface-500 mt-2">{{ request.description }}</div>
                        <div *ngIf="request.beforeImageUrl" class="mt-3">
                            <div class="text-xs text-surface-500 mb-1">Issue Photo</div>
                            <img [src]="request.beforeImageUrl" alt="Before" class="w-44 h-28 object-cover rounded-xl border border-surface-200" />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3 text-sm">
                        <div class="col-span-12 md:col-span-6">
                            <div class="text-surface-500">Apartment</div>
                            <div class="font-medium">{{ request.apartmentId }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="text-surface-500">Reported By</div>
                            <div class="font-medium">{{ request.reportedBy }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="text-surface-500">Priority</div>
                            <div class="mt-1"><p-tag [value]="formatPriority(request.priority)" [severity]="getPrioritySeverity(request.priority)"></p-tag></div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="text-surface-500">Status</div>
                            <div class="mt-1"><p-tag [value]="formatStatus(request.status)" [severity]="getStatusSeverity(request.status)"></p-tag></div>
                        </div>
                        <div class="col-span-12 md:col-span-6" *ngIf="request.category">
                            <div class="text-surface-500">Category</div>
                            <div class="font-medium">{{ request.category }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6" *ngIf="request.severity">
                            <div class="text-surface-500">Severity</div>
                            <div class="font-medium">{{ request.severity }}</div>
                        </div>
                        <div class="col-span-12" *ngIf="request.locationDetails || request.buildingId || request.residenceId">
                            <div class="text-surface-500">Location</div>
                            <div class="font-medium">
                                {{ request.residenceId || '-' }} / {{ request.buildingId || '-' }} / {{ request.locationDetails || '-' }}
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6" *ngIf="request.dueAt">
                            <div class="text-surface-500">Due At</div>
                            <div class="font-medium">{{ request.dueAt }}</div>
                        </div>
                        <div class="col-span-12 md:col-span-6" *ngIf="request.progressPercent !== undefined">
                            <div class="text-surface-500">Progress</div>
                            <div class="font-medium">{{ request.progressPercent }}%</div>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <button pButton type="button" severity="secondary" label="Close" text (click)="showDetailsDialog = false"></button>
                    <button pButton type="button" label="Edit" [outlined]="true" (click)="editFromDetails()"></button>
                    <button pButton type="button" label="Delete" severity="danger" [outlined]="true" (click)="deleteFromDetails()"></button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class MyMaintenanceComponent implements OnInit {
    private maintenanceService = inject(MaintenanceRequestService);
    private maintenanceTaskService = inject(MaintenanceTaskService);
    private auth = inject(AuthService);
    private messageService = inject(MessageService);

    showNewRequestForm = false;
    showDetailsDialog = false;
    maintenanceLoading = false;
    tasksLoading = false;
    submitting = false;
    submitAttempted = false;

    myRequests: MaintenanceRequest[] = [];
    maintenanceTasks: MaintenanceTask[] = [];
    selectedRequest: MaintenanceRequest | null = null;
    beforePhotoFile: File | null = null;
    beforePhotoPreview: string | null = null;
    priorityOptions: MaintenancePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
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
    editingRequestId: string | null = null;

    newRequest: Partial<MaintenanceRequest> = this.buildDefaultRequest();
    private firstLoadRetryDone = false;

    @ViewChild('requestForm') requestForm?: NgForm;

    ngOnInit(): void {
        this.loadMyRequests();

        // Some sessions hydrate auth/token right after first route activation.
        // Trigger one deferred retry to avoid requiring a manual second click.
        setTimeout(() => {
            if (!this.firstLoadRetryDone) {
                this.firstLoadRetryDone = true;
                this.loadMyRequests();
            }
        }, 400);
    }

    loadMyRequests() {
        this.maintenanceLoading = true;

        this.maintenanceService
            .getAll()
            .pipe(
                timeout(10000),
                catchError(() => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load your maintenance requests', life: 3000 });
                    return of([] as MaintenanceRequest[]);
                }),
                finalize(() => {
                    this.maintenanceLoading = false;
                })
            )
            .subscribe((requests) => {
                this.myRequests = requests;
                this.loadMyTasks(this.myRequests);
            });
    }

    loadMyTasks(requests: MaintenanceRequest[]) {
        this.tasksLoading = true;
        const requestIdSet = new Set(requests.map((request) => request.id).filter((id): id is string => !!id));

        this.maintenanceTaskService
            .getAll()
            .pipe(
                timeout(10000),
                catchError(() => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load your maintenance tasks', life: 3000 });
                    return of([] as MaintenanceTask[]);
                }),
                finalize(() => {
                    this.tasksLoading = false;
                })
            )
            .subscribe((tasks) => {
                if (!requestIdSet.size) {
                    this.maintenanceTasks = [];
                    return;
                }

                this.maintenanceTasks = tasks.filter((task) => requestIdSet.has(task.maintenanceRequestId));
            });
    }

    submitRequest() {
        const form = this.requestForm;
        this.submitAttempted = true;

        if (!form || !!form.invalid || !this.newRequest.title?.trim() || !this.newRequest.description?.trim() || !this.newRequest.apartmentId?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Missing data', detail: 'Please fill title, description, and apartment', life: 2500 });
            return;
        }

        if (!this.editingRequestId && !this.beforePhotoFile) {
            this.messageService.add({ severity: 'warn', summary: 'Missing photo', detail: 'Please upload a photo of the issue', life: 2500 });
            return;
        }

        const payload: MaintenanceRequest = {
            title: this.newRequest.title.trim(),
            description: this.newRequest.description.trim(),
            apartmentId: this.newRequest.apartmentId.trim(),
            priority: this.newRequest.priority ?? 'MEDIUM',
            category: this.newRequest.category ?? 'OTHER',
            severity: this.newRequest.severity ?? 'MEDIUM',
            residenceId: this.newRequest.residenceId?.trim() || undefined,
            buildingId: this.newRequest.buildingId?.trim() || undefined,
            locationDetails: this.newRequest.locationDetails?.trim() || undefined,
            dueAt: this.newRequest.dueAt || undefined,
            status: 'OPEN',
            reportedBy: this.getConnectedUserFullName(),
            organizationId: this.auth.organizationId() ?? undefined
        };

        this.submitting = true;
        const request$ = this.editingRequestId
            ? this.maintenanceService.update(this.editingRequestId, payload)
            : this.maintenanceService.create(payload, this.beforePhotoFile ?? undefined);

        request$.subscribe({
            next: () => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'success',
                    summary: this.editingRequestId ? 'Updated' : 'Created',
                    detail: this.editingRequestId ? 'Maintenance request updated' : 'Maintenance request submitted',
                    life: 2500
                });
                this.newRequest = this.buildDefaultRequest();
                this.beforePhotoFile = null;
                this.beforePhotoPreview = null;
                this.showNewRequestForm = false;
                this.submitAttempted = false;
                this.editingRequestId = null;
                this.loadMyRequests();
            },
            error: () => {
                this.submitting = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit maintenance request', life: 3000 });
            }
        });
    }

    formatPriority(priority: MaintenancePriority): string {
        switch (priority) {
            case 'LOW': return 'Low';
            case 'MEDIUM': return 'Medium';
            case 'HIGH': return 'High';
            default: return priority;
        }
    }

    formatStatus(status?: MaintenanceStatus): string {
        switch (status) {
            case 'OPEN': return 'Open';
            case 'IN_PROGRESS': return 'In Progress';
            case 'COMPLETED': return 'Completed';
            case 'CLOSED': return 'Closed';
            case 'VERIFIED': return 'Verified';
            default: return 'Open';
        }
    }

    formatTaskStatus(status: TaskStatus): string {
        switch (status) {
            case 'PENDING': return 'Pending';
            case 'IN_PROGRESS': return 'In Progress';
            case 'COMPLETED': return 'Completed';
            case 'BLOCKED': return 'Blocked';
            default: return status;
        }
    }

    getPrioritySeverity(priority: MaintenancePriority): 'success' | 'warn' | 'danger' {
        switch (priority) {
            case 'LOW': return 'success';
            case 'MEDIUM': return 'warn';
            case 'HIGH': return 'danger';
            default: return 'warn';
        }
    }

    getStatusSeverity(status?: MaintenanceStatus): 'info' | 'warn' | 'success' {
        switch (status) {
            case 'OPEN': return 'info';
            case 'IN_PROGRESS': return 'warn';
            case 'COMPLETED':
            case 'CLOSED':
            case 'VERIFIED':
                return 'success';
            default:
                return 'info';
        }
    }

    getTaskStatusSeverity(status: TaskStatus): 'info' | 'warn' | 'success' | 'danger' {
        switch (status) {
            case 'PENDING': return 'info';
            case 'IN_PROGRESS': return 'warn';
            case 'COMPLETED': return 'success';
            case 'BLOCKED': return 'danger';
            default:
                return 'info';
        }
    }

    private getConnectedUserFullName(): string {
        const signalUser = this.auth.user();
        if (signalUser?.firstName || signalUser?.lastName) {
            return `${signalUser.firstName} ${signalUser.lastName}`.trim();
        }

        const raw = localStorage.getItem('syndiqa_user');
        if (!raw) {
            return '';
        }

        try {
            const parsed = JSON.parse(raw) as { firstName?: string; lastName?: string };
            return `${parsed.firstName ?? ''} ${parsed.lastName ?? ''}`.trim();
        } catch {
            return '';
        }
    }

    toggleNewRequestForm() {
        this.showNewRequestForm = !this.showNewRequestForm;
        if (!this.showNewRequestForm) {
            this.newRequest = this.buildDefaultRequest();
            this.submitAttempted = false;
        }
    }

    openNewRequestDialog() {
        this.showNewRequestForm = true;
        this.editingRequestId = null;
        this.newRequest = this.buildDefaultRequest();
        this.submitAttempted = false;
        this.beforePhotoFile = null;
        this.beforePhotoPreview = null;
    }

    closeNewRequestDialog() {
        this.showNewRequestForm = false;
        this.newRequest = this.buildDefaultRequest();
        this.submitAttempted = false;
        this.editingRequestId = null;
        this.beforePhotoFile = null;
        this.beforePhotoPreview = null;
    }

    openDetails(request: MaintenanceRequest) {
        this.selectedRequest = { ...request };
        this.showDetailsDialog = true;
    }

    editFromDetails() {
        if (!this.selectedRequest) {
            return;
        }

        this.editingRequestId = this.selectedRequest.id ?? null;
        this.newRequest = {
            title: this.selectedRequest.title,
            description: this.selectedRequest.description,
            apartmentId: this.selectedRequest.apartmentId,
            priority: this.selectedRequest.priority,
            category: this.selectedRequest.category,
            severity: this.selectedRequest.severity,
            residenceId: this.selectedRequest.residenceId,
            buildingId: this.selectedRequest.buildingId,
            locationDetails: this.selectedRequest.locationDetails,
            dueAt: this.selectedRequest.dueAt
        };
        this.showDetailsDialog = false;
        this.showNewRequestForm = true;
        this.submitAttempted = false;
    }

    deleteFromDetails() {
        if (!this.selectedRequest?.id) {
            this.showDetailsDialog = false;
            return;
        }

        const id = this.selectedRequest.id;
        this.maintenanceService.delete(id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Maintenance request deleted', life: 2500 });
                this.showDetailsDialog = false;
                this.selectedRequest = null;
                this.loadMyRequests();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete maintenance request', life: 3000 });
            }
        });
    }

    clearForm() {
        this.requestForm?.resetForm();
        this.newRequest = this.buildDefaultRequest();
        this.submitAttempted = false;
        this.beforePhotoFile = null;
        this.beforePhotoPreview = null;
    }

    isSubmitDisabled(): boolean {
        return this.submitting || !this.requestForm || !!this.requestForm.invalid;
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

    private buildDefaultRequest(): Partial<MaintenanceRequest> {
        return {
            title: '',
            description: '',
            apartmentId: '',
            priority: 'MEDIUM',
            category: 'OTHER',
            severity: 'MEDIUM'
        };
    }
}
