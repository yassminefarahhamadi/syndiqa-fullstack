import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button'; // Add this import

@Component({
  selector: 'app-report-incident',
  standalone: true,
  imports: [CommonModule, FormsModule , ButtonModule],
  template: `
<div class="modal-overlay" (click)="onClose()">
  <div class="modal-container" (click)="$event.stopPropagation()">
    
    <!-- Header -->
    <div class="modal-header">
      <div class="header-icon">
        <i class="pi pi-flag"></i>
      </div>
      <div class="header-text">
        <h2>Report New Incident</h2>
        <p>Fill in the details below to report an incident</p>
      </div>
      <button class="close-btn" (click)="onClose()">
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- Body -->
    <div class="modal-body">
      <!-- Incident Type -->
      <div class="form-group" [class.error]="submitted && !form.type">
        <label class="form-label">
          <i class="pi pi-tag"></i>
          Incident Type
          <span class="required">*</span>
        </label>
        <div class="select-wrapper">
          <select [(ngModel)]="form.type" class="form-control" [class.ng-invalid]="submitted && !form.type">
            <option value="" disabled>Select incident type</option>
            <option *ngFor="let t of incidentTypes" [value]="t.value">
              {{ t.label }}
            </option>
          </select>
          <i class="pi pi-chevron-down select-icon"></i>
        </div>
        <div class="error-message" *ngIf="submitted && !form.type">
          <i class="pi pi-exclamation-circle"></i>
          Please select an incident type
        </div>
      </div>

      <!-- Severity -->
      <div class="form-group">
        <label class="form-label">
          <i class="pi pi-exclamation-triangle"></i>
          Severity Level
          <span class="required">*</span>
        </label>
        <div class="severity-options">
          <label class="severity-option" [class.selected]="form.userSeverity === 'LOW'">
            <input type="radio" [(ngModel)]="form.userSeverity" value="LOW" name="severity" />
            <span class="severity-badge low">Low</span>
          </label>
          <label class="severity-option" [class.selected]="form.userSeverity === 'MEDIUM'">
            <input type="radio" [(ngModel)]="form.userSeverity" value="MEDIUM" name="severity" />
            <span class="severity-badge medium">Medium</span>
          </label>
          <label class="severity-option" [class.selected]="form.userSeverity === 'HIGH'">
            <input type="radio" [(ngModel)]="form.userSeverity" value="HIGH" name="severity" />
            <span class="severity-badge high">High</span>
          </label>
          <label class="severity-option" [class.selected]="form.userSeverity === 'CRITICAL'">
            <input type="radio" [(ngModel)]="form.userSeverity" value="CRITICAL" name="severity" />
            <span class="severity-badge critical">Critical</span>
          </label>
        </div>
      </div>

      <!-- Building -->
      <div class="form-group" [class.error]="submitted && !form.buildingId">
        <label class="form-label">
          <i class="pi pi-building"></i>
          Building / Location
          <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <i class="pi pi-map-marker input-icon"></i>
         <div class="select-wrapper">
  <select [(ngModel)]="form.buildingId" class="form-control">
    <option value="" disabled>Select building</option>
    <option *ngFor="let b of buildings" [value]="b.id">
      {{ b.name }}
    </option>
  </select>
  <i class="pi pi-chevron-down select-icon"></i>
</div>
        </div>
        <div class="error-message" *ngIf="submitted && !form.buildingId">
          <i class="pi pi-exclamation-circle"></i>
          Building location is required
        </div>
      </div>

      <!-- Description -->
      <div class="form-group" [class.error]="submitted && (!form.description || form.description.length < 10)">
        <label class="form-label">
          <i class="pi pi-file-text"></i>
          Description
          <span class="required">*</span>
        </label>
        <textarea 
          [(ngModel)]="form.description" 
          rows="4" 
          class="form-control textarea"
          [class.ng-invalid]="submitted && (!form.description || form.description.length < 10)"
          placeholder="Provide detailed description of the incident..."
        ></textarea>
        <div class="char-counter">
          <span [class.text-danger]="form.description.length < 10 && form.description.length > 0">
            {{ form.description.length }}
          </span>
          / 500 characters
          <span class="char-hint" *ngIf="form.description.length > 0 && form.description.length < 10">
            (Minimum 10 characters required)
          </span>
        </div>
        <div class="error-message" *ngIf="submitted && !form.description">
          <i class="pi pi-exclamation-circle"></i>
          Description is required
        </div>
        <div class="error-message" *ngIf="submitted && form.description && form.description.length < 10">
          <i class="pi pi-exclamation-circle"></i>
          Description must be at least 10 characters
        </div>
      </div>

      <!-- Attachments -->
      <div class="form-group">
        <label class="form-label">
          <i class="pi pi-image"></i>
          Attachments
          <span class="optional">(Optional)</span>
        </label>
        <div class="upload-area" (click)="fileInput.click()">
          <i class="pi pi-cloud-upload"></i>
          <p>Click or drag files to upload</p>
          <small>Images, PDFs, or documents (max 10MB each)</small>
          <input 
            #fileInput
            type="file" 
            multiple 
            (change)="onFileSelect($event)" 
            style="display: none" 
            accept="image/*,application/pdf,.doc,.docx"
          />
        </div>
        <div class="file-list" *ngIf="files.length > 0">
          <div class="file-item" *ngFor="let file of files; let i = index">
            <div class="file-info">
              <i class="pi" [class.pi-file-pdf]="file.type.includes('pdf')" 
                 [class.pi-file-image]="file.type.includes('image')"
                 [class.pi-file]="!file.type.includes('pdf') && !file.type.includes('image')"></i>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ (file.size / 1024).toFixed(0) }} KB</span>
            </div>
            <button class="remove-file" (click)="removeFile(i)">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        <div class="file-hint" *ngIf="files.length > 0">
          <i class="pi pi-info-circle"></i>
          {{ files.length }} file(s) attached
        </div>
      </div>

      <!-- Audio Evidence -->
      <div class="form-group">
        <label class="form-label">
          <i class="pi pi-microphone"></i>
          Audio Evidence
          <span class="optional">(Optional)</span>
        </label>
        <div class="audio-upload" *ngIf="!audioFile; else audioPreview">
          <div class="upload-area-small" (click)="audioInput.click()">
            <i class="pi pi-music"></i>
            <span>Upload audio recording</span>
            <small>MP3, WAV, or M4A (max 20MB)</small>
          </div>
          <input 
            #audioInput
            type="file" 
            accept="audio/*" 
            (change)="onAudioSelect($event)" 
            style="display: none" 
          />
        </div>
        <ng-template #audioPreview>
          <div class="audio-preview">
            <div class="audio-info">
              <i class="pi pi-volume-up"></i>
              <div class="audio-details">
                <span class="audio-name">{{ audioFile?.name }}</span>
                <span class="audio-size">{{ ((audioFile?.size || 0) / 1024).toFixed(0) }} KB</span>
              </div>
            </div>
            <button class="remove-audio" (click)="removeAudio()">
              <i class="pi pi-trash"></i>
              Remove
            </button>
          </div>
        </ng-template>
      </div>
    </div>

    <!-- Footer -->
    <div class="modal-footer">
      <div class="validation-summary" *ngIf="submitted && !isFormValid()">
        <i class="pi pi-exclamation-triangle"></i>
        Please fix the errors above
      </div>
      <div class="footer-buttons">
        <button class="btn-secondary" (click)="onClose()">
          <i class="pi pi-times"></i>
          Cancel
        </button>
       <p-button 
      label="Submit Incident" 
      icon="pi pi-check" 
      styleClass="p-button-primary"
      [disabled]="submitted && !isFormValid()"
      (onClick)="submit()">
    </p-button>
      </div>
    </div>
  </div>
</div>
  `,

  styles: [`
    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Modal Container */
    .modal-container {
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      background: var(--surface-card);
      border-radius: 20px;
      overflow: hidden;
      animation: slideUp 0.3s ease;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--surface-border);
    }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Header */
    .modal-header {
      padding: 24px 28px;
      background: linear-gradient(135deg, var(--surface-card) 0%, var(--surface-ground) 100%);
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: 24px;
      color: white;
    }

    .header-text {
      flex: 1;
    }

    .header-text h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-color);
    }

    .header-text p {
      margin: 0;
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      background: var(--surface-hover);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: var(--surface-border);
      color: var(--text-color);
      transform: rotate(90deg);
    }

    /* Body */
    .modal-body {
      padding: 24px 28px;
      max-height: calc(90vh - 180px);
      overflow-y: auto;
    }

    /* Form Groups */
    .form-group {
      margin-bottom: 24px;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 10px;
    }

    .form-label i {
      font-size: 14px;
      color: var(--primary-color);
    }

    .required {
      color: #ef4444;
      margin-left: 4px;
    }

    .optional {
      color: var(--text-color-secondary);
      font-weight: normal;
      font-size: 11px;
      margin-left: 4px;
    }

    /* Error States */
    .form-group.error .form-label {
      color: #ef4444;
    }

    .form-group.error .form-control {
      border-color: #ef4444;
      background-color: rgba(239, 68, 68, 0.05);
    }

    .error-message {
      margin-top: 6px;
      font-size: 12px;
      color: #ef4444;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-message i {
      font-size: 12px;
    }

    .text-danger {
      color: #ef4444;
    }

    /* Form Controls */
    .select-wrapper {
      position: relative;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      font-size: 14px;
      color: var(--text-color);
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }

    .form-control.ng-invalid.ng-touched {
      border-color: #ef4444;
    }

    .form-control.with-icon {
      padding-left: 40px;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: var(--text-color-secondary);
    }

    .select-icon {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-color-secondary);
      pointer-events: none;
    }

    select.form-control {
      appearance: none;
      cursor: pointer;
    }

    textarea.form-control {
      resize: vertical;
      font-family: inherit;
    }

    .char-counter {
      text-align: right;
      font-size: 11px;
      color: var(--text-color-secondary);
      margin-top: 6px;
    }

    .char-hint {
      margin-left: 8px;
      color: #f59e0b;
    }

    /* Severity Options */
    .severity-options {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .severity-option {
      flex: 1;
      cursor: pointer;
    }

    .severity-option input {
      display: none;
    }

    .severity-badge {
      display: block;
      padding: 8px 12px;
      text-align: center;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .severity-badge.low { background: #dbeafe; color: #2563eb; }
    .severity-badge.medium { background: #fef3c7; color: #d97706; }
    .severity-badge.high { background: #fee2e2; color: #dc2626; }
    .severity-badge.critical { background: #fef2f2; color: #991b1b; }

    .severity-option.selected .severity-badge {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .severity-option.selected .severity-badge.low { background: #3b82f6; color: white; }
    .severity-option.selected .severity-badge.medium { background: #f59e0b; color: white; }
    .severity-option.selected .severity-badge.high { background: #ef4444; color: white; }
    .severity-option.selected .severity-badge.critical { background: #dc2626; color: white; }

    /* Upload Areas */
    .upload-area {
      border: 2px dashed var(--surface-border);
      border-radius: 12px;
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--surface-ground);
    }

    .upload-area:hover {
      border-color: var(--primary-color);
      background: var(--surface-hover);
    }

    .upload-area i {
      font-size: 48px;
      color: var(--primary-color);
      margin-bottom: 12px;
    }

    .upload-area p {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: var(--text-color);
    }

    .upload-area small {
      font-size: 11px;
      color: var(--text-color-secondary);
    }

    .upload-area-small {
      padding: 16px 20px;
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--surface-ground);
    }

    .upload-area-small:hover {
      border-color: var(--primary-color);
      background: var(--surface-hover);
    }

    .upload-area-small i {
      font-size: 24px;
      color: var(--primary-color);
    }

    .upload-area-small span {
      flex: 1;
      font-size: 14px;
      color: var(--text-color);
    }

    .upload-area-small small {
      font-size: 11px;
      color: var(--text-color-secondary);
    }

    /* File List */
    .file-list {
      margin-top: 12px;
      max-height: 200px;
      overflow-y: auto;
    }

    .file-item {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .file-info i {
      font-size: 20px;
      color: var(--primary-color);
    }

    .file-name {
      font-size: 13px;
      color: var(--text-color);
      flex: 1;
      word-break: break-word;
    }

    .file-size {
      font-size: 11px;
      color: var(--text-color-secondary);
    }

    .remove-file {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .remove-file:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .file-hint {
      margin-top: 8px;
      font-size: 11px;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Audio Preview */
    .audio-preview {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .audio-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .audio-info i {
      font-size: 28px;
      color: var(--primary-color);
    }

    .audio-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .audio-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color);
    }

    .audio-size {
      font-size: 11px;
      color: var(--text-color-secondary);
    }

    .remove-audio {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      color: #dc2626;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .remove-audio:hover {
      background: #fee2e2;
    }

    /* Footer */
    .modal-footer {
      padding: 20px 28px;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .validation-summary {
      margin-bottom: 16px;
      padding: 10px 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      font-size: 13px;
      color: #ef4444;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .validation-summary i {
      font-size: 16px;
    }

    .footer-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .btn-secondary {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color-secondary);
    }

    .btn-secondary:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    /* Dark mode specific styles */
    :host-context(.dark) .upload-area,
    :host-context(.dark) .upload-area-small,
    :host-context(.dark) .file-item,
    :host-context(.dark) .audio-preview {
      background: var(--surface-card);
    }

    :host-context(.dark) .severity-badge.low { background: #1e3a8a; color: #60a5fa; }
    :host-context(.dark) .severity-badge.medium { background: #78350f; color: #fbbf24; }
    :host-context(.dark) .severity-badge.high { background: #7f1d1d; color: #f87171; }
    :host-context(.dark) .severity-badge.critical { background: #991b1b; color: #fca5a5; }

    :host-context(.dark) .form-group.error .form-control {
      background-color: rgba(239, 68, 68, 0.1);
    }

    /* Scrollbar */
    .modal-body::-webkit-scrollbar {
      width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: var(--surface-border);
      border-radius: 10px;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: var(--primary-color);
      border-radius: 10px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        max-height: 95vh;
      }

      .modal-header {
        padding: 20px;
      }

      .modal-body {
        padding: 20px;
      }

      .modal-footer {
        padding: 16px 20px;
      }

      .severity-options {
        flex-direction: column;
      }

      .footer-buttons {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ReportIncidentComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private http: HttpClient) {}

  audioFile: File | null = null;
  submitted: boolean = false;
  buildings: any[] = [];
  incidentTypes = [
    { label: '🔥 Fire', value: 'FIRE' },
    { label: '💧 Water Leak', value: 'WATER_LEAK' },
    { label: '🔒 Security Issue', value: 'SECURITY' },
    { label: '⚡ Electricity Issue', value: 'ELECTRICITY' },
    { label: '🛗 Elevator Issue', value: 'ELEVATOR' },
    { label: '🔧 Technical Issue', value: 'TECHNICAL' },
    { label: '💳 Payment Issue', value: 'PAYMENT' },
    { label: '📢 Complaint', value: 'COMPLAINT' },
    { label: '📝 Other', value: 'OTHER' }
  ];

  form = {
    type: '',
    userSeverity: 'LOW',
    description: '',
    buildingId: ''
  };

  files: File[] = [];

  ngOnInit() {
  this.loadBuildings();
}

loadBuildings() {
  this.http.get<any[]>('http://localhost:8089/api/incidents/my-buildings')
    .subscribe({
      next: (res) => this.buildings = res,
      error: (err) => console.error(err)
    });
}
  isFormValid(): boolean {
    return !!this.form.type && 
           !!this.form.buildingId && 
           !!this.form.description &&
           this.form.description.trim().length >= 10;
  }

  onFileSelect(event: any) {
    const newFiles = Array.from(event.target.files) as File[];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    newFiles.forEach(file => {
      if (file.size <= maxSize) {
        this.files.push(file);
      } else {
        console.warn(`File ${file.name} is too large (max 10MB)`);
      }
    });
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  onAudioSelect(event: any) {
    const file = event.target.files[0];
    const maxSize = 20 * 1024 * 1024; // 20MB
    
    if (file && file.type.startsWith('audio/')) {
      if (file.size <= maxSize) {
        this.audioFile = file;
      } else {
        console.warn('Audio file is too large (max 20MB)');
      }
    } else {
      console.error('Invalid audio file');
    }
  }

  removeAudio() {
    this.audioFile = null;
  }

  submit() {
    this.submitted = true;
    
    if (!this.isFormValid()) {
      // Scroll to first error
      const firstError = document.querySelector('.form-group.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const category = this.detectCategory(this.form.type, this.form.description);
    const payload = {
      type: this.form.type,
      category,
      description: this.form.description,
      buildingId: this.form.buildingId,
      userSeverity: this.form.userSeverity
    };

    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    this.files.forEach(file => {
      formData.append('files', file);
    });

    if (this.audioFile) {
      formData.append('audio', this.audioFile);
    }

    this.http.post('http://localhost:8089/api/incidents', formData)
      .subscribe({
        next: (res) => {
          console.log('SUCCESS', res);
          this.close.emit();
        },
        error: (err) => {
          console.error('UPLOAD ERROR', err);
        }
      });
  }

  detectCategory(type?: string, description?: string): string {
    const text = ((type || '') + ' ' + (description || '')).toLowerCase();
    if (text.includes('fire') || text.includes('smoke') || text.includes('leak') || text.includes('security')) return 'SAFETY';
    if (text.includes('noise') || text.includes('neighbor') || text.includes('complaint')) return 'COMPLAINT';
    if (text.includes('payment') || text.includes('invoice') || text.includes('refund')) return 'PAYMENT';
    if (text.includes('wifi') || text.includes('technical') || text.includes('elevator')) return 'TECHNICAL';
    return 'OTHER';
  }

  onClose() {
    this.close.emit();
  }
}
