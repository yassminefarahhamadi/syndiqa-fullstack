import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

import { ExecutionStatService, ExecutionStat } from '@/app/pages/service/ExecutionStat.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ChartModule,
    TableModule,
    CardModule
  ],
  template: `
  <div class="stats-page">

    <!-- HEADER Section -->
    <div class="header">
      <div class="header-left">
        <div class="header-icon">📊</div>
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Monitor system performance & execution insights</p>
        </div>
      </div>
      <div class="header-right">
        <div class="live-indicator">
          <span class="pulse-dot"></span>
          <span>Live Monitoring</span>
        </div>
      </div>
    </div>

    <!-- KPI CARDS Grid -->
    <div class="kpi-grid">

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Calls</span>
          <span class="kpi-icon">📞</span>
        </div>
        <div class="kpi-value">{{ totalCalls | number }}</div>
        <div class="kpi-footer">
          <span class="trend" [ngClass]="totalCallsTrend >= 0 ? 'up' : 'down'">
            {{ totalCallsTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(totalCallsTrend) }}
          </span>
          <span>vs last period</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Avg Execution Time</span>
          <span class="kpi-icon">⏱️</span>
        </div>
        <div class="kpi-value">{{ avgTime | number:'1.0-0' }} <span class="kpi-unit">ms</span></div>
        <div class="kpi-footer">
          <span class="trend" [ngClass]="avgTimeTrend >= 0 ? 'up' : 'down'">
            {{ avgTimeTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(avgTimeTrend) }}
          </span>
          <span>vs last period</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Error Rate</span>
          <span class="kpi-icon">⚠️</span>
        </div>
        <div class="kpi-value">{{ errorRate | number:'1.0-2' }}<span class="kpi-unit">%</span></div>
        <div class="kpi-footer">
          <span class="trend" [ngClass]="errorRateTrend >= 0 ? 'up' : 'down'">
            {{ errorRateTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(errorRateTrend) }}
          </span>
          <span>vs last period</span>
        </div>
      </div>

    </div>

    <!-- CHARTS Section -->
    <div class="charts-container">

      <!-- Method Performance Chart -->
      <div class="chart-card">
        <div class="chart-title-section">
          <div>
            <h3>📈 Method Performance</h3>
            <p>Average execution time by method</p>
          </div>
          <div class="chart-badge">Last 30 days</div>
        </div>
        <p-chart type="bar" [data]="methodChartData" [options]="getBarChartOptions()"></p-chart>
      </div>

      <!-- Weekly Trend Chart -->
      <div class="chart-card">
        <div class="chart-title-section">
          <div>
            <h3>📉 Weekly Trend</h3>
            <p>Performance over time</p>
          </div>
          <div class="chart-badge">This year</div>
        </div>
        <p-chart type="line" [data]="weeklyChartData" [options]="getLineChartOptions()"></p-chart>
      </div>

    </div>

    <!-- TABLE Section -->
    <div class="table-wrapper">
      <div class="table-header">
        <div class="table-title">
          <h3>📋 Execution Logs</h3>
          <span class="record-count">{{ stats.length }} total records</span>
        </div>
        <div class="table-filters">
          <input type="text" placeholder="🔍 Filter methods..." class="search-input" (input)="filterTable($event)">
        </div>
      </div>

      <p-table 
        #dt
        [value]="filteredStats" 
        [paginator]="true" 
        [rows]="10"
        [rowsPerPageOptions]="[5,10,15,25]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        styleClass="modern-table">

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="methodName">
              Method <p-sortIcon field="methodName"></p-sortIcon>
            </th>
            <th pSortableColumn="duration">
              Duration <p-sortIcon field="duration"></p-sortIcon>
            </th>
            <th pSortableColumn="success">
              Status <p-sortIcon field="success"></p-sortIcon>
            </th>
            <th pSortableColumn="timestamp">
              Timestamp <p-sortIcon field="timestamp"></p-sortIcon>
            </th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr [class.error-row]="!row.success">
            <td class="method-cell">
              <div class="method-info">
                <div class="method-icon">{{ getMethodIcon(row.methodName) }}</div>
                <div class="method-name">{{ row.methodName }}</div>
              </div>
            </td>
            <td>
              <div class="duration-bar-container">
                <span class="duration-value">{{ row.duration }} ms</span>
                <div class="duration-bar">
                  <div class="duration-progress" [style.width.%]="getDurationPercent(row.duration)"></div>
                </div>
              </div>
            </td>
            <td>
              <span class="status-chip" [class.success]="row.success" [class.error]="!row.success">
                {{ row.success ? '✓ Success' : '✗ Failed' }}
              </span>
            </td>
            <td class="timestamp-cell">{{ formatTime(row.timestamp) }}</td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="empty-message">
              <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>No execution data available</p>
              </div>
            </td>
          </tr>
        </ng-template>

      </p-table>
    </div>

  </div>
  `,
  styles: [`
    /* CSS Variables that adapt to both light and dark modes */
    .stats-page {
      --primary-color: #3b82f6;
      --primary-hover: #2563eb;
      --success-color: #10b981;
      --error-color: #ef4444;
      --warning-color: #f59e0b;
      --border-radius: 12px;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      padding: 1.5rem;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    /* Header Styles */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid var(--surface-border);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--primary-color), #60a5fa);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .header-left p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 100px;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-color);
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* KPI Cards Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      border: 1px solid var(--surface-border);
      transition: var(--transition);
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: var(--primary-color);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .kpi-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-icon {
      font-size: 1.5rem;
    }

    .kpi-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }

    .kpi-unit {
      font-size: 1rem;
      font-weight: 400;
      color: var(--text-color-secondary);
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .trend {
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .trend.up {
      color: var(--success-color);
      background: rgba(16, 185, 129, 0.1);
    }

    .trend.down {
      color: var(--error-color);
      background: rgba(239, 68, 68, 0.1);
    }

    /* Charts Container */
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      border: 1px solid var(--surface-border);
      transition: var(--transition);
    }

    .chart-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .chart-title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .chart-title-section h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .chart-title-section p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .chart-badge {
      padding: 0.25rem 0.75rem;
      background: var(--surface-ground);
      border-radius: 100px;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Table Styles */
    .table-wrapper {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      border: 1px solid var(--surface-border);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .table-title {
      display: flex;
      align-items: baseline;
      gap: 1rem;
    }

    .table-title h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .record-count {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .search-input {
      padding: 0.5rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color);
      font-size: 0.875rem;
      width: 200px;
      transition: var(--transition);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    /* Modern Table */
    ::ng-deep .modern-table {
      width: 100%;
    }

    ::ng-deep .modern-table .p-datatable-wrapper {
      border-radius: 8px;
      overflow-x: auto;
    }

    ::ng-deep .modern-table .p-datatable-thead > tr > th {
      background: var(--surface-ground);
      color: var(--text-color);
      border: none;
      padding: 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      border-bottom: 2px solid var(--surface-border);
    }

    ::ng-deep .modern-table .p-datatable-tbody > tr {
      background: var(--surface-card);
      transition: var(--transition);
      border-bottom: 1px solid var(--surface-border);
    }

    ::ng-deep .modern-table .p-datatable-tbody > tr:hover {
      background: var(--surface-ground);
      transform: scale(1.01);
    }

    ::ng-deep .modern-table .p-datatable-tbody > tr > td {
      padding: 1rem;
      border: none;
      color: var(--text-color);
    }

    .error-row {
      background: rgba(239, 68, 68, 0.05) !important;
    }

    .method-cell {
      padding: 0 !important;
    }

    .method-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .method-icon {
      width: 32px;
      height: 32px;
      background: var(--surface-ground);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .method-name {
      font-weight: 500;
    }

    .duration-bar-container {
      min-width: 120px;
    }

    .duration-value {
      font-size: 0.875rem;
      font-weight: 500;
      display: block;
      margin-bottom: 0.25rem;
    }

    .duration-bar {
      height: 4px;
      background: var(--surface-border);
      border-radius: 2px;
      overflow: hidden;
    }

    .duration-progress {
      height: 100%;
      background: var(--primary-color);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .status-chip {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-chip.success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-color);
    }

    .status-chip.error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error-color);
    }

    .timestamp-cell {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .empty-message {
      text-align: center;
      padding: 3rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    /* Paginator Styles */
    ::ng-deep .modern-table .p-paginator {
      background: transparent;
      border: none;
      margin-top: 1rem;
      padding: 1rem 0 0;
      justify-content: flex-end;
    }

    ::ng-deep .modern-table .p-paginator .p-paginator-pages .p-paginator-page {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      border-radius: 6px;
      margin: 0 0.25rem;
      border: none;
    }

    ::ng-deep .modern-table .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
      background: var(--primary-color);
      color: white;
    }

    ::ng-deep .modern-table .p-paginator .p-paginator-first,
    ::ng-deep .modern-table .p-paginator .p-paginator-prev,
    ::ng-deep .modern-table .p-paginator .p-paginator-next,
    ::ng-deep .modern-table .p-paginator .p-paginator-last {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      border-radius: 6px;
      border: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-page {
        padding: 1rem;
      }
      
      .charts-container {
        grid-template-columns: 1fr;
      }
      
      .kpi-value {
        font-size: 2rem;
      }
      
      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .table-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .search-input {
        width: 100%;
      }
    }
  `]
})
export class StatsComponent implements OnInit {

