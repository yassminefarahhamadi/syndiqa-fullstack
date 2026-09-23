import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { FinancialAnalyticsService } from '../../../services/financial-analytics.service';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';

interface DistributionPreview {
  userId: string;
  apartmentId: string;
  surfaceM2: number;
  percentage: number;
  calculatedAmount: number;
}

interface DistributionResponse {
  balanced: boolean;
  sumCalculated: number;
  previews: DistributionPreview[];
}

@Component({
  selector: 'app-distribution-wizard',
  standalone: true,
  imports: [
      CommonModule,
      ReactiveFormsModule,
      ButtonModule,
      ToastModule,
      StepsModule,
      InputTextModule,
      InputNumberModule,
      DatePickerModule,
      TableModule,
      MessageModule
  ],
  templateUrl: './distribution-wizard.component.html',
  styleUrls: ['./distribution-wizard.component.scss'],
  providers: [MessageService]
})
export class DistributionWizardComponent implements OnInit {
  items: MenuItem[] = [];
  activeIndex: number = 0;

  distributionForm: FormGroup;
  previewData: DistributionResponse | null = null;
  loading: boolean = false;
  today: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private financialService: FinancialAnalyticsService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.distributionForm = this.fb.group({
      totalAmount: [null, [Validators.required, Validators.min(0.001)]],
      label: ['', [Validators.required, Validators.minLength(3)]],
      dueDate: [null, Validators.required],
      period: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    this.items = [
      { label: 'Configuration', icon: 'pi pi-fw pi-cog' },
      { label: 'Preview Validation', icon: 'pi pi-fw pi-eye' }
    ];
  }

  onPreview() {
    if (this.distributionForm.invalid) {
      this.messageService.add({severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields correctly.'});
      return;
    }

    // Custom DueDate Validation: Ensure due date is not in the past
    const dueDate = new Date(this.distributionForm.value.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    
    if (dueDate < today) {
      this.messageService.add({severity: 'error', summary: 'Invalid Date', detail: 'The due date must be in the future.'});
      return;
    }

    this.loading = true;
    const formVal = this.distributionForm.value;
    const d = new Date(formVal.dueDate);
    const payload = {
      ...formVal,
      dueDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    };
    this.financialService.previewDistribution(payload).subscribe({
      next: (res: DistributionResponse) => {
        this.previewData = res;
        this.loading = false;
        this.activeIndex = 1; // Move to Step 2

        if (!this.previewData.balanced) {
            this.messageService.add({severity: 'warn', summary: 'Imbalance Detected', detail: 'Calculated fractions do not match total. Review data.', sticky: true});
        }
      },
      error: (err) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to generate preview.'});
        this.loading = false;
      }
    });
  }

  onConfirm() {
    this.loading = true;
    const formVal = this.distributionForm.value;
    const d = new Date(formVal.dueDate);
    const payload = {
      ...formVal,
      dueDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    };
    this.financialService.confirmDistribution(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.messageService.add({severity: 'success', summary: 'Success', detail: 'Charges have been successfully distributed.'});
        
        // Redirect back to analytics dashboard after brief delay
        setTimeout(() => {
            this.router.navigate(['/pages/dashboard/analytics']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({severity: 'error', summary: 'Confirmation Failed', detail: 'Failed to distribute charges.'});
      }
    });
  }

  onCancel() {
    this.activeIndex = 0; // Return to Step 1
    this.previewData = null;
    this.distributionForm.reset();
  }
}
