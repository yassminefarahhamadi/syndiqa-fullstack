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
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Announcement, AnnouncementAcknowledgement, AnnouncementAiDraftResponse } from '@/app/models/announcement.model';
import { AnnouncementTargetScope, AnnouncementType, Priority } from '@/app/models/enums.model';
import { CreateAnnouncementRequest } from '@/app/models/payloads.model';
import { AnnouncementService } from '@/app/pages/service/announcement.service';
import { BuildingService } from '@/app/pages/service/building.service';
import { ChargeService } from '@/app/pages/service/charge.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { downloadHttpBlob } from '@/app/core/download/download-blob';

@Component({
    selector: 'app-announcements',
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
        SelectModule,
        DialogModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        ConfirmDialogModule
    ],
    template: `
        <p-toast />
        <div class="card mb-4">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm">Resident communications</div>
                    <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mt-0 mb-2">Announcements</h1>
                    <p class="text-surface-600 dark:text-surface-400 m-0 max-w-3xl">Publish clear updates, pin critical notices, target the right audience, and track who has acknowledged important messages.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <p-button label="Dashboard" icon="pi pi-chart-bar" severity="secondary" routerLink="/pages/community-dashboard" />
                    <p-button label="Events" icon="pi pi-calendar" severity="secondary" routerLink="/pages/community-events" />
                </div>
            </div>
            <div class="grid grid-cols-12 gap-4 mt-5">
                <div class="col-span-12 md:col-span-3">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Total announcements</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalAnnouncements() }}</div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Urgent</div>
                        <div class="text-2xl font-bold text-red-600">{{ urgentAnnouncements() }}</div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Pinned now</div>
                        <div class="text-2xl font-bold text-yellow-600">{{ pinnedAnnouncements() }}</div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                        <div class="text-surface-500 text-sm mb-2">Need acknowledgement</div>
                        <div class="text-2xl font-bold text-primary">{{ acknowledgementRequiredAnnouncements() }}</div>
                    </div>
                </div>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="New Announcement" icon="pi pi-plus" severity="success" class="mr-2" (onClick)="openNew()" />
                <p-button label="Delete" icon="pi pi-trash" severity="secondary" outlined (onClick)="deleteSelected()" [disabled]="!selectedAnnouncements?.length" />
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
            [value]="announcementService.announcements()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['title', 'content', 'type', 'priority', 'targetScope', 'buildingId']"
            [tableStyle]="{ 'min-width': '88rem' }"
            [(selection)]="selectedAnnouncements"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} announcements"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h5 class="m-0" style="font-family: 'Fira Sans'">Communication queue</h5>
                        <small class="text-surface-500">Review priorities, audience, pins, and acknowledgement progress.</small>
                    </div>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Search title, content, priority..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="title" style="min-width: 20rem">Announcement <p-sortIcon field="title" /></th>
                    <th pSortableColumn="type" style="min-width: 12rem">Type <p-sortIcon field="type" /></th>
                    <th pSortableColumn="priority" style="min-width: 10rem">Priority <p-sortIcon field="priority" /></th>
                    <th pSortableColumn="targetScope" style="min-width: 14rem">Audience <p-sortIcon field="targetScope" /></th>
                    <th style="min-width: 12rem">Acknowledgement</th>
                    <th pSortableColumn="createdAt" style="min-width: 12rem">Published <p-sortIcon field="createdAt" /></th>
                    <th style="min-width: 15rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-announcement>
                <tr [ngClass]="{ 'bg-yellow-50 dark:bg-yellow-900/10': announcement.pinActive }">
                    <td><p-tableCheckbox [value]="announcement" /></td>
                    <td>
                        <div class="flex items-start gap-3">
                            <div
                                *ngIf="announcement.pinActive"
                                class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-800/50 text-yellow-700 dark:text-yellow-200 rounded-border mt-1"
                                style="width: 2.5rem; height: 2.5rem"
                            >
                                <i class="pi pi-megaphone text-xl"></i>
                            </div>
                            <div>
                                <div class="font-medium flex items-center gap-2">
                                    <p-tag *ngIf="announcement.pinActive" value="PINNED" severity="warn" />
                                    <span>{{ announcement.title }}</span>
                                </div>
                                <small class="text-surface-500">{{ announcement.content }}</small>
                                <div *ngIf="announcement.pinActive && announcement.pinnedUntil" class="text-xs text-yellow-700 dark:text-yellow-200 font-medium mt-1">
                                    Pinned until {{ announcement.pinnedUntil | date: 'medium' }}
                                </div>
                                <div *ngIf="announcement.pinned && !announcement.pinActive" class="text-xs text-surface-500 mt-1">Pin expired</div>
                            </div>
                        </div>
                    </td>
                    <td><p-tag [value]="label(announcement.type)" severity="info" /></td>
                    <td><p-tag [value]="label(announcement.priority)" [severity]="prioritySeverity(announcement.priority)" /></td>
                    <td>{{ audienceLabel(announcement) }}</td>
                    <td>
                        <span *ngIf="announcement.requiresAcknowledgement">{{ announcement.acknowledgementCount ?? 0 }} acknowledged</span>
                        <span *ngIf="!announcement.requiresAcknowledgement" class="text-surface-500">Not required</span>
                    </td>
                    <td>{{ announcement.createdAt ? (announcement.createdAt | date: 'medium') : 'Not published yet' }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="edit(announcement)" />
                        <p-button
                            *ngIf="announcement.requiresAcknowledgement"
                            icon="pi pi-users"
                            class="mr-2"
                            severity="info"
                            [rounded]="true"
                            [outlined]="true"
                            (click)="viewAcknowledgements(announcement)"
                        />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="delete(announcement)" />
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="8" class="text-center py-6">
                        <div class="flex flex-col items-center gap-3 text-surface-500">
                            <i class="pi pi-megaphone text-3xl"></i>
                            <div class="font-medium text-surface-700 dark:text-surface-200">No announcements yet</div>
                            <div>Create the first announcement to keep residents informed.</div>
                            <p-button label="New Announcement" icon="pi pi-plus" severity="success" (onClick)="openNew()" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="announcementDialog" [style]="{ width: '520px' }" header="Announcement" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5">
                    <div *ngIf="canUseAiAssistant()" class="border border-surface-200 dark:border-surface-700 rounded-border overflow-hidden">
                        <div class="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 p-4 flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 text-primary rounded-border" style="width: 2.75rem; height: 2.75rem">
                                    <i class="pi pi-sparkles text-xl"></i>
                                </div>
                                <div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">Smart AI Announcement Assistant</div>
                                    <div class="text-surface-500 text-sm">Turn rough notes into a draft you can review and edit.</div>
                                </div>
                            </div>
                            <p-tag value="Draft only" icon="pi pi-pencil" severity="info" />
                        </div>

                        <div class="p-4 flex flex-col gap-4">
                            <div>
                                <label class="block font-bold mb-3">Rough notes</label>
                                <textarea
                                    class="w-full p-inputtext p-component"
                                    rows="3"
                                    [(ngModel)]="aiPrompt"
                                    placeholder="Example: water off building b monday 9 to 12"
                                ></textarea>
                                <small class="text-red-500" *ngIf="aiSubmitted && !aiPrompt.trim()">Enter a short note first.</small>
                            </div>

                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-bold mb-3">Language</label>
                                    <p-select [(ngModel)]="aiLanguage" [options]="aiLanguageOptions" optionLabel="label" optionValue="value" fluid />
                                </div>
                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-bold mb-3">Tone</label>
                                    <p-select [(ngModel)]="aiTone" [options]="aiToneOptions" optionLabel="label" optionValue="value" fluid />
                                </div>
                                <div class="col-span-12 md:col-span-4">
                                    <label class="block font-bold mb-3">Audience context</label>
                                    <p-select [(ngModel)]="aiTargetScope" [options]="audienceOptions" optionLabel="label" optionValue="value" fluid />
                                </div>
                            </div>

                            <div *ngIf="aiTargetScope === AnnouncementTargetScope.BUILDING">
                                <label class="block font-bold mb-3">Building context</label>
                                <p-select [(ngModel)]="aiBuildingId" [options]="buildingOptions()" optionLabel="label" optionValue="id" placeholder="Select a building" fluid />
                            </div>

                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <small class="text-surface-500">The draft will fill the form below. It will not be saved until you click Save.</small>
                                <p-button [label]="aiLoading ? 'Generating announcement draft...' : 'Generate draft'" icon="pi pi-sparkles" [loading]="aiLoading" (onClick)="generateAiDraft()" />
                            </div>

                            <div *ngIf="aiSuggestedBuildingName" class="text-surface-500 text-sm">
                                AI suggested: {{ aiSuggestedBuildingName }}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="title" class="block font-bold mb-3">Title</label>
                        <input id="title" type="text" pInputText [(ngModel)]="announcement.title" required autofocus fluid />
                        <small class="text-surface-500">Keep it specific so residents understand the update at a glance.</small>
                        <small class="text-red-500" *ngIf="submitted && !announcement.title">Title is required.</small>
                    </div>
                    <div>
                        <label for="content" class="block font-bold mb-3">Content</label>
                        <textarea id="content" class="w-full p-inputtext p-component" rows="4" [(ngModel)]="announcement.content" required></textarea>
                        <small class="text-surface-500">Lead with the action or impact, then add timing and contact details.</small>
                        <small class="text-red-500" *ngIf="submitted && !announcement.content">Content is required.</small>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Type</label>
                            <p-select [(ngModel)]="announcement.type" [options]="typeOptions" optionLabel="label" optionValue="value" fluid />
                        </div>
                        <div class="col-span-6">
                            <label class="block font-bold mb-3">Priority</label>
                            <p-select [(ngModel)]="announcement.priority" [options]="priorityOptions" optionLabel="label" optionValue="value" fluid />
                        </div>
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label class="block font-bold mb-3">Audience</label>
                            <p-select [(ngModel)]="announcement.targetScope" [options]="audienceOptions" optionLabel="label" optionValue="value" (onChange)="syncAudience()" fluid />
                        </div>
                        <div class="col-span-12" *ngIf="announcement.targetScope === AnnouncementTargetScope.BUILDING">
                            <label class="block font-bold mb-3">Building</label>
                            <p-select
                                [(ngModel)]="announcement.buildingId"
                                [options]="buildingOptions()"
                                optionLabel="label"
                                optionValue="id"
                                placeholder="Select a building"
                                fluid
                            />
                            <small class="text-red-500" *ngIf="submitted && !announcement.buildingId">Building is required.</small>
                        </div>
                    </div>
                    <label class="flex items-center gap-3 font-medium">
                        <input type="checkbox" [(ngModel)]="announcement.requiresAcknowledgement" />
                        <span>Require acknowledgement for important updates</span>
                    </label>
                    <label class="flex items-center gap-3 font-medium">
                        <input type="checkbox" [(ngModel)]="announcement.pinned" (ngModelChange)="syncPinned()" />
                        <span>Pin announcement at the top of resident feeds</span>
                    </label>
                    <div *ngIf="announcement.pinned">
                        <label class="block font-bold mb-3">Pinned until</label>
                        <input type="datetime-local" pInputText [(ngModel)]="announcement.pinnedUntil" fluid />
                        <small class="text-surface-500 block mt-2">Leave empty to keep it pinned indefinitely.</small>
                        <small class="text-red-500" *ngIf="submitted && pinnedUntilInvalid()">Pinned until must be in the future.</small>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Save" icon="pi pi-check" (click)="save()" [loading]="loading" />
            </ng-template>
        </p-dialog>
        <p-dialog [(visible)]="acknowledgementsDialog" [style]="{ width: '620px' }" header="Acknowledgements" [modal]="true">
            <p-table [value]="acknowledgements" [rows]="8" [paginator]="acknowledgements.length > 8" [tableStyle]="{ 'min-width': '34rem' }">
                <ng-template #header>
                    <tr>
                        <th>Resident</th>
                        <th>Acknowledged At</th>
                    </tr>
                </ng-template>
                <ng-template #body let-acknowledgement>
                    <tr>
                        <td>{{ residentName(acknowledgement.accountId) }}</td>
                        <td>{{ acknowledgement.acknowledgedAt | date: 'medium' }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="2" class="text-center text-surface-500 py-4">No acknowledgements yet.</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-dialog>
        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class AnnouncementsComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    announcementService = inject(AnnouncementService);
    buildingService = inject(BuildingService);
    chargeService = inject(ChargeService);
    authService = inject(AuthService);
    messageService = inject(MessageService);
    confirmationService = inject(ConfirmationService);

    announcementDialog = false;
    loading = false;
    submitted = false;
    announcement: Partial<Announcement> = {};
    selectedAnnouncements: Announcement[] | null = null;
    acknowledgementsDialog = false;
    acknowledgements: AnnouncementAcknowledgement[] = [];
    residentNames = new Map<string, string>();
    csvExporting = false;
    aiPrompt = '';
    aiLanguage: 'EN' | 'FR' | 'AR' = 'EN';
    aiTone: 'PROFESSIONAL' | 'FRIENDLY' | 'URGENT' | 'FORMAL' = 'PROFESSIONAL';
    aiTargetScope: AnnouncementTargetScope = AnnouncementTargetScope.ORGANIZATION;
    aiBuildingId: string | null = null;
    aiLoading = false;
    aiSubmitted = false;
    aiSuggestedBuildingName = '';
    readonly AnnouncementTargetScope = AnnouncementTargetScope;

    typeOptions = [
        { label: 'General', value: AnnouncementType.GENERAL },
        { label: 'Event Related', value: AnnouncementType.EVENT_RELATED },
        { label: 'Maintenance', value: AnnouncementType.MAINTENANCE },
        { label: 'Emergency', value: AnnouncementType.EMERGENCY },
        { label: 'Notice', value: AnnouncementType.NOTICE }
    ];

    priorityOptions = [
        { label: 'Low', value: Priority.LOW },
        { label: 'Medium', value: Priority.MEDIUM },
        { label: 'High', value: Priority.HIGH },
        { label: 'Urgent', value: Priority.URGENT }
    ];

    audienceOptions = [
        { label: 'Entire organization', value: AnnouncementTargetScope.ORGANIZATION },
        { label: 'Specific building', value: AnnouncementTargetScope.BUILDING }
    ];

    aiLanguageOptions = [
        { label: 'English', value: 'EN' },
        { label: 'French', value: 'FR' },
        { label: 'Arabic', value: 'AR' }
    ];

    aiToneOptions = [
        { label: 'Professional', value: 'PROFESSIONAL' },
        { label: 'Friendly', value: 'FRIENDLY' },
        { label: 'Urgent', value: 'URGENT' },
        { label: 'Formal', value: 'FORMAL' }
    ];

    ngOnInit() {
        this.announcementService.getAll().subscribe();
        this.buildingService.getAll().subscribe({ error: () => this.fail('Buildings could not be loaded.') });
        this.chargeService.getSyndicResidents().subscribe({
            next: (residents) => {
                this.residentNames = new Map(residents.map((resident) => [resident.id, `${resident.firstName} ${resident.lastName}`.trim() || resident.email || resident.id]));
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    totalAnnouncements(): number {
        return this.announcementService.announcements().length;
    }

    urgentAnnouncements(): number {
        return this.announcementService.announcements().filter((announcement) => announcement.priority === Priority.URGENT).length;
    }

    pinnedAnnouncements(): number {
        return this.announcementService.announcements().filter((announcement) => announcement.pinActive).length;
    }

    acknowledgementRequiredAnnouncements(): number {
        return this.announcementService.announcements().filter((announcement) => announcement.requiresAcknowledgement).length;
    }

    openNew() {
        this.announcement = {
            type: AnnouncementType.GENERAL,
            priority: Priority.MEDIUM,
            targetScope: AnnouncementTargetScope.ORGANIZATION,
            buildingId: null,
            requiresAcknowledgement: false,
            pinned: false,
            pinnedUntil: null
        };
        this.resetAiAssistant();
        this.submitted = false;
        this.announcementDialog = true;
    }

    edit(announcement: Announcement) {
        this.announcement = {
            ...announcement,
            targetScope: announcement.targetScope ?? (announcement.buildingId ? AnnouncementTargetScope.BUILDING : AnnouncementTargetScope.ORGANIZATION),
            buildingId: announcement.buildingId ?? null,
            requiresAcknowledgement: !!announcement.requiresAcknowledgement,
            pinned: !!announcement.pinned,
            pinnedUntil: announcement.pinnedUntil ? this.toInputDate(announcement.pinnedUntil) : null
        };
        this.resetAiAssistant();
        this.announcementDialog = true;
    }

    delete(announcement: Announcement) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${announcement.title}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => announcement.id && this.announcementService.delete(announcement.id).subscribe({
                next: () => this.toast('Announcement Deleted'),
                error: (error) => this.fail(this.errorMessage(error))
            })
        });
    }

    deleteSelected() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected announcements?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.selectedAnnouncements?.forEach((announcement) =>
                    announcement.id && this.announcementService.delete(announcement.id).subscribe({ error: (error) => this.fail(this.errorMessage(error)) })
                );
                this.selectedAnnouncements = null;
                this.toast('Announcements Deleted');
            }
        });
    }

    hideDialog() {
        this.announcementDialog = false;
        this.submitted = false;
    }

    save() {
        this.submitted = true;
        if (!this.isValid()) return;

        this.loading = true;
        const payload = this.payload();
        const request = this.announcement.id ? this.announcementService.update(this.announcement.id, payload) : this.announcementService.create(payload);
        request.subscribe({
            next: () => {
                this.toast(this.announcement.id ? 'Announcement Updated' : 'Announcement Created');
                this.announcementDialog = false;
                this.loading = false;
                this.announcement = {};
            },
            error: (error) => {
                this.loading = false;
                this.fail(this.errorMessage(error));
            }
        });
    }

    label(value?: string) {
        return value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : '';
    }

    prioritySeverity(priority: Priority): 'success' | 'info' | 'warn' | 'danger' {
        return priority === Priority.URGENT ? 'danger' : priority === Priority.HIGH ? 'warn' : priority === Priority.LOW ? 'success' : 'info';
    }

    audienceLabel(announcement: Announcement): string {
        if (announcement.targetScope === AnnouncementTargetScope.BUILDING) {
            return `Building: ${this.buildingLabel(announcement.buildingId)}`;
        }

        return 'Entire organization';
    }

    buildingOptions() {
        return this.buildingService.buildings().map((building) => ({
            id: building.id,
            label: building.name || building.id
        }));
    }

    canUseAiAssistant(): boolean {
        return this.authService.isSyndicAdmin() || this.authService.isPlatformAdmin();
    }

    canExportCsv(): boolean {
        return this.authService.isSyndicAdmin() || this.authService.isPlatformAdmin();
    }

    exportCsv() {
        if (!this.canExportCsv() || this.csvExporting) return;

        this.csvExporting = true;
        this.announcementService.exportCsv().subscribe({
            next: (response) => {
                downloadHttpBlob(response, 'announcements.csv');
                this.toast('CSV downloaded.');
            },
            error: (error) => {
                this.csvExporting = false;
                this.fail(this.exportErrorMessage(error));
            },
            complete: () => (this.csvExporting = false)
        });
    }

    generateAiDraft() {
        this.aiSubmitted = true;
        const prompt = this.aiPrompt.trim();
        if (prompt.length < 5) {
            this.fail('Enter a short note first.');
            return;
        }

        this.aiLoading = true;
        this.aiSuggestedBuildingName = '';
        const selectedBuilding = this.buildingService.buildings().find((building) => building.id === this.aiBuildingId);

        this.announcementService.generateDraft({
            prompt,
            language: this.aiLanguage,
            tone: this.aiTone,
            targetScope: this.aiTargetScope,
            buildingName: this.aiTargetScope === AnnouncementTargetScope.BUILDING && selectedBuilding ? this.buildingLabel(selectedBuilding.id) : undefined
        }).subscribe({
            next: (draft) => this.applyAiDraft(draft),
            error: (error) => this.fail(this.aiErrorMessage(error)),
            complete: () => (this.aiLoading = false)
        });
    }

    syncAudience() {
        if (this.announcement.targetScope === AnnouncementTargetScope.ORGANIZATION) {
            this.announcement.buildingId = null;
        }
    }

    syncPinned() {
        if (!this.announcement.pinned) {
            this.announcement.pinnedUntil = null;
        }
    }

    viewAcknowledgements(announcement: Announcement) {
        if (!announcement.id) return;

        this.announcementService.getAcknowledgements(announcement.id).subscribe({
            next: (acknowledgements) => {
                this.acknowledgements = acknowledgements;
                this.acknowledgementsDialog = true;
            },
            error: (error) => this.fail(this.errorMessage(error))
        });
    }

    residentName(accountId: string): string {
        return this.residentNames.get(accountId) ?? accountId;
    }

    private isValid() {
        return !!(
            this.announcement.title?.trim() &&
            this.announcement.content?.trim() &&
            this.announcement.type &&
            this.announcement.priority &&
            this.announcement.targetScope &&
            (this.announcement.targetScope !== AnnouncementTargetScope.BUILDING || this.announcement.buildingId) &&
            !this.pinnedUntilInvalid()
        );
    }

    private payload(): CreateAnnouncementRequest {
        const targetScope = this.announcement.targetScope ?? AnnouncementTargetScope.ORGANIZATION;
        const pinned = !!this.announcement.pinned;
        return {
            title: this.announcement.title!.trim(),
            content: this.announcement.content!.trim(),
            type: this.announcement.type!,
            priority: this.announcement.priority!,
            targetScope,
            buildingId: targetScope === AnnouncementTargetScope.BUILDING ? this.announcement.buildingId! : null,
            requiresAcknowledgement: !!this.announcement.requiresAcknowledgement,
            pinned,
            pinnedUntil: pinned && this.announcement.pinnedUntil ? this.toIso(this.announcement.pinnedUntil) : null
        };
    }

    pinnedUntilInvalid(): boolean {
        if (!this.announcement.pinned || !this.announcement.pinnedUntil) return false;
        const pinnedUntil = new Date(this.announcement.pinnedUntil);
        return Number.isNaN(pinnedUntil.getTime()) || pinnedUntil.getTime() <= Date.now();
    }

    private toInputDate(value: string) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    private toIso(value: string) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }

    private buildingLabel(buildingId?: string | null): string {
        if (!buildingId) return 'Unknown building';

        const building = this.buildingService.buildings().find((item) => item.id === buildingId);
        return building ? building.name || building.id : buildingId;
    }

    private applyAiDraft(draft: AnnouncementAiDraftResponse) {
        this.announcement = {
            ...this.announcement,
            title: draft.title,
            content: draft.content,
            type: draft.type,
            priority: draft.priority,
            targetScope: draft.suggestedTargetScope ?? this.announcement.targetScope ?? AnnouncementTargetScope.ORGANIZATION
        };

        if (draft.suggestedTargetScope === AnnouncementTargetScope.ORGANIZATION) {
            this.announcement.buildingId = null;
        }

        if (draft.suggestedTargetScope === AnnouncementTargetScope.BUILDING && draft.suggestedBuildingName) {
            const matchedBuilding = this.findBuildingByName(draft.suggestedBuildingName);
            if (matchedBuilding) {
                this.announcement.buildingId = matchedBuilding.id;
            } else {
                this.aiSuggestedBuildingName = draft.suggestedBuildingName;
            }
        }

        this.toast('Draft generated. Please review before publishing.');
    }

    private findBuildingByName(name: string) {
        const normalizedName = this.normalize(name);
        return this.buildingService.buildings().find((building) => this.normalize(building.name || building.id) === normalizedName);
    }

    private normalize(value: string): string {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    private resetAiAssistant() {
        this.aiPrompt = '';
        this.aiLanguage = 'EN';
        this.aiTone = 'PROFESSIONAL';
        this.aiTargetScope = this.announcement.targetScope ?? AnnouncementTargetScope.ORGANIZATION;
        this.aiBuildingId = this.announcement.buildingId ?? null;
        this.aiLoading = false;
        this.aiSubmitted = false;
        this.aiSuggestedBuildingName = '';
    }

    private toast(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    }

    private fail(detail: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
    }

    private errorMessage(error: unknown): string {
        const response = error as { error?: { message?: string } };
        return response.error?.message ?? 'The request could not be completed.';
    }

    private aiErrorMessage(error: unknown): string {
        const response = error as { status?: number };
        if (response.status === 403) return 'You cannot use the AI announcement assistant.';
        return 'Could not generate draft. Please try again or write the announcement manually.';
    }

    private exportErrorMessage(error: unknown): string {
        const response = error as { status?: number };
        if (response.status === 401) return 'Your session expired. Please sign in again.';
        if (response.status === 403) return 'You do not have permission to export this data.';
        return 'Could not export CSV. Please try again.';
    }
}
