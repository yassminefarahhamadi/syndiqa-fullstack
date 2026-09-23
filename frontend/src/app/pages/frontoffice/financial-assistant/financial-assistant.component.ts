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
import { FinancialAssistantService } from './financial-assistant.service';

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

@Component({
  selector: 'app-financial-assistant',
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
  templateUrl: './financial-assistant.component.html',
  styleUrls: ['./financial-assistant.component.scss']
})
export class FinancialAssistantComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private financialService = inject(FinancialAssistantService);

  // State
  activeTab = signal(0);
  
  // Bank Statement Analysis
  bankStatementFile: File | null = null;
  bankStatementLoading = signal(false);
  bankStatementData: BankStatement | null = null;
  analysisData: FinancialAnalysis | null = null;
  chartData: any = null;

  // Financial Chatbot
  chatForm: FormGroup;
  chatMessages: Array<{ role: string; content: string; timestamp: Date }> = [];
  chatLoading = signal(false);
  chatInput = '';

  // Smart Bill Analysis
  billFile: File | null = null;
  billLoading = signal(false);
  billAnalysisData: SmartBillAnalysis | null = null;
  billForm: FormGroup;

  // UI State
  userId = this.auth.user()?.id || '';
  organizationId = this.auth.organizationId() || '';

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
    // Initialize
  }

  // ═══════════════════════════════════════════════════════════
  // BANK STATEMENT ANALYSIS
  // ═══════════════════════════════════════════════════════════

  onBankStatementSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.bankStatementFile = file;
      this.messageService.add({
        severity: 'info',
        summary: 'File Selected',
        detail: `${file.name} ready for analysis`
      });
    }
  }

  analyzeBankStatement(): void {
    if (!this.bankStatementFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File',
        detail: 'Please select a bank statement file'
      });
      return;
    }

    this.bankStatementLoading.set(true);
    const formData = new FormData();
    formData.append('file', this.bankStatementFile);

    this.financialService.analyzeBankStatement(formData).subscribe({
      next: (response: any) => {
        this.bankStatementData = response.bankStatement;
        this.analysisData = response.analysis;
        this.prepareChartData();
        this.bankStatementLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: 'Bank statement analyzed successfully'
        });
      },
      error: (error) => {
        this.bankStatementLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Analysis Failed',
          detail: error.error?.error || 'Failed to analyze bank statement'
        });
      }
    });
  }

  prepareChartData(): void {
    if (!this.analysisData) return;

    const categories = Object.keys(this.analysisData.expensesByCategory);
    const amounts = Object.values(this.analysisData.expensesByCategory);

    this.chartData = {
      labels: categories,
      datasets: [
        {
          label: 'Expenses by Category',
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

  getHealthScoreColor(score: string): 'success' | 'info' | 'warn' | 'danger' {
    const colors: { [key: string]: 'success' | 'info' | 'warn' | 'danger' } = {
      'EXCELLENT': 'success',
      'GOOD': 'info',
      'AVERAGE': 'warn',
      'POOR': 'danger'
    };
    return colors[score] || 'info';
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
    
    // Add user message to chat
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
    return trend === 'INCREASING' ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  getTrendColor(trend: string): 'success' | 'danger' {
    return trend === 'INCREASING' ? 'danger' : 'success';
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
