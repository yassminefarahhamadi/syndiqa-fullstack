import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Announcement } from '@/app/models/announcement.model';
import { CommunityEvent, EventFeedbackSummary } from '@/app/models/community-event.model';
import { AnnouncementType, EventStatus, ParticipationStatus } from '@/app/models/enums.model';
import { AnnouncementService } from '@/app/pages/service/announcement.service';
import { CommunityEventService } from '@/app/pages/service/community-event.service';
import { EventParticipationService } from '@/app/pages/service/event-participation.service';
import { EventPosterComponent } from '@/app/pages/community-events/event-poster.component';
import { EventFeedbackDialogComponent } from '@/app/pages/community-events/event-feedback-dialog.component';

type EventFilter = 'UPCOMING' | 'REGISTERED' | 'FINISHED' | 'CANCELLED' | 'ALL';

@Component({
    selector: 'app-resident-events',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        DialogModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectButtonModule,
        TagModule,
        ButtonModule,
        RatingModule,
        ToastModule,
        EventPosterComponent,
        EventFeedbackDialogComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0 flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                        <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> COMMUNITY
                        </div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-1 mt-0">Community Events</h1>
                        <p class="text-surface-600 dark:text-surface-400 m-0">Discover upcoming events and manage your participation.</p>
                    </div>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card mb-0">
                    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <div class="font-semibold text-xl text-surface-900 dark:text-surface-0 mb-1">Browse events</div>
                            <div class="text-surface-500">Filter the community calendar by what matters to you.</div>
                        </div>
                        <div class="flex flex-col md:flex-row md:items-center gap-3">
                            <p-selectbutton [(ngModel)]="eventFilter" [options]="filterOptions" optionLabel="label" optionValue="value" [allowEmpty]="false" />
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input
                                    pInputText
                                    type="text"
                                    [(ngModel)]="searchTerm"
                                    placeholder="Search title, location, category..."
                                    class="w-full md:w-80"
                                />
                            </p-iconfield>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-6 xl:col-span-4" *ngFor="let event of filteredEvents()">
                <div
                    class="card h-full flex flex-col cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg"
                    role="button"
                    tabindex="0"
                    (click)="openDetails(event)"
                    (keydown.enter)="openDetails(event)"
                    (keydown.space)="openDetails(event)"
                >
                    <app-event-poster [svg]="event.aiPosterSvg" [title]="event.title" [category]="event.category" />

                    <div class="flex justify-between gap-3 mb-4">
                        <div class="min-w-0">
                            <div class="text-surface-500 font-medium mb-2">{{ event.location }}</div>
                            <h2 class="text-xl text-surface-900 dark:text-surface-0 font-semibold m-0">{{ event.title }}</h2>
                        </div>
                        <div class="flex flex-col gap-2 items-end">
                            <p-tag [value]="label(event.category)" [severity]="isRegistered(event) ? 'success' : 'info'" />
                            <p-tag [value]="lifecycleLabel(event)" [severity]="lifecycleSeverity(event)" />
                        </div>
                    </div>

                    <p class="text-surface-600 dark:text-surface-400 line-height-3 flex-1">{{ event.description }}</p>

                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-3">
                            <div class="text-surface-500 text-xs mb-1">Starts</div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0">{{ event.startDate | date: 'MMM d' }}</div>
                            <div class="text-surface-500 text-sm">{{ event.startDate | date: 'shortTime' }}</div>
                        </div>
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-3">
                            <div class="text-surface-500 text-xs mb-1">RSVP</div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0">{{ isRegistered(event) ? 'Registered' : rsvpLabel(event) }}</div>
                            <div class="text-surface-500 text-sm">{{ attendeeLabel(event) }}</div>
                        </div>
                    </div>

                    <div *ngIf="!isFinished(event)" class="flex flex-col gap-2 mb-4">
                        <div class="flex items-center gap-2 text-surface-600">
                            <i class="pi pi-calendar text-primary"></i>
                            <span>{{ event.startDate | date: 'medium' }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-surface-600">
                            <i class="pi pi-clock text-primary"></i>
                            <span>Until {{ event.endDate | date: 'medium' }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-surface-600">
                            <i class="pi pi-users text-primary"></i>
                            <span>{{ capacityLabel(event) }}</span>
                        </div>
                    </div>

                    <div *ngIf="isFinished(event)" class="border border-surface-200 dark:border-surface-700 rounded-border p-4 mb-4 bg-surface-50 dark:bg-surface-800/50">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p-tag value="Finished event" severity="info" />
                                <div class="text-surface-500 text-sm mt-2">{{ event.endDate | date: 'medium' }}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold">{{ event.feedbackCount }} reviews</div>
                                <small class="text-surface-500">Resident satisfaction</small>
                            </div>
                        </div>
                        <div *ngIf="event.feedbackCount > 0; else noFeedback" class="flex items-center gap-3 mb-3">
                            <p-rating [ngModel]="event.averageRating" [readonly]="true" />
                            <span class="font-bold">{{ event.averageRating | number:'1.1-1' }}</span>
                        </div>
                        <ng-template #noFeedback>
                            <div class="text-surface-500 mb-3">No feedback yet.</div>
                        </ng-template>
                        <div class="flex flex-col sm:flex-row gap-2">
                            <p-button label="View feedback" icon="pi pi-comments" severity="secondary" outlined (onClick)="feedbackDialog.open(event)" />
                            <p-button
                                *ngIf="event.currentUserCanFeedback"
                                [label]="event.currentUserReviewed ? 'Edit my feedback' : 'Leave feedback'"
                                icon="pi pi-star"
                                (onClick)="feedbackDialog.open(event)"
                            />
                        </div>
                        <small *ngIf="!event.currentUserCanFeedback && event.status !== EventStatus.CANCELLED" class="text-surface-500 block mt-3">
                            Only participants can leave feedback.
                        </small>
                    </div>

                    <p-tag *ngIf="!isFinished(event) && isRegistered(event)" value="Registered" severity="success" styleClass="mb-3" />
                    <p-tag *ngIf="!isFinished(event) && !isRegistered(event) && unavailableReason(event)" [value]="unavailableReason(event)" severity="warn" styleClass="mb-3" />

                    <p-button
                        *ngIf="!isFinished(event) && !isRegistered(event)"
                        label="Join Event"
                        icon="pi pi-check"
                        [loading]="isBusy(event)"
                        [disabled]="!canRegister(event)"
                        (click)="$event.stopPropagation()"
                        (onClick)="join(event)"
                    />
                    <p-button
                        *ngIf="!isFinished(event) && isRegistered(event)"
                        label="Unregister"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        [loading]="isBusy(event)"
                        (click)="$event.stopPropagation()"
                        (onClick)="unregister(event)"
                    />
                    <small class="text-surface-500 mt-3 flex items-center gap-2">
                        <i class="pi pi-info-circle"></i>
                        <span>Click card for full details</span>
                    </small>
                </div>
            </div>

            <div class="col-span-12" *ngIf="!loading && filteredEvents().length === 0">
                <div class="card text-center py-8">
                    <i class="pi pi-calendar-times text-4xl text-surface-400 mb-3"></i>
                    <div class="text-xl font-semibold mb-2">No matching events</div>
                    <p class="text-surface-500 m-0">Try another filter or search term to explore more community events.</p>
                </div>
            </div>
        </div>

        <p-dialog
            [(visible)]="detailsDialog"
            [modal]="true"
            [style]="{ width: '720px', maxWidth: '95vw' }"
            [dismissableMask]="true"
            [draggable]="false"
            [resizable]="false"
        >
            <ng-template #header>
                <div class="flex items-center justify-between gap-3 w-full pr-4">
                    <div>
                        <div class="text-surface-500 text-sm font-medium mb-1">Event Details</div>
                        <div class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ selectedEvent?.title }}</div>
                    </div>
                    <div class="flex gap-2" *ngIf="selectedEvent as event">
                        <p-tag [value]="label(event.category)" [severity]="isRegistered(event) ? 'success' : 'info'" />
                        <p-tag [value]="lifecycleLabel(event)" [severity]="lifecycleSeverity(event)" />
                    </div>
                </div>
            </ng-template>

            <div *ngIf="selectedEvent as event" class="flex flex-col gap-5">
                <app-event-poster [svg]="event.aiPosterSvg" [title]="event.title" [category]="event.category" size="large" />

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 lg:col-span-8">
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0 mb-2">{{ event.title }}</h2>
                        <p class="text-surface-700 dark:text-surface-300 line-height-3 m-0">{{ event.description }}</p>
                    </div>
                    <div class="col-span-12 lg:col-span-4">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full bg-surface-50 dark:bg-surface-800/50">
                            <div class="text-surface-500 text-sm mb-2">RSVP state</div>
                            <div class="flex items-center gap-2 mb-2">
                                <i [class]="isRegistered(event) ? 'pi pi-check-circle text-green-500' : 'pi pi-user-plus text-primary'"></i>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">{{ isRegistered(event) ? 'You are registered' : rsvpLabel(event) }}</span>
                            </div>
                            <div class="text-surface-500 text-sm">{{ attendeeLabel(event) }}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="text-surface-500 text-sm mb-2">Date & time</div>
                            <div class="flex items-start gap-3 text-surface-900 dark:text-surface-0">
                                <i class="pi pi-calendar text-primary mt-1"></i>
                                <div>
                                    <div class="font-semibold">{{ event.startDate | date: 'fullDate' }}</div>
                                    <div class="text-surface-500 text-sm">{{ event.startDate | date: 'shortTime' }} - {{ event.endDate | date: 'shortTime' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="text-surface-500 text-sm mb-2">Location</div>
                            <div class="flex items-start gap-3 text-surface-900 dark:text-surface-0">
                                <i class="pi pi-map-marker text-primary mt-1"></i>
                                <div class="font-semibold">{{ event.location }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="text-surface-500 text-sm mb-2">Capacity</div>
                            <div class="flex items-start gap-3 text-surface-900 dark:text-surface-0">
                                <i class="pi pi-users text-primary mt-1"></i>
                                <div>
                                    <div class="font-semibold">{{ capacityLabel(event) }}</div>
                                    <div class="text-surface-500 text-sm" *ngIf="event.maxCapacity">Registered: {{ event.registeredCount }}/{{ event.maxCapacity }}</div>
                                    <div class="text-surface-500 text-sm" *ngIf="!event.maxCapacity">{{ event.registeredCount || 0 }} residents registered</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="text-surface-500 text-sm mb-2">Your status</div>
                            <div class="flex items-start gap-3 text-surface-900 dark:text-surface-0">
                                <i [class]="isRegistered(event) ? 'pi pi-check-circle text-green-500 mt-1' : 'pi pi-user-plus text-primary mt-1'"></i>
                                <div>
                                    <div class="font-semibold">{{ isRegistered(event) ? 'Registered' : 'Not registered yet' }}</div>
                                    <div class="text-surface-500 text-sm">{{ unavailableReason(event) || 'Registration is open.' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="relatedAnnouncement(event) as announcement" class="border border-blue-200 dark:border-blue-800 rounded-border p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <i class="pi pi-megaphone text-blue-600"></i>
                                <span class="font-semibold text-blue-900 dark:text-blue-100">Related announcement</span>
                            </div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-1">{{ announcement.title }}</div>
                            <p class="text-surface-700 dark:text-surface-300 line-height-3 m-0">{{ announcement.content }}</p>
                        </div>
                        <p-tag value="Event update" severity="info" />
                    </div>
                </div>

                <div *ngIf="isFinished(event)" class="border border-surface-200 dark:border-surface-700 rounded-border p-4 bg-surface-50 dark:bg-surface-800/50">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-1">Event feedback</div>
                            <div class="text-surface-500 text-sm">{{ event.feedbackCount }} resident reviews</div>
                        </div>
                        <div *ngIf="event.feedbackCount > 0" class="flex items-center gap-2">
                            <p-rating [ngModel]="event.averageRating" [readonly]="true" />
                            <span class="font-bold">{{ event.averageRating | number:'1.1-1' }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                    <div>
                        <p-tag *ngIf="!isFinished(event) && isRegistered(event)" value="You are registered" severity="success" />
                        <p-tag *ngIf="!isFinished(event) && !isRegistered(event) && unavailableReason(event)" [value]="unavailableReason(event)" severity="warn" />
                    </div>
                    <div class="flex flex-wrap gap-2 justify-end">
                        <p-button label="Close" icon="pi pi-times" severity="secondary" outlined (onClick)="closeDetails()" />
                        <p-button
                            *ngIf="isFinished(event)"
                            label="View feedback"
                            icon="pi pi-comments"
                            severity="secondary"
                            outlined
                            (onClick)="feedbackDialog.open(event)"
                        />
                        <p-button
                            *ngIf="isFinished(event) && event.currentUserCanFeedback"
                            [label]="event.currentUserReviewed ? 'Edit my feedback' : 'Leave feedback'"
                            icon="pi pi-star"
                            (onClick)="feedbackDialog.open(event)"
                        />
                        <p-button
                            *ngIf="!isFinished(event) && !isRegistered(event)"
                            label="Join Event"
                            icon="pi pi-check"
                            [loading]="isBusy(event)"
                            [disabled]="!canRegister(event)"
                            (onClick)="join(event)"
                        />
                        <p-button
                            *ngIf="!isFinished(event) && isRegistered(event)"
                            label="Unregister"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            [loading]="isBusy(event)"
                            (onClick)="unregister(event)"
                        />
                    </div>
                </div>
            </div>
        </p-dialog>
        <app-event-feedback-dialog #feedbackDialog (summaryChange)="onFeedbackSummary($event)" />
    `
})
export class ResidentEventsComponent implements OnInit {
    eventService = inject(CommunityEventService);
    announcementService = inject(AnnouncementService);
    participationService = inject(EventParticipationService);
    messageService = inject(MessageService);

    loading = false;
    busyEventIds = new Set<string>();
    detailsDialog = false;
    selectedEvent: CommunityEvent | null = null;
    searchTerm = '';
    eventFilter: EventFilter = 'UPCOMING';
    filterOptions: Array<{ label: string; value: EventFilter }> = [
        { label: 'Upcoming', value: 'UPCOMING' },
        { label: 'Registered', value: 'REGISTERED' },
        { label: 'Finished', value: 'FINISHED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'All', value: 'ALL' }
    ];

    ngOnInit() {
        this.loading = true;
        this.eventService.getAll().subscribe({ complete: () => (this.loading = false), error: () => (this.loading = false) });
        this.announcementService.getAll().subscribe();
        this.participationService.getMine().subscribe();
    }

    visibleEvents(): CommunityEvent[] {
        return this.eventService.events().filter((event) => event.status !== EventStatus.DRAFT);
    }

    filteredEvents(): CommunityEvent[] {
        return this.visibleEvents()
            .filter((event) => this.matchesFilter(event))
            .filter((event) => this.matchesSearch(event))
            .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
    }

    openDetails(event: CommunityEvent) {
        this.selectedEvent = event;
        this.detailsDialog = true;
    }

    closeDetails() {
        this.detailsDialog = false;
    }

    isRegistered(event: CommunityEvent): boolean {
        return !!event.id && this.participationService.participations().some((item) => item.eventId === event.id && item.status === ParticipationStatus.REGISTERED);
    }

    isBusy(event: CommunityEvent): boolean {
        return !!event.id && this.busyEventIds.has(event.id);
    }

    canRegister(event: CommunityEvent): boolean {
        return !!event.id && !this.isBusy(event) && !this.isRegistered(event) && !this.unavailableReason(event) && !this.isFinished(event);
    }

    unavailableReason(event: CommunityEvent): string {
        if (event.status !== EventStatus.PUBLISHED) return 'Event is not open';
        if (this.isOngoing(event)) return 'Event in progress';
        if (this.isFinished(event)) return 'Finished event';
        if (event.availableSpots === 0) return 'Event full';
        return '';
    }

    capacityLabel(event: CommunityEvent): string {
        if (event.availableSpots === null || event.availableSpots === undefined) return 'Unlimited spots';
        if (event.availableSpots === 0) return 'No spots left';
        return `${event.availableSpots} available spots`;
    }

    attendeeLabel(event: CommunityEvent): string {
        const registered = event.registeredCount ?? 0;
        if (event.maxCapacity) return `${registered}/${event.maxCapacity} attending`;
        return `${registered} attending`;
    }

    rsvpLabel(event: CommunityEvent): string {
        const reason = this.unavailableReason(event);
        if (reason) return reason;
        return 'Open';
    }

    relatedAnnouncement(event: CommunityEvent): Announcement | null {
        const eventTitle = this.normalize(event.title);
        if (!eventTitle) return null;

        return (
            this.announcementService
                .announcements()
                .find((announcement) => {
                    if (announcement.type !== AnnouncementType.EVENT_RELATED) return false;
                    const title = this.normalize(announcement.title);
                    const content = this.normalize(announcement.content);
                    return title.includes(eventTitle) || content.includes(eventTitle) || eventTitle.includes(title);
                }) ?? null
        );
    }

    join(event: CommunityEvent) {
        if (!event.id || !this.canRegister(event)) return;

        this.busyEventIds.add(event.id);
        this.participationService.register({ eventId: event.id }).pipe(finalize(() => this.busyEventIds.delete(event.id!))).subscribe({
            next: () => {
                this.eventService.updateParticipationCounters(event.id!, 1);
                this.toast('You joined the event.');
            },
            error: (error) => this.fail(this.errorMessage(error)),
        });
    }

    unregister(event: CommunityEvent) {
        if (!event.id) return;

        this.busyEventIds.add(event.id);
        this.participationService.unregister(event.id).pipe(finalize(() => this.busyEventIds.delete(event.id!))).subscribe({
            next: () => {
                this.eventService.updateParticipationCounters(event.id!, -1);
                this.toast('You are no longer registered for this event.');
            },
            error: (error) => this.fail(this.errorMessage(error)),
        });
    }

    label(value?: string) {
        return value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : '';
    }

    lifecycleLabel(event: CommunityEvent): string {
        if (event.status === EventStatus.CANCELLED) return 'Cancelled';
        if (this.isFinished(event)) return 'Finished';
        if (this.isOngoing(event)) return 'Ongoing';
        return 'Upcoming';
    }

    lifecycleSeverity(event: CommunityEvent): 'info' | 'success' | 'warn' | 'danger' {
        if (event.status === EventStatus.CANCELLED) return 'danger';
        if (this.isFinished(event)) return 'info';
        if (this.isOngoing(event)) return 'warn';
        return 'success';
    }

    isOngoing(event: CommunityEvent): boolean {
        const now = Date.now();
        const startDate = new Date(event.startDate).getTime();
        const endDate = new Date(event.endDate).getTime();
        return !Number.isNaN(startDate) && !Number.isNaN(endDate) && startDate <= now && now <= endDate;
    }

    isFinished(event: CommunityEvent): boolean {
        const endDate = new Date(event.endDate).getTime();
        return event.feedbackOpen || (!Number.isNaN(endDate) && endDate < Date.now());
    }

    onFeedbackSummary(summary: EventFeedbackSummary) {
        this.eventService.updateFeedbackSummary(summary.eventId, summary);
    }

    private toast(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Successful', detail, life: 3000 });
    }

    private fail(detail: string) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
    }

    private errorMessage(error: unknown): string {
        const response = error as { error?: { message?: string }; status?: number };
        const message = response.error?.message;
        if (message) return message;
        if (response.status === 409) return 'This event is full or you are already registered for this event.';
        return 'The request could not be completed.';
    }

    private matchesFilter(event: CommunityEvent): boolean {
        if (this.eventFilter === 'ALL') return true;
        if (this.eventFilter === 'REGISTERED') return this.isRegistered(event);
        if (this.eventFilter === 'FINISHED') return this.isFinished(event);
        if (this.eventFilter === 'CANCELLED') return event.status === EventStatus.CANCELLED;
        return event.status !== EventStatus.CANCELLED && !this.isFinished(event);
    }

    private matchesSearch(event: CommunityEvent): boolean {
        const query = this.normalize(this.searchTerm);
        if (!query) return true;

        return [event.title, event.description, event.location, event.category].some((value) => this.normalize(value).includes(query));
    }

    private normalize(value?: string): string {
        return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    protected readonly EventStatus = EventStatus;
}
