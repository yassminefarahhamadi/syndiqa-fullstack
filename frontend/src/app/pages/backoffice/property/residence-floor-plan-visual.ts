/**
 * =============================================================================
 * RESIDENCE FLOOR PLAN VISUAL — SVG Grid Floor Plan
 * =============================================================================
 * Interactive visual representation of building floors with apartments
 * displayed as SVG grid blocks with occupancy color coding
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ResidenceService } from './residence-complete';
import { BuildingService } from './building-complete';
import { ApartmentService } from './apartment-complete';

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

@Component({
  selector: 'app-residence-floor-plan-visual',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visual-plan-wrapper">
      <!-- Header -->
      <div class="plan-header">
        <div class="header-left">
          <h2>🏢 Visual Floor Plan</h2>
          <p class="subtitle" *ngIf="currentResidence">{{ currentResidence.name }}</p>
        </div>
        <div class="header-right">
          <button (click)="goBack()" class="back-btn">← Back</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading floor plan...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && buildings.length > 0" class="plan-content">
        <!-- Building Tabs -->
        <div class="building-tabs">
          <button
            *ngFor="let building of buildings"
            class="tab"
            [class.active]="selectedBuilding?.id === building.id"
            (click)="selectBuilding(building)"
          >
            {{ building.name }}
          </button>
        </div>

        <!-- Floor Tabs -->
        <div *ngIf="selectedBuilding" class="floor-tabs">
          <button
            *ngFor="let floor of getFloorNumbers()"
            class="floor-tab"
            [class.active]="selectedFloor === floor"
            (click)="selectFloor(floor)"
          >
            Floor {{ floor }}
          </button>
        </div>

        <!-- SVG Floor Plan -->
        <div *ngIf="selectedBuilding" class="svg-container">
          <svg [attr.viewBox]="'0 0 1000 600'" preserveAspectRatio="xMidYMid meet" class="floor-svg">
            <!-- Grid Background -->
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#grid)" />

            <!-- Apartments Grid -->
            <g *ngFor="let apt of getApartmentsOnFloor(); let i = index" 
               (mouseenter)="hoveredApt = apt"
               (mouseleave)="hoveredApt = null"
               class="apartment-group">
              <!-- Apartment Block -->
              <rect
                [attr.x]="getApartmentX(i)"
                [attr.y]="getApartmentY(i)"
                width="90"
                height="90"
                [attr.fill]="getApartmentColor(apt.status)"
                [attr.stroke]="hoveredApt?.id === apt.id ? '#1f2937' : '#d1d5db'"
                stroke-width="2"
                rx="4"
                class="apartment-rect"
                [class.hovered]="hoveredApt?.id === apt.id"
              />
              
              <!-- Unit Number -->
              <text
                [attr.x]="getApartmentX(i) + 45"
                [attr.y]="getApartmentY(i) + 35"
                text-anchor="middle"
                class="apartment-text unit-number"
              >
                {{ apt.unitNumber }}
              </text>

              <!-- Status Badge -->
              <circle
                [attr.cx]="getApartmentX(i) + 75"
                [attr.cy]="getApartmentY(i) + 10"
                r="8"
                [attr.fill]="getStatusBadgeColor(apt.status)"
                stroke="white"
                stroke-width="1"
              />

              <!-- Type Label -->
              <text
                [attr.x]="getApartmentX(i) + 45"
                [attr.y]="getApartmentY(i) + 60"
                text-anchor="middle"
                class="apartment-text type-label"
              >
                {{ apt.type }}
              </text>

              <!-- Hover Tooltip -->
              <g *ngIf="hoveredApt?.id === apt.id" class="tooltip">
                <rect
                  [attr.x]="getApartmentX(i) + 10"
                  [attr.y]="getApartmentY(i) - 50"
                  width="70"
                  height="40"
                  fill="white"
                  stroke="#d1d5db"
                  stroke-width="1"
                  rx="3"
                />
                <text
                  [attr.x]="getApartmentX(i) + 45"
                  [attr.y]="getApartmentY(i) - 30"
                  text-anchor="middle"
                  class="tooltip-text unit"
                >
                  {{ apt.unitNumber }}
                </text>
                <text
                  [attr.x]="getApartmentX(i) + 45"
                  [attr.y]="getApartmentY(i) - 15"
                  text-anchor="middle"
                  class="tooltip-text status"
                >
                  {{ apt.status }}
                </text>
              </g>
            </g>
          </svg>
        </div>

        <!-- Empty State -->
        <div *ngIf="!selectedBuilding" class="empty-state">
          <p>Select a building to view floor plan</p>
        </div>
      </div>

      <!-- No Data -->
      <div *ngIf="!loading && buildings.length === 0" class="empty-state">
        <h3>No buildings found</h3>
      </div>

      <!-- Legend -->
      <div class="legend">
        <h3>Legend</h3>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color occupied"></div>
            <span>Occupied</span>
          </div>
          <div class="legend-item">
            <div class="legend-color available"></div>
            <span>Available</span>
          </div>
          <div class="legend-item">
            <div class="legend-color maintenance"></div>
            <span>Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visual-plan-wrapper {
      padding: 20px;
      background: #f9fafb;
      min-height: 100vh;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
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
      color: #3b82f6;
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
      border: 4px solid #e5e7eb;
      border-top: 4px solid #3b82f6;
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
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      margin-bottom: 30px;
    }

    .building-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab {
      padding: 10px 18px;
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      color: #374151;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s;
    }

    .tab:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .tab.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .floor-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }

    .floor-tab {
      padding: 8px 14px;
      background: #f9fafb;
      border: 1px solid #d1d5db;
      color: #666;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      font-size: 12px;
      transition: all 0.3s;
    }

    .floor-tab:hover {
      background: #f3f4f6;
    }

    .floor-tab.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .svg-container {
      display: flex;
      justify-content: center;
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      overflow: auto;
    }

    .floor-svg {
      max-width: 100%;
      height: auto;
      width: 100%;
      max-height: 600px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      background: white;
    }

    .apartment-group {
      cursor: pointer;
    }

    .apartment-rect {
      transition: all 0.2s;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08));
    }

    .apartment-rect:hover {
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    }

    .apartment-rect.hovered {
      stroke-width: 3;
    }

    .apartment-text {
      font-size: 12px;
      font-weight: 600;
      fill: #1f2937;
      pointer-events: none;
    }

    .unit-number {
      font-size: 14px;
      font-weight: 700;
    }

    .type-label {
      font-size: 10px;
      fill: #666;
    }

    .tooltip {
      pointer-events: none;
    }

    .tooltip-text {
      font-size: 11px;
      font-weight: 600;
      fill: #374151;
      pointer-events: none;
    }

    .tooltip-text.unit {
      font-size: 12px;
      font-weight: 700;
    }

    .tooltip-text.status {
      font-size: 10px;
      fill: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
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
      color: #1f2937;
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

    .legend-color {
      width: 30px;
      height: 30px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    .legend-color.occupied {
      background: #fef3c7;
    }

    .legend-color.available {
      background: #d1fae5;
    }

    .legend-color.maintenance {
      background: #fed7aa;
    }
  `]
})
export class ResidenceFloorPlanVisualComponent implements OnInit {
  loading = true;
  currentResidence: any;
  buildings: Building[] = [];
  selectedBuilding: Building | null = null;
  selectedFloor = 1;
  apartments: Apartment[] = [];
  residenceId: string | null = null;
  hoveredApt: Apartment | null = null;

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

  getApartmentX(index: number): number {
    const col = index % 10;
    return 30 + col * 95;
  }

  getApartmentY(index: number): number {
    const row = Math.floor(index / 10);
    return 30 + row * 110;
  }

  getApartmentColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return '#fef3c7';
      case 'available':
        return '#d1fae5';
      case 'maintenance':
        return '#fed7aa';
      default:
        return '#f3f4f6';
    }
  }

  getStatusBadgeColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return '#fbbf24';
      case 'available':
        return '#10b981';
      case 'maintenance':
        return '#f97316';
      default:
        return '#d1d5db';
    }
  }

  goBack(): void {
    this.router.navigate(['/pages/backoffice/property/residences']);
  }
}
