import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolarService, PredictionResponse, SolarSystem, DailyPrediction } from './solar.service';
import { BuildingService, Building } from '../property/building-complete';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-energy-prediction',
    standalone: true,
    imports: [CommonModule, FormsModule, ChartModule, SelectModule, CardModule, ButtonModule, TagModule],
    template: `
        <div class="flex flex-col gap-6 p-4">
            <!-- Header & Selection -->
            <div class="card flex flex-wrap gap-4 items-center justify-between p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xl">
                <div>
                    <h2 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        AI Energy Prediction
                    </h2>
                    <p class="text-slate-400 text-sm mt-1">7-Day Production Forecast using Seasonal Hybrid Model</p>
                </div>
                
                <div class="flex gap-3">
                    <p-select [options]="systems" [(ngModel)]="selectedSystemId" optionLabel="nameTranslate" optionValue="id" 
                        placeholder="Select Solar System" class="w-64" (onChange)="onSystemChange()" [filter]="true" filterBy="nameTranslate"></p-select>
                    <p-button icon="pi pi-refresh" [loading]="loading" (onClick)="loadPrediction()" 
                        [disabled]="!selectedSystemId" severity="info" label="Recalculate"></p-button>
                </div>
            </div>

            <div *ngIf="predictionData" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Summary Cards -->
                <div class="lg:col-span-1 flex flex-col gap-4">
                    <p-card header="Weekly Outlook" class="shadow-sm">
                        <div class="flex flex-col gap-4">
                            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span class="text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase">Total Expected</span>
                                <div class="text-3xl font-bold mt-1">{{totalWeeklyEnergy | number:'1.2-2'}} kWh</div>
                            </div>
                            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span class="text-green-600 dark:text-green-400 text-sm font-semibold uppercase">Estimated Savings</span>
                                <div class="text-3xl font-bold mt-1">{{predictionData.totalExpectedSavings | currency:'TND':'TND '}}</div>
                                <div class="text-[10px] text-slate-400 mt-1">Based on STEG progressive pricing</div>
                            </div>
                            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <span class="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase">Best Generation Day</span>
                                <div class="text-xl font-bold mt-1">{{bestDay?.date | date:'EEEE, MMM d'}}</div>
                                <div class="text-sm text-slate-500">{{bestDay?.expectedTotalEnergy | number:'1.2-2'}} kWh expected</div>
                            </div>
                            <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <span class="text-amber-600 dark:text-amber-400 text-sm font-semibold uppercase">Weather impact</span>
                                <div class="flex items-center gap-2 mt-1">
                                    <i class="pi pi-cloud text-xl"></i>
                                    <span class="font-bold">Next 7 days: {{weatherSummary}}</span>
                                </div>
                            </div>
                        </div>
                    </p-card>

                    <!-- Daily List -->
                    <div class="card p-4 overflow-auto max-h-[400px]">
                        <h3 class="text-lg font-bold mb-4">Daily Breakdown</h3>
                        <div *ngFor="let pred of predictionData.predictions" 
                             (click)="selectDay(pred)"
                             [class.bg-blue-50]="selectedDay === pred"
                             class="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-slate-50 transition-colors rounded-md">
                            <div>
                                <div class="font-semibold">{{pred.date | date:'MMM d'}}</div>
                                <div class="text-xs text-slate-500">{{pred.date | date:'EEEE'}}</div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="text-right">
                                    <div class="font-mono font-bold text-slate-800">{{pred.expectedTotalEnergy | number:'1.1-1'}} <span class="text-[10px]">kWh</span></div>
                                    <div class="text-[10px] text-green-600 font-semibold">{{pred.expectedSavings | currency:'TND':'TND '}}</div>
                                </div>
                                <p-tag [value]="pred.primaryWeather" [severity]="getWeatherSeverity(pred.primaryWeather)"></p-tag>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="lg:col-span-2 flex flex-col gap-6">
                    <!-- 7-Day Trend -->
                    <p-card header="7-Day Production Trend" class="shadow-sm">
                        <p-chart type="bar" [data]="barData" [options]="barOptions" height="300px"></p-chart>
                    </p-card>

                    <!-- Hourly Profile -->
                    <p-card [header]="'Hourly Forecast: ' + (selectedDay?.date | date:'EEEE, MMM d')" class="shadow-sm">
                        <p-chart type="line" [data]="lineData" [options]="lineOptions" height="300px"></p-chart>
                    </p-card>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!predictionData && !loading" class="card flex flex-col items-center justify-center p-20 text-slate-400">
                <i class="pi pi-chart-line text-6xl mb-4 opacity-20"></i>
                <p>Select a solar system to view AI energy production forecasts.</p>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep .p-card {
            border-radius: 12px;
            overflow: hidden;
        }
    `]
})
export class EnergyPredictionComponent implements OnInit {
    private solarService = inject(SolarService);
    private buildingService = inject(BuildingService);

