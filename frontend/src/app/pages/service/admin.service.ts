import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API = 'http://localhost:8089/admin';

export interface DashboardStats {
    totalOrganizations: number;
    totalAccounts: number;
    activeAccounts: number;
    suspendedAccounts: number;
    totalResidents: number;
    totalStaff: number;
    totalSyndicAdmins: number;
    totalCharges: number;
    totalExpenses: number;
    totalPayments: number;
    totalChargeAmount: number;
    totalExpenseAmount: number;
    totalCollected: number;
    netRevenue: number;
    totalMaintenanceRequests: number;
    totalLeases: number;
}

export interface AccountItem {
    id: string;
    organizationId: string;
    email: string;
    passwordHash?: string;
    role: string;
    status: string;
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: string;
}

export interface OrgItem {
    id: string;
    name: string;
    address: string;
    city: string;
    buildingIds: string[];
    managerAccountId: string;
    memberAccountIds: string[];
    subscriptionPlan: string;
    status: string;
    createdAt: string;
}

export interface AuditLogItem {
    id: string;
    accountId: string;
    action: string;
    ip: string;
    userAgent: string;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
    private http = inject(HttpClient);

    // ═══ Dashboard ═══
    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${API}/dashboard`);
    }

    // ═══ Accounts ═══
    getAccounts(role?: string, orgId?: string): Observable<AccountItem[]> {
        let url = `${API}/accounts`;
        const params: string[] = [];
        if (role) params.push(`role=${role}`);
        if (orgId) params.push(`organizationId=${orgId}`);
        if (params.length) url += '?' + params.join('&');
        return this.http.get<AccountItem[]>(url);
    }

    createAccount(data: any): Observable<AccountItem> {
        return this.http.post<AccountItem>(`${API}/accounts`, data);
    }

    updateAccount(id: string, data: any): Observable<AccountItem> {
        return this.http.put<AccountItem>(`${API}/accounts/${id}`, data);
    }

    updateAccountStatus(id: string, status: string): Observable<AccountItem> {
        return this.http.patch<AccountItem>(`${API}/accounts/${id}/status`, { status });
    }

    resetPassword(id: string, password: string): Observable<any> {
        return this.http.post(`${API}/accounts/${id}/reset-password`, { password });
    }

    // ═══ Organizations ═══
    getOrganizations(): Observable<OrgItem[]> {
        return this.http.get<OrgItem[]>(`${API}/organizations`);
    }

    createOrganization(data: any): Observable<OrgItem> {
        return this.http.post<OrgItem>(`${API}/organizations`, data);
    }

    updateOrganization(id: string, data: any): Observable<OrgItem> {
        return this.http.put<OrgItem>(`${API}/organizations/${id}`, data);
    }

    updateOrgStatus(id: string, status: string): Observable<OrgItem> {
        return this.http.patch<OrgItem>(`${API}/organizations/${id}/status`, { status });
    }

    // ═══ Finance ═══
    getFinanceSummary(): Observable<any> {
        return this.http.get(`${API}/finance/summary`);
    }

    // ═══ Audit Logs ═══
    getAuditLogs(): Observable<AuditLogItem[]> {
        return this.http.get<AuditLogItem[]>(`${API}/audit-logs`);
    }
}
