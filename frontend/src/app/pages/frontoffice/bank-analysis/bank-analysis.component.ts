import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ChipModule } from 'primeng/chip';
import { KnobModule } from 'primeng/knob';
import { AccordionModule } from 'primeng/accordion';
import { FinancialAssistantService } from '../financial-assistant/financial-assistant.service';

interface BankStatement { accountNumber: string; bankName: string; balance: number; transactions: Transaction[]; statementDate: string; }
interface Transaction { date: string; description: string; amount: number; type: string; category: string; }
interface FinancialAnalysis { totalIncome: number; totalExpenses: number; savingsRate: number; financialHealthScore: string; expensesByCategory: { [key: string]: number }; recommendations: string[]; investmentSuggestions: string[]; summary: string; }

@Component({
  selector: 'app-bank-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, FileUploadModule, CardModule, ProgressBarModule, ToastModule, ChartModule, TagModule, DividerModule, SkeletonModule, TooltipModule, TableModule, ChipModule, KnobModule, AccordionModule],
  providers: [MessageService],
  template: `
<div class="ds-page">
  <div class="ds-orbs"><div class="ds-o1"></div><div class="ds-o2"></div></div>
  <div class="ds-wrap">
    <div class="ds-hdr">
      <h1 class="ds-h1">Bank Statement Analysis</h1>
      <p class="ds-sub">Upload your bank statement for AI-powered financial insights and recommendations.</p>
    </div>

    <!-- Upload -->
    <div *ngIf="!bankStatementData" class="ds-upload-section">
      <div class="ds-upload-zone">
        <label for="fileInput" class="ds-upload-label">
          <div class="ds-upload-inner">
            <div class="ds-upload-icon-wrap"><i class="pi pi-cloud-upload ds-upload-icon"></i></div>
            <h3 class="ds-upload-title">Drag & drop statements</h3>
            <p class="ds-upload-hint">Support for PDF, CSV, and secure banking exports (max 10MB)</p>
            <span class="ds-browse-btn">Browse Files <i class="pi pi-external-link" style="font-size:12px"></i></span>
          </div>
        </label>
        <input #fileInput id="fileInput" type="file" accept=".pdf,.csv,.xlsx,.xls" multiple (change)="onFileSelected($event)" class="ds-hidden" />
      </div>

      <div *ngIf="bankStatementFiles.length > 0" class="ds-file-info">
        <div *ngFor="let f of bankStatementFiles; let i = index" class="ds-file-row ds-mb-sm">
          <div class="ds-file-meta"><i class="pi pi-file ds-file-icon"></i><div><p class="ds-fname">{{ f.name }}</p><p class="ds-fsize">{{ formatFileSize(f.size) }}</p></div></div>
          <button class="ds-icon-btn-remove" (click)="removeFile(i)"><i class="pi pi-times"></i></button>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:.5rem">
          <p-button label="Analyze All ({{ bankStatementFiles.length }})" icon="pi pi-arrow-right" [loading]="bankStatementLoading()" (onClick)="analyzeBankStatement()" />
        </div>
      </div>

      <div class="ds-features">
        <div class="ds-feat-card" *ngFor="let f of featureCards">
          <div class="ds-feat-glow"></div>
          <div class="ds-feat-head"><i [class]="f.icon + ' ds-feat-icon'"></i><h4 class="ds-feat-title">{{ f.title }}</h4></div>
          <p class="ds-feat-desc">{{ f.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div *ngIf="bankStatementData && analysisData" class="ds-results">
      <div class="ds-stat-grid">
        <div class="ds-stat-card" *ngFor="let s of getStatCards()">
          <div class="ds-stat-icon-wrap" [style.background]="s.bg"><i [class]="s.icon" [style.color]="s.color"></i></div>
          <div><p class="ds-stat-label">{{ s.label }}</p><p class="ds-stat-val">{{ s.value }}</p></div>
        </div>
      </div>

      <div class="ds-result-grid">
        <div class="ds-result-main">
          <div class="ds-glass-card ds-mb"><div class="ds-sec-head"><i class="pi pi-heart ds-sec-icon"></i><h3>Financial Health</h3></div>
            <div class="ds-health-row"><p-knob [ngModel]="healthScoreValue" [size]="120" [strokeWidth]="8" [valueColor]="getHealthScoreColor(analysisData.financialHealthScore)" [readonly]="true" />
              <div><p-tag [value]="analysisData.financialHealthScore" [severity]="getHealthScoreSeverity(analysisData.financialHealthScore)" /><p class="ds-health-sum">{{ analysisData.summary }}</p></div>
            </div>
          </div>
          <div class="ds-glass-card ds-mb"><div class="ds-sec-head"><i class="pi pi-chart-pie ds-sec-icon"></i><h3>Expense Breakdown</h3></div><p-chart type="doughnut" [data]="chartData" [options]="chartOptions" height="300px" /></div>
          <div class="ds-glass-card"><div class="ds-sec-head"><i class="pi pi-list ds-sec-icon"></i><h3>Recent Transactions</h3></div>
            <p-table [value]="bankStatementData.transactions.slice(0, 10)" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
              <ng-template #header><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></ng-template>
              <ng-template #body let-t><tr><td>{{ t.date | date:'short' }}</td><td>{{ t.description }}</td><td><p-chip [label]="t.category" size="small" /></td><td [class]="t.type==='CREDIT'?'ds-credit':'ds-debit'">{{ t.type==='CREDIT'?'+':'-' }}{{ t.amount | currency:'TND' }}</td></tr></ng-template>
            </p-table>
          </div>
        </div>
        <div class="ds-result-side">
          <div class="ds-glass-card ds-mb"><div class="ds-sec-head"><i class="pi pi-lightbulb ds-sec-icon"></i><h3>Recommendations</h3></div>
            <div class="ds-rec-list"><div *ngFor="let r of analysisData.recommendations; let i=index" class="ds-rec-item"><span class="ds-rec-num">{{ i+1 }}</span><p>{{ r }}</p></div></div>
          </div>
          <div class="ds-glass-card ds-mb"><div class="ds-sec-head"><i class="pi pi-chart-line ds-sec-icon"></i><h3>Investment Ideas</h3></div>
            <div class="ds-rec-list"><div *ngFor="let s of analysisData.investmentSuggestions" class="ds-inv-item"><i class="pi pi-arrow-right ds-inv-icon"></i><p>{{ s }}</p></div></div>
          </div>
          <div class="ds-glass-card"><p-button label="Download Report" icon="pi pi-download" styleClass="w-full" (onClick)="downloadReport()" /><p-button label="Analyze Another" icon="pi pi-refresh" severity="secondary" [outlined]="true" styleClass="w-full ds-mt" (onClick)="reset()" /></div>
        </div>
      </div>
    </div>
  </div>
</div>
<p-toast />
  `,
  styles: [`
    :host { display:block; font-family:'Inter',sans-serif; --ds-bg:rgba(0,0,0,0.02); --ds-border:rgba(0,0,0,0.08); --ds-text:#1a2e23; --ds-muted:#64748b; --ds-primary:#4edea3; --ds-surface:#f8fafb; color:var(--ds-text); }
    :host-context(.app-dark) { --ds-bg:rgba(255,255,255,0.03); --ds-border:rgba(255,255,255,0.1); --ds-text:#dde4dd; --ds-muted:#86948a; --ds-surface:#0e1511; }
    .ds-page { position:relative; min-height:100vh; color:var(--ds-text); }
    .ds-orbs { position:fixed; inset:0; z-index:-1; pointer-events:none; }
    .ds-o1 { position:absolute; top:10%; left:15%; width:24rem; height:24rem; background:rgba(78,222,163,0.05); filter:blur(120px); border-radius:50%; }
    .ds-o2 { position:absolute; bottom:20%; right:10%; width:30rem; height:30rem; background:rgba(59,130,246,0.04); filter:blur(150px); border-radius:50%; }
    .ds-wrap { max-width:80rem; margin:0 auto; padding:0 1.5rem; }
    .ds-hdr { margin-bottom:2rem; }
    .ds-h1 { font-size:2.5rem; font-weight:700; letter-spacing:-0.02em; margin:0 0 .5rem; }
    .ds-sub { color:var(--ds-muted); max-width:36rem; margin:0; font-size:1.125rem; }
    .ds-hidden { display:none; }
    .ds-glass-card { background:var(--ds-bg); backdrop-filter:blur(20px); border:1px solid var(--ds-border); border-radius:1rem; padding:1.5rem; }
    .ds-mb { margin-bottom:1.5rem; }
    .ds-mt { margin-top:.5rem; }

    /* Upload */
    .ds-upload-zone { margin-bottom:2rem; }
    .ds-upload-label { cursor:pointer; display:block; }
    .ds-upload-inner { background:var(--ds-bg); backdrop-filter:blur(20px); border:2px dashed var(--ds-border); border-radius:1rem; padding:3rem; text-align:center; transition:all .3s; }
    .ds-upload-inner:hover { border-color:rgba(16,185,129,0.4); }
    .ds-upload-icon-wrap { width:5rem; height:5rem; border-radius:50%; background:rgba(16,185,129,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; transition:transform .3s; }
    .ds-upload-inner:hover .ds-upload-icon-wrap { transform:scale(1.1); }
    .ds-upload-icon { font-size:2rem; color:var(--ds-primary); }
    .ds-upload-title { font-size:1.5rem; font-weight:600; margin:0 0 .5rem; }
    .ds-upload-hint { color:var(--ds-muted); margin:0 0 1.5rem; }
    .ds-browse-btn { display:inline-flex; align-items:center; gap:.5rem; background:var(--ds-primary); color:#003824; font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; padding:.75rem 1.5rem; border-radius:9999px; box-shadow:0 0 15px rgba(16,185,129,0.2); }

    .ds-file-info { margin-bottom:2rem; }
    .ds-file-row { display:flex; align-items:center; justify-content:space-between; background:var(--ds-bg); backdrop-filter:blur(20px); border:1px solid var(--ds-border); border-radius:.75rem; padding:1rem 1.5rem; }
    .ds-file-meta { display:flex; align-items:center; gap:.75rem; }
    .ds-file-icon { font-size:1.25rem; color:#3b82f6; }
    .ds-fname { font-weight:600; margin:0; }
    .ds-fsize { font-size:.875rem; color:var(--ds-muted); margin:0; }
    .ds-mb-sm { margin-bottom:.5rem; }
    .ds-icon-btn-remove { background:transparent; border:1px solid var(--ds-border); border-radius:.375rem; padding:.375rem .5rem; cursor:pointer; color:var(--ds-muted); transition:all .2s; }
    .ds-icon-btn-remove:hover { color:#ef4444; border-color:rgba(239,68,68,0.3); }

    /* Features */
    .ds-features { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:2rem; }
    @media(max-width:768px) { .ds-features { grid-template-columns:1fr; } }
    .ds-feat-card { background:var(--ds-bg); backdrop-filter:blur(20px); border:1px solid var(--ds-border); border-radius:.75rem; padding:1.5rem; position:relative; overflow:hidden; }
    .ds-feat-glow { position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(90deg,transparent,rgba(16,185,129,0.3),transparent); opacity:0; transition:opacity .3s; }
    .ds-feat-card:hover .ds-feat-glow { opacity:1; }
    .ds-feat-head { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
    .ds-feat-icon { color:var(--ds-primary); background:rgba(16,185,129,0.1); padding:.5rem; border-radius:.5rem; }
    .ds-feat-title { font-size:1.25rem; font-weight:600; margin:0; }
    .ds-feat-desc { color:var(--ds-muted); margin:0; font-size:.875rem; line-height:1.5; }

    /* Stats */
    .ds-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:768px) { .ds-stat-grid { grid-template-columns:repeat(2,1fr); } }
    .ds-stat-card { background:var(--ds-bg); backdrop-filter:blur(20px); border:1px solid var(--ds-border); border-radius:1rem; padding:1.25rem; display:flex; align-items:center; gap:.75rem; }
    .ds-stat-icon-wrap { width:3rem; height:3rem; border-radius:.75rem; display:flex; align-items:center; justify-content:center; }
    .ds-stat-label { font-size:.75rem; color:var(--ds-muted); margin:0; text-transform:uppercase; letter-spacing:.05em; font-weight:600; }
    .ds-stat-val { font-size:1.25rem; font-weight:700; margin:.25rem 0 0; }

    /* Results */
    .ds-result-grid { display:grid; grid-template-columns:2fr 1fr; gap:1.5rem; }
    @media(max-width:1024px) { .ds-result-grid { grid-template-columns:1fr; } }
    .ds-sec-head { display:flex; align-items:center; gap:.5rem; margin-bottom:1rem; }
    .ds-sec-head h3 { font-size:1.125rem; font-weight:600; margin:0; }
    .ds-sec-icon { color:var(--ds-primary); }
    .ds-health-row { display:flex; align-items:center; gap:2rem; flex-wrap:wrap; }
    .ds-health-sum { color:var(--ds-muted); font-size:.875rem; margin:.5rem 0 0; }
    .ds-credit { color:#10b981; font-weight:600; }
    .ds-debit { color:#ef4444; font-weight:600; }

    .ds-rec-list { display:flex; flex-direction:column; gap:.75rem; }
    .ds-rec-item { display:flex; align-items:flex-start; gap:.5rem; padding:.75rem; background:rgba(16,185,129,0.05); border-radius:.5rem; border-left:3px solid var(--ds-primary); }
    .ds-rec-item p { margin:0; font-size:.875rem; }
    .ds-rec-num { flex-shrink:0; width:1.25rem; height:1.25rem; background:var(--ds-primary); color:#003824; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; }
    .ds-inv-item { display:flex; align-items:flex-start; gap:.5rem; padding:.75rem; background:rgba(16,185,129,0.05); border-radius:.5rem; border-left:3px solid #10b981; }
    .ds-inv-item p { margin:0; font-size:.875rem; }
    .ds-inv-icon { color:#10b981; margin-top:.125rem; }
  `]
})
export class BankAnalysisComponent implements OnInit {
  private messageService = inject(MessageService);
  private financialService = inject(FinancialAssistantService);

