/**
 * =============================================================================
 * PARKING SPOT - COMPLETE ENTITY (Model + Service + Components)
 * =============================================================================
 * This file contains everything about the ParkingSpot entity consolidated
 * for easy integration when working with a monolithic structure.
 * =============================================================================
 */

import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { BuildingService } from './building-complete';
import { ResidenceService } from './residence-complete';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * ============================================================================
 * MODEL / INTERFACE
 * ============================================================================
 */
export interface ParkingSpot {
  id?: string;
  buildingId: string;
  number: number;
  type: string;
  status: string;
  organizationId?: string;
}

export interface Building {
  id?: string;
  residenceId: string;
  name: string;
  floorsCount: number;
  parkingSpotsCount: number;
}

export interface Residence {
  id?: string;
  name: string;
  address: string;
  city: string;
}

/**
 * ============================================================================
 * SERVICE
 * ============================================================================
 */
@Injectable({ providedIn: 'root' })
export class ParkingSpotService {
  private apiUrl = 'http://localhost:8089/api/parking-spots';

  constructor(private http: HttpClient) {}

  /**
   * Get all parking spots
   */
  getAll(): Observable<ParkingSpot[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<ParkingSpot[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<ParkingSpot[]>(this.apiUrl);
  }

  /**
   * Get all parking spots for a building
   */
  getByBuilding(buildingId: string): Observable<ParkingSpot[]> {
    return this.http.get<ParkingSpot[]>(`${this.apiUrl}/building/${buildingId}`);
  }

  /**
   * Get parking spot by ID
   */
  getById(id: string): Observable<ParkingSpot> {
    return this.http.get<ParkingSpot>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new parking spot
   */
  create(parkingSpot: ParkingSpot): Observable<ParkingSpot> {
    return this.http.post<ParkingSpot>(this.apiUrl, parkingSpot);
  }

  /**
   * Update existing parking spot
   */
  update(id: string, parkingSpot: ParkingSpot): Observable<ParkingSpot> {
    return this.http.put<ParkingSpot>(`${this.apiUrl}/${id}`, parkingSpot);
  }

  /**
   * Delete parking spot
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: PARKING SPOT FORM
 * ============================================================================
 * Used for creating and editing parking spots
 */
@Component({
  selector: 'app-parking-spot-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, CardModule, SelectModule, TagModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-amber-500 to-orange-700 text-white flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
            <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            {{ isEditMode ? 'Edit' : 'Add' }} Parking Spot
          </h3>
          <p class="text-amber-100 mt-2 m-0 opacity-80 text-sm">Assign slot number and parking category</p>
        </div>
      </div>

      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Primary Info -->
          <div class="flex flex-col gap-6">
            <div *ngIf="buildings.length === 1" class="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
               <span class="text-sm font-medium text-amber-700 dark:text-amber-300">Target Building</span>
               <p-tag [value]="buildings[0].name" severity="warn" [rounded]="true" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Spot Number / ID</label>
              <p-inputNumber [(ngModel)]="form.number" [showButtons]="true" [min]="1" [max]="maxSpotNumber" 
                buttonLayout="horizontal" spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="font-bold" />
              <small class="text-amber-600 font-semibold text-[10px]">Maximum allowed for this building: {{ maxSpotNumber }}</small>
            </div>
          </div>

          <!-- Attributes -->
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Spot Type</label>
              <p-select [options]="typeOptions" [(ngModel)]="form.type" placeholder="Select Type" styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Status</label>
              <div class="flex gap-2">
                <div *ngFor="let s of statusOptions" 
                     (click)="form.status = s"
                     [class]="'flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold text-xs ' + 
                              (form.status === s ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20' : 'border-surface-200 bg-surface-0 text-surface-500 dark:border-surface-700')">
                  {{ s }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Spot' : 'Create Spot'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="warn" styleClass="px-8 shadow-lg shadow-amber-500/20" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class ParkingSpotFormComponent implements OnChanges {
  @Input() parkingSpot: ParkingSpot | null = null;
  @Input() buildingId: string = '';
  @Input() buildings: Building[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: ParkingSpot = {
    buildingId: '',
    number: 1,
    type: 'Regular',
    status: 'AVAILABLE'
  };
  isEditMode = false;

  typeOptions = ['Regular', 'Accessible', 'Reserved'];
  statusOptions = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];
  maxSpotNumber = 0;

  constructor(private parkingSpotService: ParkingSpotService) {}

  ngOnChanges(): void {
    if (this.parkingSpot) {
      this.form = { ...this.parkingSpot };
      this.isEditMode = true;
    } else {
      this.form = {
        buildingId: this.buildingId || (this.buildings.length > 0 ? this.buildings[0].id! : ''),
        number: 1,
        type: 'Regular',
        status: 'AVAILABLE'
      };
      this.isEditMode = false;
    }
    
    // Set max spot number based on building's parkingSpotsCount
    if (this.buildings.length > 0) {
      const building = this.buildings[0];
      this.maxSpotNumber = building.parkingSpotsCount || 0;
    }
  }

  onSubmit(): void {
    if (!this.form.buildingId) {
      alert('Please select a building');
      return;
    }
    
    if (!this.form.number || this.form.number < 1) {
      alert('Please enter a valid parking spot number');
      return;
    }
    
    if (this.form.number > this.maxSpotNumber) {
      alert(`Spot number cannot exceed ${this.maxSpotNumber} (building max capacity)`);
      return;
    }
    
    if (!this.form.type) {
      alert('Please select a parking spot type');
      return;
    }
    
    // Check for duplicate spot number in the same building (only when creating new)
    if (!this.isEditMode) {
      this.parkingSpotService.getByBuilding(this.form.buildingId).subscribe({
        next: (spots) => {
          const isDuplicate = spots.some(s => s.number === this.form.number);
          if (isDuplicate) {
            alert(`A parking spot with number ${this.form.number} already exists in this building!`);
            return;
          }
          this.createParkingSpot();
        },
        error: () => this.createParkingSpot() // If error, allow creation anyway
      });
    } else {
      this.updateParkingSpot();
    }
  }

  private createParkingSpot(): void {
    this.parkingSpotService.create(this.form)
      .subscribe({
        next: (createdSpot) => {
          console.log('Parking spot created successfully', createdSpot);
          alert('Parking spot created successfully!');
          this.saved.emit();
        },
        error: (err) => {
          console.error('Error creating parking spot:', err);
          const errorMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error creating parking spot: ' + errorMsg);
        }
      });
  }

  private updateParkingSpot(): void {
    if (this.parkingSpot?.id) {
      this.parkingSpotService.update(this.parkingSpot.id, this.form)
        .subscribe({
          next: () => {
            console.log('Parking spot updated successfully', this.form);
            alert('Parking spot updated successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error updating parking spot:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error updating parking spot: ' + errorMsg);
          }
        });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

/**
 * ============================================================================
 * COMPONENT: PARKING SPOT LIST
 * ============================================================================
 * Displays list of all parking spots with CRUD operations
 */
@Component({
  selector: 'app-parking-spot-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ParkingSpotFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, CardModule, TagModule, TooltipModule, InputTextModule, SelectModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative background element -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <i class="pi pi-car text-3xl text-white"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Parking Management</h2>
              <div class="flex items-center gap-2 mt-2" *ngIf="residence && building">
                 <p-tag [value]="residence.name" severity="info" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
                 <i class="pi pi-angle-right text-white/50"></i>
                 <p-tag [value]="building.name" severity="warn" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
              </div>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button label="Back to Buildings" icon="pi pi-arrow-left" [outlined]="true" styleClass="text-white border-white/50 hover:bg-white/10" (onClick)="goBack()" />
          <p-button label="Add Parking Spot" icon="pi pi-plus" severity="contrast" styleClass="shadow-lg px-6 py-3 font-bold" (onClick)="onAdd()" />
        </div>
      </div>
    </div>

    <!-- Filter & Search Section -->
    <div class="mb-8 p-6 bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm" *ngIf="parkingSpots.length > 0 && !showForm">
       <div class="flex flex-col xl:flex-row items-end gap-4">
          <div class="flex-1 w-full">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Find Slot</label>
             <div class="p-inputgroup">
                <span class="p-inputgroup-addon bg-surface-50 dark:bg-surface-800"><i class="pi pi-search"></i></span>
                <input pInputText [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Search by number..." class="w-full" />
             </div>
          </div>
          
          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Status</label>
             <p-select [options]="[{label: 'All Statuses', value: ''}, {label: 'Available', value: 'available'}, {label: 'Occupied', value: 'occupied'}, {label: 'Reserved', value: 'reserved'}]" 
                       [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>

          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Slot Type</label>
             <p-select [options]="typeOptions" [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>
          
          <p-button icon="pi pi-filter-slash" [outlined]="true" severity="secondary" pTooltip="Clear Filters" (onClick)="clearFilters()" />
       </div>
       
       <div class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <span class="text-xs text-surface-500">Inventory: <b>{{ filteredParkingSpots.length }}</b> of <b>{{ parkingSpots.length }}</b> total slots</span>
          <div class="flex gap-2">
             <div class="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-full text-[10px] font-bold uppercase">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {{ getCountByStatus('AVAILABLE') }} Available
             </div>
             <div class="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-full text-[10px] font-bold uppercase">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                {{ getCountByStatus('OCCUPIED') }} Occupied
             </div>
          </div>
       </div>
    </div>

    <!-- Add/Edit Form -->
    <div *ngIf="showForm">
      <app-parking-spot-form
        [parkingSpot]="selectedParkingSpot"
        [buildingId]="buildingId"
        [buildings]="[building!]"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-parking-spot-form>
    </div>

    <!-- Parking Spots Card Grid -->
    <div *ngIf="filteredParkingSpots.length > 0 && !showForm" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <div *ngFor="let spot of filteredParkingSpots" class="group relative bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300">
        
        <div class="p-5 flex flex-col items-center text-center">
          <div class="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <i class="pi pi-car text-xl text-amber-600"></i>
          </div>
          
          <span class="text-lg font-black text-surface-900 dark:text-surface-0 mb-1">Spot {{ spot.number }}</span>
          <p-tag [value]="spot.status" [severity]="spot.status === 'AVAILABLE' ? 'success' : 'warn'" [rounded]="true" styleClass="text-[8px] px-2 py-0" />
          
          <div class="mt-4 pt-4 border-t border-surface-50 dark:border-surface-800 w-full">
             <span class="text-[10px] text-surface-400 uppercase font-bold">{{ spot.type }}</span>
          </div>
          
          <!-- Quick Actions Overlay -->
          <div class="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <p-button icon="pi pi-pencil" [text]="true" severity="info" size="small" (onClick)="onEdit(spot)" />
             <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(spot)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="filteredParkingSpots.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-3xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-map text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Slots Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">
         {{ parkingSpots.length > 0 ? 'No spots match your current filter selection.' : 'This building does not have any parking slots assigned yet.' }}
      </p>
      <div class="flex gap-3">
         <p-button *ngIf="searchTerm || statusFilter || typeFilter" label="Clear Filters" [outlined]="true" (onClick)="clearFilters()" />
         <p-button label="Initialize Parking" icon="pi pi-plus" (onClick)="onAdd()" />
      </div>
    </div>
  `,
  styles: [``]
})
export class ParkingSpotListComponent implements OnInit {
  parkingSpots: ParkingSpot[] = [];
  filteredParkingSpots: ParkingSpot[] = [];
  residenceId!: string;
  buildingId!: string;
  residence: Residence | null = null;
  building: Building | null = null;
  selectedParkingSpot: ParkingSpot | null = null;
  selectedParkingSpots: ParkingSpot[] = [];
  showForm = false;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  availableTypes: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parkingSpotService: ParkingSpotService,
    private buildingService: BuildingService,
    private residenceService: ResidenceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.residenceId = this.route.snapshot.queryParamMap.get('residenceId') || '';
    this.buildingId = this.route.snapshot.queryParamMap.get('buildingId') || '';
    
    if (!this.buildingId) {
      console.error('No buildingId provided');
      alert('Error: No building selected. Please select a building first.');
      this.router.navigate(['/pages/backoffice/property/residences']);
      return;
    }
    
    this.loadBuildingDetails();
    this.loadParkingSpots();
  }

  loadBuildingDetails(): void {
    if (this.buildingId) {
      this.buildingService.getById(this.buildingId).subscribe(data => {
        this.building = data;
      });
    }
  }

  loadParkingSpots(): void {
    this.parkingSpotService.getByBuilding(this.buildingId).subscribe(data => {
      this.parkingSpots = data;
      this.extractAvailableTypes();
      this.applyFilters();
    });
  }

  extractAvailableTypes(): void {
    const types = new Set(this.parkingSpots.map(s => s.type));
    this.availableTypes = Array.from(types).sort();
  }

  get typeOptions() {
    return [
      { label: 'All Types', value: '' },
      ...this.availableTypes.map(t => ({ label: t, value: t }))
    ];
  }

  getCountByStatus(status: string): number {
    return this.parkingSpots.filter(s => s.status === status).length;
  }

  applyFilters(): void {
    this.filteredParkingSpots = this.parkingSpots.filter(spot => {
      const matchesSearch = this.searchTerm === '' || spot.number.toString().includes(this.searchTerm);
      const matchesStatus = this.statusFilter === '' || spot.status?.toLowerCase() === this.statusFilter.toLowerCase();
      const matchesType = this.typeFilter === '' || spot.type === this.typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.applyFilters();
  }

  onAdd(): void {
    this.selectedParkingSpot = null;
    this.showForm = true;
  }

  onEdit(parkingSpot: ParkingSpot): void {
    this.selectedParkingSpot = { ...parkingSpot };
    this.showForm = true;
  }

  confirmDelete(parkingSpot: ParkingSpot): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this parking spot?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (parkingSpot.id) {
          this.parkingSpotService.delete(parkingSpot.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Parking spot deleted' });
              this.loadParkingSpots();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedParkingSpots.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedParkingSpots.length} parking spot(s)?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedParkingSpots.forEach(p => {
          if (p.id) {
            this.parkingSpotService.delete(p.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Parking spots deleted' });
        this.loadParkingSpots();
        this.selectedParkingSpots = [];
      }
    });
  }

  onFormSaved(): void {
    this.showForm = false;    this.loadBuildingDetails();    this.loadParkingSpots();
  }

  onFormCancelled(): void {
    this.showForm = false;
  }

  goBack(): void {
    if (this.residenceId) {
      this.router.navigate(['/pages/backoffice/property/buildings-by-residence', this.residenceId]);
    } else {
      this.router.navigate(['/pages/backoffice/property/buildings']);
    }
  }
}
