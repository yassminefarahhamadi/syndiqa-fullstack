import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResidentProfile {
  accountId: string;
  organizationId: string;
  nationalId?: string;
  birthDate?: string;
  apartmentId?: string;
  buildingId?: string;
  moveInDate?: string;
  moveOutDate?: string;
  emergencyContact?: any;
  notifPrefs?: any[];
}

export interface Building {
  id: string;
  residenceId: string;
  name: string;
  floorsCount: number;
  parkingSpotsCount: number;
}

export interface Apartment {
  id: string;
  buildingId: string;
  floor: number;
  unitNumber: string;
  surfaceM2: number;
  type: string;
  status?: string;
}

export interface ResidentProfileData {
  profile: ResidentProfile | null;
  building: Building | null;
  apartment: Apartment | null;
}

@Injectable({
  providedIn: 'root'
})
export class ResidentProfileService {
  private apiUrl = 'http://localhost:8089/resident-profile';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<ResidentProfileData> {
    return this.http.get<ResidentProfileData>(`${this.apiUrl}/my-profile`);
  }

  updateMyProfile(profile: ResidentProfile): Observable<ResidentProfile> {
    return this.http.put<ResidentProfile>(`${this.apiUrl}/my-profile`, profile);
  }
}
