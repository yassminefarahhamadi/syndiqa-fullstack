import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alert {
  id: string;
  message: string;
  incidentId: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private baseUrl = 'http://localhost:8089/api/alerts'; // your backend URL

  constructor(private http: HttpClient) {}

  getAllAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.baseUrl);
  }

   markAsRead(id: string): Observable<Alert> {
    return this.http.put<Alert>(`${this.baseUrl}/${id}/read`, {});
  }
}
