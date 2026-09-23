import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import { CommunityDashboardService, CommunityDashboardStats } from '@/app/pages/service/community-dashboard.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { downloadHttpBlob } from '@/app/core/download/download-blob';

@Component({
    selector: 'app-community-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, TagModule, ButtonModule, ToastModule, RatingModule],
    template: `
        <p-toast />
        <div *ngIf="loading()" class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0">
                    <div class="flex items-center gap-4">
                        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
                        <div>
                            <div class="text-surface-500 font-medium uppercase tracking-wide text-sm">SYNCHRONIZING</div>
                            <div class="text-surface-900 dark:text-surface-0 font-bold text-xl mt-1">Loading Community Telemetry...</div>
                        </div>
                    </div>
                </div>
            </div>
            <div *ngFor="let i of [1,2,3,4]" class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 animate-pulse">
                    <div class="flex justify-between mb-4">
                        <div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-4 w-32 rounded mb-3"></div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-7 w-20 rounded"></div>
                        </div>
                        <div class="bg-surface-200 dark:bg-surface-700 rounded-border" style="width: 2.5rem; height: 2.5rem"></div>
                    </div>
                    <div class="bg-surface-200 dark:bg-surface-700 h-4 w-24 rounded"></div>
                </div>
            </div>
        </div>

        <div *ngIf="!loading() && error()" class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card border-l-4 border-red-500">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div class="text-red-500 font-semibold text-xl mb-2">{{ error() }}</div>
                            <p class="text-surface-600 dark:text-surface-400 m-0">Community statistics are protected and depend on the backend dashboard endpoint.</p>
                        </div>
                        <p-button label="Retry" icon="pi pi-refresh" severity="secondary" [loading]="loading()" (onClick)="load()" />
                    </div>
                </div>
            </div>
        </div>

        <div *ngIf="!loading() && !error()" class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> COMMUNITY COMMAND CENTER
                        </div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-1 mt-0">Community Dashboard</h1>
                        <p class="text-surface-600 dark:text-surface-400 m-0 max-w-3xl">Track the health of resident communication, spot urgent follow-ups, and jump straight into the event or announcement workflows.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                        <p-button label="Events" icon="pi pi-calendar" severity="secondary" routerLink="/pages/community-events" />
                        <p-button label="Announcements" icon="pi pi-megaphone" severity="secondary" routerLink="/pages/announcements" />
                        <p-button
                            *ngIf="canExportCsv()"
                            [label]="csvExporting() ? 'Exporting...' : 'Export CSV'"
                            icon="pi pi-upload"
                            severity="secondary"
                            [loading]="csvExporting()"
                            (onClick)="exportCsv()"
                        />
                        <p-button label="Refresh" icon="pi pi-refresh" severity="secondary" [loading]="loading()" (onClick)="load()" />
                    </div>
                </div>
            </div>

            <div class="col-span-12">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 lg:col-span-4">
                        <div class="card mb-0 h-full border-l-4 border-blue-500">
                            <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-2">Next operational focus</div>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">Fill upcoming events and monitor capacity</div>
                            <p class="text-surface-600 dark:text-surface-400 m-0">There are {{ stat('upcomingEvents') }} upcoming events, with {{ stat('fullEvents') }} already full.</p>
                        </div>
                    </div>
                    <div class="col-span-12 lg:col-span-4">
                        <div class="card mb-0 h-full border-l-4 border-orange-500">
                            <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-2">Resident follow-up</div>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">{{ stat('pendingAcknowledgements') }} pending acknowledgements</div>
                            <p class="text-surface-600 dark:text-surface-400 m-0">{{ acknowledgementRate() | number:'1.0-0' }}% of required acknowledgements have been received.</p>
                        </div>
                    </div>
                    <div class="col-span-12 lg:col-span-4">
                        <div class="card mb-0 h-full border-l-4 border-green-500">
                            <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-2">Resident sentiment</div>
                            <div class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">{{ stat('totalEventFeedback') }} event reviews</div>
                            <p class="text-surface-600 dark:text-surface-400 m-0">Average satisfaction is {{ stat('averageEventRating') | number:'1.1-1' }} when feedback is available.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-blue-50 dark:bg-blue-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-blue-500 font-medium mb-3">Total Events</span>
                            <div class="text-blue-900 dark:text-blue-100 font-medium text-2xl">{{ stat('totalEvents') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-calendar text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">{{ stat('upcomingEvents') }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> upcoming events</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-green-50 dark:bg-green-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-green-500 font-medium mb-3">Published Events</span>
                            <div class="text-green-900 dark:text-green-100 font-medium text-2xl">{{ stat('publishedEvents') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-send text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">{{ stat('fullEvents') }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> full events</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-cyan-50 dark:bg-cyan-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-cyan-500 font-medium mb-3">Announcements</span>
                            <div class="text-cyan-900 dark:text-cyan-100 font-medium text-2xl">{{ stat('totalAnnouncements') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-megaphone text-cyan-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-red-500 font-medium">{{ stat('urgentAnnouncements') }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> urgent, </span>
                    <span class="text-yellow-600 font-medium">{{ stat('pinnedAnnouncements') }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> pinned</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-orange-50 dark:bg-orange-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-orange-500 font-medium mb-3">Pending Acknowledgements</span>
                            <div class="text-orange-900 dark:text-orange-100 font-medium text-2xl">{{ stat('pendingAcknowledgements') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-hourglass text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">{{ stat('totalAcknowledgements') }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> confirmations received</span>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card h-full">
                    <div class="font-semibold text-xl mb-4">Event Operations</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Upcoming Events</span>
                                <span class="text-surface-500">{{ stat('upcomingEvents') }}</span>
                            </span>
                        </li>
                        <li class="flex items-center py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Published Events</span>
                                <span class="text-surface-500">{{ stat('publishedEvents') }}</span>
                            </span>
                        </li>
                        <li class="flex items-center py-3">
                            <div class="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Full Events</span>
                                <span class="text-surface-500">{{ stat('fullEvents') }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card h-full">
                    <div class="font-semibold text-xl mb-4">Participation Ledger</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center flex-col py-2">
                            <div class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center mb-2">
                                <span class="font-medium">Event Registrations</span>
                                <span class="text-surface-900 dark:text-surface-0 font-bold">{{ stat('totalRegistrations') }}</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-border h-2 mb-4">
                                <div class="bg-primary-500 h-full rounded-border" [style.width.%]="registrationBarWidth()"></div>
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center mb-2">
                                <span class="font-medium">Acknowledgements Received</span>
                                <span class="text-green-500 font-bold">{{ stat('totalAcknowledgements') }}</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-border h-2">
                                <div class="bg-green-500 h-full rounded-border" [style.width.%]="acknowledgementRate()"></div>
                            </div>
                            <div class="text-surface-500 dark:text-surface-400 text-sm mt-3 w-full">
                                {{ acknowledgementRate() | number:'1.0-0' }}% acknowledged where confirmations are required.
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card h-full">
                    <div class="font-semibold text-xl mb-4">Announcement Watchlist</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Urgent Announcements</span>
                            <p-tag [value]="stat('urgentAnnouncements').toString()" severity="danger"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Pinned Announcements</span>
                            <p-tag [value]="stat('pinnedAnnouncements').toString()" severity="warn"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Acknowledgement Required</span>
                            <p-tag [value]="stat('acknowledgementRequiredAnnouncements').toString()" severity="info"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3">
                            <span class="text-surface-700 dark:text-surface-300">Pending Confirmations</span>
                            <p-tag [value]="stat('pendingAcknowledgements').toString()" severity="warn"></p-tag>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-primary font-medium mb-3">Average Satisfaction</span>
                            <div *ngIf="stat('totalEventFeedback') > 0; else noSatisfaction">
                                <div class="flex items-center gap-2 mb-2">
                                    <p-rating [ngModel]="stat('averageEventRating')" [readonly]="true" />
                                    <span class="font-bold text-xl">{{ stat('averageEventRating') | number:'1.1-1' }}</span>
                                </div>
                                <span class="text-surface-500">Across completed events</span>
                            </div>
                            <ng-template #noSatisfaction>
                                <div class="text-surface-500 font-medium">No feedback yet</div>
                            </ng-template>
                        </div>
                        <div class="flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-star text-primary text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-cyan-500 font-medium mb-3">Feedback Received</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stat('totalEventFeedback') }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-comments text-cyan-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">Resident event reviews</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-green-500 font-medium mb-3">Best Rated Event</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-lg">{{ stats()?.highestRatedEventTitle || 'No feedback yet' }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-thumbs-up text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <span *ngIf="stats()?.highestRatedEventTitle" class="text-green-500 font-medium">{{ stat('highestRatedEventAverage') | number:'1.1-1' }}</span>
                    <span *ngIf="stats()?.highestRatedEventTitle" class="text-surface-500 dark:text-surface-400"> average rating</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-orange-500 font-medium mb-3">Needs Attention</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-lg">{{ stats()?.lowestRatedEventTitle || 'No feedback yet' }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-exclamation-circle text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span *ngIf="stats()?.lowestRatedEventTitle" class="text-orange-500 font-medium">{{ stat('lowestRatedEventAverage') | number:'1.1-1' }}</span>
                    <span *ngIf="stats()?.lowestRatedEventTitle" class="text-surface-500 dark:text-surface-400"> average rating</span>
                </div>
            </div>
        </div>
    `,
    providers: [MessageService]
})
export class CommunityDashboardComponent implements OnInit {
    private dashboardService = inject(CommunityDashboardService);
    private auth = inject(AuthService);
    private messageService = inject(MessageService);

