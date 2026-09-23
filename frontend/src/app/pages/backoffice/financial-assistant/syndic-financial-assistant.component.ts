import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
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

import { AuthService } from '@/app/core/auth/auth.service';
import { FinancialAssistantService } from '../../../pages/frontoffice/financial-assistant/financial-assistant.service';

interface BankStatement {
  accountNumber: string;
  bankName: string;
  balance: number;
  transactions: Transaction[];
  statementDate: string;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
}

interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  financialHealthScore: string;
  expensesByCategory: { [key: string]: number };
  recommendations: string[];
  investmentSuggestions: string[];
  summary: string;
}

interface ChatResponse {
  userId: string;
  question: string;
  answer: string;
  sources: string[];
  confidence: number;
}

interface SmartBillAnalysis {
  billData: {
    amount: number;
    currency: string;
    provider: string;
    date: string;
  };
  smartCategory: string;
  optimizationTips: string[];
  trend: string;
}

interface ExpenseData {
  category: string;
  amount: number;
  percentage: number;
  trend: string;
  status: string;
}

@Component({
  selector: 'app-syndic-financial-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    FileUploadModule,
    CardModule,
    ProgressBarModule,
    ToastModule,
    ChartModule,
    TagModule,
    DividerModule,
    SkeletonModule,
    TooltipModule,
    TableModule
  ],
  providers: [MessageService],
  templateUrl: './syndic-financial-assistant.component.html',
  styleUrls: ['./syndic-financial-assistant.component.scss']
})
export class SyndicFinancialAssistantComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private financialService = inject(FinancialAssistantService);

  // State
  activeTab = signal(0);
  
  // Organization Financial Analysis
  orgBankStatementFile: File | null = null;
  orgBankStatementLoading = signal(false);
  orgBankStatementData: BankStatement | null = null;
  orgAnalysisData: FinancialAnalysis | null = null;
  orgChartData: any = null;

  // Financial Chatbot
  chatForm: FormGroup;
  chatMessages: Array<{ role: string; content: string; timestamp: Date }> = [];
  chatLoading = signal(false);

  // Smart Bill Analysis
  billFile: File | null = null;
  billLoading = signal(false);
  billAnalysisData: SmartBillAnalysis | null = null;
  billForm: FormGroup;

  // Organization Expense Analysis
  expenseChartData: any = null;
  expenseTableData: ExpenseData[] = [];
  expenseLoading = signal(false);

  // UI State
  userId = this.auth.user()?.id || '';
  organizationId = this.auth.organizationId() || '';
  organizationName = this.auth.user()?.organizationId || 'Organization';

  constructor() {
    this.chatForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
    });

    this.billForm = this.fb.group({
      userId: [this.userId, Validators.required],
      organizationId: [this.organizationId, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOrganizationExpenseData();
  }

  // ═══════════════════════════════════════════════════════════
  // ORGANIZATION BANK STATEMENT ANALYSIS
  // ═══════════════════════════════════════════════════════════

  onOrgBankStatementSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.orgBankStatementFile = file;
      this.messageService.add({
        severity: 'info',
        summary: 'File Selected',
        detail: `${file.name} ready for analysis`
      });
    }
  }

  analyzeOrgBankStatement(): void {
    if (!this.orgBankStatementFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Please select a bank statement file'
      });
      return;
    }

    this.orgBankStatementLoading.set(true);
    const formData = new FormData();
    formData.append('file', this.orgBankStatementFile);

    this.financialService.analyzeBankStatement(formData).subscribe({
      next: (response: any) => {
        this.orgBankStatementData = response.bankStatement;
        this.orgAnalysisData = response.analysis;
        this.prepareOrgChartData();
        this.orgBankStatementLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: 'Organization bank statement analyzed successfully'
        });
      },
      error: (error) => {
        this.orgBankStatementLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Analysis Failed',
          detail: error.error?.error || 'Failed to analyze bank statement'
        });
      }
    });
  }

  prepareOrgChartData(): void {
    if (!this.orgAnalysisData) return;

    const categories = Object.keys(this.orgAnalysisData.expensesByCategory);
    const amounts = Object.values(this.orgAnalysisData.expensesByCategory);

    this.orgChartData = {
      labels: categories,
      datasets: [
        {
          label: 'Organization Expenses by Category',
          data: amounts,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ORGANIZATION EXPENSE ANALYSIS
  // ═══════════════════════════════════════════════════════════

  loadOrganizationExpenseData(): void {
    this.expenseLoading.set(true);
    
    // Mock data for organization expenses
    this.expenseTableData = [
      { category: 'Maintenance', amount: 5000, percentage: 25, trend: 'up', status: 'warn' },
      { category: 'Utilities', amount: 3500, percentage: 17.5, trend: 'down', status: 'success' },
      { category: 'Security', amount: 4000, percentage: 20, trend: 'stable', status: 'info' },
      { category: 'Cleaning', amount: 2500, percentage: 12.5, trend: 'up', status: 'warn' },
      { category: 'Administration', amount: 3000, percentage: 15, trend: 'stable', status: 'info' },
      { category: 'Insurance', amount: 2000, percentage: 10, trend: 'down', status: 'success' }
    ];

    const categories = this.expenseTableData.map(e => e.category);
    const amounts = this.expenseTableData.map(e => e.amount);

    this.expenseChartData = {
      labels: categories,
      datasets: [
        {
          label: 'Monthly Expenses (TND)',
          data: amounts,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };

    this.expenseLoading.set(false);
  }

  // ═══════════════════════════════════════════════════════════
  // FINANCIAL CHATBOT
  // ═══════════════════════════════════════════════════════════

  askQuestion(): void {
    if (this.chatForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Input',
        detail: 'Please enter a valid question (3-500 characters)'
      });
      return;
    }

    const question = this.chatForm.get('question')?.value;
    
    this.chatMessages.push({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    this.chatLoading.set(true);
    this.chatForm.reset();

    this.financialService.askFinancialQuestion(question, this.userId).subscribe({
      next: (response: ChatResponse) => {
        this.chatMessages.push({
          role: 'assistant',
          content: response.answer,
          timestamp: new Date()
        });
        this.chatLoading.set(false);
      },
      error: (error) => {
        this.chatLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Chat Error',
          detail: error.error?.error || 'Failed to get response'
        });
      }
    });
  }

  clearChat(): void {
    this.chatMessages = [];
    this.chatForm.reset();
  }

  // ═══════════════════════════════════════════════════════════
  // SMART BILL ANALYSIS
  // ═══════════════════════════════════════════════════════════

  onBillSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.billFile = file;
      this.messageService.add({
        severity: 'info',
        summary: 'Bill Selected',
        detail: `${file.name} ready for analysis`
      });
    }
  }

  analyzeSmartBill(): void {
    if (!this.billFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Please select a bill file'
      });
      return;
    }

    this.billLoading.set(true);
    const formData = new FormData();
    formData.append('file', this.billFile);
    formData.append('userId', this.userId);
    formData.append('organizationId', this.organizationId);

    this.financialService.analyzeSmartBill(formData).subscribe({
      next: (response: any) => {
        this.billAnalysisData = response.analysis;
        this.billLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Bill Analyzed',
          detail: 'Smart bill analysis completed successfully'
        });
      },
      error: (error) => {
        this.billLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Analysis Failed',
          detail: error.error?.error || 'Failed to analyze bill'
        });
      }
    });
  }

  getTrendIcon(trend: string): string {
    if (trend === 'up') return 'pi pi-arrow-up';
    if (trend === 'down') return 'pi pi-arrow-down';
    return 'pi pi-minus';
  }

  getTrendColor(trend: string): 'success' | 'danger' | 'info' {
    if (trend === 'up') return 'danger';
    if (trend === 'down') return 'success';
    return 'info';
  }

  getBillTrendIcon(trend: string): string {
    return trend === 'INCREASING' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  getBillTrendColor(trend: string): 'success' | 'danger' {
    return trend === 'INCREASING' ? 'danger' : 'success';
  }

  getHealthScoreColor(score: string): 'success' | 'info' | 'warn' | 'danger' {
    const colors: { [key: string]: 'success' | 'info' | 'warn' | 'danger' } = {
      'EXCELLENT': 'success',
      'GOOD': 'info',
      'AVERAGE': 'warn',
      'POOR': 'danger'
    };
    return colors[score] || 'info';
  }

  getTotalExpenses(): number {
    return this.expenseTableData.reduce((sum, e) => sum + e.amount, 0);
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND'
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US');
  }
}
