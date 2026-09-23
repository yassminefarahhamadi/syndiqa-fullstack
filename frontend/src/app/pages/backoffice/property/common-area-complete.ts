/**
 * =============================================================================
 * COMMON AREA - COMPLETE ENTITY (Model + Service + Components)
 * =============================================================================
 * This file contains everything about the CommonArea entity consolidated
 * for easy integration. Common Areas are shared spaces in buildings that
 * belong to everyone and no single tenant owns them.
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { BuildingService } from './building-complete';
import { ResidenceService } from './residence-complete';

/**
 * ============================================================================
 * MODEL / INTERFACE
 * ============================================================================
 */
export interface CommonArea {
  id?: string;
  buildingId: string;
  name: string;
  type: string;
  status?: string; // e.g., 'AVAILABLE', 'UNDER_MAINTENANCE', 'CLOSED'
  floor: number; // Must be integer >= 0
  surfaceM2: number; // Must be >= 0
  description?: string;
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
export class CommonAreaService {
  private apiUrl = 'http://localhost:8089/api/common-areas';

  constructor(private http: HttpClient) {}

  /**
   * Get all common areas
   */
  getAll(): Observable<CommonArea[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<CommonArea[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<CommonArea[]>(this.apiUrl);
  }

  /**
   * Get all common areas for a building
   */
  getByBuilding(buildingId: string): Observable<CommonArea[]> {
    return this.http.get<CommonArea[]>(`${this.apiUrl}/building/${buildingId}`);
  }

  /**
   * Get common area by ID
   */
  getById(id: string): Observable<CommonArea> {
    return this.http.get<CommonArea>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new common area
   */
  create(commonArea: CommonArea): Observable<CommonArea> {
    return this.http.post<CommonArea>(this.apiUrl, commonArea);
  }

  /**
   * Update existing common area
   */
  update(id: string, commonArea: CommonArea): Observable<CommonArea> {
    return this.http.put<CommonArea>(`${this.apiUrl}/${id}`, commonArea);
  }

  /**
   * Delete common area
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: COMMON AREA FORM
 * ============================================================================
 * Used for creating and editing common areas
 */
@Component({
  selector: 'app-common-area-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, TextareaModule, CardModule, SelectModule, TagModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-teal-500 to-emerald-700 text-white flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
            <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            {{ isEditMode ? 'Edit' : 'Add' }} Common Area
          </h3>
          <p class="text-teal-100 mt-2 m-0 opacity-80 text-sm">Configure shared spaces and amenities</p>
        </div>
      </div>

      <div class="p-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left: Basic Info -->
          <div class="lg:col-span-7 flex flex-col gap-6">
            <div class="flex flex-col gap-2" *ngIf="buildings.length > 1">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Building</label>
              <p-select 
                [options]="buildings" 
                [(ngModel)]="form.buildingId" 
                optionLabel="name" 
                optionValue="id" 
                placeholder="Select Building"
                styleClass="w-full" />
            </div>
            
            <div *ngIf="buildings.length === 1" class="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-900/20 flex items-center justify-between">
               <span class="text-sm font-medium text-teal-700 dark:text-teal-300">Target Building</span>
               <p-tag [value]="buildings[0].name" severity="info" [rounded]="true" styleClass="bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Common Area Name</label>
                <p-select 
                  [options]="nameOptions" 
                  [(ngModel)]="form.name" 
                  (onChange)="onNameChange()"
                  placeholder="Select Name"
                  styleClass="w-full" />
              </div>

              <div class="flex flex-col gap-2 relative">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Area Type</label>
                <p-select 
                  [options]="typeOptions" 
                  [(ngModel)]="form.type" 
                  [disabled]="!!form.name"
                  placeholder="Select Type"
                  styleClass="w-full" />
                <span *ngIf="form.name" class="absolute -top-1 right-0 text-[9px] font-bold text-teal-500 uppercase tracking-wider bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">Auto-filled</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
               <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Current Status</label>
               <div class="flex gap-2">
                  <div *ngFor="let s of statusOptions" 
                       (click)="form.status = s"
                       [class]="'flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold text-[11px] uppercase tracking-wider ' + 
                                (form.status === s ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20' : 'border-surface-200 bg-surface-0 text-surface-500 dark:border-surface-700')">
                    {{ s.replace('_', ' ') }}
                  </div>
               </div>
            </div>
            
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Description</label>
              <textarea pTextarea [(ngModel)]="form.description" rows="3" class="w-full p-3 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-50 dark:bg-surface-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" placeholder="Additional details about this space..."></textarea>
            </div>
          </div>

          <!-- Right: Measurements -->
          <div class="lg:col-span-5 flex flex-col gap-6 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
            <h4 class="text-sm font-bold m-0 flex items-center gap-2 text-surface-700 dark:text-surface-200">
               <i class="pi pi-sliders-h text-teal-500"></i> Dimensions & Location
            </h4>
            
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter flex items-center gap-2">
                <i class="pi pi-align-justify"></i> Floor Level
              </label>
              <p-inputNumber [(ngModel)]="form.floor" [showButtons]="true" [min]="0" [max]="100" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
              <small class="text-surface-400 text-[10px]">0 = Ground, 1-N = Upper, 99 = Rooftop</small>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter flex items-center gap-2">
                <i class="pi pi-external-link"></i> Surface Area (m²)
              </label>
              <p-inputNumber [(ngModel)]="form.surfaceM2" [showButtons]="true" [min]="0" [max]="5000" [minFractionDigits]="1" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
            </div>

            <div class="mt-4 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 flex items-center gap-4">
               <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600">
                  <i class="pi pi-info-circle text-xl"></i>
               </div>
               <div class="flex-1 text-[11px] leading-relaxed text-surface-500">
                  Common area specifications are crucial for calculating accurate maintenance shares for residents.
               </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Area' : 'Create Area'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="success" styleClass="px-8 shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700 border-none" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class CommonAreaFormComponent implements OnChanges {
  @Input() commonArea: CommonArea | null = null;
  @Input() buildingId: string = '';
  @Input() buildings: Building[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: CommonArea = {
    id: undefined,
    buildingId: '',
    name: '',
    type: '',
    status: 'AVAILABLE',
    floor: 0,
    surfaceM2: 0,
    description: ''
  };
  isEditMode = false;

  // Common area name options
  nameOptions = [
    'Lobby / entrance hall',
    'Staircase',
    'Corridor / hallway on each floor',
    'Rooftop terrace',
    'Garden',
    'Swimming pool',
    'Gym',
    'Meeting room',
    'Laundry room',
    'Garbage room'
  ];

  // Common area type options
  typeOptions = [
    'Circulation',
    'Common',
    'Outdoor',
    'Recreation',
    'Service'
  ];

  // Status options
  statusOptions = ['AVAILABLE', 'UNDER_MAINTENANCE', 'CLOSED'];

  // Mapping of common area names to their types
  nameToTypeMap: { [key: string]: string } = {
    'Lobby / entrance hall': 'Common',
    'Staircase': 'Circulation',
    'Corridor / hallway on each floor': 'Circulation',
    'Rooftop terrace': 'Outdoor',
    'Garden': 'Outdoor',
    'Swimming pool': 'Recreation',
    'Gym': 'Recreation',
    'Meeting room': 'Recreation',
    'Laundry room': 'Service',
    'Garbage room': 'Service'
  };

  // Mapping of common area names to default floor numbers
  nameToFloorMap: { [key: string]: number } = {
    'Lobby / entrance hall': 0,
    'Staircase': 0,
    'Corridor / hallway on each floor': 0,
    'Rooftop terrace': 99, // Top floor representation
    'Garden': 0,
    'Swimming pool': 0,
    'Gym': 0,
    'Meeting room': 0,
    'Laundry room': 0,
    'Garbage room': 0
  };

  constructor(private commonAreaService: CommonAreaService) {}

  ngOnChanges(): void {
    if (this.commonArea) {
      this.form = { ...this.commonArea };
      this.isEditMode = true;
    } else {
      this.form = {
        id: undefined,
        buildingId: this.buildingId,
        name: '',
        type: '',
        status: 'AVAILABLE',
        floor: 0,
        surfaceM2: 0,
        description: ''
      };
      this.isEditMode = false;
    }
  }

  // Auto-fill type and floor when name is selected
  onNameChange(): void {
    if (this.form.name && this.nameToTypeMap[this.form.name]) {
      this.form.type = this.nameToTypeMap[this.form.name];
      this.form.floor = this.nameToFloorMap[this.form.name] || 0;
    } else {
      this.form.type = '';
      this.form.floor = 0;
    }
  }

  onSubmit(): void {
    if (!this.form.name || !this.form.type || !this.form.buildingId) {
      alert('Please fill in all required fields (Name, Type, Building)');
      return;
    }

    if (this.form.floor < 0) {
      alert('Floor must be 0 or greater (use 99 for rooftop)');
      return;
    }

    if (this.form.surfaceM2 < 0) {
      alert('Surface area must be 0 or greater');
      return;
    }
    
    // Send required fields to backend
    const submitData = {
      buildingId: this.form.buildingId,
      name: this.form.name,
      type: this.form.type,
      status: this.form.status || 'AVAILABLE',
      floor: Math.floor(this.form.floor), // Ensure integer
      surfaceM2: this.form.surfaceM2,
      description: this.form.description || ''
    };
    
    console.log('Submitting common area:', JSON.stringify(submitData, null, 2));
    
    if (this.isEditMode && this.commonArea?.id) {
      this.commonAreaService.update(this.commonArea.id, submitData as any)
        .subscribe({
          next: () => {
            console.log('✅ Common Area updated successfully', submitData);
            alert('Common area updated successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('❌ Error updating common area:', err);
            console.error('Status:', err.status);
            console.error('Full error object:', JSON.stringify(err, null, 2));
            let errorMsg = this.extractErrorMessage(err);
            alert('Error updating common area: ' + errorMsg);
          }
        });
    } else {
      this.commonAreaService.create(submitData as any)
        .subscribe({
          next: () => {
            console.log('✅ Common Area created successfully', submitData);
            alert('Common area created successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('❌ Error creating common area');
            console.error('HTTP Status:', err.status, err.statusText);
            console.error('Error object:', err);
            console.error('Error.error:', err.error);
            console.error('Error.error type:', typeof err.error);
            if (typeof err.error === 'object') {
              console.error('Error.error JSON:', JSON.stringify(err.error, null, 2));
            }
            let errorMsg = this.extractErrorMessage(err);
            alert('Error creating common area: ' + errorMsg);
          }
        });
    }
  }

  private extractErrorMessage(err: any): string {
    // Try multiple paths to extract error message
    if (err.error?.message) return err.error.message;
    if (err.error?.error) return err.error.error;
    if (err.error?.errorMessage) return err.error.errorMessage;
    if (typeof err.error === 'string') return err.error;
    if (err.statusText) return err.statusText;
    if (err.message) return err.message;
    return 'An unexpected error occurred';
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

/**
 * ============================================================================
 * COMPONENT: COMMON AREA LIST
 * ============================================================================
 * Displays list of all common areas with CRUD operations
 */
@Component({
  selector: 'app-common-area-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonAreaFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, CardModule, TagModule, TooltipModule, InputTextModule, SelectModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative background element -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <i class="pi pi-map text-3xl text-white"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Common Areas</h2>
              <div class="flex items-center gap-2 mt-2" *ngIf="residence && building">
                 <p-tag [value]="residence.name" severity="info" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
                 <i class="pi pi-angle-right text-white/50"></i>
                 <p-tag [value]="building.name" severity="success" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
              </div>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button label="Back to Buildings" icon="pi pi-arrow-left" [outlined]="true" styleClass="text-white border-white/50 hover:bg-white/10" (onClick)="goBack()" />
          <p-button label="Add Common Area" icon="pi pi-plus" severity="contrast" styleClass="shadow-lg px-6 py-3 font-bold" (onClick)="onAdd()" />
        </div>
      </div>
    </div>

    <!-- Filter & Search Section -->
    <div class="mb-8 p-6 bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm" *ngIf="commonAreas.length > 0 && !showForm">
       <div class="flex flex-col xl:flex-row items-end gap-4">
          <div class="flex-1 w-full">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Search Area</label>
             <div class="p-inputgroup">
                <span class="p-inputgroup-addon bg-surface-50 dark:bg-surface-800"><i class="pi pi-search"></i></span>
                <input pInputText [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Search by name (e.g., Gym, Lobby)..." class="w-full" />
             </div>
          </div>
          
          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Status</label>
             <p-select [options]="[{label: 'All Statuses', value: ''}, {label: 'Available', value: 'AVAILABLE'}, {label: 'Maintenance', value: 'UNDER_MAINTENANCE'}, {label: 'Closed', value: 'CLOSED'}]" 
                       [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>

          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Space Type</label>
             <p-select [options]="typeOptions" [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>
          
          <p-button icon="pi pi-filter-slash" [outlined]="true" severity="secondary" pTooltip="Clear Filters" (onClick)="clearFilters()" />
       </div>
       
       <div class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <span class="text-xs text-surface-500">Inventory: <b>{{ filteredCommonAreas.length }}</b> of <b>{{ commonAreas.length }}</b> total spaces</span>
          <div class="flex gap-2">
             <div class="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-full text-[10px] font-bold uppercase">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {{ getCountByStatus('AVAILABLE') }} Available
             </div>
             <div class="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-full text-[10px] font-bold uppercase">
                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                {{ getCountByStatus('UNDER_MAINTENANCE') }} Maintenance
             </div>
          </div>
       </div>
    </div>

    <!-- Add/Edit Form -->
    <div *ngIf="showForm">
      <app-common-area-form
        [commonArea]="selectedCommonAreaItem"
        [buildingId]="buildingId"
        [buildings]="building ? [building] : []"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-common-area-form>
    </div>

    <!-- Common Areas Grid -->
    <div *ngIf="filteredCommonAreas.length > 0 && !showForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div *ngFor="let area of filteredCommonAreas" class="group bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 overflow-hidden">
        
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center border border-teal-100 dark:border-teal-800">
               <i class="pi pi-clone text-xl text-teal-600"></i>
            </div>
            <p-tag [value]="area.status?.replace('_', ' ')" [severity]="getStatusSeverity(area.status)" [rounded]="true" styleClass="text-[9px] px-2 py-0.5" />
          </div>
          
          <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-4 truncate">{{ area.name }}</h3>
          
          <div class="space-y-3 mb-6">
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Floor</span>
                <span class="font-bold text-surface-900 dark:text-surface-0">{{ formatFloor(area.floor) }}</span>
             </div>
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Surface</span>
                <span class="font-bold text-surface-900 dark:text-surface-0">{{ area.surfaceM2 }} m²</span>
             </div>
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Type</span>
                <p-tag [value]="area.type" severity="secondary" styleClass="text-[10px] border border-surface-200 bg-transparent text-surface-600" />
             </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-surface-50 dark:border-surface-800">
            <p-button label="Edit" icon="pi pi-pencil" [text]="true" severity="info" size="small" styleClass="flex-1" (onClick)="onEdit(area)" />
            <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(area)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="filteredCommonAreas.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-3xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-clone text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Spaces Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">
         {{ commonAreas.length > 0 ? 'No spaces match your current filter selection.' : 'This building does not have any common areas defined yet.' }}
      </p>
      <div class="flex gap-3">
         <p-button *ngIf="searchTerm || statusFilter || typeFilter" label="Clear Filters" [outlined]="true" (onClick)="clearFilters()" />
         <p-button label="Add First Space" icon="pi pi-plus" (onClick)="onAdd()" />
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-button.p-button-contrast {
      background: var(--surface-900);
      color: var(--surface-0);
      border: none;
    }
  `]
})
export class CommonAreaListComponent implements OnInit {
  commonAreas: CommonArea[] = [];
  filteredCommonAreas: CommonArea[] = [];
  buildingId: string = '';
  residenceId: string = '';
  building: Building | null = null;
  residence: Residence | null = null;
  selectedCommonAreaItem: CommonArea | null = null;
  selectedCommonAreas: CommonArea[] = [];
  showForm = false;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  availableTypes: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commonAreaService: CommonAreaService,
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
    this.loadResidenceDetails();
    this.loadCommonAreas();
  }

  loadBuildingDetails(): void {
    if (this.buildingId) {
      this.buildingService.getById(this.buildingId).subscribe(data => {
        this.building = data;
      });
    }
  }

  loadResidenceDetails(): void {
    if (this.residenceId) {
      this.residenceService.getById(this.residenceId).subscribe(data => {
        this.residence = data;
      });
    } else {
      // Try to get residence from building
      if (this.building) {
        this.residenceService.getById(this.building.residenceId).subscribe(data => {
          this.residence = data;
        });
      }
    }
  }

  loadCommonAreas(): void {
    this.commonAreaService.getByBuilding(this.buildingId).subscribe(data => {
      this.commonAreas = data;
      this.extractAvailableTypes();
      this.applyFilters();
    });
  }

  extractAvailableTypes(): void {
    const types = new Set(this.commonAreas.map(a => a.type));
    this.availableTypes = Array.from(types).sort();
  }

  get typeOptions() {
    return [
      { label: 'All Types', value: '' },
      ...this.availableTypes.map(t => ({ label: t, value: t }))
    ];
  }

  getCountByStatus(status: string): number {
    return this.commonAreas.filter(a => a.status === status).length;
  }

  getStatusSeverity(status: string | undefined): any {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'UNDER_MAINTENANCE': return 'warn';
      case 'CLOSED': return 'danger';
      default: return 'info';
    }
  }

  applyFilters(): void {
    this.filteredCommonAreas = this.commonAreas.filter(area => {
      const matchesSearch = this.searchTerm === '' || area.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === '' || area.status === this.statusFilter;
      const matchesType = this.typeFilter === '' || area.type === this.typeFilter;
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
    this.selectedCommonAreaItem = null;
    this.showForm = true;
  }

  onEdit(area: CommonArea): void {
    this.selectedCommonAreaItem = { ...area };
    this.showForm = true;
  }

  confirmDelete(area: CommonArea): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this common area?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (area.id) {
          this.commonAreaService.delete(area.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Common Area deleted' });
              this.loadCommonAreas();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedCommonAreas.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedCommonAreas.length} common area(s)?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedCommonAreas.forEach(ca => {
          if (ca.id) {
            this.commonAreaService.delete(ca.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Common Areas deleted' });
        this.loadCommonAreas();
        this.selectedCommonAreas = [];
      }
    });
  }

  onFormSaved(): void {
    this.showForm = false;
    this.loadBuildingDetails();
    this.loadResidenceDetails();
    this.loadCommonAreas();
  }

  onFormCancelled(): void {
    this.showForm = false;
  }

  formatFloor(floor: number | undefined): string {
    if (floor === undefined || floor === null) return '-';
    if (floor === 0) return 'Ground Floor';
    if (floor === 99) return 'Rooftop';
    return `Floor ${floor}`;
  }

  goBack(): void {
    if (this.residenceId) {
      this.router.navigate(['/pages/backoffice/property/buildings-by-residence', this.residenceId]);
    } else {
      this.router.navigate(['/pages/backoffice/property/buildings']);
    }
  }
}