    stats = signal<CommunityDashboardStats | null>(null);
    loading = signal(false);
    error = signal('');
    csvExporting = signal(false);

    ngOnInit() {
        if (!this.auth.isBackOffice()) {
            this.error.set('You cannot view this dashboard.');
            return;
        }

        this.load();
    }

    load() {
        if (!this.auth.isBackOffice()) return;

        this.loading.set(true);
        this.error.set('');
        this.dashboardService.getStats().subscribe({
            next: (stats) => this.stats.set(stats),
            error: (error) => {
                const status = (error as { status?: number }).status;
                this.error.set(status === 403 ? 'You cannot view this dashboard.' : 'Community statistics could not be loaded.');
                this.loading.set(false);
            },
            complete: () => this.loading.set(false)
        });
    }

    canExportCsv(): boolean {
        return this.auth.isSyndicAdmin() || this.auth.isPlatformAdmin();
    }

    exportCsv() {
        if (!this.canExportCsv() || this.csvExporting()) return;

        this.csvExporting.set(true);
        this.dashboardService.exportCsv().subscribe({
            next: (response) => {
                downloadHttpBlob(response, 'community-dashboard.csv');
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'CSV downloaded.', life: 3000 });
            },
            error: (error) => {
                this.csvExporting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.exportErrorMessage(error), life: 5000 });
            },
            complete: () => this.csvExporting.set(false)
        });
    }

    stat(key: keyof CommunityDashboardStats): number {
        const value = this.stats()?.[key];
        return typeof value === 'number' ? value : 0;
    }

    acknowledgementRate(): number {
        const total = this.stat('totalAcknowledgements') + this.stat('pendingAcknowledgements');
        return total === 0 ? 0 : Math.round((this.stat('totalAcknowledgements') / total) * 100);
    }

    registrationBarWidth(): number {
        const totalEvents = this.stat('totalEvents');
        if (totalEvents === 0) return 0;
        return Math.min(100, Math.round((this.stat('totalRegistrations') / totalEvents) * 10));
    }

    private emptyStats(): CommunityDashboardStats {
        return {
            totalEvents: 0,
            upcomingEvents: 0,
            publishedEvents: 0,
            fullEvents: 0,
            totalRegistrations: 0,
            totalAnnouncements: 0,
            urgentAnnouncements: 0,
            pinnedAnnouncements: 0,
            acknowledgementRequiredAnnouncements: 0,
            totalAcknowledgements: 0,
            pendingAcknowledgements: 0,
            averageEventRating: 0,
            totalEventFeedback: 0,
            highestRatedEventId: null,
            highestRatedEventTitle: null,
            highestRatedEventAverage: 0,
            lowestRatedEventId: null,
            lowestRatedEventTitle: null,
            lowestRatedEventAverage: 0
        };
    }

    private exportErrorMessage(error: unknown): string {
        const response = error as { status?: number };
        if (response.status === 401) return 'Your session expired. Please sign in again.';
        if (response.status === 403) return 'You do not have permission to export this data.';
        return 'Could not export CSV. Please try again.';
    }
}