  stats: ExecutionStat[] = [];
  filteredStats: ExecutionStat[] = [];

  totalCalls = 0;
  avgTime = 0;
  errorRate = 0;
  maxDuration = 0;

  // Trend values (real calculations)
  totalCallsTrend = 0;
  avgTimeTrend = 0;
  errorRateTrend = 0;

  methodChartData: any;
  weeklyChartData: any;

  Math = Math;

  constructor(private statService: ExecutionStatService) {}

  ngOnInit(): void {
    this.statService.getStats().subscribe(data => {
      this.stats = data;
      this.filteredStats = [...data];

      if (!data || data.length === 0) return;

      // Calculate real trends based on time periods
      this.calculateRealTrends(data);
      
      this.totalCalls = data.length;
      this.avgTime = data.reduce((a, b) => a + b.duration, 0) / data.length;
      this.errorRate = (data.filter(s => !s.success).length / data.length) * 100;
      this.maxDuration = Math.max(...data.map(s => s.duration));

      this.buildMethodChart(data);
    });

    this.statService.getWeeklyStats().subscribe(data => {
      this.buildWeeklyChart(data);
    });
  }

  // Method to get dynamic bar chart options based on theme
  getBarChartOptions(): any {
  const isDarkMode = this.isDarkMode();

  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-color-secondary')
        }
      },
      tooltip: {
        bodyColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-color'),
        titleColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-color'),
        backgroundColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--surface-card'),
        borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--surface-border'),
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: {
          color: getComputedStyle(document.documentElement)
                  .getPropertyValue('--surface-border')
        },
        ticks: {
          color: getComputedStyle(document.documentElement)
                  .getPropertyValue('--text-color-secondary')
        }
      },
      x: {
        grid: {
          color: getComputedStyle(document.documentElement)
                  .getPropertyValue('--surface-border')
        },
        ticks: {
          color: getComputedStyle(document.documentElement)
                  .getPropertyValue('--text-color-secondary')
        }
      }
    }
  };
}

  // Method to get dynamic line chart options based on theme
  getLineChartOptions(): any {
  const root = document.documentElement;

  const textColor = getComputedStyle(root).getPropertyValue('--text-color');
  const textColorSecondary = getComputedStyle(root).getPropertyValue('--text-color-secondary');
  const gridColor = getComputedStyle(root).getPropertyValue('--surface-border');
  const cardColor = getComputedStyle(root).getPropertyValue('--surface-card');

  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: textColorSecondary
        }
      },
      tooltip: {
        bodyColor: textColor,
        titleColor: textColor,
        backgroundColor: cardColor,
        borderColor: gridColor,
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColorSecondary
        },
        title: {
          display: true,
          text: 'Time (ms)',
          color: textColorSecondary
        }
      },
      x: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColorSecondary
        },
        title: {
          display: true,
          text: 'Weeks',
          color: textColorSecondary
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderColor: cardColor   
      }
    }
  };
}

  // Helper method to detect if dark mode is active
  isDarkMode(): boolean {
    // Check for PrimeNG theme class on body or html element
    const body = document.body;
    const html = document.documentElement;
    
    // Check for common PrimeNG dark mode classes
    if (body.classList.contains('p-dark') || 
        body.classList.contains('dark-mode') ||
        html.classList.contains('p-dark') ||
        html.classList.contains('dark-mode')) {
      return true;
    }
    
    // Check for data-theme attribute
    const theme = body.getAttribute('data-theme') || html.getAttribute('data-theme');
    if (theme === 'dark' || theme === 'lara-dark' || theme === 'soho-dark' || theme === 'viva-dark') {
      return true;
    }
    
    // Fallback to CSS media query
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  calculateRealTrends(data: ExecutionStat[]) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currentPeriod = data.filter(item => new Date(item.timestamp) >= oneWeekAgo);

  const previousPeriod = data.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
  });

  // =========================
  // 📞 TOTAL CALLS (DELTA)
  // =========================
  const currentCalls = currentPeriod.length;
  const previousCalls = previousPeriod.length;

  this.totalCallsTrend = currentCalls - previousCalls;

  // =========================
  // ⏱ AVG EXECUTION TIME (DELTA)
  // =========================
  const currentAvgTime =
    currentPeriod.length > 0
      ? currentPeriod.reduce((a, b) => a + b.duration, 0) / currentPeriod.length
      : 0;

  const previousAvgTime =
    previousPeriod.length > 0
      ? previousPeriod.reduce((a, b) => a + b.duration, 0) / previousPeriod.length
      : 0;

  this.avgTimeTrend = Math.round(currentAvgTime - previousAvgTime);

  // =========================
  // ❌ ERROR RATE (DELTA % POINTS)
  // =========================
  const currentErrorRate =
    currentPeriod.length > 0
      ? (currentPeriod.filter(s => !s.success).length / currentPeriod.length) * 100
      : 0;

  const previousErrorRate =
    previousPeriod.length > 0
      ? (previousPeriod.filter(s => !s.success).length / previousPeriod.length) * 100
      : 0;

  this.errorRateTrend = Number((currentErrorRate - previousErrorRate).toFixed(2));
}
  buildMethodChart(data: ExecutionStat[]) {
    const grouped: any = {};

    data.forEach(s => {
      if (!grouped[s.methodName]) grouped[s.methodName] = [];
      grouped[s.methodName].push(s.duration);
    });

    const labels = Object.keys(grouped);
    const values = labels.map(m =>
      grouped[m].reduce((a: number, b: number) => a + b, 0) / grouped[m].length
    );

    const isDarkMode = this.isDarkMode();
    
    this.methodChartData = {
      labels,
      datasets: [
        {
          label: 'Avg Execution Time (ms)',
          data: values,
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };
  }

  buildWeeklyChart(data: any[]) {
    const labels = data.map(d => d.week);
    const values = data.map(d => d.avgDuration);

    const isDarkMode = this.isDarkMode();
    const pointBorderColor = isDarkMode ? '#1e293b' : '#ffffff';
    
    this.weeklyChartData = {
      labels,
      datasets: [
        {
          label: 'Weekly Avg Execution Time',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: pointBorderColor,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  getMethodIcon(methodName: string): string {
    const icons: Record<string, string> = {
      'GET': '📥',
      'POST': '📤',
      'PUT': '🔄',
      'DELETE': '🗑️',
      'PATCH': '✏️'
    };
    return icons[methodName] || '⚡';
  }

  getDurationPercent(duration: number): number {
    return (duration / this.maxDuration) * 100;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    if (diffMins < 43200) return `${Math.floor(diffMins / 1440)} days ago`;
    return date.toLocaleDateString();
  }

  filterTable(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
      this.filteredStats = [...this.stats];
    } else {
      this.filteredStats = this.stats.filter(stat => 
        stat.methodName.toLowerCase().includes(searchTerm)
      );
    }
  }
}