import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Wallet } from '../../models/financial.model';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = 'http://localhost:8089/wallet';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for wallet (financial data)

@Injectable({ providedIn: 'root' })
export class WalletService {
    private walletSignal = signal<Wallet | null>(null);
    readonly wallet = this.walletSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getMyWallet(): Observable<Wallet> {
        return this.cacheService.getOrFetch(
            'wallet:my-wallet',
            () => this.http.get<Wallet>(`${API_URL}/my-wallet`),
            CACHE_TTL
        ).pipe(
            tap(data => this.walletSignal.set(data))
        );
    }

    getByUser(userId: string): Observable<Wallet> {
        return this.cacheService.getOrFetch(
            `wallet:user:${userId}`,
            () => this.http.get<Wallet>(`${API_URL}/admin/${userId}`),
            CACHE_TTL
        ).pipe(
            tap(data => this.walletSignal.set(data))
        );
    }

    topUp(amount: number, method: string): Observable<Wallet> {
        return this.http.post<Wallet>(`${API_URL}/top-up`, { amount, method }).pipe(
            tap(data => {
                this.walletSignal.set(data);
                this.cacheService.clearPattern('wallet:');
            })
        );
    }

    payCharge(userId: string, chargeId: string, amount: number): Observable<Wallet> {
        return this.http.post<Wallet>(`${API_URL}/pay-charge`, { userId, chargeId, amount }).pipe(
            tap(data => {
                this.walletSignal.set(data);
                this.cacheService.clearPattern('wallet:');
            })
        );
    }
}
