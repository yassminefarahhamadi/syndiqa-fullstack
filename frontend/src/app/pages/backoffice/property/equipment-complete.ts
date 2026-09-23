/**
 * =============================================================================
 * EQUIPMENT - COMPLETE ENTITY (Model + Service + Components)
 * =============================================================================
 * This file contains everything about the Equipment entity consolidated
 * for easy integration. Equipment refers to physical machines/devices installed
 * in buildings that need maintenance and inspection.
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
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
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
export interface Equipment {
  id?: string;
  buildingId: string;
  name: string;
  type: string;
  location?: string;
  lastMaintenanceDate?: Date;
  nextScheduledMaintenance?: Date;
  status?: string; // e.g., "operational", "maintenance", "broken"
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
export class EquipmentService {
  private apiUrl = 'http://localhost:8089/api/equipment';

  constructor(private http: HttpClient) {}

  /**
   * Get all equipment
   */
  getAll(): Observable<Equipment[]> {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user.role === 'SYNDIC_ADMIN' && user.organizationId) {
        return this.http.get<Equipment[]>(`${this.apiUrl}/organization/${user.organizationId}`);
      }
    }
    return this.http.get<Equipment[]>(this.apiUrl);
  }

  /**
   * Get all equipment for a building
   */
  getByBuilding(buildingId: string): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${this.apiUrl}/building/${buildingId}`);
  }

  /**
   * Get equipment by ID
   */
  getById(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new equipment
   */
  create(equipment: Equipment): Observable<Equipment> {
    return this.http.post<Equipment>(this.apiUrl, equipment);
  }

  /**
   * Update existing equipment
   */
  update(id: string, equipment: Equipment): Observable<Equipment> {
    return this.http.put<Equipment>(`${this.apiUrl}/${id}`, equipment);
  }

  /**
   * Delete equipment
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

/**
 * ============================================================================
 * COMPONENT: EQUIPMENT FORM
 * ============================================================================
 * Used for creating and editing equipment
 */
@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule, SelectModule, TagModule, DatePickerModule],
  template: `
    <div class="card shadow-xl border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden mb-8">
      <!-- Header -->
      <div class="p-6 bg-gradient-to-r from-slate-600 to-slate-800 text-white flex justify-between items-center">
        <div>
          <h3 class="text-2xl font-bold m-0 flex items-center gap-2">
            <i [class]="isEditMode ? 'pi pi-pencil' : 'pi pi-plus'"></i>
            {{ isEditMode ? 'Edit' : 'Add' }} Equipment
          </h3>
          <p class="text-slate-100 mt-2 m-0 opacity-80 text-sm">Configure technical assets and maintenance schedules</p>
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
            
            <div *ngIf="buildings.length === 1" class="p-4 bg-slate-50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-900/20 flex items-center justify-between">
               <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Target Building</span>
               <p-tag [value]="buildings[0].name" severity="secondary" [rounded]="true" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Equipment Name</label>
                <p-select 
                  [options]="nameOptions" 
                  [(ngModel)]="form.name" 
                  (onChange)="onNameChange()"
                  placeholder="Select Equipment"
                  styleClass="w-full" />
              </div>

              <div class="flex flex-col gap-2 relative">
                <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Asset Type</label>
                <p-select 
                  [options]="typeOptions" 
                  [(ngModel)]="form.type" 
                  [disabled]="!!form.name"
                  placeholder="Select Type"
                  styleClass="w-full" />
                <span *ngIf="form.name" class="absolute -top-1 right-0 text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/30 px-2 py-0.5 rounded">Auto-filled</span>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Installation Location</label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon bg-surface-50 dark:bg-surface-800"><i class="pi pi-map-marker"></i></span>
                <input pInputText [(ngModel)]="form.location" placeholder="e.g., Rooftop, Basement Room 12..." class="w-full" />
              </div>
            </div>
            
            <div class="flex flex-col gap-2">
               <label class="text-xs font-bold text-surface-500 uppercase tracking-widest">Operational Status</label>
               <div class="flex gap-2">
                  <div *ngFor="let s of statusOptions" 
                       (click)="form.status = s"
                       [class]="'flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold text-[10px] uppercase tracking-wider ' + 
                                (form.status === s ? 'border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-900/20' : 'border-surface-200 bg-surface-0 text-surface-500 dark:border-surface-700')">
                    {{ s }}
                  </div>
               </div>
            </div>
          </div>

          <!-- Right: Maintenance -->
          <div class="lg:col-span-5 flex flex-col gap-6 p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700">
            <h4 class="text-sm font-bold m-0 flex items-center gap-2 text-surface-700 dark:text-surface-200">
               <i class="pi pi-calendar-clock text-slate-500"></i> Maintenance Schedule
            </h4>
            
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter">Last Maintenance</label>
              <p-datepicker [(ngModel)]="form.lastMaintenanceDate" dateFormat="yy-mm-dd" [showIcon]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-surface-500 uppercase tracking-tighter">Next Scheduled</label>
              <p-datepicker [(ngModel)]="form.nextScheduledMaintenance" dateFormat="yy-mm-dd" [showIcon]="true" appendTo="body" styleClass="w-full" inputStyleClass="w-full" />
            </div>

            <div class="mt-4 p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 flex items-center gap-4">
               <div class="w-12 h-12 bg-slate-100 dark:bg-slate-900/30 rounded-full flex items-center justify-center text-slate-600">
                  <i class="pi pi-shield text-xl"></i>
               </div>
               <div class="flex-1 text-[11px] leading-relaxed text-surface-500">
                  Proactive maintenance tracking reduces downtime and extends equipment lifespan by up to 30%.
               </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end gap-3 mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" styleClass="px-6" (onClick)="onCancel()" />
          <p-button [label]="isEditMode ? 'Update Asset' : 'Register Equipment'" [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus-circle'" severity="secondary" styleClass="px-8 shadow-lg shadow-slate-500/20 bg-slate-700 hover:bg-slate-800 border-none" (onClick)="onSubmit()" />
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class EquipmentFormComponent implements OnChanges {
  @Input() equipment: Equipment | null = null;
  @Input() buildingId: string = '';
  @Input() buildings: Building[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: Equipment = {
    id: undefined,
    buildingId: '',
    name: '',
    type: '',
    location: '',
    lastMaintenanceDate: undefined,
    nextScheduledMaintenance: undefined,
    status: 'operational'
  };
  isEditMode = false;

  // Equipment name options
  nameOptions = [
    'Elevator',
    'Generator',
    'Water pump',
    'CCTV camera',
    'Fire alarm system',
    'Intercom system',
    'Solar panels',
    'Water heater (boiler)',
    'Air conditioning unit',
    'Electric gate',
    'Parking barrier'
  ];

  // Equipment type options
  typeOptions = [
    'Mechanical',
    'Electrical',
    'HVAC',
    'Security',
    'Plumbing',
    'Safety',
    'Energy',
    'Access Control',
    'Surveillance',
    'Communication'
  ];

  // Mapping of equipment names to their types
  nameToTypeMap: { [key: string]: string } = {
    'Elevator': 'Mechanical',
    'Generator': 'Electrical',
    'Water pump': 'Plumbing',
    'CCTV camera': 'Surveillance',
    'Fire alarm system': 'Safety',
    'Intercom system': 'Communication',
    'Solar panels': 'Energy',
    'Water heater (boiler)': 'Plumbing',
    'Air conditioning unit': 'HVAC',
    'Electric gate': 'Electrical',
    'Parking barrier': 'Mechanical'
  };

  statusOptions = ['operational', 'maintenance', 'broken'];

  constructor(private equipmentService: EquipmentService) {}

  ngOnChanges(): void {
    if (this.equipment) {
      this.form = { ...this.equipment };
      this.isEditMode = true;
    } else {
      this.form = {
        id: undefined,
        buildingId: this.buildingId,
        name: '',
        type: '',
        location: '',
        lastMaintenanceDate: undefined,
        nextScheduledMaintenance: undefined,
        status: 'operational'
      };
      this.isEditMode = false;
    }
  }

  // Auto-fill type when name is selected
  onNameChange(): void {
    if (this.form.name && this.nameToTypeMap[this.form.name]) {
      this.form.type = this.nameToTypeMap[this.form.name];
    } else {
      this.form.type = '';
    }
  }

  onSubmit(): void {
    if (!this.form.buildingId) {
      alert('Please select a building');
      return;
    }
    
    if (!this.form.name?.trim()) {
      alert('Please select equipment name');
      return;
    }
    
    if (!this.form.type?.trim()) {
      alert('Please select equipment type');
      return;
    }
    
    if (this.isEditMode && this.equipment?.id) {
      this.equipmentService.update(this.equipment.id, this.form)
        .subscribe({
          next: () => {
            console.log('Equipment updated successfully', this.form);
            alert('Equipment updated successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error updating equipment:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error updating equipment: ' + errorMsg);
          }
        });
    } else {
      this.equipmentService.create(this.form)
        .subscribe({
          next: (createdEquipment) => {
            console.log('Equipment created successfully', createdEquipment);
            alert('Equipment created successfully!');
            this.saved.emit();
          },
          error: (err) => {
            console.error('Error creating equipment:', err);
            const errorMsg = err.error?.message || err.message || 'Unknown error';
            alert('Error creating equipment: ' + errorMsg);
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
 * COMPONENT: EQUIPMENT LIST
 * ============================================================================
{{ ... }}
 * Displays list of all equipment with CRUD operations
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EquipmentFormComponent, TableModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, CardModule, TagModule, TooltipModule, InputTextModule, SelectModule],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative background element -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <i class="pi pi-cog text-3xl text-white"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Technical Equipment</h2>
              <div class="flex items-center gap-2 mt-2" *ngIf="residence && building">
                 <p-tag [value]="residence.name" severity="info" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
                 <i class="pi pi-angle-right text-white/50"></i>
                 <p-tag [value]="building.name" severity="secondary" [rounded]="true" styleClass="bg-white/20 text-white border-white/30" />
              </div>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button label="Back to Buildings" icon="pi pi-arrow-left" [outlined]="true" styleClass="text-white border-white/50 hover:bg-white/10" (onClick)="goBack()" />
          <p-button label="Register Asset" icon="pi pi-plus" severity="contrast" styleClass="shadow-lg px-6 py-3 font-bold" (onClick)="onAdd()" />
        </div>
      </div>
    </div>

    <!-- Filter & Search Section -->
    <div class="mb-8 p-6 bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm" *ngIf="equipment.length > 0 && !showForm">
       <div class="flex flex-col xl:flex-row items-end gap-4">
          <div class="flex-1 w-full">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Search Asset</label>
             <div class="p-inputgroup">
                <span class="p-inputgroup-addon bg-surface-50 dark:bg-surface-800"><i class="pi pi-search"></i></span>
                <input pInputText [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Search by name (e.g., Elevator, Pump)..." class="w-full" />
             </div>
          </div>
          
          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Status</label>
             <p-select [options]="[{label: 'All Statuses', value: ''}, {label: 'Operational', value: 'operational'}, {label: 'Maintenance', value: 'maintenance'}, {label: 'Broken', value: 'broken'}]" 
                       [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>

          <div class="w-full xl:w-48">
             <label class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Asset Type</label>
             <p-select [options]="typeOptions" [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" styleClass="w-full" />
          </div>
          
          <p-button icon="pi pi-filter-slash" [outlined]="true" severity="secondary" pTooltip="Clear Filters" (onClick)="clearFilters()" />
       </div>
       
       <div class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <span class="text-xs text-surface-500">Inventory: <b>{{ filteredEquipment.length }}</b> of <b>{{ equipment.length }}</b> total assets</span>
       </div>
    </div>

    <!-- Add/Edit Form -->
    <div *ngIf="showForm">
      <app-equipment-form
        [equipment]="selectedEquipmentItem"
        [buildingId]="buildingId"
        [buildings]="building ? [building] : []"
        (saved)="onFormSaved()"
        (cancelled)="onFormCancelled()">
      </app-equipment-form>
    </div>

    <!-- Equipment Grid -->
    <div *ngIf="filteredEquipment.length > 0 && !showForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div *ngFor="let equip of filteredEquipment" class="group bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-slate-500/50 transition-all duration-300 overflow-hidden">
        
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="w-12 h-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
               <i class="pi pi-cog text-xl text-slate-600"></i>
            </div>
            <p-tag [value]="equip.status" [severity]="getStatusSeverity(equip.status)" [rounded]="true" styleClass="text-[9px] px-2 py-0.5" />
          </div>
          
          <h3 class="text-lg font-bold text-surface-900 dark:text-surface-0 mb-2 truncate">{{ equip.name }}</h3>
          <p class="text-xs text-surface-500 mb-4 flex items-center gap-1">
            <i class="pi pi-map-marker text-[10px]"></i> {{ equip.location || 'Location not specified' }}
          </p>
          
          <div class="space-y-3 mb-6">
             <div class="flex justify-between items-center text-[11px] p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <span class="text-surface-500 uppercase font-bold">Next Service</span>
                <span class="font-bold text-surface-900 dark:text-surface-0">{{ equip.nextScheduledMaintenance | date:'mediumDate' }}</span>
             </div>
             <div class="flex justify-between items-center text-sm">
                <span class="text-surface-500">Asset Type</span>
                <p-tag [value]="equip.type" severity="secondary" styleClass="text-[10px] border border-surface-200 bg-transparent text-surface-600" />
             </div>
          </div>

          <div class="flex gap-2 pt-4 border-t border-surface-50 dark:border-surface-800">
            <p-button label="Edit" icon="pi pi-pencil" [text]="true" severity="info" size="small" styleClass="flex-1" (onClick)="onEdit(equip)" />
            <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(equip)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="filteredEquipment.length === 0 && !showForm" class="flex flex-col items-center justify-center py-24 bg-surface-0 dark:bg-surface-900 rounded-3xl border-2 border-dashed border-surface-300 dark:border-surface-700">
      <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
         <i class="pi pi-cog text-5xl text-surface-400"></i>
      </div>
      <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Assets Found</h3>
      <p class="text-surface-600 dark:text-surface-400 mb-8 max-w-sm text-center">
         {{ equipment.length > 0 ? 'No equipment matches your current filter selection.' : 'This building does not have any technical equipment registered yet.' }}
      </p>
      <div class="flex gap-3">
         <p-button *ngIf="searchTerm || statusFilter || typeFilter" label="Clear Filters" [outlined]="true" (onClick)="clearFilters()" />
         <p-button label="Register First Asset" icon="pi pi-plus" (onClick)="onAdd()" />
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-tag { font-weight: 700; }
  `]
})
export class EquipmentListComponent implements OnInit {
  equipment: Equipment[] = [];
  filteredEquipment: Equipment[] = [];
  buildingId: string = '';
  residenceId: string = '';
  building: Building | null = null;
  residence: Residence | null = null;
  selectedEquipmentItem: Equipment | null = null;
  selectedEquipment: Equipment[] = [];
  showForm = false;

  // Filter properties
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  availableTypes: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
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
    this.loadEquipment();
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

  loadEquipment(): void {
    if (this.buildingId) {
      this.equipmentService.getByBuilding(this.buildingId)
        .subscribe({
          next: (data) => {
            this.equipment = data;
            this.extractAvailableTypes();
            this.applyFilters();
            console.log('Equipment loaded:', this.equipment);
          },
          error: (err) => {
            console.error('Error loading equipment:', err);
            this.equipment = [];
          }
        });
    } else {
      this.equipment = [];
    }
  }

  extractAvailableTypes(): void {
    const types = new Set(this.equipment.map(e => e.type));
    this.availableTypes = Array.from(types).sort();
  }

  get typeOptions() {
    return [
      { label: 'All Types', value: '' },
      ...this.availableTypes.map(t => ({ label: t, value: t }))
    ];
  }

  getCountByStatus(status: string): number {
    return this.equipment.filter(e => e.status === status).length;
  }

  getStatusSeverity(status: string | undefined): any {
    switch (status) {
      case 'operational': return 'success';
      case 'maintenance': return 'warn';
      case 'broken': return 'danger';
      default: return 'info';
    }
  }

  applyFilters(): void {
    this.filteredEquipment = this.equipment.filter(item => {
      const matchesSearch = this.searchTerm === '' || item.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === '' || item.status?.toLowerCase() === this.statusFilter.toLowerCase();
      const matchesType = this.typeFilter === '' || item.type === this.typeFilter;
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
    this.selectedEquipmentItem = null;
    this.showForm = true;
  }

  onEdit(item: Equipment): void {
    this.selectedEquipmentItem = { ...item };
    this.showForm = true;
  }

  confirmDelete(item: Equipment): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this equipment?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (item.id) {
          this.equipmentService.delete(item.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment deleted' });
              this.loadEquipment();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' })
          });
        }
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedEquipment.length) return;
    this.confirmationService.confirm({
      message: `Delete ${this.selectedEquipment.length} equipment?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedEquipment.forEach(e => {
          if (e.id) {
            this.equipmentService.delete(e.id).subscribe();
          }
        });
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment deleted' });
        this.loadEquipment();
        this.selectedEquipment = [];
      }
    });
  }

  onFormSaved(): void {
    this.showForm = false;
    this.loadBuildingDetails();
    this.loadResidenceDetails();
    this.loadEquipment();
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

  getStatusClass(status?: string): string {
    return `status-${status || 'operational'}`;
  }
}
