import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';

import { Chart, registerables } from 'chart.js';
import { IncidentService } from '@/app/pages/service/incident.service';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    CardModule,
    ChipModule,
    SkeletonModule,
    TooltipModule,
    ProgressBarModule,
    BadgeModule,
    DividerModule,
    RippleModule
  ],
  template: `
    <div class="page">

      <!-- HEADER -->
      <div class="header">
        <div class="title">
          <i class="pi pi-chart-line icon"></i>
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Real-time incident monitoring & insights</p>
          </div>
        </div>

        <div class="date">
          <i class="pi pi-calendar"></i>
          <span>{{ currentDate | date:'MMMM d, yyyy' }}</span>
        </div>
      </div>

      <!-- CARDS -->
      <div class="cards">

        <div class="card total">
          <div class="badge"><i class="pi pi-chart-bar"></i></div>
          <div>
            <span>Total</span>
            <h2>{{ overview?.total || 0 }}</h2>
          </div>
        </div>

        <div class="card resolved">
          <div class="badge"><i class="pi pi-check-circle"></i></div>
          <div>
            <span>Resolved</span>
            <h2>{{ overview?.resolved || 0 }}</h2>
          </div>
        </div>

        <div class="card pending">
          <div class="badge"><i class="pi pi-spin pi-spinner"></i></div>
          <div>
            <span>Pending</span>
            <h2>{{ overview?.pending || 0 }}</h2>
          </div>
        </div>

        <div class="card rate">
          <div class="badge"><i class="pi pi-percentage"></i></div>
          <div>
            <span>Rate</span>
            <h2>{{ overview?.resolutionRate || 0 }}%</h2>
          </div>
        </div>

      </div>

      <!-- CHARTS -->
      <div class="charts">

        <div class="chart-box">
          <h3>Weekly Incidents</h3>
          <canvas id="weeklyChart"></canvas>
        </div>

        <div class="chart-box">
          <h3>Categories</h3>
          <canvas id="categoryChart"></canvas>
        </div>

      </div>

    </div>
  `,
  styles: [`
    /* PAGE */
    .page {
      min-height: 100vh;
      padding: 20px;
      background: var(--surface-ground);
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface-card);
      padding: 20px;
      border-radius: 18px;
      box-shadow: var(--card-shadow);
      margin-bottom: 20px;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .icon {
      font-size: 2rem;
      color: var(--primary-color);
    }

    h1 {
      margin: 0;
      font-size: 1.6rem;
      color: var(--text-color);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
    }

    .date {
      background: var(--surface-hover);
      padding: 8px 15px;
      border-radius: 50px;
      display: flex;
      gap: 8px;
      align-items: center;
      border: 1px solid var(--surface-border);
    }

    /* CARDS */
    .cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .card {
      background: var(--surface-card);
      padding: 18px;
      border-radius: 18px;
      display: flex;
      gap: 12px;
      align-items: center;
      box-shadow: var(--card-shadow);
      transition: 0.25s;
    }

    .card:hover {
      transform: translateY(-6px);
    }

    .badge {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .card span {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .card h2 {
      margin: 0;
      font-size: 1.6rem;
      color: var(--text-color);
    }

    .total .badge { background: #6366f1; }
    .resolved .badge { background: #22c55e; }
    .pending .badge { background: #f59e0b; }
    .rate .badge { background: #06b6d4; }

    /* CHARTS */
    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .chart-box {
      background: var(--surface-card);
      padding: 18px;
      border-radius: 18px;
      box-shadow: var(--card-shadow);
    }

    h3 {
      margin-bottom: 10px;
      color: var(--text-color);
    }

    canvas {
      max-height: 300px;
    }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .cards {
        grid-template-columns: repeat(2, 1fr);
      }
      .charts {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 500px) {
      .cards {
        grid-template-columns: 1fr;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
})
export class incidentStats implements OnInit, AfterViewInit, OnDestroy {

  overview: any;
  currentDate = new Date();

  private weeklyChart?: Chart<'line', number[], string>;
  private categoryChart?: Chart<'pie', number[], string>;

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  ngAfterViewInit(): void {
    this.loadCharts();
  }

  ngOnDestroy(): void {
    this.weeklyChart?.destroy();
    this.categoryChart?.destroy();
  }

  loadOverview() {
    this.incidentService.getOverview().subscribe(data => {
      this.overview = data;
    });
  }

  loadCharts() {
    this.loadWeeklyChart();
    this.loadCategoryChart();
  }

  loadWeeklyChart() {
    this.incidentService.getWeekly().subscribe(data => {
      const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
      if (!ctx) return;

      this.weeklyChart?.destroy();

      this.weeklyChart = new Chart<'line', number[], string>(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.day),
          datasets: [{
            data: data.map(d => d.total),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    });
  }

  loadCategoryChart() {
    this.incidentService.getCategory().subscribe(data => {
      const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
      if (!ctx) return;

      this.categoryChart?.destroy();

     this.categoryChart = new Chart<'pie', number[], string>(ctx, {
  type: 'pie',
  data: {
    labels: data.map(d => d.category),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: [
         '#3a5eed', // violet
  '#e11d48', // teal
  '#f97316', // orange
  '#0ea5e9', // blue
  '#14b8a6'  
        ],
        borderWidth: 1,
        borderColor: 'var(--surface-card)'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }
});
    });
  }
}