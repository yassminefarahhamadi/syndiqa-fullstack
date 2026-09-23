import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

export interface Expense {
    id?: string;
    organizationId?: string;
    buildingId?: string;
    apartmentId?: string;  // For apartment-specific expenses
    description: string;
    amount: number;
    category: string;
    expenseDate: string; // ISO date string
    createdAt?: string;
}

const API_URL = 'http://localhost:8089/expense';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class ExpenseService {
    private expensesSignal = signal<Expense[]>([]);
    readonly expenses = this.expensesSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Expense[]> {
        return this.cacheService.getOrFetch(
            'expenses:all',
            () => this.http.get<Expense[]>(API_URL),
            CACHE_TTL
        ).pipe(
            tap(data => this.expensesSignal.set(data))
        );
    }

    create(expense: Expense): Observable<Expense> {
        return this.http.post<Expense>(API_URL, expense).pipe(
            tap(newExpense => {
                this.expensesSignal.update(expenses => [...expenses, newExpense]);
                this.cacheService.clearPattern('expenses:');
            })
        );
    }

    update(id: string, expense: Expense): Observable<Expense> {
        return this.http.put<Expense>(`${API_URL}/${id}`, expense).pipe(
            tap(updatedExpense => {
                this.expensesSignal.update(expenses => 
                    expenses.map(e => e.id === id ? updatedExpense : e)
                );
                this.cacheService.clearPattern('expenses:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.expensesSignal.update(expenses => expenses.filter(e => e.id !== id));
                this.cacheService.clearPattern('expenses:');
            })
        );
    }
}
