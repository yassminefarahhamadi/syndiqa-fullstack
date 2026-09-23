/**
 * =============================================================================
 * BUILDING - COMPLETE ENTITY (Model + Service + Components)
 * =============================================================================
 * This file contains everything about the Building entity consolidated
 * for easy integration when working with a monolithic structure.
 * =============================================================================
 */

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
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
import { Observable, Subject } from 'rxjs';
import { ResidenceService } from './residence-complete';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * ============================================================================
 * MODEL / INTERFACE
 * ============================================================================
 */
export interface Building {
  id?: string;
  residenceId: string;
  name: string;
  floorsCount: number;
  parkingSpotsCount: number;
  organizationId?: string;
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
export class BuildingService {
  private apiUrl = 'http://localhost:8089/api/buildings';

  constructor(private http: HttpClient) {}

  /**
   * Get all buildings
   */
  getAll(): Observable<Building[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<Building[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<Building[]>(this.apiUrl);
  }

  /**
   * Get all buildings for a residence
   */
  getByResidence(residenceId: string): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.apiUrl}/residence/${residenceId}`);
  }

  /**
   * Get building by ID
   */
  getById(id: string): Observable<Building> {
    return this.http.get<Building>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new building
   */
  create(building: Building): Observable<Building> {
    return this.http.post<Building>(this.apiUrl, building);
  }

  /**
   * Update existing building
   */
  update(id: string, building: Building): Observable<Building> {
    return this.http.put<Building>(`${this.apiUrl}/${id}`, building);
  }

  /**
   * Delete building
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: BUILDING FORM
 * ============================================================================
 * Used for creating and editing buildings
 */
@Component({
  selector: 'app-building-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, CardModule, SelectModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-primary-600 to-primary-800 text-white flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
            <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            {{ isEditMode ? 'Edit' : 'Add' }} Building
          </h3>
          <p class="text-primary-100 mt-2 m-0 opacity-80 text-sm">Define building specifications and capacity</p>
        </div>
      </div>

      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Left Column: Primary Info -->
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Target Residence</label>
              <p-select 
                [options]="residences" 
                [(ngModel)]="form.residenceId" 
                optionLabel="name" 
                optionValue="id" 
                placeholder="Select a Residence"
                styleClass="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Building Name / Block</label>
              <input pInputText [(ngModel)]="form.name" placeholder="e.g., Block A, East Tower" class="w-full p-3 shadow-sm" />
            </div>
          </div>

          <!-- Right Column: Capacity -->
          <div class="flex flex-col gap-6 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
                <i class="pi pi-align-justify text-primary-500"></i> Number of Floors
              </label>
              <p-inputNumber [(ngModel)]="form.floorsCount" [showButtons]="true" [min]="1" [max]="100" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest flex items-center gap-2">
                <i class="pi pi-car text-primary-500"></i> Parking Spots Capacity
              </label>
              <p-inputNumber [(ngModel)]="form.parkingSpotsCount" [showButtons]="true" [min]="0" [max]="500" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Building' : 'Create Building'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="primary" styleClass="px-8 shadow-lg shadow-primary-500/20" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class BuildingFormComponent implements OnChanges {
  @Input() building: Building | null = null;
  @Input() residenceId: string = '';
  @Input() residences: Residence[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: Building = {
    id: undefined,
    residenceId: '',
    name: '',
    floorsCount: 1,
    parkingSpotsCount: 0
  };
  isEditMode = false;

  constructor(private buildingService: BuildingService) {}

  ngOnChanges(): void {
    if (this.building) {
      this.form = { ...this.building };
      this.isEditMode = true;
    } else {
      // Set default to first residence if available
      const defaultResidenceId = this.residenceId || (this.residences.length > 0 ? this.residences[0].id : '');
      this.form = {
        id: undefined,
        residenceId: defaultResidenceId || '',
        name: '',
        floorsCount: 1,
        parkingSpotsCount: 0
      };
      this.isEditMode = false;
    }
  }

  onSubmit(): void {
    if (!this.form.name?.trim()) {
      alert('Please enter a building name');
      return;
    }
    
    if (!this.form.residenceId) {
      alert('Please select a residence');
      return;
    }
    
    if (this.form.floorsCount < 1) {
      alert('Number of floors must be at least 1');
      return;
    }
    
    // Check for duplicate building name in the same residence (only when creating new)
    if (!this.isEditMode) {
      this.buildingService.getByResidence(this.form.residenceId).subscribe({
        next: (buildings) => {
          const isDuplicate = buildings.some(b => 
            b.name.toLowerCase() === this.form.name.toLowerCase()
          );
          if (isDuplicate) {
            alert(`A building named "${this.form.name}" already exists in this residence!`);
            return;
          }
          this.createBuilding();
        },
        error: () => this.createBuilding() // If error, allow creation anyway
      });
    } else {
      this.updateBuilding();
    }
  }

  private createBuilding(): void {
    this.buildingService.create(this.form)
      .subscribe({
        next: (createdBuilding) => {
          console.log('Building created successfully', createdBuilding);
          alert('Building created successfully!');
          this.saved.emit();
        },
        error: (err) => {
          console.error('Error creating building:', err);
          const errorMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error creating building: ' + errorMsg);
        }
      });
  }

  private updateBuilding(): void {
    if (this.building?.id) {
      this.buildingService.update(this.building.id, this.form)
        .subscribe({
          next: () => {
            console.log('Building updated successfully', this.form);
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error updating building:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error updating building: ' + errorMsg);
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
 * COMPONENT: BUILDING LIST
 * ============================================================================
 * Displays list of all buildings with CRUD operations
 */
@Component({
  selector: 'app-building-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BuildingFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, CardModule, TagModule, TooltipModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-surface-900 to-surface-800 dark:from-surface-950 dark:to-surface-900 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative background element -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
              <i class="pi pi-building text-3xl text-primary-400"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Buildings Management</h2>
              <div class="flex items-center gap-2 mt-2" *ngIf="selectedResidenceId && selectedResidenceName">
                 <p-tag [value]="selectedResidenceName" severity="info" [rounded]="true" styleClass="bg-primary-500/20 text-primary-200 border-primary-500/30" />
                 <span class="text-surface-400 text-sm">Portfolio Overview</span>
              </div>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button *ngIf="selectedResidenceId" label="Back to Residences" icon="pi pi-arrow-left" [outlined]="true" styleClass="text-white border-surface-700 hover:bg-surface-800" (onClick)="goBack()" />
          <p-button label="Add Building" icon="pi pi-plus" severity="primary" styleClass="shadow-lg shadow-primary-500/30 px-6 py-3 font-bold" (onClick)="onAdd()" />
        </div>
      </div>
    </div>

    <!-- Add/Edit Form -->
    <div [@fadeInOut] *ngIf="showForm">
      <app-building-form
        [building]="selectedBuilding"
        [residenceId]="selectedResidenceId"
        [residences]="residences"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-building-form>
    </div>

    <!-- Buildings Card Grid -->
    <div *ngIf="buildings.length > 0 && !showForm" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <div *ngFor="let building of buildings" class="group relative bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-2xl hover:border-primary-500/50 transition-all duration-500 overflow-hidden">
        
        <!-- Status Bar -->
        <div class="h-1.5 bg-gradient-to-r from-primary-500 to-indigo-500"></div>

        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0 group-hover:text-primary-500 transition-colors">{{ building.name }}</h3>
              <p class="text-xs text-surface-500 mt-1 uppercase tracking-widest font-semibold">Residential Block</p>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p-button icon="pi pi-pencil" [text]="true" severity="info" size="small" (onClick)="onEdit(building)" pTooltip="Edit Building" />
              <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(building)" pTooltip="Delete Building" />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700/50 flex flex-col items-center">
              <span class="text-2xl font-black text-surface-900 dark:text-surface-0">{{ building.floorsCount }}</span>
              <span class="text-[10px] font-bold text-surface-500 uppercase mt-1">Floors</span>
            </div>
            <div class="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-700/50 flex flex-col items-center">
              <span class="text-2xl font-black text-surface-900 dark:text-surface-0">{{ building.parkingSpotsCount }}</span>
              <span class="text-[10px] font-bold text-surface-500 uppercase mt-1">Parking</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
               <p-button label="Units" icon="pi pi-home" styleClass="w-full text-xs py-2.5" (onClick)="onManage(building)" />
               <p-button label="Parking" icon="pi pi-car" severity="help" [outlined]="true" styleClass="w-full text-xs py-2.5" (onClick)="onManageParking(building)" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <p-button label="Equip" icon="pi pi-cog" severity="warn" [outlined]="true" styleClass="w-full text-xs py-2.5" (onClick)="onManageEquipment(building)" />
               <p-button label="Areas" icon="pi pi-map" severity="success" [outlined]="true" styleClass="w-full text-xs py-2.5" (onClick)="onManageAreas(building)" />
            </div>
          </div>
        </div>

        <!-- Decorative element -->
        <div class="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="buildings.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-3xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-building text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Buildings Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">
         {{ selectedResidenceId ? 'This residence doesn\\'t have any buildings defined yet.' : 'Please select a residence to view its buildings.' }}
      </p>
      <p-button *ngIf="selectedResidenceId" label="Create First Building" icon="pi pi-plus" (onClick)="onAdd()" />
    </div>
  `,
  styles: [``]
})
export class BuildingListComponent implements OnInit, OnDestroy {
  buildings: Building[] = [];
  residences: Residence[] = [];
  selectedResidenceId: string = '';
  selectedResidenceName: string = '';
  selectedBuilding: Building | null = null;
  selectedBuildings: Building[] = [];
  showForm = false;
  private destroy$ = new Subject<void>();

