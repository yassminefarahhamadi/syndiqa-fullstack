import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeaderboardEntry {
  buildingId: string;
  buildingName: string;
  rank: number;
  totalEnergyKwh: number;
  savingsTND: number;
  co2AvoidedKg: number;
  badge: string;
}

export interface EcoChallenge {
  id?: string;
  title: string;
  description: string;
  targetKwh: number;
  currentKwh: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  buildingId: string;
}

export interface ForestStats {
  buildingId: string;
  totalKwh: number;
  totalTrees: number;
  co2AvoidedKg: number;
  forestLevel: 'SEEDLING' | 'GROVE' | 'FOREST' | 'NATIONAL_PARK';
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8089/api';

  getLeaderboard(date?: string): Observable<LeaderboardEntry[]> {
    const url = date ? `${this.apiUrl}/leaderboard?date=${date}` : `${this.apiUrl}/leaderboard`;
    return this.http.get<LeaderboardEntry[]>(url);
  }

  getChallenges(buildingId?: string): Observable<EcoChallenge[]> {
    const url = buildingId ? `${this.apiUrl}/challenges?buildingId=${buildingId}` : `${this.apiUrl}/challenges`;
    return this.http.get<EcoChallenge[]>(url);
  }

  createChallenge(challenge: EcoChallenge): Observable<EcoChallenge> {
    return this.http.post<EcoChallenge>(`${this.apiUrl}/challenges`, challenge);
  }

  deleteChallenge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/challenges/${id}`);
  }

  getForestStats(buildingId: string): Observable<ForestStats> {
    return this.http.get<ForestStats>(`${this.apiUrl}/forest?buildingId=${buildingId}`);
  }

  getEngagementSummary(buildingId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/engagement/building/${buildingId}`);
  }
}
