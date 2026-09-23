import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Residence } from '../../models/financial.model';

const API_URL = 'http://localhost:8089/api/residences';

@Injectable({ providedIn: 'root' })
export class ResidenceService {
    private residencesSignal = signal<Residence[]>([]);
    readonly residences = this.residencesSignal.asReadonly();

    constructor(private http: HttpClient) {}

    getAll(): Observable<Residence[]> {
        return this.http.get<Residence[]>(API_URL).pipe(
            tap(data => this.residencesSignal.set(data))
        );
    }

    getById(id: string): Observable<Residence> {
        return this.http.get<Residence>(`${API_URL}/${id}`);
    }

    getByOrganization(organizationId: string): Observable<Residence[]> {
        return this.http.get<Residence[]>(`${API_URL}/organization/${organizationId}`).pipe(
            tap(data => this.residencesSignal.set(data))
        );
    }

    create(residence: Residence): Observable<Residence> {
        return this.http.post<Residence>(API_URL, residence).pipe(
            tap(newResidence => {
                this.residencesSignal.update(residences => [...residences, newResidence]);
            })
        );
    }

    update(id: string, residence: Residence): Observable<Residence> {
        return this.http.put<Residence>(`${API_URL}/${id}`, residence).pipe(
            tap(updatedResidence => {
                this.residencesSignal.update(residences => 
                    residences.map(r => r.id === id ? updatedResidence : r)
                );
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.residencesSignal.update(residences => residences.filter(r => r.id !== id));
            })
        );
    }
}