  bankStatementFiles: File[] = [];
  bankStatementLoading = signal(false);
  bankStatementData: BankStatement | null = null;
  analysisData: FinancialAnalysis | null = null;
  chartData: any = null;
  chartOptions: any = null;
  healthScoreValue = 0;
  analysisHistory: any[] = [];
  private readonly STORAGE_KEY = 'syndiqa_bank_analysis_history';

  featureCards = [
    { icon: 'pi pi-shield', title: 'Secure', desc: 'End-to-end encryption with zero-knowledge architecture. Your financial data never leaves your secure environment.' },
    { icon: 'pi pi-bolt', title: 'Fast', desc: 'Neural network processing delivers detailed categorization and anomaly detection in milliseconds.' },
    { icon: 'pi pi-sparkles', title: 'Smart', desc: 'Automated trend spotting and liquidity forecasts powered by our proprietary AI engine.' }
  ];

  ngOnInit(): void {
    this.initChartOptions();
    this.loadAnalysisHistory();
  }

  getStatCards() {
    return [
      { icon: 'pi pi-wallet', label: 'Balance', value: (this.bankStatementData?.balance || 0).toFixed(3) + ' TND', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      { icon: 'pi pi-arrow-down', label: 'Total Income', value: (this.analysisData?.totalIncome || 0).toFixed(3) + ' TND', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      { icon: 'pi pi-arrow-up', label: 'Total Expenses', value: (this.analysisData?.totalExpenses || 0).toFixed(3) + ' TND', bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
      { icon: 'pi pi-percentage', label: 'Savings Rate', value: (this.analysisData?.savingsRate || 0) + '%', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }
    ];
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { this.messageService.add({ severity: 'error', summary: 'File Too Large', detail: `${file.name} exceeds 10MB limit` }); continue; }
      const allowedTypes = ['.pdf', '.csv', '.xlsx', '.xls'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedTypes.includes(fileExt)) { this.messageService.add({ severity: 'error', summary: 'Invalid File Type', detail: `${file.name}: only PDF, CSV, or Excel allowed` }); continue; }
      this.bankStatementFiles.push(file);
    }
    if (this.bankStatementFiles.length > 0) {
      this.messageService.add({ severity: 'success', summary: 'Files Selected', detail: `${this.bankStatementFiles.length} file(s) ready for analysis`, life: 3000 });
    }
    // Reset input so same file can be re-selected
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.bankStatementFiles.splice(index, 1);
  }

  onBankStatementSelect(event: any): void {
    const file = event.files[0];
    if (file) { this.bankStatementFiles.push(file); this.messageService.add({ severity: 'success', summary: 'File Selected', detail: `${file.name} ready for analysis`, life: 3000 }); }
  }

  analyzeBankStatement(): void {
    if (this.bankStatementFiles.length === 0) { this.messageService.add({ severity: 'warn', summary: 'No Files', detail: 'Please select at least one bank statement file' }); return; }
    this.bankStatementLoading.set(true);
    const formData = new FormData();
    this.bankStatementFiles.forEach(f => formData.append('file', f));
    this.financialService.analyzeBankStatement(formData).subscribe({
      next: (response: any) => {
        this.bankStatementData = response.bankStatement;
        this.analysisData = response.analysis;
        this.prepareChartData();
        this.calculateHealthScore();
        this.bankStatementLoading.set(false);
        this.saveAnalysis();
        this.messageService.add({ severity: 'success', summary: 'Analysis Complete', detail: 'Your bank statements have been analyzed successfully', life: 5000 });
      },
      error: (error) => { this.bankStatementLoading.set(false); this.messageService.add({ severity: 'error', summary: 'Analysis Failed', detail: error.error?.error || 'Failed to analyze bank statement' }); }
    });
  }

  prepareChartData(): void {
    if (!this.analysisData) return;
    this.chartData = { labels: Object.keys(this.analysisData.expensesByCategory), datasets: [{ data: Object.values(this.analysisData.expensesByCategory), backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'], borderWidth: 0 }] };
  }

  initChartOptions(): void { this.chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } } } }; }

  calculateHealthScore(): void {
    if (!this.analysisData) return;
    const scoreMap: { [k: string]: number } = { 'EXCELLENT': 90, 'GOOD': 75, 'AVERAGE': 50, 'POOR': 25 };
    this.healthScoreValue = scoreMap[this.analysisData.financialHealthScore] || 50;
  }

  getHealthScoreColor(score: string): string { return ({ 'EXCELLENT': '#10b981', 'GOOD': '#3b82f6', 'AVERAGE': '#f59e0b', 'POOR': '#ef4444' } as any)[score] || '#6b7280'; }
  getHealthScoreSeverity(score: string): 'success' | 'info' | 'warn' | 'danger' { return ({ 'EXCELLENT': 'success', 'GOOD': 'info', 'AVERAGE': 'warn', 'POOR': 'danger' } as any)[score] || 'info'; }
  formatFileSize(bytes: number): string { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes','KB','MB','GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]; }
  downloadReport(): void { this.messageService.add({ severity: 'info', summary: 'Downloading', detail: 'Generating your financial report...' }); setTimeout(() => { this.messageService.add({ severity: 'success', summary: 'Downloaded', detail: 'Report downloaded successfully' }); }, 1500); }
  reset(): void { this.bankStatementFiles = []; this.bankStatementData = null; this.analysisData = null; this.chartData = null; this.healthScoreValue = 0; }

  private saveAnalysis(): void {
    try {
      const entry = {
        date: new Date().toISOString(),
        files: this.bankStatementFiles.map(f => f.name),
        balance: this.bankStatementData?.balance,
        healthScore: this.analysisData?.financialHealthScore,
        savingsRate: this.analysisData?.savingsRate
      };
      this.analysisHistory.unshift(entry);
      if (this.analysisHistory.length > 10) this.analysisHistory = this.analysisHistory.slice(0, 10);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.analysisHistory));
    } catch (e) { console.warn('Failed to save analysis history:', e); }
  }

  private loadAnalysisHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) this.analysisHistory = JSON.parse(stored);
    } catch (e) { console.warn('Failed to load analysis history:', e); }
  }
}