    systems: any[] = [];
    buildings: Building[] = [];
    selectedSystemId: string | null = null;
    predictionData: PredictionResponse | null = null;
    selectedDay: DailyPrediction | null = null;
    loading = false;

    // Chart Data
    barData: any;
    barOptions: any;
    lineData: any;
    lineOptions: any;

    ngOnInit() {
        this.loadBuildings();
        this.solarService.getSolarSystems().subscribe(data => {
            this.systems = data.map(s => ({
                ...s,
                nameTranslate: this.getBuildingName(s.buildingId)
            }));
        });

        this.initChartOptions();
    }

    loadBuildings() {
        this.buildingService.getAll().subscribe(data => {
            this.buildings = data;
            // Update names if systems already loaded
            this.systems.forEach(s => s.nameTranslate = this.getBuildingName(s.buildingId));
        });
    }

    getBuildingName(id: string): string {
        const b = this.buildings.find(b => b.id === id);
        return b ? b.name : id;
    }

    onSystemChange() {
        this.loadPrediction();
    }

    loadPrediction() {
        if (!this.selectedSystemId) return;
        this.loading = true;
        this.solarService.getPrediction(this.selectedSystemId).subscribe({
            next: (res) => {
                this.predictionData = res;
                this.selectedDay = res.predictions[0];
                this.updateCharts();
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    selectDay(day: DailyPrediction) {
        this.selectedDay = day;
        this.updateLineChart();
    }

    get totalWeeklyEnergy(): number {
        return this.predictionData?.predictions.reduce((acc, p) => acc + p.expectedTotalEnergy, 0) || 0;
    }

    get bestDay(): DailyPrediction | null {
        if (!this.predictionData) return null;
        return [...this.predictionData.predictions].sort((a, b) => b.expectedTotalEnergy - a.expectedTotalEnergy)[0];
    }

    get weatherSummary(): string {
        if (!this.predictionData) return '';
        const counts: any = {};
        this.predictionData.predictions.forEach(p => counts[p.primaryWeather] = (counts[p.primaryWeather] || 0) + 1);
        return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0][0];
    }

    getWeatherSeverity(condition: string): any {
        switch (condition) {
            case 'SUNNY': return 'success';
            case 'PARTLY_CLOUDY': return 'info';
            case 'CLOUDY': return 'warn';
            case 'RAINY': return 'danger';
            default: return 'secondary';
        }
    }

    initChartOptions() {
        this.barOptions = {
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
            }
        };

        this.lineOptions = {
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: 'Hour of Day' } },
                y: { beginAtZero: true, title: { display: true, text: 'Watts' } }
            },
            elements: {
                line: { tension: 0.4 },
                point: { radius: 2 }
            }
        };
    }

    updateCharts() {
        if (!this.predictionData) return;

        // Bar Chart (7-Day Trend)
        this.barData = {
            labels: this.predictionData.predictions.map(p => new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [{
                label: 'Expected Energy',
                data: this.predictionData.predictions.map(p => p.expectedTotalEnergy),
                backgroundColor: this.predictionData.predictions.map(p => 
                    p.primaryWeather === 'SUNNY' ? '#fbbf24' : '#60a5fa'
                ),
                borderRadius: 8
            }]
        };

        this.updateLineChart();
    }

    updateLineChart() {
        if (!this.selectedDay) return;

        this.lineData = {
            labels: this.selectedDay.hourlyProfile.map(h => `${h.hour}:00`),
            datasets: [{
                label: 'Predicted Power (W)',
                data: this.selectedDay.hourlyProfile.map(h => h.expectedPower),
                fill: true,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        };
    }
}
