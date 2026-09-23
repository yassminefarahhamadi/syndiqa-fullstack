import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Building } from '../../models/financial.model';
import { DataCacheService } from '@/app/core/services/data-cache.service';

const API_URL = 'http://localhost:8089/api/buildings';

@Injectable({ providedIn: 'root' })
export class BuildingService {
    private buildingsSignal = signal<Building[]>([]);
    readonly buildings = this.buildingsSignal.asReadonly();

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {}

    getAll(): Observable<Building[]> {
        return this.cacheService.getOrFetch(
            'buildings:all',
            () => this.http.get<Building[]>(API_URL),
            10 * 60 * 1000 // 10 minutes
        ).pipe(
            tap(data => this.buildingsSignal.set(data))
        );
    }

    getById(id: string): Observable<Building> {
        return this.cacheService.getOrFetch(
            `buildings:${id}`,
            () => this.http.get<Building>(`${API_URL}/${id}`),
            10 * 60 * 1000 // 10 minutes
        );
    }

    getByOrganization(organizationId: string): Observable<Building[]> {
        return this.cacheService.getOrFetch(
            `buildings:org:${organizationId}`,
            () => this.http.get<Building[]>(`${API_URL}/organization/${organizationId}`),
            10 * 60 * 1000 // 10 minutes
        ).pipe(
            tap(data => this.buildingsSignal.set(data))
        );
    }

    getByResidence(residenceId: string): Observable<Building[]> {
        return this.cacheService.getOrFetch(
            `buildings:residence:${residenceId}`,
            () => this.http.get<Building[]>(`${API_URL}/residence/${residenceId}`),
            10 * 60 * 1000 // 10 minutes
        ).pipe(
            tap(data => this.buildingsSignal.set(data))
        );
    }

    create(building: Building): Observable<Building> {
        return this.http.post<Building>(API_URL, building).pipe(
            tap(newBuilding => {
                this.buildingsSignal.update(buildings => [...buildings, newBuilding]);
                // Clear cache on write
                this.cacheService.clearPattern('buildings:');
            })
        );
    }

    update(id: string, building: Building): Observable<Building> {
        return this.http.put<Building>(`${API_URL}/${id}`, building).pipe(
            tap(updatedBuilding => {
                this.buildingsSignal.update(buildings => 
                    buildings.map(b => b.id === id ? updatedBuilding : b)
                );
                // Clear cache on write
                this.cacheService.clearPattern('buildings:');
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${API_URL}/${id}`).pipe(
            tap(() => {
                this.buildingsSignal.update(buildings => buildings.filter(b => b.id !== id));
                // Clear cache on write
                this.cacheService.clearPattern('buildings:');
            })
        );
    }
}
