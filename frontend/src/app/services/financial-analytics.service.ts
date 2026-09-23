import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataCacheService } from '@/app/core/services/data-cache.service';

/**
 * Service for Financial Analytics and AI Insights API calls.
 */
@Injectable({
  providedIn: 'root'
})
export class FinancialAnalyticsService {
  private analyticsUrl = 'http://localhost:8089/api/v1/analytics';
  private aiUrl = 'http://localhost:8089/api/v1/ai';
  private distributeUrl = 'http://localhost:8089/api/v1/charges/distribute';

  constructor(
    private http: HttpClient,
    private cacheService: DataCacheService
  ) {}

  getDashboardData(buildingId?: string): Observable<any> {
    const cacheKey = buildingId 
      ? `analytics:dashboard:${buildingId}` 
      : 'analytics:dashboard:all';
    
    return this.cacheService.getOrFetch(
      cacheKey,
      () => {
        let url = `${this.analyticsUrl}/dashboard`;
        if (buildingId) {
          url += `?buildingId=${encodeURIComponent(buildingId)}`;
        }
        return this.http.get<any>(url);
      },
      3 * 60 * 1000 // 3 minutes
    );
  }

  generateAiInsights(): Observable<any> {
    return this.cacheService.getOrFetch(
      'analytics:ai-insights',
      () => this.http.post<any>(`${this.aiUrl}/insights`, {}),
      5 * 60 * 1000 // 5 minutes - AI insights don't change quickly
    );
  }

  previewDistribution(request: any): Observable<any> {
    return this.http.post<any>(`${this.distributeUrl}/preview`, request);
  }

  confirmDistribution(request: any): Observable<any> {
    return this.http.post<any>(`${this.distributeUrl}/confirm`, request);
  }
}
