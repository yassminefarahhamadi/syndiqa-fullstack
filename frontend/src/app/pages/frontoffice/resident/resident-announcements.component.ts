import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Announcement } from '@/app/models/announcement.model';
import { AnnouncementTargetScope, Priority } from '@/app/models/enums.model';
import { AnnouncementService } from '@/app/pages/service/announcement.service';
import { BuildingService } from '@/app/pages/service/building.service';

@Component({
    selector: 'app-resident-announcements',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, ButtonModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0 flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                        <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> COMMUNITY
                        </div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-1 mt-0">Announcements</h1>
                        <p class="text-surface-600 dark:text-surface-400 m-0">Read important updates from your syndicate.</p>
                    </div>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-6" *ngFor="let announcement of announcementService.announcements()">
                <div
                    class="card h-full overflow-hidden p-0"
                    [ngClass]="announcement.pinActive ? 'border-2 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-500/10' : ''"
                >
                    <div *ngIf="announcement.pinActive" class="bg-yellow-500 text-yellow-950 px-5 py-2 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 font-bold uppercase tracking-wide text-sm">
                            <i class="pi pi-bell"></i>
                            <span>Pinned Announcement</span>
                        </div>
                        <p-tag value="READ FIRST" severity="contrast" icon="pi pi-thumbtack" [rounded]="true" />
                    </div>

                    <div
                        class="p-5"
                        [ngClass]="announcement.pinActive ? 'bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-300 dark:border-yellow-700' : 'bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700'"
                    >
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-center gap-4 min-w-0">
                                <div
                                    class="flex items-center justify-center rounded-border shrink-0"
                                    [ngClass]="announcement.pinActive ? 'bg-yellow-500 text-yellow-950 shadow-md' : 'bg-primary-100 dark:bg-primary-900/40 text-primary'"
                                    [style.width]="announcement.pinActive ? '4rem' : '3.25rem'"
                                    [style.height]="announcement.pinActive ? '4rem' : '3.25rem'"
                                >
                                    <i [class]="announcementIcon(announcement)" [ngClass]="announcement.pinActive ? 'text-4xl' : 'text-2xl'"></i>
                                </div>
                                <div class="min-w-0">
                                    <div class="font-medium mb-1" [ngClass]="announcement.pinActive ? 'text-yellow-700 dark:text-yellow-200' : 'text-surface-500'">
                                        {{ announcement.createdAt ? (announcement.createdAt | date: 'medium') : 'Recently published' }}
                                    </div>
                                    <h2 class="text-surface-900 dark:text-surface-0 font-bold m-0 break-words" [ngClass]="announcement.pinActive ? 'text-2xl' : 'text-xl'">{{ announcement.title }}</h2>
                                </div>
                            </div>
                            <div class="flex flex-wrap justify-end gap-2">
                                <p-tag [value]="label(announcement.priority)" [severity]="prioritySeverity(announcement.priority)" [rounded]="true" />
                            </div>
                        </div>
                    </div>

                    <div class="p-5 flex flex-col gap-4">
                        

                        <p class="text-surface-700 dark:text-surface-300 line-height-3 m-0" [ngClass]="announcement.pinActive ? 'font-medium text-lg' : ''">{{ announcement.content }}</p>

                        <div class="flex flex-wrap gap-2">
                            <p-tag [value]="label(announcement.type)" icon="pi pi-info-circle" severity="info" />
                            <p-tag [value]="audienceLabel(announcement)" icon="pi pi-building" severity="secondary" />
                            <p-tag *ngIf="announcement.pinActive && announcement.pinnedUntil" [value]="'Pinned until ' + (announcement.pinnedUntil | date: 'medium')" icon="pi pi-clock" severity="warn" />
                        </div>

                        <div *ngIf="announcement.requiresAcknowledgement" class="border-t border-surface-200 dark:border-surface-700 pt-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center rounded-border bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300" style="width: 2.5rem; height: 2.5rem">
                                    <i class="pi pi-verified text-xl"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-surface-900 dark:text-surface-0">{{ announcement.acknowledged ? 'Acknowledged' : 'Acknowledgement required' }}</div>
                                    <div class="text-surface-500 text-sm">
                                        {{ announcement.acknowledgedAt ? (announcement.acknowledgedAt | date: 'medium') : 'Please confirm that you have read this announcement.' }}
                                    </div>
                                </div>
                            </div>
                            <p-button
                                *ngIf="!announcement.acknowledged"
                                label="Acknowledge"
                                icon="pi pi-check"
                                severity="success"
                                [loading]="isBusy(announcement)"
                                [disabled]="!announcement.id"
                                (onClick)="acknowledge(announcement)"
                            />
                            <p-tag *ngIf="announcement.acknowledged" value="Acknowledged" icon="pi pi-check" severity="success" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12" *ngIf="!loading && announcementService.announcements().length === 0">
                <div class="card text-center py-8">
                    <i class="pi pi-megaphone text-4xl text-surface-400 mb-3"></i>
                    <div class="text-xl font-semibold mb-2">No announcements yet</div>
                    <p class="text-surface-500 m-0">Syndicate updates will appear here when they are published.</p>
                </div>
            </div>
        </div>
    `
})
export class ResidentAnnouncementsComponent implements OnInit {
    announcementService = inject(AnnouncementService);
    buildingService = inject(BuildingService);
    messageService = inject(MessageService);
    loading = false;
    busyAnnouncementIds = new Set<string>();

    ngOnInit() {
        this.loading = true;
        this.announcementService.getAll().subscribe({ complete: () => (this.loading = false), error: () => (this.loading = false) });
        this.buildingService.getAll().subscribe();
    }

    label(value?: string) {
        return value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : '';
    }

    prioritySeverity(priority: Priority): 'success' | 'info' | 'warn' | 'danger' {
        return priority === Priority.URGENT ? 'danger' : priority === Priority.HIGH ? 'warn' : priority === Priority.LOW ? 'success' : 'info';
    }

    announcementIcon(announcement: Announcement): string {
        if (announcement.pinActive) return 'pi pi-megaphone';
        if (announcement.priority === Priority.URGENT) return 'pi pi-exclamation-triangle';
        return 'pi pi-megaphone';
    }

    audienceLabel(announcement: Announcement): string {
        if (announcement.targetScope === AnnouncementTargetScope.BUILDING) {
            return `Building: ${this.buildingLabel(announcement.buildingId)}`;
        }

        return 'Entire organization';
    }

    isBusy(announcement: Announcement): boolean {
        return !!announcement.id && this.busyAnnouncementIds.has(announcement.id);
    }

    acknowledge(announcement: Announcement) {
        if (!announcement.id || announcement.acknowledged || !announcement.requiresAcknowledgement) return;

        this.busyAnnouncementIds.add(announcement.id);
        this.announcementService.acknowledge(announcement.id).pipe(finalize(() => this.busyAnnouncementIds.delete(announcement.id!))).subscribe({
            next: () => this.toast('Announcement acknowledged.'),
            error: (error) => this.handleAcknowledgeError(announcement, error)
        });
    }

    private buildingLabel(buildingId?: string | null): string {
        if (!buildingId) return 'Unknown building';

        const building = this.buildingService.buildings().find((item) => item.id === buildingId);
        return building?.name || buildingId;
    }

    private handleAcknowledgeError(announcement: Announcement, error: unknown) {
        const response = error as { status?: number; error?: { message?: string } };
        const message = response.error?.message ?? '';

        if (response.status === 403) {
            this.fail('You cannot acknowledge this announcement.');
            return;
        }

        if (response.status === 404) {
            this.fail('Announcement no longer available.');
            return;
        }

        if (message.toLowerCase().includes('does not require')) {
            announcement.requiresAcknowledgement = false;
            this.fail('This announcement does not require acknowledgement.');
            return;
        }

        this.fail(message || 'The acknowledgement could not be completed.');
    }

    private toast(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    }

    private fail(detail: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
    }
}
