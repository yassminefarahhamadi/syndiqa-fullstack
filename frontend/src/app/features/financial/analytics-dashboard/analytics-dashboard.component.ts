import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FinancialAnalyticsService } from '../../../services/financial-analytics.service';
import { MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { BuildingService, Building } from '../../../pages/backoffice/property/building-complete';

/** Dashboard summary shape returned by the backend analytics endpoint */
interface DashboardSummary {
  totalCharged: number;
  totalCollected: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  monthlyTrends: Array<{ monthLabel: string; collectedAmount: number }>;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ProgressSpinnerModule,
    ToastModule,
    ChartModule,
    KnobModule,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  providers: [MessageService],
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  summary: DashboardSummary | null = null;
  loading = true;
  aiLoading = false;
  aiInsightsText: string | null = null;

  riskChartData: any;
  riskChartOptions: any;
  trendChartData: any;
  trendChartOptions: any;

  buildings: Building[] = [];
  selectedBuildingId: string | null = null;

  /** Auto-refresh subscription handle */
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private dataSub: Subscription | null = null;

  constructor(
    private analyticsService: FinancialAnalyticsService,
    private messageService: MessageService,
    private buildingService: BuildingService
  ) {}

  ngOnInit(): void {
    this.loadBuildings();
    this.loadData();
    // Refresh dashboard data every 60 seconds so numbers stay current without a page reload
    this.refreshHandle = setInterval(() => this.loadData(), 60_000);
  }

  ngOnDestroy(): void {
    // Clean up timer and active HTTP subscription to prevent memory leaks
    if (this.refreshHandle) clearInterval(this.refreshHandle);
    this.dataSub?.unsubscribe();
  }

  loadBuildings(): void {
    this.buildingService.getAll().subscribe({
      next: (data) => {
        this.buildings = data;
      },
      error: () => {
        console.error('Failed to load buildings');
      }
    });
  }

  onBuildingChange(): void {
    // When a new building is selected, reload the data
    this.loadData();
  }

  loadData(): void {
    if (!this.summary) {
      this.loading = true;
    }
    this.dataSub?.unsubscribe(); // Cancel any previous in-flight request
    this.dataSub = this.analyticsService.getDashboardData(this.selectedBuildingId || undefined).subscribe({
      next: (data: DashboardSummary) => {
        this.summary = data;
        this.buildCharts();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not fetch financial data. Please try again.',
        });
        this.loading = false;
      },
    });
  }

  /**
   * Builds Chart.js datasets for the Risk Doughnut and Payment Trend Line charts.
   * Called after every successful data load so charts always reflect the latest state.
   */
  private buildCharts(): void {
    if (!this.summary) return;

    // ── Risk Distribution (Doughnut) ──────────────────────────────────────
    this.riskChartData = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [
            this.summary.lowRiskCount,
            this.summary.mediumRiskCount,
            this.summary.highRiskCount,
          ],
          backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
          hoverBackgroundColor: ['#16a34a', '#ea580c', '#dc2626'],
        },
      ],
    };

    this.riskChartOptions = {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} residents`,
          },
        },
      },
      cutout: '65%', // Slightly thicker ring for better readability
    };

    // ── Monthly Payment Trends (Line) ─────────────────────────────────────
    const trendLabels = this.summary.monthlyTrends.map((t) => t.monthLabel);
    const trendValues = this.summary.monthlyTrends.map((t) => t.collectedAmount);

    this.trendChartData = {
      labels: trendLabels,
      datasets: [
        {
          label: 'Collected (TND)',
          data: trendValues,
          fill: true,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    this.trendChartOptions = {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v: number) => `${v.toLocaleString()} TND`,
          },
        },
      },
    };
  }

  /**
   * Returns a semantic color for the collection-rate knob:
   *  ≥ 80% → green (healthy), ≥ 50% → orange (at risk), < 50% → red (critical)
   */
  getKnobColor(rate: number): string {
    if (rate >= 80) return '#22c55e';
    if (rate >= 50) return '#f97316';
    return '#ef4444';
  }

  /** Triggers Gemini AI to generate a narrative health report for this syndicate */
  generateInsights(): void {
    this.aiLoading = true;
    this.analyticsService.generateAiInsights().subscribe({
      next: (data: { insightsText: string }) => {
        this.aiInsightsText = data.insightsText;
        this.aiLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'AI Report Ready',
          detail: 'Financial insights generated successfully.',
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'AI Failed',
          detail: 'Could not generate insights. The AI service may be unavailable.',
        });
        this.aiLoading = false;
      },
    });
  }
}
