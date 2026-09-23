import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '@/app/pages/service/incident.service';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-technician-resolved',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ButtonModule, 
    FormsModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    CurrencyPipe,
    DatePipe
  ],
  providers: [MessageService],
  template: `
    <div class="resolved-container" [class.dark-mode]="isDarkMode()">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Resolved Incidents</h1>
            <p class="page-subtitle">Manage and generate bills for completed incidents</p>
          </div>
          <div class="header-stats">
            <div class="stat-badge">
              <i class="pi pi-check-circle"></i>
              <span>{{ incidents.length }} Resolved</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <p-progressSpinner strokeWidth="4"></p-progressSpinner>
        <p>Loading resolved incidents...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && incidents.length === 0" class="empty-state">
        <i class="pi pi-inbox empty-icon"></i>
        <h3>No Resolved Incidents</h3>
        <p>All resolved incidents will appear here once available.</p>
      </div>

      <!-- Incidents Grid -->
      <div *ngIf="!isLoading && incidents.length > 0" class="incidents-grid">
        <p-card *ngFor="let incident of incidents" class="incident-card" [style]="{ height: '100%' }">
          <ng-template pTemplate="header">
            <div class="card-header">
              <div class="incident-type">
                <i class="pi pi-wrench"></i>
                <span>{{ incident.type || 'Incident' }}</span>
              </div>
              <div class="card-actions">
                <button *ngIf="!billMap[incident.id]" 
                        pButton 
                        pTooltip="Generate Bill"
                        tooltipPosition="top"
                        label="Generate Bill"
                        icon="pi pi-file-pdf"
                        class="p-button-sm p-button-primary"
                        (click)="openBillForm(incident)">
                </button>
                <button *ngIf="billMap[incident.id]" 
                        pButton 
                        pTooltip="View Bill Details"
                        tooltipPosition="top"
                        label="View Bill"
                        icon="pi pi-eye"
                        class="p-button-sm p-button-primary"
                        (click)="viewBill(incident.id)">
                </button>
              </div>
            </div>
          </ng-template>

          <ng-template pTemplate="title">
            <div class="incident-title">
              Incident #{{ incident.id?.slice(-6) || 'N/A' }}
            </div>
          </ng-template>

          <ng-template pTemplate="subtitle">
            <div class="incident-meta">
              <span class="meta-item">
                <i class="pi pi-building"></i>
                Building: {{ incident.buildingName || 'Not specified' }}
              </span>
               <span class="meta-item">
                <i class="pi pi-building"></i>
                Reported By: {{ incident.reportedBy || 'Not specified' }}
              </span>
              <span class="meta-item">
                <i class="pi pi-calendar"></i>
                Resolved
              </span>
            </div>
          </ng-template>

          <div class="incident-content">
            <div class="description-section">
              <label class="section-label">Description</label>
              <p class="incident-description">{{ incident.description || 'No description provided' }}</p>
            </div>

            <div *ngIf="billMap[incident.id]" class="bill-summary">
              <div class="bill-summary-header">
                <i class="pi pi-receipt"></i>
                <span>Bill Summary</span>
              </div>
              <div class="bill-summary-details">
                <div class="bill-amount">
                  <span>Amount:</span>
                  <strong>{{ billMap[incident.id].amount | currency:'USD':'symbol':'1.2-2' }}</strong>
                </div>
                <div class="bill-status">
                  <span>Status:</span>
                  <p-tag [value]="billMap[incident.id].status" 
                         [severity]="getStatusSeverity(billMap[incident.id].status)">
                  </p-tag>
                </div>
              </div>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Bill Form Dialog -->
      <p-dialog header="Generate Bill" 
                [(visible)]="showBillDialog" 
                [modal]="true" 
                [style]="{ width: '500px' }"
                [draggable]="false"
                [resizable]="false">
        <div class="bill-form" *ngIf="selectedIncident">
          <div class="form-group">
            <label for="incidentId">Incident ID</label>
            <input id="incidentId" 
                   type="text" 
                   pInputText 
                   [value]="selectedIncident.id" 
                   disabled
                   class="form-control">
            <small class="form-hint">Bill will be linked to this incident</small>
          </div>

          <div class="form-group">
            <label for="hours">Hours Worked</label>
            <div class="input-with-icon">
              <i class="pi pi-clock"></i>
              <input id="hours" 
                     type="number" 
                     pInputText 
                     [(ngModel)]="billRequest.hours" 
                     placeholder="Enter number of hours"
                     step="0.5"
                     min="0"
                     class="form-control">
            </div>
            <small class="form-hint">Hourly rate: $50.00</small>
          </div>

          <div class="form-group">
            <label for="materialsCost">Materials Cost</label>
            <div class="input-with-icon">
              <i class="pi pi-dollar"></i>
              <input id="materialsCost" 
                     type="number" 
                     pInputText 
                     [(ngModel)]="billRequest.materialsCost" 
                     placeholder="Enter materials cost"
                     step="0.01"
                     min="0"
                     class="form-control">
            </div>
          </div>

          <!-- Calculation Preview -->
          <div class="calculation-preview" *ngIf="billRequest.hours > 0 || billRequest.materialsCost > 0">
            <div class="preview-title">Bill Calculation</div>
            <div class="preview-item">
              <span>Labor ({{ billRequest.hours }} hours × $50.00):</span>
              <strong>{{ (billRequest.hours * 50) | currency:'USD':'symbol':'1.2-2' }}</strong>
            </div>
            <div class="preview-item">
              <span>Materials Cost:</span>
              <strong>{{ billRequest.materialsCost | currency:'USD':'symbol':'1.2-2' }}</strong>
            </div>
            <div class="preview-total">
              <span>Total Amount:</span>
              <strong class="total-amount">{{ calculateTotal() | currency:'USD':'symbol':'1.2-2' }}</strong>
            </div>
          </div>

          <div class="form-actions">
            <button pButton 
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    (click)="closeBillForm()">
            </button>
            <button pButton 
                    label="Generate Bill"
                    icon="pi pi-check"
                    [disabled]="!isBillFormValid()"
                    (click)="generateBill()">
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- Bill Details Dialog -->
      <p-dialog header="Bill Details" 
                [(visible)]="showBillDetailsDialog" 
                [modal]="true" 
                [style]="{ width: '500px' }"
                [draggable]="false"
                [resizable]="false">
        <div class="bill-details" *ngIf="currentBill">
          <div class="bill-detail-header">
            <i class="pi pi-receipt"></i>
            <h3>Bill Information</h3>
          </div>
          
      <!--    <div class="detail-row">
            <span class="detail-label">Bill ID:</span>
            <span class="detail-value">#{{ currentBill.id?.slice(-8) }}</span>
          </div>-->
          
          <div class="detail-row">
            <span class="detail-label">Label:</span>
            <span class="detail-value">{{ currentBill.label }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value amount">{{ currentBill.amount | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">{{ currentBill.dueDate | date:'fullDate' }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <p-tag [value]="currentBill.status" 
                   [severity]="getStatusSeverity(currentBill.status)">
            </p-tag>
          </div>
          
          <div class="detail-row" *ngIf="currentBill.createdDate">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ currentBill.createdDate | date:'medium' }}</span>
          </div>

          <div class="dialog-actions">
            <button pButton 
                    label="Close"
                    icon="pi pi-times"
                    class="p-button-secondary"
                    (click)="showBillDetailsDialog = false">
            </button>
            <button pButton 
                    label="Download PDF"
                    icon="pi pi-download"
                    class="p-button-primary">
            </button>
          </div>
        </div>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .resolved-container {
      min-height: 100vh;
      background: var(--surface-ground);
      padding: 2rem;
      transition: all 0.3s ease;
    }

    /* Dark mode specific background */
    .resolved-container.dark-mode {
      background: var(--surface-ground);
    }

    .page-header {
      background: var(--surface-card);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--surface-border);
      transition: all 0.3s ease;
    }

    .dark-mode .page-header {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, var(--primary-color) 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      color: var(--text-color-secondary);
      margin: 0;
      font-size: 0.9rem;
    }

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-badge {
      background: linear-gradient(135deg, var(--primary-color) 0%, #034b5f 100%);
      color: white;
      padding: 0.5rem 1.25rem;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }

    .stat-badge i {
      font-size: 1.1rem;
    }

    .loading-container {
      text-align: center;
      padding: 4rem;
      background: var(--surface-card);
      border-radius: 20px;
      border: 1px solid var(--surface-border);
    }

    .loading-container p {
      color: var(--text-color-secondary);
      margin-top: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem;
      background: var(--surface-card);
      border-radius: 20px;
      border: 1px solid var(--surface-border);
    }

    .empty-state h3 {
      color: var(--text-color);
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      color: var(--text-color-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
    }

    .incidents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
    }

    .incident-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .incident-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, #033745 100%);
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }

    .incident-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-weight: 600;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .incident-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .incident-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.25rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .meta-item i {
      font-size: 0.8rem;
    }

    .incident-content {
      padding-top: 0.5rem;
    }

    .description-section {
      margin-bottom: 1rem;
    }

    .section-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--text-color-secondary);
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 0.5rem;
    }

    .incident-description {
      color: var(--text-color);
      line-height: 1.5;
      margin: 0;
    }

    .bill-summary {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 8px;
      padding: 0.75rem;
      margin-top: 1rem;
    }

    .bill-summary-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--success-color);
      margin-bottom: 0.5rem;
    }

    .bill-summary-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bill-amount {
      display: flex;
      gap: 0.5rem;
      color: var(--success-color);
    }

    .bill-amount strong {
      font-size: 1.1rem;
      color: var(--success-color);
    }

    .bill-status span {
      color: var(--text-color-secondary);
      margin-right: 0.5rem;
    }

    /* Dialog Styles for Dark Mode */
    ::ng-deep .p-dialog {
      background: var(--surface-card);
      color: var(--text-color);
    }

    ::ng-deep .p-dialog .p-dialog-header {
      background: var(--surface-card);
      color: var(--text-color);
      border-bottom: 1px solid var(--surface-border);
    }

    ::ng-deep .p-dialog .p-dialog-content {
      background: var(--surface-card);
      color: var(--text-color);
    }

    .bill-form {
      padding: 0.5rem 0;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .form-control {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color);
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control:disabled {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      cursor: not-allowed;
      opacity: 0.7;
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .input-with-icon {
      position: relative;
    }

    .input-with-icon i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-color-secondary);
    }

    .input-with-icon input {
      padding-left: 38px;
    }

    .calculation-preview {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      border: 1px solid var(--surface-border);
    }

    .preview-title {
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      color: var(--text-color-secondary);
    }

    .preview-item strong {
      color: var(--text-color);
    }

    .preview-total {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 2px solid var(--surface-border);
      font-weight: 700;
      color: var(--text-color);
    }

    .total-amount {
      color: var(--success-color);
      font-size: 1.1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .bill-details {
      padding: 0.5rem 0;
    }

    .bill-detail-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--surface-border);
    }

    .bill-detail-header i {
      font-size: 2rem;
      color: var(--primary-color);
    }

    .bill-detail-header h3 {
      margin: 0;
      color: var(--text-color);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .detail-label {
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .detail-value {
      color: var(--text-color);
    }

    .detail-value.amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--success-color);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    /* Toast customization for dark mode */
    ::ng-deep .p-toast .p-toast-message {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color);
    }

    ::ng-deep .p-toast .p-toast-message .p-toast-message-content {
      color: var(--text-color);
    }

    @media (max-width: 768px) {
      .resolved-container {
        padding: 1rem;
      }
      
      .incidents-grid {
        grid-template-columns: 1fr;
      }
      
      .header-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class TechnicianResolvedComponent implements OnInit {

  private incidentService = inject(IncidentService);
  private messageService = inject(MessageService);

  incidents: any[] = [];
  selectedIncident: any = null;
  currentBill: any = null;
  isLoading = true;
  showBillDialog = false;
  showBillDetailsDialog = false;

  billMap: { [incidentId: string]: any } = {};

  billRequest = {
    incidentId: '',
    hours: 0,
    materialsCost: 0
  };

  private readonly HOURLY_RATE = 50;

  ngOnInit() {
    this.loadResolved();
  }

  // Helper method to detect dark mode
  isDarkMode(): boolean {
    const body = document.body;
    const html = document.documentElement;
    
    if (body.classList.contains('p-dark') || 
        body.classList.contains('dark-mode') ||
        html.classList.contains('p-dark') ||
        html.classList.contains('dark-mode') ||
        body.classList.contains('dark')) {
      return true;
    }
    
    const theme = body.getAttribute('data-theme') || html.getAttribute('data-theme');
    if (theme && (theme === 'dark' || theme.includes('dark'))) {
      return true;
    }
    
    const bodyClass = body.className;
    if (bodyClass.includes('-dark')) {
      return true;
    }
    
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  loadResolved() {
  this.isLoading = true;

  this.incidentService.getResolvedForTechnician().subscribe({
    next: (res) => {
      this.incidents = res;

      // 🔥 enrich AFTER loading
      this.incidents.forEach((inc) => {
        if (inc.buildingId) {
          this.loadBuildingName(inc);
        } else {
          inc.buildingName = 'Not specified';
        }
      });

      this.checkBillsForIncidents();
      this.isLoading = false;
    },
    error: (err) => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load resolved incidents'
      });
      this.isLoading = false;
    }
  });
}
loadBuildingName(incident: any) {
  this.incidentService.getBuildingById(incident.buildingId).subscribe({
    next: (b) => {
      incident.buildingName = b?.name ?? 'Unknown';
    },
    error: () => {
      incident.buildingName = 'Unknown';
    }
  });
}

  checkBillsForIncidents() {
    this.incidents.forEach((inc) => {
      this.incidentService.getBill(inc.id).subscribe({
        next: (bill) => {
          this.billMap[inc.id] = bill;
        },
        error: () => {
          this.billMap[inc.id] = null;
        }
      });
    });
  }

  openBillForm(incident: any) {
    this.selectedIncident = incident;
    this.billRequest = {
      incidentId: incident.id,
      hours: 0,
      materialsCost: 0
    };
    this.showBillDialog = true;
  }

  closeBillForm() {
    this.showBillDialog = false;
    this.selectedIncident = null;
    this.billRequest = {
      incidentId: '',
      hours: 0,
      materialsCost: 0
    };
  }

  calculateTotal(): number {
    return (this.billRequest.hours * this.HOURLY_RATE) + this.billRequest.materialsCost;
  }

  isBillFormValid(): boolean {
    return this.billRequest.hours > 0 || this.billRequest.materialsCost > 0;
  }

  generateBill() {
    const request = {
      incidentId: this.selectedIncident.id,
      hours: this.billRequest.hours,
      materialsCost: this.billRequest.materialsCost
    };

    this.incidentService.createCharge(request).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Bill generated successfully!'
        });
        
        this.billMap[this.selectedIncident.id] = res;
        this.closeBillForm();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to generate bill'
        });
      }
    });
  }

  viewBill(incidentId: string) {
    this.incidentService.getBill(incidentId).subscribe({
      next: (bill) => {
        this.currentBill = bill;
        this.showBillDetailsDialog = true;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load bill details'
        });
      }
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    const statusMap: Record<string, "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined> = {
      'PENDING': 'warn',
      'PAID': 'success',
      'OVERDUE': 'danger',
      'CANCELLED': 'secondary',
      'COMPLETED': 'success',
      'DRAFT': 'info'
    };
    return statusMap[status?.toUpperCase()] || 'info';
  }
}