  constructor(
    private buildingService: BuildingService,
    private residenceService: ResidenceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to route parameter changes
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const residenceId = params.get('residenceId');
        if (residenceId) {
          this.selectedResidenceId = residenceId;
          console.log('Loading buildings for residence:', residenceId);
        } else {
          this.selectedResidenceId = '';
        }
        this.loadResidences();
        this.loadBuildings();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadResidences(): void {
    this.residenceService.getAll().subscribe({
      next: (data) => {
        this.residences = data;
        console.log('Residences loaded:', this.residences);
        // Update selectedResidenceName if residenceId is set
        if (this.selectedResidenceId) {
          const residence = this.residences.find(r => r.id === this.selectedResidenceId);
          if (residence) {
            this.selectedResidenceName = residence.name;
          }
        }
      },
      error: (err) => {
        console.error('Error loading residences:', err);
        alert('Failed to load residences. Please refresh the page.');
      }
    });
  }

  loadBuildings(): void {
    if (this.selectedResidenceId) {
      // Load buildings for selected residence
      this.buildingService.getByResidence(this.selectedResidenceId)
        .subscribe({
          next: (data) => {
            this.buildings = data;
            console.log('Buildings loaded for residence:', this.selectedResidenceId, data);
          },
          error: (err) => {
            console.error('Error loading buildings:', err);
            this.buildings = [];
          }
        });
    } else {
      // Load all buildings when "-- All --" is selected
      this.buildingService.getAll()
        .subscribe({
          next: (data) => {
            this.buildings = data;
            console.log('All buildings loaded:', data);
          },
          error: (err) => {
            console.error('Error loading all buildings:', err);
            this.buildings = [];
          }
        });
    }
  }

  onResidenceChange(): void {
    this.loadBuildings();
  }

  onAdd(): void {
    this.selectedBuilding = null;
    // Auto-select first residence if none selected
    if (!this.selectedResidenceId && this.residences.length > 0) {
      this.selectedResidenceId = this.residences[0].id || '';
    }
    this.showForm = true;
  }

  onEdit(building: Building): void {
    this.selectedBuilding = { ...building };
    this.showForm = true;
  }

  onManage(building: Building): void {
    // Navigate to apartments for this building
    if (building.id) {
      this.router.navigate(['/pages/backoffice/property/apartments'], { 
        queryParams: { buildingId: building.id, residenceId: this.selectedResidenceId } 
      });
    }
  }

  onManageParking(building: Building): void {
    // Navigate to parking spots for this building
    if (building.id) {
      this.router.navigate(['/pages/backoffice/property/parking'], { 
        queryParams: { buildingId: building.id, residenceId: this.selectedResidenceId } 
      });
    }
  }

  onManageEquipment(building: Building): void {
    // Navigate to equipment for this building
    if (building.id) {
      this.router.navigate(['/pages/backoffice/property/equipment'], { 
        queryParams: { buildingId: building.id, residenceId: this.selectedResidenceId } 
      });
    }
  }

  onManageAreas(building: Building): void {
    // Navigate to common areas for this building
    if (building.id) {
      this.router.navigate(['/pages/backoffice/property/common-areas'], { 
        queryParams: { buildingId: building.id, residenceId: this.selectedResidenceId } 
      });
    }
  }

  confirmDelete(building: Building): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this building?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (building.id) {
          this.buildingService.delete(building.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Building deleted' });
              this.loadBuildings();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedBuildings.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedBuildings.length} building(s)?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedBuildings.forEach(b => {
          if (b.id) {
            this.buildingService.delete(b.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Buildings deleted' });
        this.loadBuildings();
        this.selectedBuildings = [];
      }
    });
  }

  onFormSaved(): void {
    this.showForm = false;
    // Ensure residenceId is set before reloading
    if (!this.selectedResidenceId && this.residences.length > 0) {
      this.selectedResidenceId = this.residences[0].id || '';
    }
    this.loadBuildings();
  }

  onFormCancelled(): void {
    this.showForm = false;
  }

  goBack(): void {
    this.router.navigate(['/pages/backoffice/property/residences']);
  }
}
