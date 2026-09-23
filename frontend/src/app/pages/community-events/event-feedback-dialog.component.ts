import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { CommunityEvent, EventFeedback, EventFeedbackSummary } from '@/app/models/community-event.model';
import { EventStatus } from '@/app/models/enums.model';
import { AuthService } from '@/app/core/auth/auth.service';
import { CommunityEventService } from '@/app/pages/service/community-event.service';
import { ChargeService } from '@/app/pages/service/charge.service';

@Component({
    selector: 'app-event-feedback-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, RatingModule, ButtonModule, TagModule, ProgressBarModule, TextareaModule],
    template: `
        <p-dialog [(visible)]="visible" [style]="{ width: '720px' }" header="Event Feedback" [modal]="true">
            <div *ngIf="event" class="flex flex-col gap-5">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div class="text-surface-500 font-medium mb-1">{{ event.location }}</div>
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ event.title }}</h2>
                        <p class="text-surface-600 dark:text-surface-400 mt-2 mb-0">{{ event.description }}</p>
                    </div>
                    <p-tag [value]="event.status === EventStatus.CANCELLED ? 'Cancelled' : 'Finished event'" [severity]="event.status === EventStatus.CANCELLED ? 'danger' : 'info'" />
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-4">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="text-surface-500 text-sm font-medium mb-2">Average Rating</div>
                            <div *ngIf="summary.feedbackCount > 0; else noRating" class="flex flex-col gap-2">
                                <p-rating [ngModel]="summary.averageRating" [readonly]="true" />
                                <div class="text-2xl font-bold">{{ summary.averageRating | number:'1.1-1' }}</div>
                            </div>
                            <ng-template #noRating>
                                <div class="text-surface-500">No feedback yet</div>
                            </ng-template>
                        </div>
                    </div>
                    <div class="col-span-12 md:col-span-8">
                        <div class="border border-surface-200 dark:border-surface-700 rounded-border p-4 h-full">
                            <div class="flex items-center justify-between mb-3">
                                <span class="font-semibold">Satisfaction Summary</span>
                                <span class="text-surface-500">{{ summary.feedbackCount }} reviews</span>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div>
                                    <div class="flex justify-between text-sm mb-1"><span>Positive</span><span>{{ summary.positiveCount }}</span></div>
                                    <p-progressbar [value]="summaryPercent(summary.positiveCount)" [showValue]="false" />
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1"><span>Neutral</span><span>{{ summary.neutralCount }}</span></div>
                                    <p-progressbar [value]="summaryPercent(summary.neutralCount)" [showValue]="false" />
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1"><span>Negative</span><span>{{ summary.negativeCount }}</span></div>
                                    <p-progressbar [value]="summaryPercent(summary.negativeCount)" [showValue]="false" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="canShowForm()" class="border border-primary-200 dark:border-primary-800 rounded-border p-4 bg-primary-50 dark:bg-primary-900/10">
                    <div class="font-semibold mb-3">{{ event.currentUserReviewed ? 'Edit my feedback' : 'Leave feedback' }}</div>
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block font-bold mb-2">Rating</label>
                            <p-rating [(ngModel)]="rating" />
                            <small class="text-red-500 block mt-2" *ngIf="submitted && !validRating()">Rating is required.</small>
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Comment</label>
                            <textarea
                                pTextarea
                                class="w-full"
                                rows="4"
                                [autoResize]="true"
                                maxlength="1000"
                                [(ngModel)]="comment"
                                placeholder="Share what went well or what could be improved."
                            ></textarea>
                            <div class="flex justify-between mt-1">
                                <small class="text-red-500" *ngIf="submitted && comment.length > 1000">Comment must be 1000 characters or less.</small>
                                <small class="text-surface-500 ml-auto">{{ comment.length }}/1000</small>
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <p-button label="Save feedback" icon="pi pi-check" [loading]="saving" (onClick)="submit()" />
                        </div>
                    </div>
                </div>

                <div *ngIf="event && !canShowForm() && event.status !== EventStatus.CANCELLED" class="text-surface-500 text-sm">
                    Only participants can leave feedback.
                </div>

                <div>
                    <div class="font-semibold text-xl mb-3">Resident Feedback</div>
                    <div *ngIf="loading" class="flex items-center gap-3 text-surface-500">
                        <i class="pi pi-spin pi-spinner"></i>
                        <span>Loading feedback...</span>
                    </div>
                    <div *ngIf="!loading && feedback.length === 0" class="border border-dashed border-surface-300 dark:border-surface-700 rounded-border p-5 text-center text-surface-500">
                        No feedback yet.
                    </div>
                    <div *ngIf="!loading && feedback.length > 0" class="flex flex-col gap-3">
                        <div *ngFor="let item of feedback" class="border border-surface-200 dark:border-surface-700 rounded-border p-4">
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                <div class="flex items-center gap-3">
                                    <p-rating [ngModel]="item.rating" [readonly]="true" />
                                    <span class="font-medium">{{ item.rating }}/5</span>
                                </div>
                                <small class="text-surface-500">{{ item.updatedAt || item.createdAt | date:'medium' }}</small>
                            </div>
                            <p class="text-surface-700 dark:text-surface-300 m-0" *ngIf="item.comment">{{ item.comment }}</p>
                            <small class="text-surface-500 block mt-2">{{ feedbackAuthor(item) }}</small>
                        </div>
                    </div>
                </div>
            </div>
        </p-dialog>
    `
})
export class EventFeedbackDialogComponent {
    private eventService = inject(CommunityEventService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);
    private chargeService = inject(ChargeService);

