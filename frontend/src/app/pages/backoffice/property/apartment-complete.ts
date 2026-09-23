/**
 * =============================================================================
 * APARTMENT - COMPLETE ENTITY (Model + Service + Components)
 * =============================================================================
 * This file contains everything about the Apartment entity consolidated
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
export interface Apartment {
  id?: string;
  buildingId: string;
  floor: number;
  unitNumber: string;
  surfaceM2: number;
  type: string;
  status?: string;
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
export class ApartmentService {
  private apiUrl = 'http://localhost:8089/api/apartments';

  constructor(private http: HttpClient) {}

  /**
   * Get all apartments
   */
  getAll(): Observable<Apartment[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<Apartment[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<Apartment[]>(this.apiUrl);
  }

  /**
   * Get all apartments for a building
   */
  getByBuilding(buildingId: string): Observable<Apartment[]> {
    return this.http.get<Apartment[]>(`${this.apiUrl}/building/${buildingId}`);
  }

  /**
   * Get apartment by ID
   */
  getById(id: string): Observable<Apartment> {
    return this.http.get<Apartment>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new apartment
   */
  create(apartment: Apartment): Observable<Apartment> {
    return this.http.post<Apartment>(this.apiUrl, apartment);
  }

  /**
   * Update existing apartment
   */
  update(id: string, apartment: Apartment): Observable<Apartment> {
    return this.http.put<Apartment>(`${this.apiUrl}/${id}`, apartment);
  }

  /**
   * Delete apartment
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: APARTMENT FORM
 * ============================================================================
 * Used for creating and editing apartments
 */
@Component({
  selector: 'app-apartment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, CardModule, SelectModule, TagModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-primary-600 to-indigo-700 text-white flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
            <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            {{ isEditMode ? 'Edit' : 'Add' }} Apartment
          </h3>
          <p class="text-primary-100 mt-2 m-0 opacity-80 text-sm">Configure unit details, area, and current status</p>
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
            
            <div *ngIf="buildings.length === 1" class="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 flex items-center justify-between">
               <span class="text-sm font-medium text-primary-700 dark:text-primary-300">Target Building</span>
               <p-tag [value]="buildings[0].name" severity="info" [rounded]="true" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Unit Number</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon"><i class="pi pi-id-card"></i></span>
                  <input pInputText [(ngModel)]="form.unitNumber" placeholder="e.g., A-101" class="w-full" />
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Apartment Type</label>
                <p-select 
                  [options]="typeOptions" 
                  [(ngModel)]="form.type" 
                  placeholder="Select Type"
                  styleClass="w-full" />
              </div>
            </div>

            <div class="flex flex-col gap-2">
               <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Current Status</label>
               <div class="flex gap-2">
                  <div *ngFor="let s of statusOptions" 
                       (click)="form.status = s"
                       [class]="'flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold text-sm ' + 
                                (form.status === s ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20' : 'border-surface-200 bg-surface-0 text-surface-500 dark:border-surface-700')">
                    {{ s }}
                  </div>
               </div>
            </div>
          </div>

          <!-- Right: Measurements -->
          <div class="lg:col-span-5 flex flex-col gap-6 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
            <h4 class="text-sm font-bold m-0 flex items-center gap-2 text-surface-700 dark:text-surface-200">
               <i class="pi pi-sliders-h text-primary-500"></i> Dimensions & Location
            </h4>
            
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter flex items-center gap-2">
                <i class="pi pi-align-justify"></i> Floor Level
              </label>
              <p-inputNumber [(ngModel)]="form.floor" [showButtons]="true" [min]="0" [max]="100" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter flex items-center gap-2">
                <i class="pi pi-external-link"></i> Surface Area (m²)
              </label>
              <p-inputNumber [(ngModel)]="form.surfaceM2" [showButtons]="true" [min]="1" [max]="1000" [minFractionDigits]="1" buttonLayout="horizontal" 
                spinnerMode="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                styleClass="w-full" inputStyleClass="text-center font-bold" />
            </div>

            <div class="mt-4 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 flex items-center gap-4">
               <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                  <i class="pi pi-info-circle text-xl"></i>
               </div>
               <div class="flex-1 text-[11px] leading-relaxed text-surface-500">
                  Accurate measurements ensure better price predictions and property valuations.
               </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Apartment' : 'Create Apartment'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="primary" styleClass="px-8 shadow-lg shadow-primary-500/20" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class ApartmentFormComponent implements OnChanges {
  @Input() apartment: Apartment | null = null;
  @Input() buildingId: string = '';
  @Input() buildings: Building[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: Apartment = {
    id: undefined,
    buildingId: '',
    floor: 1,
    unitNumber: '',
    surfaceM2: 1,
    type: '',
    status: 'AVAILABLE'
  };
  isEditMode = false;

  statusOptions = ['AVAILABLE', 'OCCUPIED'];
  typeOptions = ['1BR', '2BR', '3BR', 'Studio'];

  constructor(private apartmentService: ApartmentService) {}

  ngOnChanges(): void {
    if (this.apartment) {
      this.form = { ...this.apartment };
      this.isEditMode = true;
    } else {
      this.form = {
        id: undefined,
        buildingId: this.buildingId || (this.buildings.length > 0 ? this.buildings[0].id! : ''),
        floor: 1,
        unitNumber: '',
        surfaceM2: 1,
        type: '',
        status: 'AVAILABLE'
      };
      this.isEditMode = false;
    }
  }

  onSubmit(): void {
    if (!this.form.buildingId) {
      alert('Please select a building');
      return;
    }
    
    if (!this.form.unitNumber?.trim()) {
      alert('Please enter a unit number');
      return;
    }
    
    if (!this.form.type) {
      alert('Please select an apartment type');
      return;
    }
    
    if (!this.form.floor || this.form.floor < 1) {
      alert('Please enter a valid floor number');
      return;
    }
    
    if (!this.form.surfaceM2 || this.form.surfaceM2 < 1) {
      alert('Please enter a valid surface area');
      return;
    }
    
    // Check for duplicate unit number in the same building (only when creating new)
    if (!this.isEditMode) {
      this.apartmentService.getByBuilding(this.form.buildingId).subscribe({
        next: (apartments) => {
          const isDuplicate = apartments.some(a => 
            a.unitNumber.toLowerCase() === this.form.unitNumber.toLowerCase()
          );
          if (isDuplicate) {
            alert(`Unit "${this.form.unitNumber}" already exists in this building!`);
            return;
          }
          this.createApartment();
        },
        error: () => this.createApartment() // If error, allow creation anyway
      });
    } else {
      this.updateApartment();
    }
  }

  private createApartment(): void {
    this.apartmentService.create(this.form)
      .subscribe({
        next: (createdApartment) => {
          console.log('Apartment created successfully', createdApartment);
          alert('Apartment created successfully!');
          this.saved.emit();
        },
        error: (err) => {
          console.error('Error creating apartment:', err);
          const errorMsg = err.error?.message || err.message || 'Unknown error';
          alert('Error creating apartment: ' + errorMsg);
        }
      });
  }

  private updateApartment(): void {
    if (this.apartment?.id) {
      this.apartmentService.update(this.apartment.id, this.form)
        .subscribe({
          next: () => {
            console.log('Apartment updated successfully', this.form);
            alert('Apartment updated successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error updating apartment:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error updating apartment: ' + errorMsg);
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
 * COMPONENT: APARTMENT LIST
 * ============================================================================
 * Displays list of all apartments with CRUD operations
 */
@Component({
  selector: 'app-apartment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ApartmentFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, CardModule, TagModule, TooltipModule, InputTextModule, SelectModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-surface-900 to-surface-800 dark:from-surface-950 dark:to-surface-900 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative background element -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <i class="pi pi-home text-3xl text-indigo-400"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Units Management</h2>
              <div class="flex items-center gap-2 mt-2" *ngIf="residence && building">
                 <p-tag [value]="residence.name" severity="info" [rounded]="true" styleClass="bg-surface-800 text-surface-200 border-surface-700" />
                 <i class="pi pi-angle-right text-surface-500"></i>
                 <p-tag [value]="building.name" severity="info" [rounded]="true" styleClass="bg-indigo-500/20 text-indigo-200 border-indigo-500/30" />
              </div>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button label="Back to Buildings" icon="pi pi-arrow-left" [outlined]="true" styleClass="text-white border-surface-700 hover:bg-surface-800" (onClick)="goBack()" />
          <p-button label="Add New Unit" icon="pi pi-plus" severity="primary" styleClass="shadow-lg shadow-primary-500/30 px-6 py-3 font-bold" (onClick)="onAdd()" />
        </div>
      </div>
    </div>

    <!-- Filter & Search Section -->
    <div class="mb-8 p-6 bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm" *ngIf="apartments.length > 0 && !showForm">
       <div class="flex flex-col xl:flex-row items-end gap-4">
          <div class="flex-1 w-full">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Search Unit</label>
             <div class="p-inputgroup">
                <span class="p-inputgroup-addon bg-surface-50 dark:bg-surface-800"><i class="pi pi-search"></i></span>
                <input pInputText [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Search by number (e.g., A101)..." class="w-full" />
             </div>
          </div>
          
          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Status</label>
             <p-select [options]="[{label: 'All Statuses', value: ''}, {label: 'Available', value: 'available'}, {label: 'Occupied', value: 'occupied'}]" 
                       [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>

          <div class="w-full xl:w-40">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Floor</label>
             <p-select [options]="floorOptions" [(ngModel)]="floorFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>

          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Type</label>
             <p-select [options]="typeOptions" [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>
          
          <p-button icon="pi pi-filter-slash" [outlined]="true" severity="secondary" pTooltip="Clear Filters" (onClick)="clearFilters()" />
       </div>
       
       <div class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <span class="text-xs text-surface-500">Showing <b>{{ filteredApartments.length }}</b> of <b>{{ apartments.length }}</b> total units in this building</span>
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
      <app-apartment-form
        [apartment]="selectedApartment"
        [buildingId]="buildingId"
        [buildings]="[building!]"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-apartment-form>
    </div>

    <!-- Apartments Card Grid -->
    <div *ngIf="filteredApartments.length > 0 && !showForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div *ngFor="let apartment of filteredApartments" class="group bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 overflow-hidden">
        
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 bg-surface-50 dark:bg-surface-800 rounded-2xl flex items-center justify-center border border-surface-100 dark:border-surface-700">
               <span class="text-lg font-black text-surface-900 dark:text-surface-0">{{ apartment.unitNumber }}</span>
            </div>
            <p-tag [value]="apartment.status" [severity]="apartment.status === 'AVAILABLE' ? 'success' : 'warn'" [rounded]="true" styleClass="text-[9px] px-2 py-0.5" />
          </div>
          
          <div class="space-y-3 mb-6">
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Floor</span>
                <span class="font-bold text-surface-900 dark:text-surface-0">{{ apartment.floor }}</span>
             </div>
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Surface</span>
                <span class="font-bold text-surface-900 dark:text-surface-0">{{ apartment.surfaceM2 }} m²</span>
             </div>
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Type</span>
                <p-tag [value]="apartment.type" severity="secondary" styleClass="text-[10px] border border-surface-200 bg-transparent text-surface-600" />
             </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-surface-50 dark:border-surface-800">
            <p-button label="Edit" icon="pi pi-pencil" [text]="true" severity="info" size="small" styleClass="flex-1" (onClick)="onEdit(apartment)" />
            <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(apartment)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="filteredApartments.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-3xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-inbox text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Units Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">
         {{ apartments.length > 0 ? 'No units match your current filter selection.' : 'This building does not have any units defined yet.' }}
      </p>
      <div class="flex gap-3">
         <p-button *ngIf="searchTerm || statusFilter || floorFilter || typeFilter" label="Clear Filters" [outlined]="true" (onClick)="clearFilters()" />
         <p-button label="Add First Unit" icon="pi pi-plus" (onClick)="onAdd()" />
      </div>
    </div>
  `,
  styles: [``]
})
export class ApartmentListComponent implements OnInit {
  apartments: Apartment[] = [];
  filteredApartments: Apartment[] = [];
  residenceId!: string;
  buildingId!: string;
  residence: Residence | null = null;
  building: Building | null = null;
  selectedApartment: Apartment | null = null;
  selectedApartments: Apartment[] = [];
  showForm = false;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  floorFilter: any = '';
  typeFilter = '';
  availableFloors: number[] = [];
  availableTypes: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apartmentService: ApartmentService,
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
    this.loadApartments();
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

  loadBuildingDetails(): void {
    if (this.buildingId) {
      this.buildingService.getById(this.buildingId).subscribe(data => {
        this.building = data;
      });
    }
  }

  loadApartments(): void {
    this.apartmentService.getByBuilding(this.buildingId).subscribe(data => {
      this.apartments = data;
      this.extractAvailableFloors();
      this.extractAvailableTypes();
      this.applyFilters();
    });
  }

  extractAvailableFloors(): void {
    const floors = new Set(this.apartments.map(a => a.floor));
    this.availableFloors = Array.from(floors).sort((a, b) => a - b);
  }

  extractAvailableTypes(): void {
    const types = new Set(this.apartments.map(a => a.type));
    this.availableTypes = Array.from(types).sort();
  }

  get floorOptions() {
    return [
      { label: 'All Floors', value: '' },
      ...this.availableFloors.map(f => ({ label: `Floor ${f}`, value: f }))
    ];
  }

  get typeOptions() {
    return [
      { label: 'All Types', value: '' },
      ...this.availableTypes.map(t => ({ label: t, value: t }))
    ];
  }

  getCountByStatus(status: string): number {
    return this.apartments.filter(a => a.status === status).length;
  }

  applyFilters(): void {
    this.filteredApartments = this.apartments.filter(apartment => {
      const matchesSearch = this.searchTerm === '' || 
        apartment.unitNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === '' || 
        apartment.status?.toLowerCase() === this.statusFilter.toLowerCase();
      
      const matchesFloor = this.floorFilter === '' || apartment.floor === parseInt(this.floorFilter);
      
      const matchesType = this.typeFilter === '' || apartment.type === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesFloor && matchesType;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.floorFilter = '';
    this.typeFilter = '';
    this.applyFilters();
  }

  onAdd(): void {
    this.selectedApartment = null;
    this.showForm = true;
  }

  onEdit(apartment: Apartment): void {
    this.selectedApartment = { ...apartment };
    this.showForm = true;
  }

  confirmDelete(apartment: Apartment): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this apartment?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (apartment.id) {
          this.apartmentService.delete(apartment.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Apartment deleted' });
              this.loadApartments();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedApartments.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedApartments.length} apartment(s)?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedApartments.forEach(a => {
          if (a.id) {
            this.apartmentService.delete(a.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Apartments deleted' });
        this.loadApartments();
        this.selectedApartments = [];
      }
    });
  }

  onFormSaved(): void {
    this.showForm = false;
    this.loadBuildingDetails();
    this.loadResidenceDetails();
    this.loadApartments();
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
