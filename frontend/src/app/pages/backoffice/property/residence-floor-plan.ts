/**
 * =============================================================================
 * RESIDENCE FLOOR PLAN VIEWER
 * =============================================================================
 * Interactive 2D visualization of building layouts with floor-by-floor
 * apartment overview, color-coded by occupancy status
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ResidenceService } from './residence-complete';
import { BuildingService } from './building-complete';
import { ApartmentService } from './apartment-complete';
import { OccupiedCountPipe, AvailableCountPipe, MaintenanceCountPipe } from './apartment-status-pipes';

interface Building {
  id?: string;
  name: string;
  floorsCount: number;
}

interface Apartment {
  id?: string;
  unitNumber: string;
  floor: number;
  type: string;
  status?: string;
  surfaceM2?: number;
}

interface FloorData {
  floorNumber: number;
  apartments: Apartment[];
}

@Component({
  selector: 'app-residence-floor-plan',
  standalone: true,
  imports: [CommonModule, OccupiedCountPipe, AvailableCountPipe, MaintenanceCountPipe],
  template: `
    <div class="floor-plan-wrapper">
      <!-- Header -->
      <div class="plan-header">
        <div class="header-left">
          <h2>🏗️ Building Floor Plan</h2>
          <p class="subtitle" *ngIf="currentResidence">{{ currentResidence.name }}</p>
        </div>
        <div class="header-right">
          <button (click)="goBack()" class="back-btn">← Back to Residences</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading floor plan...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && buildings.length > 0" class="plan-content">
        <!-- Building Selector -->
        <div class="building-selector">
          <h3>📍 Select Building:</h3>
          <div class="building-buttons">
            <button
              *ngFor="let building of buildings"
              class="building-btn"
              [class.active]="selectedBuilding?.id === building.id"
              (click)="selectBuilding(building)"
            >
              {{ building.name }}
            </button>
          </div>
        </div>

        <!-- Floor Plan -->
        <div *ngIf="selectedBuilding" class="floor-plan-section">
          <!-- Floor Selector -->
          <div class="floor-selector">
            <h3>📊 Select Floor:</h3>
            <div class="floor-tabs">
              <button
                *ngFor="let floor of getFloorNumbers()"
                class="floor-tab"
                [class.active]="selectedFloor === floor"
                (click)="selectFloor(floor)"
              >
                Floor {{ floor }}
              </button>
            </div>
          </div>

          <!-- Apartments Grid -->
          <div class="apartments-section">
            <h3>🏠 Apartments on Floor {{ selectedFloor }}</h3>
            <div *ngIf="getApartmentsOnFloor().length > 0" class="apartments-grid">
              <div
                *ngFor="let apt of getApartmentsOnFloor()"
                class="apartment-card"
                [class]="'status-' + (apt.status | lowercase)"
              >
                <div class="apt-header">
                  <h4>{{ apt.unitNumber }}</h4>
                  <span class="status-badge" [class]="(apt.status | lowercase)">
                    {{ apt.status }}
                  </span>
                </div>
                <div class="apt-body">
                  <p class="apt-detail">
                    <span class="label">Type:</span>
                    <span class="value">{{ apt.type }}</span>
                  </p>
                  <p *ngIf="apt.surfaceM2" class="apt-detail">
                    <span class="label">Surface:</span>
                    <span class="value">{{ apt.surfaceM2 }} m²</span>
                  </p>
                </div>
              </div>
            </div>
            <div *ngIf="getApartmentsOnFloor().length === 0" class="no-apartments">
              <p>No apartments on this floor</p>
            </div>
          </div>

          <!-- Floor Summary -->
          <div class="floor-summary">
            <h3>📈 Floor Summary</h3>
            <div class="summary-stats">
              <div class="stat">
                <span class="stat-label">Total Apartments:</span>
                <span class="stat-value">{{ getApartmentsOnFloor().length }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Occupied:</span>
                <span class="stat-value occupied">
                  {{ (getApartmentsOnFloor() | occupiedCount) }}
                </span>
              </div>
              <div class="stat">
                <span class="stat-label">Available:</span>
                <span class="stat-value available">
                  {{ (getApartmentsOnFloor() | availableCount) }}
                </span>
              </div>
              <div class="stat">
                <span class="stat-label">Maintenance:</span>
                <span class="stat-value maintenance">
                  {{ (getApartmentsOnFloor() | maintenanceCount) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!selectedBuilding" class="empty-state">
          <p>Select a building to view floor plan</p>
        </div>
      </div>

      <!-- No Data -->
      <div *ngIf="!loading && buildings.length === 0" class="empty-state">
        <h3>No buildings found for this residence</h3>
        <p>Buildings will appear here once added to the system</p>
      </div>

      <!-- Legend -->
      <div class="legend">
        <h3>Legend</h3>
        <div class="legend-items">
          <div class="legend-item occupied">
            <span class="legend-box"></span> Occupied
          </div>
          <div class="legend-item available">
            <span class="legend-box"></span> Available
          </div>
          <div class="legend-item maintenance">
            <span class="legend-box"></span> Maintenance
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .floor-plan-wrapper {
      padding: 20px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    }

    .header-left h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .back-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s;
    }

    .back-btn:hover {
      background: white;
      color: #667eea;
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e8ecf1;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .plan-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      margin-bottom: 30px;
    }

    .building-selector {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e0e0e0;
    }

    .building-selector h3,
    .floor-selector h3,
    .floor-summary h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
    }

    .building-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .building-btn {
      padding: 10px 20px;
      background: #f0f4ff;
      border: 2px solid #667eea;
      color: #667eea;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s;
    }

    .building-btn:hover {
      background: #667eea;
      color: white;
    }

    .building-btn.active {
      background: #667eea;
      color: white;
    }

    .floor-plan-section {
      margin-top: 30px;
    }

    .floor-selector {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .floor-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .floor-tab {
      padding: 8px 16px;
      background: #f9fafb;
      border: 2px solid #ddd;
      color: #666;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s;
    }

    .floor-tab:hover {
      background: #e8ecf1;
      border-color: #667eea;
    }

    .floor-tab.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .apartments-section {
      margin: 30px 0;
    }

    .apartments-section h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
    }

    .apartments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .apartment-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s;
      cursor: pointer;
    }

    .apartment-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .apartment-card.status-occupied {
      border-left: 5px solid #fef3c7;
      background: #fffbf0;
    }

    .apartment-card.status-available {
      border-left: 5px solid #d1fae5;
      background: #f0fdf4;
    }

    .apartment-card.status-maintenance {
      border-left: 5px solid #fed7aa;
      background: #fffbf0;
    }

    .apt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .apt-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.3);
      color: white;
    }

    .apt-body {
      padding: 15px;
    }

    .apt-detail {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin: 8px 0;
    }

    .apt-detail:last-child {
      margin-bottom: 0;
    }

    .apt-detail .label {
      font-weight: 600;
      color: #667eea;
    }

    .apt-detail .value {
      color: #555;
    }

    .no-apartments {
      text-align: center;
      padding: 40px;
      color: #999;
      background: #f9fafb;
      border-radius: 8px;
    }

    .floor-summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }

    .stat-value.occupied {
      color: #fbbf24;
    }

    .stat-value.available {
      color: #10b981;
    }

    .stat-value.maintenance {
      color: #f97316;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      color: #999;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #333;
    }

    .legend {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .legend h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 700;
      color: #2c3e50;
    }

    .legend-items {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
    }

    .legend-box {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 3px;
    }

    .legend-item.occupied .legend-box {
      background: #fef3c7;
      border: 2px solid #fbbf24;
    }

    .legend-item.available .legend-box {
      background: #d1fae5;
      border: 2px solid #10b981;
    }

    .legend-item.maintenance .legend-box {
      background: #fed7aa;
      border: 2px solid #f97316;
    }
  `]
})
export class ResidenceFloorPlanComponent implements OnInit {
  loading = true;
  currentResidence: any;
  buildings: Building[] = [];
  selectedBuilding: Building | null = null;
  selectedFloor = 1;
  apartments: Apartment[] = [];
  residenceId: string | null = null;

  constructor(
    private residenceService: ResidenceService,
    private buildingService: BuildingService,
    private apartmentService: ApartmentService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.residenceId = params['residenceId'];
      this.loadData();
    });
  }

  private loadData(): void {
    if (!this.residenceId) {
      this.loading = false;
      return;
    }

    this.residenceService.getAll().toPromise().then(residences => {
      this.currentResidence = residences?.find(r => r.id === this.residenceId);
      
      if (!this.currentResidence) {
        this.loading = false;
        return;
      }

      this.buildingService.getByResidence(this.residenceId!).toPromise().then(buildings => {
        this.buildings = buildings || [];
        
        if (this.buildings.length > 0) {
          this.selectBuilding(this.buildings[0]);
        } else {
          this.loading = false;
        }
      });
    });
  }

  selectBuilding(building: Building): void {
    this.selectedBuilding = building;
    this.selectedFloor = 1;
    this.loadApartments();
  }

  selectFloor(floor: number): void {
    this.selectedFloor = floor;
  }

  private loadApartments(): void {
    if (!this.selectedBuilding?.id) return;

    this.loading = true;
    this.apartmentService.getByBuilding(this.selectedBuilding.id).toPromise().then(apts => {
      this.apartments = apts || [];
      this.loading = false;
    });
  }

  getFloorNumbers(): number[] {
    if (!this.selectedBuilding) return [];
    const floors = [];
    for (let i = 1; i <= this.selectedBuilding.floorsCount; i++) {
      floors.push(i);
    }
    return floors;
  }

  getApartmentsOnFloor(): Apartment[] {
    return this.apartments.filter(apt => apt.floor === this.selectedFloor);
  }

  goBack(): void {
    this.router.navigate(['/pages/backoffice/property/residences']);
  }
}
