import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolarService, EnergyReading, SolarSystem } from './solar.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { BuildingService, Building } from '../property/building-complete';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'app-energy-readings',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, SelectModule, ChartModule, ButtonModule, DialogModule, InputNumberModule],
    template: `
        <div class="flex flex-col gap-4">
            <div class="card">
                <h2 class="text-2xl font-bold mb-4">Energy Readings</h2>
                <div class="flex flex-row justify-between mb-4">
                    <div class="flex flex-wrap gap-4">
                        <p-select [options]="systems" [(ngModel)]="selectedSystem" optionLabel="nameTranslate" optionValue="id" placeholder="Select Solar System" (onChange)="loadReadings()" [filter]="true" filterBy="nameTranslate"></p-select>
                        <p-button icon="pi pi-refresh" label="Refresh" (onClick)="loadReadings()" [disabled]="!selectedSystem"></p-button>
                    </div>
                    <p-button *ngIf="isAdmin || isTech" icon="pi pi-plus" label="Add Reading" severity="success" (onClick)="openNew()"></p-button>
                </div>

                <div class="card mb-4">
                    <h3 class="text-lg font-semibold mb-3">Solar Potentiometer Simulation</h3>
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="font-semibold">Turn the potentiometer to simulate solar intensity</label>
                            <input type="range" min="0" max="1023" [(ngModel)]="potentiometerValue" (ngModelChange)="calculatePotentiometerMetrics()" class="w-full" />
                            <div class="text-sm text-surface-500">Potentiometer Value: {{ potentiometerValue }} / 1023</div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="p-4 border rounded-lg bg-surface-50">
                                <div class="text-sm uppercase text-surface-600">Solar Power</div>
                                <div class="text-2xl font-bold">{{ generatedPower | number: '1.0-0' }} W</div>
                            </div>
                            <div class="p-4 border rounded-lg bg-surface-50">
                                <div class="text-sm uppercase text-surface-600">Estimated Consumption</div>
                                <div class="text-2xl font-bold">{{ gridConsumption | number: '1.0-0' }} W</div>
                            </div>
                            <div class="p-4 border rounded-lg bg-surface-50">
                                <div class="text-sm uppercase text-surface-600">Solar Intensity</div>
                                <div class="text-2xl font-bold">{{ (potentiometerValue / 1023) * 100 | number: '1.0-0' }} %</div>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <p-button label="Save Reading" icon="pi pi-save" (onClick)="savePotentiometerReading()" [disabled]="!selectedSystem"></p-button>
                            <div *ngIf="!selectedSystem" class="text-sm text-red-600 self-center">Select a solar system first to record the reading.</div>
                        </div>
                    </div>
                </div>

                <p-table [value]="readings" [paginator]="true" [rows]="10" styleClass="p-datatable-sm" *ngIf="readings.length > 0">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Timestamp</th>
                            <th>Building Name</th>
                            <th>Voltage (V)</th>
                            <th>Current (A)</th>
                            <th>Power (W)</th>
                            <th *ngIf="isAdmin || isTech" style="width: 8rem">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-reading>
                        <tr>
                            <td>{{ reading.timestamp | date: 'medium' }}</td>
                            <td>{{ getSystemBuildingName(reading.solarSystemId) }}</td>
                            <td>{{ reading.voltage | number: '1.2-2' }}</td>
                            <td>{{ reading.current | number: '1.2-2' }}</td>
                            <td>{{ reading.power | number: '1.2-2' }}</td>
                            <td *ngIf="isAdmin || isTech">
                                <div class="flex gap-2">
                                    <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="editReading(reading)"></p-button>
                                    <p-button *ngIf="isAdmin" icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deleteReading(reading)"></p-button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
                <div *ngIf="readings.length === 0 && selectedSystem" class="text-gray-500 mt-4">No readings found for the selected system.</div>
                <div *ngIf="!selectedSystem && readings.length === 0" class="text-gray-500 mt-4">Please select a solar system to view its readings, or add a new one.</div>
            </div>

            <div class="card" *ngIf="readings.length > 0">
                <h3 class="text-xl font-bold mb-4">Power Over Time</h3>
                <p-chart type="line" [data]="chartData" [options]="chartOptions"></p-chart>
            </div>

            <p-dialog [(visible)]="readingDialog" [style]="{ width: '450px' }" [header]="isEditMode ? 'Edit Reading' : 'New Reading'" [modal]="true">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-5 pt-2">
                        <div class="flex flex-col gap-2">
                            <label for="system" class="block font-bold">Solar System</label>
                            <p-select
                                id="system"
                                [options]="systems"
                                [(ngModel)]="editingReading.solarSystemId"
                                optionLabel="nameTranslate"
                                optionValue="id"
                                appendTo="body"
                                class="w-full"
                                styleClass="w-full"
                                [filter]="true"
                                filterBy="nameTranslate"
                            ></p-select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="voltage" class="block font-bold">Voltage (V)</label>
                            <p-inputNumber id="voltage" [(ngModel)]="editingReading.voltage" [minFractionDigits]="2" [maxFractionDigits]="2" class="w-full" styleClass="w-full"></p-inputNumber>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="current" class="block font-bold">Current (A)</label>
                            <p-inputNumber id="current" [(ngModel)]="editingReading.current" [minFractionDigits]="2" [maxFractionDigits]="2" class="w-full" styleClass="w-full"></p-inputNumber>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="footer">
                    <p-button label="Cancel" icon="pi pi-times" [text]="true" (onClick)="hideDialog()"></p-button>
                    <p-button label="Save" icon="pi pi-check" [text]="true" (onClick)="saveReading()"></p-button>
                </ng-template>
            </p-dialog>
        </div>
    `
})
export class EnergyReadingsComponent implements OnInit {
    private solarService = inject(SolarService);
    private authService = inject(AuthService);
    private buildingService = inject(BuildingService);

