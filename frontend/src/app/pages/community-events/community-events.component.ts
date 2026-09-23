import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CommunityEvent, EventFeedbackSummary } from '@/app/models/community-event.model';
import { EventCategory, EventStatus } from '@/app/models/enums.model';
import { CreateCommunityEventRequest } from '@/app/models/payloads.model';
import { CommunityEventService } from '@/app/pages/service/community-event.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { downloadHttpBlob } from '@/app/core/download/download-blob';
import { EventPosterComponent } from './event-poster.component';
import { EventFeedbackDialogComponent } from './event-feedback-dialog.component';

@Component({
    selector: 'app-community-events',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        RatingModule,
        SelectModule,
        DialogModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule,
        EventPosterComponent,
        EventFeedbackDialogComponent
    ],
    template: `
        <p-toast />
        <div class="card mb-4">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm">Community programming</div>
                    <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mt-0 mb-2">Community Events</h1>
                    <p class="text-surface-600 dark:text-surface-400 m-0 max-w-3xl">Plan resident activities, publish approved events, monitor capacity, and review satisfaction after events finish.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <p-button label="Dashboard" icon="pi pi-chart-bar" severity="secondary" routerLink="/pages/community-dashboard" />
                    <p-button label="Announcements" icon="pi pi-megaphone" severity="secondary" routerLink="/pages/announcements" />
                </div>
            </div>
            <div class="grid grid-cols-12 gap-4 mt-5">
                <div class="col-span-12 md:col-span-4">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Total events</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalEvents() }}</div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Published now</div>
                        <div class="text-2xl font-bold text-green-600">{{ publishedEvents() }}</div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Awaiting feedback</div>
                        <div class="text-2xl font-bold text-primary">{{ feedbackReadyEvents() }}</div>
                    </div>
                </div>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New Event" icon="pi pi-plus" severity="success" class="mr-2" (onClick)="openNew()" />
                <p-button label="Delete" icon="pi pi-trash" severity="secondary" outlined (onClick)="deleteSelected()" [disabled]="!selectedEvents?.length" />
            </ng-template>
            <ng-template #end>
                <p-button
                    *ngIf="canExportCsv()"
                    [label]="csvExporting ? 'Exporting...' : 'Export CSV'"
                    icon="pi pi-upload"
                    severity="secondary"
                    [loading]="csvExporting"
                    (onClick)="exportCsv()"
                />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="eventService.events()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['title', 'description', 'category', 'status', 'location']"
            [tableStyle]="{ 'min-width': '78rem' }"
            [(selection)]="selectedEvents"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} community events"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h5 class="m-0" style="font-family: 'Fira Sans'">Event pipeline</h5>
                        <small class="text-surface-500">Draft, publish, close, and learn from every resident event.</small>
                    </div>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search title, category, location..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="title" style="min-width: 18rem">Event <p-sortIcon field="title" /></th>
                    <th pSortableColumn="category" style="min-width: 10rem">Category <p-sortIcon field="category" /></th>
                    <th pSortableColumn="status" style="min-width: 10rem">Status <p-sortIcon field="status" /></th>
                    <th pSortableColumn="startDate" style="min-width: 13rem">Starts <p-sortIcon field="startDate" /></th>
                    <th pSortableColumn="location" style="min-width: 12rem">Location <p-sortIcon field="location" /></th>
                    <th pSortableColumn="maxCapacity" style="min-width: 9rem">Capacity <p-sortIcon field="maxCapacity" /></th>
                    <th pSortableColumn="averageRating" style="min-width: 12rem">Satisfaction <p-sortIcon field="averageRating" /></th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-event>
                <tr>
                    <td><p-tableCheckbox [value]="event" /></td>
                    <td>
                        <div class="flex items-start gap-3">
                            <app-event-poster [svg]="event.aiPosterSvg" [title]="event.title" [category]="event.category" size="thumb" />
                            <div>
                                <div class="font-medium flex items-center gap-2">
                                    <span>{{ event.title }}</span>
                                    <p-tag *ngIf="event.aiPosterSvg" value="AI poster" severity="info" />
                                </div>
                                <small class="text-surface-500">{{ event.description }}</small>
                                <div *ngIf="event.aiPosterGeneratedAt" class="text-xs text-surface-500 mt-1">Generated {{ event.aiPosterGeneratedAt | date: 'medium' }}</div>
                            </div>
                        </div>
                    </td>
                    <td><p-tag [value]="label(event.category)" [severity]="categorySeverity(event.category)" /></td>
                    <td><p-tag [value]="label(event.status)" [severity]="statusSeverity(event.status)" /></td>
                    <td>
                        <div>{{ event.startDate | date: 'mediumDate' }}</div>
                        <small class="text-surface-500">{{ event.startDate | date: 'shortTime' }} - {{ event.endDate | date: 'shortTime' }}</small>
                    </td>
                    <td>{{ event.location }}</td>
                    <td>{{ capacityLabel(event) }}</td>
                    <td>
                        <div *ngIf="(event.feedbackCount ?? 0) > 0; else noEventFeedback" class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                                <p-rating [ngModel]="event.averageRating ?? 0" [readonly]="true" />
                                <span class="font-semibold">{{ event.averageRating | number:'1.1-1' }}</span>
                            </div>
                            <small class="text-surface-500">{{ event.feedbackCount }} reviews</small>
                        </div>
                        <ng-template #noEventFeedback>
                            <span class="text-surface-500">No feedback yet</span>
                        </ng-template>
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="edit(event)" />
                        <p-button
                            *ngIf="isFinished(event)"
                            icon="pi pi-comments"
                            class="mr-2"
                            severity="help"
                            [rounded]="true"
                            [outlined]="true"
                            (click)="feedbackDialog.open(event)"
                        />
                        <p-button
                            *ngIf="event.status === EventStatus.DRAFT"
                            icon="pi pi-send"
                            class="mr-2"
                            severity="success"
                            [rounded]="true"
                            [outlined]="true"
                            [loading]="isBusy(event)"
                            (click)="publish(event)"
                        />
                        <p-button
                            *ngIf="event.status === EventStatus.PUBLISHED"
                            icon="pi pi-check-circle"
                            class="mr-2"
                            severity="info"
                            [rounded]="true"
                            [outlined]="true"
                            [loading]="isBusy(event)"
                            (click)="complete(event)"
                        />
                        <p-button
                            *ngIf="event.status === EventStatus.PUBLISHED || event.status === EventStatus.DRAFT"
                            icon="pi pi-ban"
                            class="mr-2"
                            severity="warn"
                            [rounded]="true"
                            [outlined]="true"
                            [loading]="isBusy(event)"
                            (click)="cancel(event)"
                        />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="delete(event)" />
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="9" class="text-center py-6">
                        <div class="flex flex-col items-center gap-3 text-surface-500">
                            <i class="pi pi-calendar-plus text-3xl"></i>
                            <div class="font-medium text-surface-700 dark:text-surface-200">No community events yet</div>
                            <div>Create the first event to start building the resident calendar.</div>
                            <p-button label="New Event" icon="pi pi-plus" severity="success" (onClick)="openNew()" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="eventDialog" [style]="{ width: '560px' }" header="Community Event" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div>
                        <label for="title" class="block font-bold mb-3">Title</label>
                        <input id="title" type="text" pInputText [(ngModel)]="event.title" required autofocus fluid />
                        <small class="text-surface-500">Use a short, resident-facing name.</small>
                        <small class="text-red-500" *ngIf="submitted && !event.title">Title is required.</small>
                    </div>
                    <div>
                        <label for="description" class="block font-bold mb-3">Description</label>
                        <textarea id="description" class="w-full p-inputtext p-component" rows="3" [(ngModel)]="event.description" required></textarea>
                        <small class="text-surface-500">Include the purpose, audience, and anything residents should bring.</small>
                        <small class="text-red-500" *ngIf="submitted && !event.description">Description is required.</small>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label class="block font-bold mb-3">Category</label>
                            <p-select [(ngModel)]="event.category" [options]="categoryOptions" optionLabel="label" optionValue="value" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Start Date & Time</label>
                            <input type="datetime-local" pInputText [(ngModel)]="event.startDate" required fluid />
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">End Date & Time</label>
                            <input type="datetime-local" pInputText [(ngModel)]="event.endDate" required fluid />
                        </div>
                        <div class="col-span-12">
                            <small class="text-red-500" *ngIf="submitted && !endDateAfterStart()">End date must be after the start date.</small>
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-8">
                            <label class="block font-bold mb-3">Location</label>
                            <input type="text" pInputText [(ngModel)]="event.location" required fluid />
                        </div>
                        <div class="col-span-4">
                            <label class="block font-bold mb-3">Capacity</label>
                            <p-inputnumber [(ngModel)]="event.maxCapacity" [min]="1" [showButtons]="true" fluid />
                        </div>
                    </div>
                    <div *ngIf="event.id" class="flex flex-col gap-2">
                        <label class="block font-bold mb-1">Event Poster</label>
                        <app-event-poster [svg]="event.aiPosterSvg" [title]="event.title || 'Community event'" [category]="event.category" size="large" />
                        <small class="text-surface-500" *ngIf="event.aiPosterGeneratedAt">Poster generated {{ event.aiPosterGeneratedAt | date: 'medium' }}</small>
                        <small class="text-surface-500" *ngIf="!event.aiPosterSvg">No AI poster is available for this event.</small>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button [label]="saveLabel()" icon="pi pi-check" (click)="save()" [loading]="loading" />
            </ng-template>
        </p-dialog>
        <p-confirmdialog [style]="{ width: '450px' }" />
        <app-event-feedback-dialog #feedbackDialog (summaryChange)="onFeedbackSummary($event)" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class CommunityEventsComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    eventService = inject(CommunityEventService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);

    eventDialog = false;
    loading = false;
    submitted = false;
    event: Partial<CommunityEvent> = {};
    selectedEvents: CommunityEvent[] | null = null;
    busyEventIds = new Set<string>();
    csvExporting = false;
    readonly EventStatus = EventStatus;

    categoryOptions = [
        { label: 'Meeting', value: EventCategory.MEETING },
        { label: 'Social', value: EventCategory.SOCIAL },
        { label: 'Sports', value: EventCategory.SPORTS },
        { label: 'Maintenance', value: EventCategory.MAINTENANCE },
        { label: 'Emergency', value: EventCategory.EMERGENCY },
        { label: 'Other', value: EventCategory.OTHER }
    ];

    ngOnInit() {
        this.eventService.getAll().subscribe();
    }

    totalEvents(): number {
        return this.eventService.events().length;
    }

    publishedEvents(): number {
        return this.eventService.events().filter((event) => event.status === EventStatus.PUBLISHED).length;
    }

    feedbackReadyEvents(): number {
        return this.eventService.events().filter((event) => this.isFinished(event)).length;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.event = { category: EventCategory.MEETING, maxCapacity: 50 };
        this.submitted = false;
        this.eventDialog = true;
    }

    edit(event: CommunityEvent) {
        this.event = { ...event, startDate: this.toInputDate(event.startDate), endDate: this.toInputDate(event.endDate) };
        this.eventDialog = true;
    }

    delete(event: CommunityEvent) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${event.title}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => event.id && this.eventService.delete(event.id).subscribe({
                next: () => this.toast('Community Event Deleted'),
                error: (error) => this.fail(this.errorMessage(error))
            })
        });
    }

    deleteSelected() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected community events?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.selectedEvents?.forEach((event) => event.id && this.eventService.delete(event.id).subscribe({ error: (error) => this.fail(this.errorMessage(error)) }));
                this.selectedEvents = null;
                this.toast('Community Events Deleted');
            }
        });
    }

    hideDialog() {
        this.eventDialog = false;
        this.submitted = false;
    }

    save() {
        this.submitted = true;
        if (!this.isValid()) return;

        this.loading = true;
        const payload = this.payload();
        const request = this.event.id ? this.eventService.update(this.event.id, payload) : this.eventService.create(payload);
        request.subscribe({
            next: (savedEvent) => {
                if (!this.event.id) {
                    this.toast('Event created.');
                    if (!savedEvent.aiPosterSvg) {
                        this.messageService.add({ severity: 'info', summary: 'Poster', detail: 'Poster could not be generated, using default event visual.', life: 4000 });
                    }
                } else {
                    this.toast('Community Event Updated');
                }
                this.eventDialog = false;
                this.loading = false;
                this.event = {};
            },
            error: (error) => {
                this.loading = false;
                this.fail(this.errorMessage(error));
            }
        });
    }

    publish(event: CommunityEvent) {
        this.changeStatus(event, 'publish');
    }

    cancel(event: CommunityEvent) {
        this.changeStatus(event, 'cancel');
    }

    complete(event: CommunityEvent) {
        this.changeStatus(event, 'complete');
    }

    isBusy(event: CommunityEvent): boolean {
        return !!event.id && this.busyEventIds.has(event.id);
    }

    isFinished(event: CommunityEvent): boolean {
        const endDate = new Date(event.endDate).getTime();
        return event.feedbackOpen || (!Number.isNaN(endDate) && endDate < Date.now());
    }

    onFeedbackSummary(summary: EventFeedbackSummary) {
        this.eventService.updateFeedbackSummary(summary.eventId, summary);
    }

    canExportCsv(): boolean {
        return this.authService.isSyndicAdmin() || this.authService.isPlatformAdmin();
    }

    exportCsv() {
        if (!this.canExportCsv() || this.csvExporting) return;

        this.csvExporting = true;
        this.eventService.exportCsv().subscribe({
            next: (response) => {
                downloadHttpBlob(response, 'community-events.csv');
                this.toast('CSV downloaded.');
            },
            error: (error) => {
                this.csvExporting = false;
                this.fail(this.exportErrorMessage(error));
            },
            complete: () => (this.csvExporting = false)
        });
    }

    label(value?: string) {
        return value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : '';
    }

    categorySeverity(category: EventCategory): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
        return category === EventCategory.EMERGENCY ? 'danger' : category === EventCategory.MAINTENANCE ? 'warn' : category === EventCategory.SOCIAL ? 'success' : 'info';
    }

    statusSeverity(status: EventStatus): 'info' | 'success' | 'warn' | 'danger' {
        return status === EventStatus.PUBLISHED ? 'success' : status === EventStatus.CANCELLED ? 'danger' : status === EventStatus.COMPLETED ? 'info' : 'warn';
    }

    capacityLabel(event: CommunityEvent): string {
        if (event.maxCapacity === null || event.maxCapacity === undefined) return 'Unlimited';
        return `${event.registeredCount ?? 0}/${event.maxCapacity}`;
    }

    saveLabel(): string {
        if (!this.loading) return 'Save';
        return this.event.id ? 'Saving...' : 'Creating event and generating poster...';
    }

    endDateAfterStart(): boolean {
        if (!this.event.startDate || !this.event.endDate) return true;

        const start = new Date(this.event.startDate).getTime();
        const end = new Date(this.event.endDate).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) return true;

        return end > start;
    }

    private isValid() {
        return !!(
            this.event.title?.trim() &&
            this.event.description?.trim() &&
            this.event.category &&
            this.event.startDate &&
            this.event.endDate &&
            this.endDateAfterStart() &&
            this.event.location?.trim() &&
            (!this.event.maxCapacity || this.event.maxCapacity >= 1)
        );
    }

    private payload(): CreateCommunityEventRequest {
        return {
            title: this.event.title!.trim(),
            description: this.event.description!.trim(),
            category: this.event.category!,
            startDate: this.toBackendDateTime(this.event.startDate!),
            endDate: this.toBackendDateTime(this.event.endDate!),
            location: this.event.location!.trim(),
            maxCapacity: this.event.maxCapacity ? Number(this.event.maxCapacity) : undefined,
            buildingId: this.event.buildingId ?? undefined
        };
    }

    private toInputDate(value: string) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    private toBackendDateTime(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 19);
    }

    private toast(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    }

    private changeStatus(event: CommunityEvent, action: 'publish' | 'cancel' | 'complete') {
        if (!event.id) return;

        this.busyEventIds.add(event.id);
        const request = action === 'publish' ? this.eventService.publish(event.id) : action === 'cancel' ? this.eventService.cancel(event.id) : this.eventService.complete(event.id);
        request.subscribe({
            next: () => this.toast(this.statusActionMessage(action)),
            error: (error) => this.fail(this.errorMessage(error)),
            complete: () => this.busyEventIds.delete(event.id!)
        });
    }

    private fail(detail: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
    }

    private errorMessage(error: unknown): string {
        const response = error as { error?: { message?: string } };
        const message = response.error?.message;
        if (message?.includes('Conversion =')) {
            return 'The server failed while generating the AI poster. The event was not saved because the backend returned an error.';
        }
        return message ?? 'The request could not be completed.';
    }

    private exportErrorMessage(error: unknown): string {
        const response = error as { status?: number };
        if (response.status === 401) return 'Your session expired. Please sign in again.';
        if (response.status === 403) return 'You do not have permission to export this data.';
        return 'Could not export CSV. Please try again.';
    }

    private statusActionMessage(action: 'publish' | 'cancel' | 'complete'): string {
        if (action === 'publish') return 'Community Event Published';
        if (action === 'cancel') return 'Community Event Cancelled';
        return 'Community Event Completed';
    }
}
