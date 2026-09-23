import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { EventParticipation } from '@/app/models/event-participation.model';
import { ParticipationStatus } from '@/app/models/enums.model';
import { CreateEventParticipationRequest } from '@/app/models/payloads.model';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiBaseUrl}/event-participations`;

@Injectable({ providedIn: 'root' })
export class EventParticipationService {
    private participationsSignal = signal<EventParticipation[]>([]);
    readonly participations = this.participationsSignal.asReadonly();

    constructor(private http: HttpClient) {}

    getMine(): Observable<EventParticipation[]> {
        return this.http.get<EventParticipation[]>(`${API_URL}/my-participations`).pipe(
            tap((participations) => this.participationsSignal.set(participations))
        );
    }

    getByEvent(eventId: string): Observable<EventParticipation[]> {
        return this.http.get<EventParticipation[]>(`${API_URL}/event/${eventId}`);
    }

    register(payload: CreateEventParticipationRequest): Observable<EventParticipation> {
        return this.http.post<EventParticipation>(API_URL, payload).pipe(
            tap((participation) => {
                this.participationsSignal.update((participations) => [
                    ...participations.filter((item) => item.eventId !== participation.eventId),
                    participation
                ]);
            })
        );
    }

    unregister(eventId: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/event/${eventId}/unregister`).pipe(
            tap(() => {
                this.participationsSignal.update((participations) =>
                    participations.map((item) => (item.eventId === eventId ? { ...item, status: ParticipationStatus.CANCELLED } : item))
                );
            })
        );
    }
}