    systems: any[] = [];
    buildings: Building[] = [];
    selectedSystem: string | null = null;
    readings: EnergyReading[] = [];

    potentiometerValue: number = 512;
    generatedPower: number = 0;
    gridConsumption: number = 0;
    readonly baselineLoad: number = 3000;
    readonly maxSolarPower: number = 3000;

    chartData: any;
    chartOptions: any;

    readingDialog: boolean = false;
    isEditMode: boolean = false;
    editingReading: EnergyReading = this.getEmptyReading();

    isAdmin = false;
    isTech = false;

    ngOnInit() {
        this.isAdmin = this.authService.isPlatformAdmin() || this.authService.isSyndicAdmin();
        this.isTech = this.authService.role() === 'TECHNICAL_STAFF';

        this.loadBuildings();
        this.solarService.getSolarSystems().subscribe((data) => {
            this.systems = data.map((s) => ({
                ...s,
                nameTranslate: this.getBuildingName(s.buildingId)
            }));
        });

        this.calculatePotentiometerMetrics();

        this.chartOptions = {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#495057' } }
            },
            scales: {
                x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
                y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }
            }
        };
    }

    loadReadings() {
        if (!this.selectedSystem) return;
        this.solarService.getReadings(this.selectedSystem).subscribe((data) => {
            this.readings = data.sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
            this.updateChart();
        });
    }

    calculatePotentiometerMetrics() {
        const intensity = this.potentiometerValue / 1023;
        this.generatedPower = Math.round(this.maxSolarPower * intensity);
        this.gridConsumption = Math.max(0, this.baselineLoad - this.generatedPower);
    }

    savePotentiometerReading() {
        if (!this.selectedSystem) {
            return;
        }

        const payload = {
            solarSystemId: this.selectedSystem,
            analogValue: this.potentiometerValue
        };

        this.solarService.createReadingFromPotentiometer(payload).subscribe(() => {
            this.loadReadings();
        });
    }

    loadBuildings() {
        this.buildingService.getAll().subscribe((data) => {
            this.buildings = data;
            this.systems.forEach((s) => (s.nameTranslate = this.getBuildingName(s.buildingId)));
        });
    }

    getBuildingName(id: string): string {
        const b = this.buildings.find((b) => b.id === id);
        return b ? b.name : id;
    }

    getSystemBuildingName(systemId: string): string {
        const system = this.systems.find((s) => s.id === systemId);
        if (!system) return systemId;
        return this.getBuildingName(system.buildingId);
    }

    updateChart() {
        this.chartData = {
            labels: this.readings.map((r) => (r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '')),
            datasets: [
                {
                    label: 'Power (W)',
                    data: this.readings.map((r) => r.power),
                    fill: false,
                    borderColor: '#42A5F5',
                    tension: 0.4
                }
            ]
        };
    }

    getEmptyReading(): EnergyReading {
        return {
            solarSystemId: this.selectedSystem || '',
            voltage: 0,
            current: 0,
            power: 0
        };
    }

    openNew() {
        this.editingReading = this.getEmptyReading();
        if (!this.editingReading.solarSystemId && this.systems.length > 0) {
            this.editingReading.solarSystemId = this.systems[0].id!;
        }
        this.isEditMode = false;
        this.readingDialog = true;
    }

    editReading(reading: EnergyReading) {
        this.editingReading = { ...reading };
        this.isEditMode = true;
        this.readingDialog = true;
    }

    deleteReading(reading: EnergyReading) {
        if (confirm('Are you sure you want to delete this reading?')) {
            this.solarService.deleteReading(reading.id!).subscribe(() => {
                this.loadReadings();
            });
        }
    }

    hideDialog() {
        this.readingDialog = false;
    }

    saveReading() {
        this.editingReading.power = this.editingReading.voltage * this.editingReading.current;

        if (this.isEditMode) {
            this.solarService.updateReading(this.editingReading.id!, this.editingReading).subscribe(() => {
                if (this.selectedSystem === this.editingReading.solarSystemId) {
                    this.loadReadings();
                }
                this.hideDialog();
            });
        } else {
            this.solarService.createReading(this.editingReading).subscribe(() => {
                if (this.selectedSystem === this.editingReading.solarSystemId) {
                    this.loadReadings();
                } else if (!this.selectedSystem) {
                    this.selectedSystem = this.editingReading.solarSystemId;
                    this.loadReadings();
                }
                this.hideDialog();
            });
        }
    }
}
