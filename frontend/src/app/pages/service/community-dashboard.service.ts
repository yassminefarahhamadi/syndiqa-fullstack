import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiBaseUrl}/community-dashboard`;

export interface CommunityDashboardStats {
    totalEvents: number;
    upcomingEvents: number;
    publishedEvents: number;
    fullEvents: number;
    totalRegistrations: number;
    totalAnnouncements: number;
    urgentAnnouncements: number;
    pinnedAnnouncements: number;
    acknowledgementRequiredAnnouncements: number;
    totalAcknowledgements: number;
    pendingAcknowledgements: number;
    averageEventRating: number;
    totalEventFeedback: number;
    highestRatedEventId: string | null;
    highestRatedEventTitle: string | null;
    highestRatedEventAverage: number;
    lowestRatedEventId: string | null;
    lowestRatedEventTitle: string | null;
    lowestRatedEventAverage: number;
}

@Injectable({ providedIn: 'root' })
export class CommunityDashboardService {
    constructor(private http: HttpClient) {}

    getStats(): Observable<CommunityDashboardStats> {
        return this.http.get<CommunityDashboardStats>(API_URL);
    }

    exportCsv(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_URL}/export.csv`, {
            responseType: 'blob',
            observe: 'response'
        });
    }
}
