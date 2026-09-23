import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Apartment } from '../../models/financial.model';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = 'http://localhost:8089/api/apartments';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

@Injectable({ providedIn: 'root' })
export class ApartmentService {
    private apartmentsSignal = signal<Apartment[]>([]);
    readonly apartments = this.apartmentsSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Apartment[]> {
        return this.cacheService.getOrFetch(
            'apartments:all',
            () => this.http.get<Apartment[]>(API_URL),
            CACHE_TTL
        ).pipe(
            tap(data => this.apartmentsSignal.set(data))
        );
    }

    getById(id: string): Observable<Apartment> {
        return this.cacheService.getOrFetch(
            `apartments:${id}`,
            () => this.http.get<Apartment>(`${API_URL}/${id}`),
            CACHE_TTL
        );
    }

    getByBuilding(buildingId: string): Observable<Apartment[]> {
        return this.cacheService.getOrFetch(
            `apartments:building:${buildingId}`,
            () => this.http.get<Apartment[]>(`${API_URL}/building/${buildingId}`),
            CACHE_TTL
        ).pipe(
            tap(data => this.apartmentsSignal.set(data))
        );
    }

    getByOrganization(organizationId: string): Observable<Apartment[]> {
        return this.cacheService.getOrFetch(
            `apartments:org:${organizationId}`,
            () => this.http.get<Apartment[]>(`${API_URL}/organization/${organizationId}`),
            CACHE_TTL
        ).pipe(
            tap(data => this.apartmentsSignal.set(data))
        );
    }

    create(apartment: Apartment): Observable<Apartment> {
        return this.http.post<Apartment>(API_URL, apartment).pipe(
            tap(newApartment => {
                this.apartmentsSignal.update(apartments => [...apartments, newApartment]);
                this.cacheService.clearPattern('apartments:');
            })
        );
    }

    update(id: string, apartment: Apartment): Observable<Apartment> {
        return this.http.put<Apartment>(`${API_URL}/${id}`, apartment).pipe(
            tap(updatedApartment => {
                this.apartmentsSignal.update(apartments => 
                    apartments.map(a => a.id === id ? updatedApartment : a)
                );
                this.cacheService.clearPattern('apartments:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.apartmentsSignal.update(apartments => apartments.filter(a => a.id !== id));
                this.cacheService.clearPattern('apartments:');
            })
        );
    }
}
