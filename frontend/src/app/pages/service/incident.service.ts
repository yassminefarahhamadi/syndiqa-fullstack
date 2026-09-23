import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // ✅ import map
import { forkJoin } from 'rxjs';

export interface Incident {
  id: string;
  type: string;
  category?: string;
  description: string;
  buildingId: string;
  userId?: string;
  status?: string;
  reportedAt?: string;
  finalSeverity?: any;
  rating?: any;
  buildingName?: string;
  assignedDomain?: string; 
      audioPath?: string;
  evidencePhotos?: string[]; 
photoUrls?: {
    url: string;
    name: string;
    type: string;
  }[];}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {

  private baseUrl = 'http://localhost:8089/api/incidents'; // your backend endpoint

  constructor(private http: HttpClient) { }

  // Get all incidents

analyzeAudioByIncidentId(id: string) {
    return this.http.get<any>(
        `${this.baseUrl}/${id}/analyze-audio`
    );
}
getAllIncidents(): Observable<Incident[]> {
  return this.http.get<Incident[]>(this.baseUrl).pipe(
    map((incidents: Incident[]) => {

      return incidents.map((i: Incident) => {

        i.photoUrls = (i.evidencePhotos || []).map((f: string) => {

          // normalize filename
          const cleanName = f
            .replace(/\\/g, '/')
            .split('/')
            .pop() || '';

          const type = cleanName.split('.').pop()?.toLowerCase() || '';

          return {
            // ✅ FIXED: MUST match Spring WebConfig
            url: `http://localhost:8089/uploads/${cleanName}`,
            name: cleanName,
            type: type
          };
        });

        return i;
      });

    })
  );
}

getBuildingById(id: string) {
  return this.http.get<any>(`${this.baseUrl}/buildingg/${id}`);
}
  // Get incident by ID
  getById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/${id}`);
  }

  // Submit a new incident (with files)
  submitIncident(formData: FormData): Observable<Incident> {
    return this.http.post<Incident>(this.baseUrl, formData);
  }

  // Update status
  updateStatus(id: string, status: string): Observable<Incident> {
    return this.http.put<Incident>(`${this.baseUrl}/${id}/status?status=${status}`, {});
  }

  // Delete an incident
  deleteIncident(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Filter by category
  getByCategory(category: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.baseUrl}/category/${category}`);
  }

  // Filter by severity
  getBySeverity(severity: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.baseUrl}/severity/${severity}`);
  }

  // Filter by user
  getByUser(userId: string): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.baseUrl}/user/${userId}`);
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/${id}`);
  }
  getIncidentWithBuilding(id: string) {
  return forkJoin({
    incident: this.getIncidentById(id),
    building: this.getBuildingById(id)
  });
}

  getMyIncidents(): Observable<Incident[]> {
  return this.http.get<Incident[]>(`${this.baseUrl}/my`);
}

 investigateIncident(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/investigate`, {}, { responseType: 'text' });
  }

  resolveIncident(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/resolve`, {}, { responseType: 'text' });
  }

  markFalse(id: string): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}/false`, {}, { responseType: 'text' });

  }

  setInProgress(id: string): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}/in-progress`, {}, { responseType: 'text' });

  }



  getIncidentCounts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/counts`);
  }



  detectCategory(type?: string, description?: string): string {
  const text = ((type || '') + ' ' + (description || '')).toLowerCase();

  // SAFETY: fire, smoke, leak, security
  if (text.includes('fire') || text.includes('smoke') || text.includes('leak') || text.includes('security')) {
    return 'SAFETY';
  }

  // COMPLAINT: noise, neighbor, complaint
  if (text.includes('noise') || text.includes('neighbor') || text.includes('complaint') || text.includes('noisy')) {
    return 'COMPLAINT';
  }

  // PAYMENT: payment, invoice, refund
  if (text.includes('payment') || text.includes('invoice') || text.includes('refund')) {
    return 'PAYMENT';
  }

  // TECHNICAL: wifi, outage, it, technical
  if (text.includes('wifi') || text.includes('outage') || text.includes('it') || text.includes('technical') || text.includes('elevator')) {
    return 'TECHNICAL';
  }

  // Default category
  return 'OTHER';
}



assignDomain(id: string, domain: string) {
    return this.http.put<Incident>(
        `${this.baseUrl}/${id}/assign-domain`,
        {},
        {
            params: { domain }
        }
    );
}
private readonly USER_ID = '4c640542-1cbd-4d70-87d4-e2c10b661bcd';

updateIncidentStage(id: string, action: string, email?: string) {

  const url = `http://localhost:8089/api/incidents/${id}/${action}`;

  if (action === 'take') {
    return this.http.put(url, {}, {
      params: { email: email! }
    });
  }

  return this.http.put(url, {});
}

getResolvedForTechnician() {
    return this.http.get<any[]>(
      `${this.baseUrl}/technician/resolved`
    );
  }

  // 💰 CREATE BILL (charge)
  createCharge(request: any) {
    return this.http.post<any>(
      `${this.baseUrl}/incident-charge`,
      request
    );
  }

  getChargeByIncident(incidentId: string) {
  return this.http.get(`/api/charges/incident/${incidentId}`);
}

  // 🔥 GET BILL BY INCIDENT ID
  getBill(incidentId: string) {
    return this.http.get<any>(`${this.baseUrl}/technician/bill/${incidentId}`);
  }

  // In incident.service.ts
rateIncident(incidentId: string, rating: number): Observable<any> {
  return this.http.put(
    `http://localhost:8089/api/incidents/${incidentId}/rate`,
    { rating },   // ⚠️ IMPORTANT FIX (send JSON, not raw number)
    { responseType: 'text' }
  );
}

getOverview() {
    return this.http.get<any>(`${this.baseUrl}/overview`);
  }

  getWeekly() {
    return this.http.get<any[]>(`${this.baseUrl}/weekly`);
  }

  getCategory() {
    return this.http.get<any[]>(`${this.baseUrl}/category`);
  }
}
