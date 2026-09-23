import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Payment } from '../../models/financial.model';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = 'http://localhost:8089/payment';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private paymentsSignal = signal<Payment[]>([]);
    readonly payments = this.paymentsSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Payment[]> {
        return this.cacheService.getOrFetch(
            'payments:all',
            () => this.http.get<Payment[]>(API_URL),
            CACHE_TTL
        ).pipe(
            tap(data => this.paymentsSignal.set(data))
        );
    }

    getById(id: string): Observable<Payment> {
        return this.cacheService.getOrFetch(
            `payments:${id}`,
            () => this.http.get<Payment>(`${API_URL}/${id}`),
            CACHE_TTL
        );
    }

    getByOrganization(organizationId: string): Observable<Payment[]> {
        return this.cacheService.getOrFetch(
            `payments:org:${organizationId}`,
            () => this.http.get<Payment[]>(`${API_URL}/organization/${organizationId}`),
            CACHE_TTL
        ).pipe(
            tap(data => this.paymentsSignal.set(data))
        );
    }

    getByUser(userId: string): Observable<Payment[]> {
        return this.cacheService.getOrFetch(
            `payments:user:${userId}`,
            () => this.http.get<Payment[]>(`${API_URL}/user/${userId}`),
            CACHE_TTL
        ).pipe(
            tap(data => this.paymentsSignal.set(data))
        );
    }

    getByCharge(chargeId: string): Observable<Payment[]> {
        return this.cacheService.getOrFetch(
            `payments:charge:${chargeId}`,
            () => this.http.get<Payment[]>(`${API_URL}/charge/${chargeId}`),
            CACHE_TTL
        );
    }

    create(payment: Payment): Observable<Payment> {
        return this.http.post<Payment>(API_URL, payment).pipe(
            tap(newPayment => {
                this.paymentsSignal.update(payments => [...payments, newPayment]);
                this.cacheService.clearPattern('payments:');
            })
        );
    }
}
