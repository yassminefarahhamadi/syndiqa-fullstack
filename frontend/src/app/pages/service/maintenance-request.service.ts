import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'VERIFIED';
export type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'ELEVATOR' | 'HVAC' | 'CLEANING' | 'STRUCTURAL' | 'SECURITY' | 'OTHER';
export type MaintenanceSource = 'RESIDENT' | 'SYNDIC_ADMIN' | 'PLATFORM_ADMIN' | 'TECHNICAL_STAFF' | 'SYSTEM';
export type MaintenanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MaintenanceRequest {
	id?: string;
	title: string;
	description: string;
	maintenanceCode?: string;
	reportedBy: string;
	reporterAccountId?: string;
	apartmentId: string;
	buildingId?: string;
	residenceId?: string;
	locationDetails?: string;
	beforeImageUrl?: string;
	organizationId?: string;
	category?: MaintenanceCategory;
	source?: MaintenanceSource;
	severity?: MaintenanceSeverity;
	priority: MaintenancePriority;
	status?: MaintenanceStatus;
	createdByAccountId?: string;
	lastUpdatedByAccountId?: string;
	closedByAccountId?: string;
	subTaskCount?: number;
	completedSubTaskCount?: number;
	progressPercent?: number;
	createdAt?: string;
	updatedAt?: string;
	dueAt?: string;
	acknowledgedAt?: string;
	startedAt?: string;
	resolvedAt?: string;
	verifiedAt?: string;
}

const API_URL = 'http://localhost:8089/api/maintenance/requests';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

@Injectable({ providedIn: 'root' })
export class MaintenanceRequestService {
	private requestsSignal = signal<MaintenanceRequest[]>([]);
	readonly requests = this.requestsSignal.asReadonly();

	constructor(
		private http: HttpClient,
		private cacheService: DataCacheService
	) {}

	getAll(): Observable<MaintenanceRequest[]> {
		return this.cacheService.getOrFetch(
			'maintenance:all',
			() => this.http.get<MaintenanceRequest[]>(API_URL),
			CACHE_TTL
		).pipe(tap((data) => this.requestsSignal.set(data)));
	}

	create(request: MaintenanceRequest, beforePhoto?: File): Observable<MaintenanceRequest> {
		if (beforePhoto) {
			const formData = new FormData();
			formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
			formData.append('beforePhoto', beforePhoto);
			return this.http.post<MaintenanceRequest>(API_URL, formData).pipe(
				tap((newRequest) => this.requestsSignal.update((requests) => [...requests, newRequest]))
			);
		}
		return this.http.post<MaintenanceRequest>(API_URL, request).pipe(
			tap((newRequest) => {
				this.requestsSignal.update((requests) => [...requests, newRequest]);
				this.cacheService.clearPattern('maintenance:');
			})
		);
	}

	update(id: string, request: MaintenanceRequest): Observable<MaintenanceRequest> {
		return this.http.put<MaintenanceRequest>(`${API_URL}/${id}`, request).pipe(
			tap((updatedRequest) => {
				this.requestsSignal.update((requests) => requests.map((existing) => (existing.id === id ? updatedRequest : existing)));
				this.cacheService.clearPattern('maintenance:');
			})
		);
	}

	delete(id: string): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${id}`).pipe(
			tap(() => {
				this.requestsSignal.update((requests) => requests.filter((request) => request.id !== id));
				this.cacheService.clearPattern('maintenance:');
			})
		);
	}
}
