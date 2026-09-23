import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Announcement, AnnouncementAcknowledgement, AnnouncementAiDraftRequest, AnnouncementAiDraftResponse } from '@/app/models/announcement.model';
import { CreateAnnouncementRequest } from '@/app/models/payloads.model';
import { environment } from '../../../environments/environment';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = `${environment.apiBaseUrl}/announcements`;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private announcementsSignal = signal<Announcement[]>([]);
    readonly announcements = this.announcementsSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Announcement[]> {
        return this.http.get<Announcement[]>(API_URL).pipe(tap((announcements) => this.announcementsSignal.set(this.sortAnnouncements(announcements))));
    }

    create(announcement: CreateAnnouncementRequest): Observable<Announcement> {
        return this.http.post<Announcement>(API_URL, announcement).pipe(
            tap((createdAnnouncement) => this.announcementsSignal.update((announcements) => this.sortAnnouncements([...announcements, createdAnnouncement])))
        );
    }

    update(id: string, announcement: CreateAnnouncementRequest): Observable<Announcement> {
        return this.http.put<Announcement>(`${API_URL}/${id}`, announcement).pipe(
            tap((updatedAnnouncement) => {
                this.announcementsSignal.update((announcements) =>
                    this.sortAnnouncements(announcements.map((existing) => (existing.id === id ? updatedAnnouncement : existing)))
                );
                this.cacheService.clearPattern('announcements:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.announcementsSignal.update((announcements) => announcements.filter((announcement) => announcement.id !== id));
                this.cacheService.clearPattern('announcements:');
            })
        );
    }

    acknowledge(id: string): Observable<Partial<Announcement>> {
        return this.http.patch<Partial<Announcement>>(`${API_URL}/${id}/acknowledge`, {}).pipe(
            tap((response) => {
                this.announcementsSignal.update((announcements) =>
                    announcements.map((announcement) => {
                        if (announcement.id !== id) return announcement;

                        const wasAcknowledged = announcement.acknowledged;
                        return {
                            ...announcement,
                            ...response,
                            acknowledged: true,
                            acknowledgedAt: response.acknowledgedAt ?? announcement.acknowledgedAt ?? new Date().toISOString(),
                            acknowledgementCount: response.acknowledgementCount ?? announcement.acknowledgementCount + (wasAcknowledged ? 0 : 1)
                        };
                    })
                );
            })
        );
    }

    getAcknowledgements(id: string): Observable<AnnouncementAcknowledgement[]> {
        return this.http.get<AnnouncementAcknowledgement[]>(`${API_URL}/${id}/acknowledgements`);
    }

    generateDraft(payload: AnnouncementAiDraftRequest): Observable<AnnouncementAiDraftResponse> {
        return this.http.post<AnnouncementAiDraftResponse>(`${API_URL}/ai/draft`, payload);
    }

    exportCsv(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_URL}/export.csv`, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    private sortAnnouncements(announcements: Announcement[]): Announcement[] {
        return [...announcements].sort((left, right) => {
            if (left.pinActive !== right.pinActive) return left.pinActive ? -1 : 1;
            return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
        });
    }
}
