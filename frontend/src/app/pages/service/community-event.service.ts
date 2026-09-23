import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';
import { CommunityEvent, EventFeedback, EventFeedbackRequest, EventFeedbackSummary } from '@/app/models/community-event.model';
import { CreateCommunityEventRequest } from '@/app/models/payloads.model';
import { environment } from '../../../environments/environment';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = `${environment.apiBaseUrl}/community-events`;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

@Injectable({ providedIn: 'root' })
export class CommunityEventService {
    private eventsSignal = signal<CommunityEvent[]>([]);
    readonly events = this.eventsSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<CommunityEvent[]> {
        return this.cacheService.getOrFetch(
            'community-events:all',
            () => this.http.get<CommunityEvent[]>(API_URL),
            CACHE_TTL
        ).pipe(tap((events) => this.eventsSignal.set(events)));
    }

    getById(id: string): Observable<CommunityEvent> {
        return this.cacheService.getOrFetch(
            `community-events:${id}`,
            () => this.http.get<CommunityEvent>(`${API_URL}/${id}`),
            CACHE_TTL
        );
    }

    create(event: CreateCommunityEventRequest): Observable<CommunityEvent> {
        return this.http.post<CommunityEvent>(API_URL, event).pipe(
            tap((createdEvent) => {
                this.eventsSignal.update((events) => [...events, createdEvent]);
                this.cacheService.clearPattern('community-events:');
            })
        );
    }

    update(id: string, event: CreateCommunityEventRequest): Observable<CommunityEvent> {
        return this.http.put<CommunityEvent>(`${API_URL}/${id}`, event).pipe(
            tap((updatedEvent) => {
                this.eventsSignal.update((events) => events.map((existing) => (existing.id === id ? updatedEvent : existing)));
                this.cacheService.clearPattern('community-events:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.eventsSignal.update((events) => events.filter((event) => event.id !== id));
                this.cacheService.clearPattern('community-events:');
            })
        );
    }

    updateParticipationCounters(id: string, registeredDelta: 1 | -1): void {
        this.eventsSignal.update((events) =>
            events.map((event) => {
                if (event.id !== id) return event;

                const registeredCount = Math.max(0, (event.registeredCount ?? 0) + registeredDelta);
                const availableSpots =
                    event.availableSpots === null || event.availableSpots === undefined
                        ? null
                        : Math.max(0, event.availableSpots - registeredDelta);

                return { ...event, registeredCount, availableSpots };
            })
        );
    }

    publish(id: string): Observable<CommunityEvent> {
        return this.patchStatus(id, 'publish');
    }

    cancel(id: string): Observable<CommunityEvent> {
        return this.patchStatus(id, 'cancel');
    }

    complete(id: string): Observable<CommunityEvent> {
        return this.patchStatus(id, 'complete');
    }

    getEventFeedback(eventId: string): Observable<EventFeedback[]> {
        return this.http.get<EventFeedback[]>(`${API_URL}/${eventId}/feedback`);
    }

    getEventFeedbackSummary(eventId: string): Observable<EventFeedbackSummary> {
        return this.http.get<EventFeedbackSummary>(`${API_URL}/${eventId}/feedback/summary`);
    }

    submitEventFeedback(eventId: string, payload: EventFeedbackRequest): Observable<EventFeedback> {
        return this.http.post<EventFeedback>(`${API_URL}/${eventId}/feedback`, payload);
    }

    updateFeedbackSummary(eventId: string, summary: EventFeedbackSummary): void {
        this.eventsSignal.update((events) =>
            events.map((event) =>
                event.id === eventId
                    ? {
                          ...event,
                          averageRating: summary.averageRating,
                          feedbackCount: summary.feedbackCount,
                          currentUserReviewed: true
                      }
                    : event
            )
        );
    }

    exportCsv(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_URL}/export.csv`, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    private patchStatus(id: string, action: 'publish' | 'cancel' | 'complete'): Observable<CommunityEvent> {
        return this.http.patch<CommunityEvent | null>(`${API_URL}/${id}/${action}`, null).pipe(
            switchMap((updatedEvent) => (updatedEvent ? of(updatedEvent) : this.getById(id))),
            tap((updatedEvent) => {
                this.eventsSignal.update((events) => events.map((existing) => (existing.id === id ? updatedEvent : existing)));
                this.cacheService.clearPattern('community-events:');
            })
        );
    }
}
