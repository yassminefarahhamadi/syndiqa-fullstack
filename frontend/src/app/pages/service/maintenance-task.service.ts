import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface MaintenanceTask {
    id?: string;
    maintenanceRequestId: string;
    title?: string;
    description?: string;
    orderIndex?: number;
    assignedTo: string;
    estimatedMinutes?: number;
    blockedReason?: string;
    afterImageUrl?: string;
    aiComparisonScore?: number;
    aiComparisonConclusion?: string;
    aiApproved?: boolean;
    scheduledDate: string;
    startedDate?: string;
    completedDate?: string;
    createdAt?: string;
    updatedAt?: string;
    status: TaskStatus;
}

export interface AssignableStaffOption {
    accountId: string;
    fullName: string;
    jobTitle: string;
}

export interface AiComparisonResult {
    taskId: string;
    score: number;
    conclusion: string;
    approved: boolean;
    beforeImageUrl: string;
    afterImageUrl: string;
}

const API_URL = 'http://localhost:8089/api/maintenance/tasks';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

@Injectable({ providedIn: 'root' })
export class MaintenanceTaskService {
    private tasksSignal = signal<MaintenanceTask[]>([]);
    readonly tasks = this.tasksSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<MaintenanceTask[]> {
        return this.cacheService.getOrFetch(
            'maintenance-tasks:all',
            () => this.http.get<MaintenanceTask[]>(API_URL),
            CACHE_TTL
        ).pipe(tap((data) => this.tasksSignal.set(data)));
    }

    getByRequestId(requestId: string): Observable<MaintenanceTask[]> {
        return this.http
            .get<MaintenanceTask[]>(`http://localhost:8089/api/maintenance/requests/${requestId}/tasks`)
            .pipe(tap((data) => this.tasksSignal.set(data)));
    }

    getAssignableStaff(): Observable<AssignableStaffOption[]> {
        return this.cacheService.getOrFetch(
            'maintenance-tasks:assignable-staff',
            () => this.http.get<AssignableStaffOption[]>(`${API_URL}/assignable-staff`),
            10 * 60 * 1000 // 10 minutes - staff list rarely changes
        );
    }

    create(task: MaintenanceTask): Observable<MaintenanceTask> {
        return this.http.post<MaintenanceTask>(API_URL, task).pipe(
            tap((newTask) => {
                this.tasksSignal.update((tasks) => [...tasks, newTask]);
                this.cacheService.clearPattern('maintenance-tasks:');
            })
        );
    }

    createForRequest(requestId: string, task: MaintenanceTask): Observable<MaintenanceTask> {
        return this.http.post<MaintenanceTask>(`http://localhost:8089/api/maintenance/requests/${requestId}/tasks`, task).pipe(
            tap((newTask) => this.tasksSignal.update((tasks) => [...tasks, newTask]))
        );
    }

    update(id: string, task: MaintenanceTask): Observable<MaintenanceTask> {
        return this.http.put<MaintenanceTask>(`${API_URL}/${id}`, task).pipe(
            tap((updatedTask) => {
                this.tasksSignal.update((tasks) => tasks.map((existing) => (existing.id === id ? updatedTask : existing)));
                this.cacheService.clearPattern('maintenance-tasks:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
                this.cacheService.clearPattern('maintenance-tasks:');
            })
        );
    }

    completeWithPhoto(taskId: string, afterPhoto: File): Observable<AiComparisonResult> {
        const formData = new FormData();
        formData.append('afterPhoto', afterPhoto);
        return this.http.post<AiComparisonResult>(`${API_URL}/${taskId}/complete-with-photo`, formData);
    }

    confirmCompletion(taskId: string): Observable<MaintenanceTask> {
        return this.http.post<MaintenanceTask>(`${API_URL}/${taskId}/confirm-completion`, {}).pipe(
            tap((updatedTask) => {
                this.tasksSignal.update((tasks) => tasks.map((existing) => (existing.id === taskId ? updatedTask : existing)));
            })
        );
    }
}

