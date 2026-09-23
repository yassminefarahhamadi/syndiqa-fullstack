import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolarService, EnergyReport, SolarSystem } from './solar.service';
import { BuildingService, Building } from '../property/building-complete';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';

@Component({
  selector: 'app-energy-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ChartModule, ButtonModule, SelectModule, 
    TableModule, TagModule, DialogModule, TextareaModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="flex flex-col gap-6">
      <!-- Filter Card -->
      <div class="card p-6 bg-surface-0 dark:bg-surface-900 shadow-sm border-round">
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex items-center gap-3">
             <i class="pi pi-chart-bar text-primary text-3xl"></i>
             <h2 class="text-2xl font-bold m-0">Energy Intelligence Hub</h2>
          </div>
          
          <div class="flex flex-wrap gap-3">
            <p-select [options]="systems" [(ngModel)]="selectedSystem" (onChange)="loadAnomalyHistory()" optionLabel="nameTranslate" optionValue="id" placeholder="Select Solar System" class="w-full md:w-56" [filter]="true" filterBy="nameTranslate"></p-select>
            
            <p-select [options]="[ {label: 'Monthly Analysis', value: 'month'}, {label: 'Daily Analysis', value: 'day'} ]" [(ngModel)]="reportType" optionLabel="label" optionValue="value" class="w-full md:w-48"></p-select>
            
            <input *ngIf="reportType === 'month'" type="month" [(ngModel)]="selectedDatePrefix" class="p-inputtext p-component w-full md:w-40" />
            <input *ngIf="reportType === 'day'" type="date" [(ngModel)]="selectedDatePrefix" class="p-inputtext p-component w-full md:w-40" />
            
            <p-button icon="pi pi-bolt" label="Generate Insights" (onClick)="generateReport()" [disabled]="!selectedSystem" [loading]="loading"></p-button>
            <p-button *ngIf="report" icon="pi pi-download" label="Export" severity="secondary" (onClick)="exportReport()"></p-button>
          </div>
        </div>
      </div>

      <ng-container *ngIf="report">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Energy Card -->
          <div class="card mb-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-l-4 border-amber-500 overflow-hidden relative">
              <div class="flex justify-between items-start">
                  <div>
                      <span class="block text-surface-600 dark:text-surface-400 font-semibold mb-2 uppercase text-xs tracking-wider">Net Production</span>
                      <div class="text-amber-700 dark:text-amber-400 font-bold text-4xl">{{report.totalEnergy | number:'1.2-2'}}<span class="text-lg ml-1">kWh</span></div>
                  </div>
                  <div class="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl">
                      <i class="pi pi-sun text-amber-600 text-2xl"></i>
                  </div>
              </div>
              <div class="mt-4 flex items-center text-sm text-amber-600 font-medium">
                  <i class="pi pi-arrow-up-right mr-1"></i>
                  <span>Active generating period</span>
              </div>
              <i class="pi pi-bolt absolute -bottom-4 -right-4 text-8xl opacity-5 text-amber-900 dark:text-amber-100"></i>
          </div>

          <!-- Savings Card -->
          <div class="card mb-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-l-4 border-green-500">
              <div class="flex justify-between items-start">
                  <div>
                      <span class="block text-surface-600 dark:text-surface-400 font-semibold mb-2 uppercase text-xs tracking-wider">Financial Savings</span>
                      <div class="text-green-700 dark:text-green-400 font-bold text-4xl">{{report.savingsEstimation | currency:'TND':'TND '}}</div>
                  </div>
                  <div class="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl">
                      <i class="pi pi-dollar text-green-600 text-2xl"></i>
                  </div>
              </div>
              <div class="mt-4 flex items-center text-sm text-green-600 font-medium">
                  <i class="pi pi-shield mr-1"></i>
                  <span>Tunisian STEG Optimized</span>
              </div>
          </div>

          <!-- Ecological Card -->
          <div class="card mb-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-l-4 border-emerald-500">
              <div class="flex justify-between items-start">
                  <div>
                      <span class="block text-surface-600 dark:text-surface-400 font-semibold mb-2 uppercase text-xs tracking-wider">Ecological Footprint</span>
                      <div class="text-emerald-700 dark:text-emerald-400 font-bold text-3xl">{{report.co2Avoided | number:'1.1-1'}} kg <span class="text-sm opacity-60">CO2</span></div>
                      <div class="text-emerald-600 mt-1 font-medium">≈ {{report.treesPlantedEquivalent | number:'1.1-1'}} trees planted</div>
                  </div>
                  <div class="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-xl">
                      <i class="pi pi-heart text-emerald-600 text-2xl"></i>
                  </div>
              </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Bar Chart Section -->
            <div class="card p-6 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold m-0 flex items-center gap-2">
                        <i class="pi pi-chart-line text-blue-500"></i>
                        Daily Production Trend
                    </h3>
                    <span class="text-sm text-surface-500">Unit: kWh</span>
                </div>
                <p-chart type="bar" [data]="chartData" [options]="chartOptions" height="350px"></p-chart>
            </div>

            <!-- Pie Chart Section -->
            <div class="card p-6 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold m-0 flex items-center gap-2">
                        <i class="pi pi-chart-pie text-purple-500"></i>
                        Production Distribution
                    </h3>
                    <span class="text-sm text-surface-500">By Time of Day</span>
                </div>
                <div class="flex justify-center items-center h-[350px]">
                    <p-chart type="pie" [data]="pieData" [options]="pieOptions" height="300px" class="w-full"></p-chart>
                </div>
            </div>
        </div>
      </ng-container>

      <!-- Anomaly Historics Section -->
      <div *ngIf="selectedSystem && canManageAnomalies" class="card p-6 shadow-sm bg-surface-0 dark:bg-surface-900">
          <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-bold m-0 flex items-center gap-2">
                  <i class="pi pi-history text-orange-500"></i>
                  Anomaly Historics
              </h3>
          </div>

          <p-table [value]="anomalyHistory" styleClass="p-datatable-sm" [rows]="5" [paginator]="true">
              <ng-template pTemplate="header">
                  <tr>
                      <th>Date</th>
                      <th>Measured Power</th>
                      <th>Baseline</th>
                      <th>Status</th>
                      <th>Resolution</th>
                      <th>Actions</th>
                  </tr>
              </ng-template>
              <ng-template pTemplate="body" let-anomaly>
                  <tr>
                      <td>{{anomaly.timestamp | date:'short'}}</td>
                      <td>{{anomaly.powerAtTime}} W</td>
                      <td>{{anomaly.baselineAtTime | number:'1.0-0'}} W</td>
                      <td>
                          <p-tag [severity]="anomaly.status === 'PENDING' ? 'warn' : 'success'" 
                                 [value]="anomaly.status"></p-tag>
                      </td>
                      <td>
                          <span *ngIf="anomaly.status === 'RESOLVED'" class="text-sm">
                              <strong>{{anomaly.anomalyType}}</strong>: {{anomaly.resolutionAction}}
                          </span>
                          <span *ngIf="anomaly.status === 'PENDING'" class="text-surface-400 italic text-sm">Awaiting technician...</span>
                      </td>
                      <td>
                          <p-button *ngIf="anomaly.status === 'PENDING'" icon="pi pi-wrench" 
                                    label="Resolve" [text]="true" severity="info"
                                    (onClick)="openResolveDialog(anomaly)"></p-button>
                      </td>
                  </tr>
              </ng-template>
          </p-table>
          
          <div *ngIf="anomalyHistory.length === 0" class="p-8 text-center text-surface-400">
              <i class="pi pi-shield text-4xl opacity-20 mb-2"></i>
              <p>No anomalies recorded for this system.</p>
          </div>
      </div>

      <div *ngIf="!report && (!selectedSystem || !canManageAnomalies)" class="card p-20 flex flex-col items-center justify-center text-surface-400 border-dashed border-2">
          <i class="pi pi-file-edit text-6xl mb-4 opacity-20"></i>
          <p class="text-lg">Configure your parameters above to generate a comprehensive energy report.</p>
      </div>

      <!-- Resolve Anomaly Dialog -->
      <p-dialog [(visible)]="showResolveDialog" header="Anomaly Resolution Report" [modal]="true" [style]="{width: '500px'}">
          <div class="flex flex-col gap-4 mt-4">
              <div class="flex flex-col gap-2">
                  <label class="font-bold">Detected Anomaly Type</label>
                  <p-select [options]="anomalyTypes" [(ngModel)]="resolutionData.type" placeholder="Select Type" class="w-full"></p-select>
              </div>
              
              <div class="flex flex-col gap-2">
                  <label class="font-bold">Resolution Action Taken</label>
                  <p-select [options]="resolutionActions" [(ngModel)]="resolutionData.action" placeholder="Select Action" class="w-full"></p-select>
              </div>

              <div class="flex flex-col gap-2">
                  <label class="font-bold">Technician Notes</label>
                  <textarea pTextarea [(ngModel)]="resolutionData.notes" rows="4" placeholder="Enter details of the fix..."></textarea>
              </div>
          </div>
          <ng-template pTemplate="footer">
              <p-button label="Cancel" icon="pi pi-times" severity="secondary" (onClick)="showResolveDialog = false"></p-button>
              <p-button label="Submit Fix" icon="pi pi-check" (onClick)="submitResolution()" [loading]="resolving"></p-button>
          </ng-template>
      </p-dialog>
    </div>
  `
})
export class EnergyReportsComponent implements OnInit {
  private solarService = inject(SolarService);
  private buildingService = inject(BuildingService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  
  canManageAnomalies: boolean = false;
  systems: any[] = [];
  buildings: Building[] = [];
  selectedSystem: string | null = null;
  reportType: 'month' | 'day' = 'month';
  selectedDatePrefix: string = '';
  report: EnergyReport | null = null;
  loading: boolean = false;

  anomalyHistory: any[] = [];
  showResolveDialog: boolean = false;
  selectedAnomaly: any = null;
  resolving: boolean = false;
  
  resolutionData = {
      type: '',
      action: '',
      notes: ''
  };

  anomalyTypes = [
      'Dust/Dirt Accumulation',
      'Inverter Overheating',
      'Connection/Wiring Issue',
      'Panel Micro-cracks',
      'Shading Interference',
      'Communication Error',
      'Degraded Battery Performance'
  ];

  resolutionActions = [
      'Professional Cleaning',
      'Hardware Replacement',
      'Wiring Repair',
      'System Reboot',
      'Shading Removal',
      'Monitoring Calibration',
      'No Action Required (False Alarm)'
  ];

  chartData: any;
  chartOptions: any;

  pieData: any;
  pieOptions: any;

  ngOnInit() {
    this.checkPermissions();
    this.loadBuildings();
    this.solarService.getSolarSystems().subscribe((data: any) => {
        this.systems = data.map((s: any) => ({
            ...s,
            nameTranslate: this.getBuildingName(s.buildingId)
        }));
    });
    this.initChartOptions();
  }

  checkPermissions() {
    const role = this.authService.role();
    // Strictly for technicians as requested
    this.canManageAnomalies = role === 'TECHNICAL_STAFF';
  }

  loadBuildings() {
    this.buildingService.getAll().subscribe((data: any) => {
        this.buildings = data;
        this.systems.forEach(s => s.nameTranslate = this.getBuildingName(s.buildingId));
    });
  }

  getBuildingName(id: string): string {
    const b = this.buildings.find(b => b.id === id);
    return b ? b.name : id;
  }

  loadAnomalyHistory() {
    if (!this.selectedSystem || !this.canManageAnomalies) return;
    this.solarService.getAnomalies(this.selectedSystem).subscribe((data: any) => {
        this.anomalyHistory = data;
    });
  }

  openResolveDialog(anomaly: any) {
    this.selectedAnomaly = anomaly;
    this.resolutionData = { type: '', action: '', notes: '' };
    this.showResolveDialog = true;
  }

  submitResolution() {
    if (!this.resolutionData.type || !this.resolutionData.action) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select anomaly type and action' });
        return;
    }

    this.resolving = true;
    this.solarService.resolveAnomaly(this.selectedAnomaly.id, this.resolutionData).subscribe({
        next: () => {
            this.showResolveDialog = false;
            this.loadAnomalyHistory();
            this.messageService.add({ severity: 'success', summary: 'Fixed', detail: 'Anomaly resolution logged successfully' });
            this.resolving = false;
        },
        error: (err: any) => {
            console.error('Failed to resolve anomaly', err);
            this.resolving = false;
        }
    });
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const borderColor = documentStyle.getPropertyValue('--p-content-border-color');

    this.chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                ticks: { color: textColor, font: { weight: 500 } },
                grid: { display: false }
            },
            y: {
                ticks: { color: textColor },
                grid: { color: borderColor, drawBorder: false }
            }
        }
    };

    this.pieOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return ` ${context.label}: ${value.toFixed(2)} kWh (${percentage}%)`;
                    }
                }
            }
        }
    };
  }

  generateReport() {
    if (!this.selectedSystem) return;
    this.loading = true;
    this.solarService.getReport(this.selectedSystem, this.selectedDatePrefix).subscribe({
      next: (data: any) => {
        this.report = data;
        this.updateChartData();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to generate report', err);
        this.loading = false;
      }
    });
  }

  updateChartData() {
    if (!this.report) return;

    // Bar Chart
    if (this.report.dailyProduction) {
        const sortedDates = Object.keys(this.report.dailyProduction).sort();
        const values = sortedDates.map(date => this.report!.dailyProduction[date]);

        this.chartData = {
            labels: sortedDates.map(d => d.split('-').slice(1).join('/')),
            datasets: [
                {
                    label: 'Energy Produced (kWh)',
                    data: values,
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        };
    }

    // Pie Chart
    if (this.report.dailyPeriodDistribution) {
        const dist = this.report.dailyPeriodDistribution;
        const labels = Object.keys(dist);
        const values = labels.map(l => dist[l]);

        this.pieData = {
            labels: labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: [
                        '#fbbf24', // Amber
                        '#f59e0b', // Orange
                        '#d97706', // Brown/Dark Orange
                        '#1e293b'  // Slate
                    ],
                    hoverBackgroundColor: [
                        '#fcd34d',
                        '#fbbf24',
                        '#f59e0b',
                        '#334155'
                    ]
                }
            ]
        };
    }
  }

  exportReport() {
    if (!this.report) return;
    const csvData = [
      ['Report Parameter', 'Value'],
      ['Solar System ID', this.report.solarSystemId],
      ['Period Evaluated', this.report.period],
      ['Total Energy Produced (kWh)', this.report.totalEnergy.toFixed(2)],
      ['Estimated Financial Savings (TND)', this.report.savingsEstimation.toFixed(3)],
      ['CO2 Avoided (kg)', this.report.co2Avoided.toFixed(2)],
      ['Trees Equivalent', this.report.treesPlantedEquivalent.toFixed(2)]
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," + csvData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solar_analysis_${this.report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
