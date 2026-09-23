import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolarService, SolarSystem } from './solar.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { BuildingService, Building } from '../property/building-complete';
import { MessageService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-solar-systems',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, 
    InputTextModule, InputNumberModule, ToastModule, SelectModule, TagModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <p-toast></p-toast>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">Solar Systems</h2>
        <p-button *ngIf="isAdmin || isTech" icon="pi pi-plus" label="Add New" (onClick)="openNew()"></p-button>
      </div>

      <p-table [value]="systems" styleClass="p-datatable-striped p-datatable-sm"
               [paginator]="true" [rows]="10" [showCurrentPageReport]="true"
               currentPageReportTemplate="Showing {first} to {last} of {totalRecords} systems">
        <ng-template pTemplate="header">
          <tr>
            <th>Building Name</th>
            <th>Capacity (kW)</th>
            <th>Install Date</th>
            <th>Status</th>
            <th *ngIf="isAdmin || isTech">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-sys>
          <tr class="dark:text-surface-0">
            <td>{{getBuildingName(sys.buildingId)}}</td>
            <td>{{sys.capacityKw}}</td>
            <td>{{sys.installationDate}}</td>
            <td>
              <p-tag *ngIf="!sys.activeAnomaly" severity="success" value="Healthy" icon="pi pi-check-circle"></p-tag>
              <div *ngIf="sys.activeAnomaly" class="flex items-center gap-2">
                <p-tag severity="danger" value="Anomaly Detected" icon="pi pi-exclamation-triangle" class="animate-pulse"></p-tag>
                <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" severity="success" 
                          pTooltip="Resolve Anomaly" tooltipPosition="top" (onClick)="resolveAnomaly(sys)"></p-button>
              </div>
            </td>
            <td *ngIf="isAdmin || isTech">
              <p-button *ngIf="isAdmin || isTech" icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="editSystem(sys)"></p-button>
              <p-button *ngIf="isAdmin" icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deleteSystem(sys)"></p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <div *ngIf="systems.length === 0" class="flex flex-col items-center justify-center p-8 text-gray-500">
          <i class="pi pi-sun text-4xl mb-4 text-gray-400"></i>
          <span class="text-lg">No Solar Systems have been registered yet.</span>
          <span *ngIf="isAdmin || isTech" class="text-sm mt-2">Click "Add New" to register a physical array to a building.</span>
      </div>

      <p-dialog [(visible)]="displayDialog" [header]="isEditing ? 'Edit Solar System' : 'New Solar System'" [modal]="true" [style]="{width: '450px'}">
        <div class="flex flex-col gap-4 mt-4">
          <div class="flex flex-col gap-2">
            <label for="buildingId" class="block font-bold">Target Building</label>
            <p-select [options]="buildings" [(ngModel)]="system.buildingId" optionLabel="name" optionValue="id" 
                      placeholder="Select a Building" [filter]="true" filterBy="name" [showClear]="true" class="w-full"></p-select>
          </div>
          <div class="flex flex-col gap-2">
            <label for="capacity" class="block font-bold">Capacity (kW)</label>
            <p-inputNumber id="capacity" [(ngModel)]="system.capacityKw" mode="decimal" [minFractionDigits]="2" class="w-full" styleClass="w-full"></p-inputNumber>
          </div>
          <div class="flex flex-col gap-2">
            <label for="date" class="block font-bold">Installation Date</label>
            <input type="date" pInputText id="date" [(ngModel)]="system.installationDate" class="w-full" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" severity="secondary" (onClick)="hideDialog()"></p-button>
          <p-button label="Save" icon="pi pi-check" (onClick)="saveSystem()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class SolarSystemsComponent implements OnInit {
  systems: SolarSystem[] = [];
  buildings: Building[] = [];
  system: SolarSystem = this.getEmptySystem();
  displayDialog = false;
  isEditing = false;
  
  private solarService = inject(SolarService);
  private authService = inject(AuthService);
  private buildingService = inject(BuildingService);
  private messageService = inject(MessageService);

  isAdmin = false;
  isTech = false;

  ngOnInit() {
    this.isAdmin = this.authService.isPlatformAdmin() || this.authService.isSyndicAdmin();
    this.isTech = this.authService.role() === 'TECHNICAL_STAFF';
    this.loadSystems();
    this.loadBuildings();
  }

  loadBuildings() {
    this.buildingService.getAll().subscribe({
      next: (data) => this.buildings = data,
      error: (err) => console.error('Error loading buildings', err)
    });
  }

  getBuildingName(id: string): string {
    const b = this.buildings.find(b => b.id === id);
    return b ? b.name : id;
  }

  loadSystems() {
    this.solarService.getSolarSystems().subscribe({
      next: (data) => this.systems = data,
      error: (err) => this.showError('Could not load systems')
    });
  }

  getEmptySystem(): SolarSystem {
    return { buildingId: '', capacityKw: 0, installationDate: new Date().toISOString().split('T')[0] };
  }

  openNew() {
    this.system = this.getEmptySystem();
    this.isEditing = false;
    this.displayDialog = true;
  }

  editSystem(sys: SolarSystem) {
    this.system = { ...sys };
    this.isEditing = true;
    this.displayDialog = true;
  }

  resolveAnomaly(sys: SolarSystem) {
    const updated = { ...sys, activeAnomaly: false };
    this.solarService.updateSolarSystem(sys.id!, updated).subscribe({
      next: () => {
        this.loadSystems();
        this.showSuccess('Anomaly resolved successfully');
      },
      error: () => this.showError('Error resolving anomaly')
    });
  }

  deleteSystem(sys: SolarSystem) {
    if (confirm('Are you sure you want to delete this system?')) {
      this.solarService.deleteSolarSystem(sys.id!).subscribe({
        next: () => {
          this.loadSystems();
          this.showSuccess('System deleted successfully');
        },
        error: () => this.showError('Error deleting system')
      });
    }
  }

  saveSystem() {
    if (!this.system.buildingId) {
      this.showError('Building ID is required');
      return;
    }
    
    if (this.isEditing) {
      this.solarService.updateSolarSystem(this.system.id!, this.system).subscribe({
        next: () => {
          this.loadSystems();
          this.hideDialog();
          this.showSuccess('System updated successfully');
        },
        error: (err) => this.showError(err.error?.message || 'Error updating system')
      });
    } else {
      this.solarService.createSolarSystem(this.system).subscribe({
        next: () => {
          this.loadSystems();
          this.hideDialog();
          this.showSuccess('System created successfully');
        },
        error: (err) => this.showError(err.error?.message || 'Error creating system')
      });
    }
  }

  hideDialog() {
    this.displayDialog = false;
  }

  showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  showSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail });
  }
}
