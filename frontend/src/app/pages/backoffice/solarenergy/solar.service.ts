import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SolarSystem {
    id?: string;
    buildingId: string;
    capacityKw: number;
    installationDate: string;
    activeAnomaly?: boolean;
}

export interface AnomalyHistory {
    id: string;
    solarSystemId: string;
    timestamp: string;
    powerAtTime: number;
    baselineAtTime: number;
    anomalyType?: string;
    resolutionAction?: string;
    status: string;
    technicianNotes?: string;
    resolvedAt?: string;
}

export interface EnergyReading {
    id?: string;
    solarSystemId: string;
    voltage: number;
    current: number;
    power: number;
    timestamp?: string;
}

export interface PotentiometerReading {
    solarSystemId: string;
    analogValue: number;
}

export interface EnergyReport {
    id?: string;
    solarSystemId: string;
    period: string;
    totalEnergy: number;
    savingsEstimation: number;
    co2Avoided: number;
    treesPlantedEquivalent: number;
    dailyProduction: { [key: string]: number };
    dailyPeriodDistribution: { [key: string]: number };
}

export interface HourlyPrediction {
    hour: number;
    expectedPower: number;
}

export interface DailyPrediction {
    date: string;
    expectedTotalEnergy: number;
    expectedSavings: number;
    primaryWeather: string;
    hourlyProfile: HourlyPrediction[];
}

export interface PredictionResponse {
    solarSystemId: string;
    totalExpectedSavings: number;
    predictions: DailyPrediction[];
}

export interface GlobalSolarSummary {
    totalKwhAllTime: number;
    monthlyKwh: number;
    monthlySavings: number;
    activeSystemsCount: number;
    buildingCount: number;
    residentCount: number;
    totalOutstandingCharges: number;
}

import { map } from 'rxjs/operators';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class SolarService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8089';

    // Solar Systems
    getSolarSystems(): Observable<SolarSystem[]> {
        return this.http.get<PageResponse<SolarSystem>>(`${this.apiUrl}/solar`).pipe(map((response) => response.content));
    }

    createSolarSystem(system: SolarSystem): Observable<SolarSystem> {
        return this.http.post<SolarSystem>(`${this.apiUrl}/solar`, system);
    }

    updateSolarSystem(id: string, system: SolarSystem): Observable<SolarSystem> {
        return this.http.put<SolarSystem>(`${this.apiUrl}/solar/${id}`, system);
    }

    deleteSolarSystem(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/solar/${id}`);
    }

    // Energy Readings
    getReadings(solarId: string): Observable<EnergyReading[]> {
        return this.http.get<EnergyReading[]>(`${this.apiUrl}/readings/system/${solarId}`);
    }

    getAllReadings(): Observable<EnergyReading[]> {
        return this.http.get<EnergyReading[]>(`${this.apiUrl}/readings`);
    }

    createReading(reading: EnergyReading): Observable<EnergyReading> {
        return this.http.post<EnergyReading>(`${this.apiUrl}/readings`, reading);
    }

    createReadingFromPotentiometer(payload: PotentiometerReading): Observable<EnergyReading> {
        return this.http.post<EnergyReading>(`${this.apiUrl}/readings/device`, payload);
    }

    updateReading(id: string, reading: EnergyReading): Observable<EnergyReading> {
        return this.http.put<EnergyReading>(`${this.apiUrl}/readings/${id}`, reading);
    }

    deleteReading(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/readings/${id}`);
    }

    // Reports
    getReport(solarId: string, datePrefix: string = ''): Observable<EnergyReport> {
        let url = `${this.apiUrl}/reports/${solarId}${datePrefix ? '/period?datePrefix=' + datePrefix : ''}`;
        return this.http.get<EnergyReport>(url);
    }

    getPrediction(solarId: string): Observable<PredictionResponse> {
        return this.http.get<PredictionResponse>(`${this.apiUrl}/reports/${solarId}/prediction`);
    }

    getGlobalSummary(): Observable<GlobalSolarSummary> {
        return this.http.get<GlobalSolarSummary>(`${this.apiUrl}/reports/summary`);
    }

    // Anomaly History
    getAnomalies(systemId: string): Observable<AnomalyHistory[]> {
        return this.http.get<AnomalyHistory[]>(`${this.apiUrl}/api/anomalies/system/${systemId}`);
    }

    resolveAnomaly(id: string, data: { type: string; action: string; notes: string }): Observable<AnomalyHistory> {
        return this.http.put<AnomalyHistory>(`${this.apiUrl}/api/anomalies/${id}/resolve`, data);
    }
}
