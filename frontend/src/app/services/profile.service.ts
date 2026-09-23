import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../pages/backoffice/profiles/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private base = 'http://localhost:8089/profile';

    constructor(private http: HttpClient) {}

    getAll(): Observable<Profile[]> {
        return this.http.get<Profile[]>(this.base);
    }

    getById(id: string): Observable<Profile> {
        return this.http.get<Profile>(`${this.base}/${id}`);
    }

    getByAccountId(accountId: string): Observable<Profile> {
        return this.http.get<Profile>(`${this.base}/account/${accountId}`);
    }

    create(profile: Profile): Observable<Profile> {
        return this.http.post<Profile>(this.base, profile);
    }

    update(id: string, profile: Profile): Observable<Profile> {
        return this.http.put<Profile>(`${this.base}/${id}`, profile);
    }

    updateRiskScore(id: string, score: number): Observable<Profile> {
        return this.http.patch<Profile>(`${this.base}/${id}/risk-score`, null, {
            params: { score: score.toString() }
        });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}
