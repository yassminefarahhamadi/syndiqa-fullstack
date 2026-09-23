import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

export interface ResidentCharge {
    id?: string;
    organizationId?: string;
    buildingId?: string;
    apartmentId?: string;
    residentId?: string;
    label: string;
    amount: number;
    paidAmount?: number;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
    period: string;
    createdAt?: string;
}

const API_URL = 'http://localhost:8089/charge';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes for resident data

@Injectable({ providedIn: 'root' })
export class ResidentChargeService {
    private myChargesSignal = signal<ResidentCharge[]>([]);
    readonly myCharges = this.myChargesSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getMyCharges(): Observable<ResidentCharge[]> {
        return this.cacheService.getOrFetch(
            'resident:my-charges',
            () => this.http.get<ResidentCharge[]>(`${API_URL}/my-charges`),
            CACHE_TTL
        ).pipe(
            tap(data => this.myChargesSignal.set(data))
        );
    }

    payCharge(chargeId: string, amount: number, method: string): Observable<ResidentCharge> {
        return this.http.post<ResidentCharge>(`${API_URL}/${chargeId}/pay`, { amount, method }).pipe(
            tap(updatedCharge => {
                this.myChargesSignal.update(charges =>
                    charges.map(c => c.id === chargeId ? updatedCharge : c)
                );
                // Invalidate caches after payment
                this.cacheService.clearPattern('resident:');
                this.cacheService.clearPattern('wallet:');
            })
        );
    }

    // ═══════════════════════════════════════════════
    //                  WALLET & PAYMENTS
    // ═══════════════════════════════════════════════

    getMyWallet(): Observable<any> {
        return this.cacheService.getOrFetch(
            'wallet:my-wallet',
            () => this.http.get(`http://localhost:8089/wallet/my-wallet`),
            CACHE_TTL
        );
    }

    topUpWallet(amount: number, method: string): Observable<any> {
        return this.http.post(`http://localhost:8089/wallet/top-up`, { amount, method }).pipe(
            tap(() => this.cacheService.clearPattern('wallet:'))
        );
    }

    getMyPayments(): Observable<any[]> {
        return this.cacheService.getOrFetch(
            'resident:my-payments',
            () => this.http.get<any[]>(`http://localhost:8089/payment/my-payments`),
            CACHE_TTL
        );
    }

    verifyStripePayment(sessionId: string): Observable<any> {
        return this.http.get(`http://localhost:8092/api/v1/payments/verify?session_id=${sessionId}`, { responseType: 'text' }).pipe(
            tap(() => {
                // Invalidate all resident caches after Stripe verification
                this.cacheService.clearPattern('resident:');
                this.cacheService.clearPattern('wallet:');
            })
        );
    }

    // ═══════════════════════════════════════════════
    //  STRIPE — create checkout session via microservice
    // ═══════════════════════════════════════════════

    createStripeCheckout(
        chargeId: string, 
        amountTnd: number, 
        payerId: string, 
        type: 'CHARGE' | 'TOP_UP', 
        organizationId: string
    ): Observable<{ checkoutUrl: string; transactionId: string }> {
        // Convert TND to millimes (1 TND = 1000 millimes)
        const amountMillimes = Math.round(amountTnd * 1000);
        const idempotencyKey = `${type}-${chargeId}-${Date.now()}`;

        return this.http.post<any>('http://localhost:8092/api/v1/payments/intent', {
            amount: amountMillimes,
            currency: 'TND',
            payerId,
            referenceId: chargeId,
            type,
            organizationId,
            provider: 'STRIPE'
        }, {
            headers: { 'X-Idempotency-Key': idempotencyKey }
        });
    }
}
