import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

export interface Charge {
    id?: string;
    organizationId?: string;
    buildingId?: string;
    apartmentId?: string;
    userId?: string;
    label: string;
    amount: number;
    paidAmount?: number;
    dueDate: string; // ISO date string
    status?: string; // PENDING, PAID, PARTIALLY_PAID, OVERDUE
    category?: string;
    period?: string;
    createdAt?: string;
}

export interface ResidentApartmentInfo {
    accountId: string;
    firstName: string;
    lastName: string;
    email: string;
    apartmentId: string | null;
    apartmentNumber: string | null;
    floor: number | null;
    buildingId: string | null;
    buildingName: string | null;
}

const API_URL = 'http://localhost:8089/charge';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class ChargeService {
    private chargesSignal = signal<Charge[]>([]);
    readonly charges = this.chargesSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Charge[]> {
        return this.cacheService.getOrFetch(
            'charges:all',
            () => this.http.get<Charge[]>(API_URL),
            CACHE_TTL
        ).pipe(
            tap(data => this.chargesSignal.set(data))
        );
    }

    getMyCharges(): Observable<Charge[]> {
        return this.cacheService.getOrFetch(
            'charges:my',
            () => this.http.get<Charge[]>(`${API_URL}/my-charges`),
            CACHE_TTL
        ).pipe(
            tap(data => this.chargesSignal.set(data))
        );
    }

    getSyndicResidents(): Observable<{id: string, firstName: string, lastName: string, email: string}[]> {
        return this.cacheService.getOrFetch(
            'residents:syndic',
            () => this.http.get<any[]>('http://localhost:8089/admin/syndic/residents'),
            CACHE_TTL
        );
    }

    getResidentsWithApartments(): Observable<ResidentApartmentInfo[]> {
        return this.cacheService.getOrFetch(
            'residents:with-apartments',
            () => this.http.get<ResidentApartmentInfo[]>('http://localhost:8089/admin/syndic/residents-with-apartments'),
            CACHE_TTL
        );
    }

    create(charge: Charge): Observable<Charge> {
        return this.http.post<Charge>(API_URL, charge).pipe(
            tap(newCharge => {
                this.chargesSignal.update(charges => [...charges, newCharge]);
                this.cacheService.clearPattern('charges:');
            })
        );
    }

    update(id: string, charge: Charge): Observable<Charge> {
        return this.http.put<Charge>(`${API_URL}/${id}`, charge).pipe(
            tap(updatedCharge => {
                this.chargesSignal.update(charges => 
                    charges.map(c => c.id === id ? updatedCharge : c)
                );
                this.cacheService.clearPattern('charges:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.chargesSignal.update(charges => charges.filter(c => c.id !== id));
                this.cacheService.clearPattern('charges:');
            })
        );
    }

    auditOverdue(): Observable<{ markedOverdue: number }> {
        return this.http.post<{ markedOverdue: number }>(`${API_URL}/audit-overdue`, {}).pipe(
            tap(() => this.cacheService.clearPattern('charges:'))
        );
    }
}
