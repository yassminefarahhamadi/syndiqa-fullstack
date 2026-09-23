import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExecutionStat {
  methodName: string;
  duration: number;
  success: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExecutionStatService {

  private apiUrl = 'http://localhost:8089/api/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<ExecutionStat[]> {
    return this.http.get<ExecutionStat[]>(this.apiUrl);
  }

  getSummary() {
  return this.http.get<any>('http://localhost:8089/api/stats/summary');
}

getWeeklyStats() {
  return this.http.get<any[]>('http://localhost:8089/api/stats/weekly');
}
}