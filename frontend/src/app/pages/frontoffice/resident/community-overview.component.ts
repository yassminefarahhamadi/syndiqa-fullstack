import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Announcement } from '@/app/models/announcement.model';
import { CommunityEvent } from '@/app/models/community-event.model';
import { EventStatus, Priority } from '@/app/models/enums.model';
import { AnnouncementService } from '@/app/pages/service/announcement.service';
import { CommunityEventService } from '@/app/pages/service/community-event.service';

type CommunityCalendarItem = {
    type: 'event' | 'announcement';
    title: string;
    date: Date;
    severity: 'info' | 'success' | 'warn' | 'danger' | 'secondary';
};

type CommunityCalendarDay = {
    date: Date;
    inMonth: boolean;
    isToday: boolean;
    items: CommunityCalendarItem[];
};

@Component({
    selector: 'app-community-overview',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0">
                    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> COMMUNITY
                            </div>
                            <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mt-0 mb-2">Community Overview</h1>
                            <p class="text-surface-600 dark:text-surface-400 m-0 max-w-3xl">
                                One place for upcoming events, important announcements, and the community calendar.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Events" icon="pi pi-calendar" severity="secondary" routerLink="/pages/resident-events" />
                            <p-button label="Announcements" icon="pi pi-megaphone" severity="secondary" routerLink="/pages/resident-announcements" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-4">
                <div class="card mb-0 h-full border-l-4 border-green-500">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <div class="text-surface-500 text-sm mb-2">Upcoming events</div>
                            <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ upcomingEvents().length }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-900/40 text-green-600 rounded-border" style="width: 3rem; height: 3rem">
                            <i class="pi pi-calendar text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 md:col-span-4">
                <div class="card mb-0 h-full border-l-4 border-yellow-500">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <div class="text-surface-500 text-sm mb-2">Pinned updates</div>
                            <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ pinnedAnnouncements().length }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 rounded-border" style="width: 3rem; height: 3rem">
                            <i class="pi pi-thumbtack text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 md:col-span-4">
                <div class="card mb-0 h-full border-l-4 border-red-500">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <div class="text-surface-500 text-sm mb-2">Need acknowledgement</div>
                            <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">{{ pendingAcknowledgements().length }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-900/40 text-red-600 rounded-border" style="width: 3rem; height: 3rem">
                            <i class="pi pi-verified text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-8">
                <div class="card h-full">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Community Calendar</div>
                            <div class="text-surface-500 text-sm">Events and announcements in one monthly view.</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <p-button icon="pi pi-chevron-left" [rounded]="true" [outlined]="true" severity="secondary" ariaLabel="Previous month" (onClick)="previousMonth()" />
                            <div class="font-semibold min-w-40 text-center">{{ monthLabel() }}</div>
                            <p-button icon="pi pi-chevron-right" [rounded]="true" [outlined]="true" severity="secondary" ariaLabel="Next month" (onClick)="nextMonth()" />
                        </div>
                    </div>

                    <div class="grid grid-cols-7 gap-2 mb-2 text-center text-surface-500 text-sm font-medium">
                        <div *ngFor="let weekday of weekdays">{{ weekday }}</div>
                    </div>
                    <div class="grid grid-cols-7 gap-2">
                        <div
                            *ngFor="let day of calendarDays()"
                            class="border border-surface-200 dark:border-surface-700 rounded-border p-2 min-h-28 overflow-hidden"
                            [ngClass]="{
                                'bg-surface-50 dark:bg-surface-800/50': day.inMonth,
                                'opacity-50': !day.inMonth,
                                'ring-2 ring-primary': day.isToday
                            }"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ day.date | date:'d' }}</span>
                                <span *ngIf="day.items.length" class="text-xs text-surface-500">{{ day.items.length }}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <div
                                    *ngFor="let item of day.items.slice(0, 3)"
                                    class="text-xs rounded px-2 py-1 truncate"
                                    [ngClass]="calendarItemClass(item)"
                                    [title]="item.title"
                                >
                                    <i [class]="item.type === 'event' ? 'pi pi-calendar mr-1' : 'pi pi-megaphone mr-1'"></i>
                                    {{ item.title }}
                                </div>
                                <div *ngIf="day.items.length > 3" class="text-xs text-surface-500 px-2">+{{ day.items.length - 3 }} more</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card h-full">
                    <div class="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Priority Updates</div>
                            <div class="text-surface-500 text-sm">Pinned, urgent, and unread confirmations.</div>
                        </div>
                    </div>

                    <div *ngIf="priorityAnnouncements().length; else noPriorityUpdates" class="flex flex-col gap-3">
                        <div *ngFor="let announcement of priorityAnnouncements()" class="border border-surface-200 dark:border-surface-700 rounded-border p-4">
                            <div class="flex items-start justify-between gap-3 mb-2">
                                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ announcement.title }}</div>
                                <p-tag [value]="announcement.pinActive ? 'Pinned' : label(announcement.priority)" [severity]="announcementSeverity(announcement)" />
                            </div>
                            <p class="text-surface-600 dark:text-surface-400 m-0 line-height-3">{{ announcement.content }}</p>
                            <div *ngIf="announcement.requiresAcknowledgement" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                                <small class="text-surface-500">{{ announcement.acknowledged ? 'You have acknowledged this.' : 'Acknowledgement required.' }}</small>
                                <p-button
                                    *ngIf="!announcement.acknowledged"
                                    label="Acknowledge"
                                    icon="pi pi-check"
                                    size="small"
                                    severity="success"
                                    [loading]="isBusy(announcement)"
                                    (onClick)="acknowledge(announcement)"
                                />
                            </div>
                        </div>
                    </div>
                    <ng-template #noPriorityUpdates>
                        <div class="text-center text-surface-500 py-6">
                            <i class="pi pi-check-circle text-3xl mb-3"></i>
                            <div class="font-medium">Nothing urgent right now</div>
                        </div>
                    </ng-template>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Coming Up & Latest</div>
                            <div class="text-surface-500 text-sm">A single timeline for events and announcements.</div>
                        </div>
                    </div>

                    <div *ngIf="unifiedFeed().length; else emptyCommunity" class="grid grid-cols-12 gap-4">
                        <div *ngFor="let item of unifiedFeed()" class="col-span-12 md:col-span-6 xl:col-span-4">
                            <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                                <div class="flex items-start justify-between gap-3 mb-3">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="flex items-center justify-center rounded-border shrink-0" [ngClass]="item.type === 'event' ? 'bg-green-100 dark:bg-green-900/40 text-green-600' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'" style="width: 2.75rem; height: 2.75rem">
                                            <i [class]="item.type === 'event' ? 'pi pi-calendar text-xl' : 'pi pi-megaphone text-xl'"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <p-tag [value]="item.type === 'event' ? 'Event' : 'Announcement'" [severity]="item.type === 'event' ? 'success' : 'info'" styleClass="mb-2" />
                                            <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">{{ item.title }}</div>
                                        </div>
                                    </div>
                                </div>
                                <p class="text-surface-600 dark:text-surface-400 line-height-3 m-0 mb-3">{{ item.description }}</p>
                                <div class="flex items-center gap-2 text-surface-500 text-sm">
                                    <i class="pi pi-clock"></i>
                                    <span>{{ item.date | date:'medium' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ng-template #emptyCommunity>
                        <div class="text-center text-surface-500 py-8">
                            <i class="pi pi-inbox text-4xl mb-3"></i>
                            <div class="text-xl font-semibold text-surface-700 dark:text-surface-200 mb-2">No community updates yet</div>
                            <p class="m-0">Events and announcements will appear here when they are published.</p>
                        </div>
                    </ng-template>
                </div>
            </div>
        </div>
    `
})
export class CommunityOverviewComponent implements OnInit {
    eventService = inject(CommunityEventService);
    announcementService = inject(AnnouncementService);
    messageService = inject(MessageService);

    readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    loading = false;
    busyAnnouncementIds = new Set<string>();

    ngOnInit() {
        this.loading = true;
        let completed = 0;
        const finish = () => {
            completed += 1;
            this.loading = completed < 2;
        };

        this.eventService.getAll().subscribe({ complete: finish, error: finish });
        this.announcementService.getAll().subscribe({ complete: finish, error: finish });
    }

    monthLabel(): string {
        return this.currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    previousMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    }

    nextMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    }

    calendarDays(): CommunityCalendarDay[] {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(year, month, 1 - firstDay.getDay());

        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
            return {
                date,
                inMonth: date.getMonth() === month,
                isToday: this.sameDate(date, new Date()),
                items: this.itemsForDate(date)
            };
        });
    }

    upcomingEvents(): CommunityEvent[] {
        const now = Date.now();
        return this.eventService
            .events()
            .filter((event) => event.status === EventStatus.PUBLISHED && new Date(event.endDate).getTime() >= now)
            .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
    }

    pinnedAnnouncements(): Announcement[] {
        return this.announcementService.announcements().filter((announcement) => announcement.pinActive);
    }

    pendingAcknowledgements(): Announcement[] {
        return this.announcementService.announcements().filter((announcement) => announcement.requiresAcknowledgement && !announcement.acknowledged);
    }

    priorityAnnouncements(): Announcement[] {
        return this.announcementService
            .announcements()
            .filter((announcement) => announcement.pinActive || announcement.priority === Priority.URGENT || (announcement.requiresAcknowledgement && !announcement.acknowledged))
            .slice(0, 4);
    }

    unifiedFeed(): Array<{ type: 'event' | 'announcement'; title: string; description: string; date: Date }> {
        const events = this.upcomingEvents().map((event) => ({
            type: 'event' as const,
            title: event.title,
            description: event.description,
            date: new Date(event.startDate)
        }));

        const announcements = this.announcementService.announcements().slice(0, 6).map((announcement) => ({
            type: 'announcement' as const,
            title: announcement.title,
            description: announcement.content,
            date: new Date(announcement.createdAt ?? announcement.updatedAt ?? Date.now())
        }));

        return [...events, ...announcements]
            .filter((item) => !Number.isNaN(item.date.getTime()))
            .sort((left, right) => left.date.getTime() - right.date.getTime())
            .slice(0, 9);
    }

    calendarItemClass(item: CommunityCalendarItem): string {
        if (item.severity === 'danger') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200';
        if (item.severity === 'warn') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200';
        if (item.severity === 'success') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200';
    }

    announcementSeverity(announcement: Announcement): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
        if (announcement.priority === Priority.URGENT) return 'danger';
        if (announcement.priority === Priority.HIGH || announcement.pinActive) return 'warn';
        if (announcement.priority === Priority.LOW) return 'success';
        return 'info';
    }

    label(value?: string): string {
        return value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : '';
    }

    isBusy(announcement: Announcement): boolean {
        return !!announcement.id && this.busyAnnouncementIds.has(announcement.id);
    }

    acknowledge(announcement: Announcement) {
        if (!announcement.id || announcement.acknowledged || !announcement.requiresAcknowledgement) return;

        this.busyAnnouncementIds.add(announcement.id);
        this.announcementService
            .acknowledge(announcement.id)
            .pipe(finalize(() => this.busyAnnouncementIds.delete(announcement.id!)))
            .subscribe({
                next: () => this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Announcement acknowledged.', life: 3000 }),
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'The acknowledgement could not be completed.', life: 5000 })
            });
    }

    private itemsForDate(date: Date): CommunityCalendarItem[] {
        const eventItems = this.eventService
            .events()
            .filter((event) => event.status !== EventStatus.DRAFT && this.sameDate(new Date(event.startDate), date))
            .map((event) => ({
                type: 'event' as const,
                title: event.title,
                date: new Date(event.startDate),
                severity: event.status === EventStatus.CANCELLED ? 'danger' as const : 'success' as const
            }));

        const announcementItems = this.announcementService
            .announcements()
            .filter((announcement) => this.sameDate(new Date(announcement.createdAt ?? announcement.updatedAt ?? ''), date))
            .map((announcement) => ({
                type: 'announcement' as const,
                title: announcement.title,
                date: new Date(announcement.createdAt ?? announcement.updatedAt ?? Date.now()),
                severity: this.announcementSeverity(announcement)
            }));

        return [...eventItems, ...announcementItems].sort((left, right) => left.date.getTime() - right.date.getTime());
    }

    private sameDate(left: Date, right: Date): boolean {
        return (
            !Number.isNaN(left.getTime()) &&
            !Number.isNaN(right.getTime()) &&
            left.getFullYear() === right.getFullYear() &&
            left.getMonth() === right.getMonth() &&
            left.getDate() === right.getDate()
        );
    }
}
