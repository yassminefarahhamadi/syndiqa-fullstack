import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationName?: string;
}

export interface AuthResponse {
    accessToken: string;
    account: AccountSummary;
}

export interface AccountSummary {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    status: string;
}

// What we decode from the JWT
export interface JwtPayload {
    sub: string;          // accountId
    organizationId: string;
    role: string;
    status: string;
    iat: number;
    exp: number;
}

const API_URL = 'http://localhost:8089/auth';
const TOKEN_KEY = 'syndiqa_access_token';
const USER_KEY = 'syndiqa_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUser = signal<AccountSummary | null>(this.loadUser());
    private isAuthenticated = signal<boolean>(this.hasValidToken());

    readonly user = this.currentUser.asReadonly();
    readonly authenticated = this.isAuthenticated.asReadonly();
    readonly role = computed(() => this.currentUser()?.role ?? null);
    readonly organizationId = computed(() => this.currentUser()?.organizationId ?? null);

    // Role check helpers
    readonly isSyndicAdmin = computed(() => this.role() === 'SYNDIC_ADMIN');
    readonly isPlatformAdmin = computed(() => this.role() === 'PLATFORM_ADMIN');
    readonly isBackOffice = computed(() => this.isPlatformAdmin() || this.isSyndicAdmin());
    readonly isResident = computed(() => this.role() === 'RESIDENT');
    readonly isFrontOffice = computed(() => this.isResident());
    readonly isTechnicalStaff = computed(() => this.role() === 'TECHNICAL_STAFF');

    constructor(private http: HttpClient, private router: Router) {}

    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${API_URL}/login`, credentials, {
            withCredentials: true  // sends/receives cookies (refresh token)
        }).pipe(
            tap(response => this.handleAuthSuccess(response)),
            catchError(err => {
                console.error('Login failed:', err);
                return throwError(() => err);
            })
        );
    }

    register(data: RegisterRequest): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${API_URL}/register`, data);
    }

    logout(): void {
        this.http.post(`${API_URL}/logout`, {}, { withCredentials: true }).subscribe({
            complete: () => this.clearSession()
        });
        this.clearSession();
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    /** Decode JWT payload without external library */
    decodeToken(token: string): JwtPayload | null {
        try {
            const payload = token.split('.')[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }

    hasValidToken(): boolean {
        const token = this.getToken();
        if (!token) return false;
        const decoded = this.decodeToken(token);
        if (!decoded) return false;
        return decoded.exp * 1000 > Date.now();
    }

    /** Where to send user after login based on role */
    getDefaultRoute(): string {
        if (this.isPlatformAdmin()) return '/pages/admin/dashboard';
        if (this.isSyndicAdmin()) return '/pages/syndic-dashboard';
        if (this.isResident()) return '/pages/resident-dashboard';
        if (this.isTechnicalStaff()) return '/pages/backoffice/maintenance/tasks';
        return '/auth/login';
    }

    // ─── Private ──────────────────────────────────────────

    private handleAuthSuccess(response: AuthResponse): void {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(response.account));
        this.currentUser.set(response.account);
        this.isAuthenticated.set(true);
    }

    private clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/auth/login']);
    }

    private loadUser(): AccountSummary | null {
        const json = localStorage.getItem(USER_KEY);
        if (!json) return null;
        try { return JSON.parse(json); } catch { return null; }
    }
}