    @Output() summaryChange = new EventEmitter<EventFeedbackSummary>();

    visible = false;
    loading = false;
    saving = false;
    submitted = false;
    event: CommunityEvent | null = null;
    feedback: EventFeedback[] = [];
    summary: EventFeedbackSummary = this.emptySummary('');
    residentNames = new Map<string, string>();
    rating = 0;
    comment = '';
    readonly EventStatus = EventStatus;

    open(event: CommunityEvent): void {
        if (!event.id) return;

        this.event = event;
        this.visible = true;
        this.submitted = false;
        this.rating = 0;
        this.comment = '';
        this.summary = this.emptySummary(event.id);
        this.loadResidentNames();
        this.load(event.id);
    }

    canShowForm(): boolean {
        return !!this.event?.currentUserCanFeedback && this.event.status !== EventStatus.CANCELLED;
    }

    summaryPercent(count: number): number {
        return this.summary.feedbackCount === 0 ? 0 : Math.round((count / this.summary.feedbackCount) * 100);
    }

    validRating(): boolean {
        return this.rating >= 1 && this.rating <= 5;
    }

    feedbackAuthor(feedback: EventFeedback): string {
        return this.feedbackDisplayName(feedback) ?? this.residentNames.get(feedback.accountId) ?? 'Resident';
    }

    submit(): void {
        if (!this.event?.id || this.saving) return;

        this.submitted = true;
        if (!this.validRating() || this.comment.length > 1000) return;

        this.saving = true;
        this.eventService
            .submitEventFeedback(this.event.id, {
                rating: this.rating,
                comment: this.comment.trim() || undefined
            })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.event = { ...this.event!, currentUserReviewed: true };
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Feedback saved.', life: 3000 });
                    this.load(this.event!.id!);
                },
                error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage(error), life: 5000 })
            });
    }

    private load(eventId: string): void {
        this.loading = true;
        forkJoin({
            feedback: this.eventService.getEventFeedback(eventId),
            summary: this.eventService.getEventFeedbackSummary(eventId)
        })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: ({ feedback, summary }) => {
                    this.feedback = feedback;
                    this.hydrateNamesFromFeedback(feedback);
                    this.summary = summary;
                    this.summaryChange.emit(summary);
                    this.prefillMine();
                },
                error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage(error), life: 5000 })
            });
    }

    private prefillMine(): void {
        const accountId = this.authService.user()?.id;
        const mine = accountId ? this.feedback.find((item) => item.accountId === accountId) : undefined;
        if (!mine) return;

        this.rating = mine.rating;
        this.comment = mine.comment ?? '';
    }

    private loadResidentNames(): void {
        const currentUser = this.authService.user();
        if (currentUser?.id) {
            this.residentNames.set(currentUser.id, this.displayName(currentUser));
        }

        if (!this.authService.isBackOffice()) return;

        this.chargeService.getSyndicResidents().subscribe({
            next: (residents) => {
                this.residentNames = new Map([
                    ...this.residentNames,
                    ...residents.map((resident) => [resident.id, this.displayName(resident)] as [string, string])
                ]);
            }
        });
    }

    private hydrateNamesFromFeedback(feedback: EventFeedback[]): void {
        feedback.forEach((item) => {
            const name = this.feedbackDisplayName(item);
            if (name) {
                this.residentNames.set(item.accountId, name);
            }
        });
    }

    private feedbackDisplayName(feedback: EventFeedback): string | null {
        return (
            feedback.residentName?.trim() ||
            feedback.accountName?.trim() ||
            `${feedback.accountFirstName ?? ''} ${feedback.accountLastName ?? ''}`.trim() ||
            null
        );
    }

    private displayName(account: { firstName?: string; lastName?: string; email?: string; id?: string }): string {
        return `${account.firstName ?? ''} ${account.lastName ?? ''}`.trim() || account.email || account.id || 'Resident';
    }

    private emptySummary(eventId: string): EventFeedbackSummary {
        return {
            eventId,
            averageRating: 0,
            feedbackCount: 0,
            positiveCount: 0,
            neutralCount: 0,
            negativeCount: 0
        };
    }

    private errorMessage(error: unknown): string {
        const response = error as { status?: number; error?: { message?: string } };
        if (response.error?.message) return response.error.message;
        if (response.status === 400) return 'Feedback is only available after the event is finished and only for participants.';
        if (response.status === 403) return 'You do not have permission to leave feedback.';
        if (response.status === 404) return 'Event not found.';
        return 'Could not save feedback. Please try again.';
    }
}
