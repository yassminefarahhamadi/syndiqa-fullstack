import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuModule } from 'primeng/menu';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RatingModule } from 'primeng/rating';

import { IncidentService, Incident } from '@/app/pages/service/incident.service';
import { AlertService, Alert } from '@/app/pages/service/alert.service';

@Component({
    selector: 'app-admin-incident',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        TagModule,
        ConfirmDialogModule,
        ProgressSpinnerModule,
        MenuModule,
        RatingModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast></p-toast>

<p-toolbar class="mb-4">
    <ng-template #start>
        <h5 class="m-0">Incident Management</h5>
    </ng-template>

    <ng-template #end>
        <div class="flex align-items-center gap-3">
            <input pInputText type="text" placeholder="Search..." (input)="onGlobalFilter(dt, $event)" />
<div class="notification-wrapper">
  <p-button 
    icon="pi pi-bell" 
    severity="danger" 
    [rounded]="true" 
    (click)="openAlerts()"
    styleClass="notification-button">
  </p-button>
  
  <span *ngIf="unreadCount > 0" class="notification-badge">
   + {{ unreadCount }}
  </span>
</div>
</div>

    </ng-template>
</p-toolbar>

<!-- FILTERS -->
<div class="flex gap-3 mb-3">
    <select class="filter-select" (change)="onTypeFilter(dt, $event)">
        <option value="">All Types</option>
        <option value="FIRE">FIRE</option>
        <option value="WATER_LEAK">WATER_LEAK</option>
        <option value="SECURITY">SECURITY</option>
        <option value="ELECTRICITY">ELECTRICITY</option>
        <option value="ELEVATOR">ELEVATOR</option>
        <option value="TECHNICAL">TECHNICAL</option>
        <option value="PAYMENT">PAYMENT</option>
        <option value="COMPLAINT">COMPLAINT</option>
        <option value="OTHER">OTHER</option>
    </select>

    <select class="filter-select" (change)="onSeverityFilter(dt, $event)">
        <option value="">All Severity</option>
        <option value="LOW">LOW</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HIGH">HIGH</option>
    </select>

    <select class="filter-select" (change)="onStatusFilter(dt, $event)">
        <option value="">All Status</option>
        <option value="NEW">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="TAKEN">TAKEN</option>
        <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="FALSE_REPORT">FALSE_REPORT</option>

    </select>
</div>

<p-table
    #dt
    [value]="(incidents$ | async) ?? []"
    dataKey="id"
    [paginator]="true"
    [rows]="10"
    [rowHover]="true"
    [globalFilterFields]="['description','type','status','finalSeverity']"
>

    <ng-template pTemplate="header">
        <tr>
           <th>Building</th>
            <th>Severity</th>
            <th>Type</th>
            <th>Status</th>
            <th>Description</th>
            <th>Actions</th>
        </tr>
    </ng-template>

    <ng-template pTemplate="body" let-incident>
        <tr>
            <td>
            <div class="building-cell">
                <i class="pi pi-building"></i>
                <span>{{ incident.buildingName || 'N/A' }}</span>
            </div>
</td>
            <td>
                <p-tag [value]="incident.finalSeverity" [severity]="getSeverityTag(incident.finalSeverity)"></p-tag>
</td>
            <td>{{ incident.type }}</td>
            <td>
                <p-tag
                    [value]="incident.assignedDomain ? (incident.status + ' • ASSIGNED') : incident.status"
                    [severity]="getStatusTag(incident.status)">
                </p-tag>
</td>
            <td>{{ incident.description }}</td>
            <td class="flex gap-2">
                <p-button icon="pi pi-eye" (click)="openDetails(incident)"></p-button>
                <p-button icon="pi pi-user-plus"
                          severity="info"
                          [disabled]="!!incident.assignedDomain"
                          (click)="openAssignDialog(incident)">
                </p-button>
            </td>
        </tr>
    </ng-template>
</p-table>

<!-- DETAILS -->
<p-dialog [(visible)]="detailsDialog" header="Incident Details" [modal]="true" [style]="{ width: '700px' }">
    <div *ngIf="selectedIncident">
        <div><b>Type:</b> {{ selectedIncident.type }}</div>
        <div><b>Status:</b> {{ selectedIncident.status }}</div>
        <div><b>Severity:</b> {{ selectedIncident.finalSeverity }}</div>
        <div><b>Description:</b> {{ selectedIncident.description }}</div>

        <hr />

        <b>Evidence Files</b>

        <div *ngIf="!selectedIncident.photoUrls?.length" class="empty">
            No evidence files
        </div>

        <div class="evidence-grid" *ngIf="selectedIncident.photoUrls?.length">
            <div class="evidence-card"
                 *ngFor="let file of selectedIncident.photoUrls"
                 (click)="openFile(file)">

                <img *ngIf="file.type !== 'pdf'" [src]="file.url" />

                <div *ngIf="file.type === 'pdf'" class="pdf-card">
                    📄 PDF
                </div>

            </div>
        </div>

        <!-- AUDIO EVIDENCE SECTION - DARK MODE COMPATIBLE -->
        <div *ngIf="selectedIncident.audioPath" class="audio-section">
            <div class="audio-section-header">
                <div class="header-left">
                    <i class="pi pi-headphones"></i>
                    <h3>Audio Evidence</h3>
                </div>
                <div class="header-right">
                    <span class="badge-ai">AI Analysis Available</span>
                </div>
            </div>

            <!-- Audio Player with Download Menu -->
            <div class="audio-player-wrapper">
                <div class="player-container">
                  <audio
    controls
    style="width:100%"
    (error)="onAudioError($event)"
    (loadeddata)="onAudioLoaded()">

    <source [src]="getAudioUrl(selectedIncident.audioPath)" type="audio/mpeg" />

    Your browser does not support audio.
</audio>
                 
        
                </div>

                <!-- Debug info -->
                <div *ngIf="audioError" class="audio-error">
                    <i class="pi pi-exclamation-triangle"></i>
                    Audio file not found. Path: {{ getAudioUrl(selectedIncident.audioPath) }}
                </div>

                <!-- Analyze Button -->
                <div class="analyze-container mt-2">
                    <button pButton
                            icon="pi pi-bolt"
                            label="Analyze Audio"
                            [loading]="isAnalyzing"
                            (click)="analyzeAudio(selectedIncident.id)">
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="isAnalyzing" class="loading-overlay">
                <div class="loading-spinner">
                    <p-progressSpinner strokeWidth="3" [style]="{width: '40px', height: '40px'}"></p-progressSpinner>
                    <p>Processing audio with AI...</p>
                </div>
            </div>

            <!-- AI Analysis Results -->
            <div *ngIf="audioAnalysis && !isAnalyzing" class="analysis-results">
                <div class="results-header">
                    <i class="pi pi-chart-line"></i>
                    <h4>AI Analysis Results</h4>
                    <span class="confidence-badge" [class.high]="audioAnalysis.confidence > 0.7" 
                          [class.medium]="audioAnalysis.confidence <= 0.7 && audioAnalysis.confidence > 0.4"
                          [class.low]="audioAnalysis.confidence <= 0.4">
                        {{ (audioAnalysis.confidence * 100).toFixed(0) }}% Confidence
                    </span>
                </div>

                <div class="results-grid">
                    <div class="result-card primary">
                        <div class="card-icon">
                            <i class="pi pi-tag"></i>
                        </div>
                        <div class="card-content">
                            <label>Primary Detection</label>
                            <div class="value-large">{{ audioAnalysis.label || 'Unknown' }}</div>
                            <div class="confidence-meter">
                                <div class="meter-bar">
                                    <div class="meter-fill" [style.width.%]="audioAnalysis.confidence * 100"></div>
                                </div>
                                <span class="percentage">{{ (audioAnalysis.confidence * 100).toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="result-card severity">
                        <div class="card-icon">
                            <i class="pi pi-exclamation-triangle"></i>
                        </div>
                        <div class="card-content">
                            <label>Predicted Severity</label>
                            <div class="severity-display">
                                <p-tag [value]="audioAnalysis.severity" 
                                       [severity]="getSeverityTag(audioAnalysis.severity)"
                                       class="severity-tag-large">
                                </p-tag>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="audioAnalysis.transcript" class="result-card full-width transcript-card">
                        <div class="card-icon">
                            <i class="pi pi-file"></i>
                        </div>
                        <div class="card-content">
                            <label>Audio Transcript</label>
                            <div class="transcript-text">
                                <i class="pi pi-quote-left"></i>
                                {{ audioAnalysis.transcript }}
                                <i class="pi pi-quote-right"></i>
                            </div>
                        </div>
                    </div>

                    
<!-- TOP PREDICTIONS -->
<div *ngIf="audioAnalysis?.topPredictions?.length" class="top-predictions">
    <div class="tp-header">
        <i class="pi pi-sparkles"></i>
        <h4>Top Predictions</h4>
    </div>

    <div class="tp-list">
        <div class="tp-item"
             *ngFor="let p of audioAnalysis.topPredictions">

            <div class="tp-label">
                {{ p.label }}
            </div>

            <div class="tp-bar">
                <div class="tp-fill"
                     [style.width.%]="p.confidence * 100">
                </div>
            </div>

            <div class="tp-value">
                {{ (p.confidence * 100).toFixed(1) }}%
            </div>

        </div>
    </div>
</div>
           
                </div>

                <div class="results-actions">
                    <button class="action-btn export" (click)="exportAnalysisReport()">
                        <i class="pi pi-download"></i>
                        Export Report
                    </button>
                   
                </div>
            </div>
        </div>

        <!-- TIMELINE -->
        <hr *ngIf="selectedIncident.assignedDomain" />

        <div *ngIf="selectedIncident.assignedDomain">
            <h4 class="timeline-title">Timeline</h4>
            <div class="timeline">
                <div class="timeline-step">
                    <div class="dot created"></div>
                    <div class="content">
                        <b>Created</b>
                        <div>{{ selectedIncident.reportedAt }}</div>
                    </div>
                </div>
                <div class="timeline-step">
                    <div class="dot assigned"></div>
                    <div class="content">
                        <b>Assigned to {{ selectedIncident.assignedDomain }}</b>
                        <div>Admin assigned this incident</div>
                    </div>
                </div>
                <div class="timeline-step">
                    <div class="dot status"></div>
                    <div class="content">
                        <b>Status: {{ selectedIncident.status }}</b>
                        <div>Current progress</div>
                    </div>
                </div>
                <div class="timeline-step">
                    <div class="dot severity"></div>
                    <div class="content">
                        <b>Final Severity: {{ selectedIncident.finalSeverity }}</b>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <ng-container *ngIf="selectedIncident">
    <!-- RATING DISPLAY - ONLY FOR RESOLVED INCIDENTS -->
    <div class="rating-display-section" *ngIf="selectedIncident.status === 'RESOLVED' && selectedIncident.rating">
        <div class="rating-header">
            <i class="pi pi-star-fill"></i>
            <h3>Resident Rating</h3>
        </div>
        
        <div class="rating-content">
            <div class="stars-container">
                <p-rating 
                    [(ngModel)]="selectedIncident.rating" 
                    [readonly]="true"
                    [stars]="5">
                </p-rating>
                <span class="rating-value">{{ selectedIncident.rating }} / 5</span>
            </div>
            
            <div class="rating-label">
                {{ getRatingLabel(selectedIncident.rating) }}
            </div>
        </div>
    </div>
    </ng-container>
</p-dialog>

<!-- ASSIGN -->
<p-dialog [(visible)]="assignDialog" header="Assign Incident" [modal]="true" [style]="{ width: '400px' }">
    <div *ngIf="selectedIncident">
        <p>Select Department</p>
        <select class="filter-select" [(ngModel)]="selectedDepartment">
            <option value="">Choose...</option>
            <option value="plumbing">Plumbing</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="SECURITY">Security</option>
            <option value="MAINTENANCE">Maintenance</option>
        </select>
        <div class="flex justify-content-end mt-3 gap-2">
            <p-button label="Cancel" severity="secondary" (click)="assignDialog=false"></p-button>
            <p-button label="Assign" (click)="assignIncident()"></p-button>
        </div>
    </div>
</p-dialog>

<!-- IMAGE -->
<p-dialog [(visible)]="imageDialog" header="Preview" [modal]="true" [style]="{ width: '70vw' }">
    <img *ngIf="previewImage" [src]="previewImage" style="width:100%; border-radius:10px;" />
</p-dialog>

<!-- ALERTS -->
<p-dialog [(visible)]="alertsDialog" header="Notifications" [modal]="true" [style]="{ width: '450px' }">
    <div *ngIf="alerts$ | async as alerts">
        <div *ngIf="alerts.length === 0" class="empty">
            No notifications
        </div>
        <div class="alert-item"
             *ngFor="let alert of alerts"
             (click)="onAlertClick(alert)">
            <span [ngClass]="alert.isRead ? 'alert-read' : 'alert-new'">
                {{ alert.message }}
            </span>
            <p-tag
                [value]="alert.isRead ? 'READ' : 'UNREAD'"
                [severity]="alert.isRead ? 'success' : 'danger'">
            </p-tag>
        </div>
    </div>
</p-dialog>
`,
styles: [`
.evidence-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
    gap: 10px;
}

.evidence-card {
    background: var(--surface-ground);
    border-radius: 8px;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.evidence-card:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.evidence-card img {
    width: 100%;
    height: 70px;
    object-fit: cover;
    border-radius: 4px;
}

.pdf-card {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-border);
    color: var(--text-color);
    border-radius: 4px;
}

.filter-select {
    padding: 6px;
    border-radius: 6px;
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
    color: var(--text-color);
    min-width: 180px;
}

.timeline-title {
    margin-bottom: 10px;
    font-weight: 600;
    color: var(--text-color);
}

.timeline {
    position: relative;
    padding-left: 20px;
    border-left: 2px solid var(--surface-border);
}

.timeline-step {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;
    position: relative;
}

.timeline-step .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: absolute;
    left: -7px;
    top: 4px;
}

.dot.created { background: #3b82f6; }
.dot.assigned { background: #8b5cf6; }
.dot.status { background: #f59e0b; }
.dot.severity { background: #ef4444; }

.timeline-step .content {
    padding-left: 10px;
    color: var(--text-color);
}

.timeline-step .content b {
    color: var(--text-color);
}

.alert-item {
    padding: 10px;
    border-bottom: 1px solid var(--surface-border);
    cursor: pointer;
    background: var(--surface-card);
    transition: background 0.2s;
}

.alert-item:hover {
    background: var(--surface-hover);
}

.alert-new { 
    font-weight: 700; 
    color: var(--text-color);
}
.alert-read { 
    color: var(--text-color-secondary); 
}

.empty {
    padding: 10px;
    color: var(--text-color-secondary);
    text-align: center;
}

/* AUDIO SECTION STYLES - DARK MODE COMPATIBLE */
.audio-section {
    margin: 24px 0;
    background: var(--surface-card);
    border-radius: 16px;
    border: 1px solid var(--surface-border);
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.audio-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--surface-ground);
    border-bottom: 1px solid var(--surface-border);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-left i {
    font-size: 20px;
    color: var(--primary-color);
}

.header-left h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
}

.badge-ai {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
}

.audio-player-wrapper {
    padding: 20px;
    background: var(--surface-ground);
}

.player-container {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface-card);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--surface-border);
}

.player-container audio {
    flex: 1;
    height: 40px;
}

.menu-container {
    position: relative;
}

.audio-error {
    margin-top: 10px;
    padding: 8px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-radius: 6px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.analyze-container {
    margin-top: 12px;
}

.analyze-container button {
    width: 100%;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
    border: none;
    color: white;
    font-weight: 500;
}

.analyze-container button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-overlay {
    padding: 30px;
    text-align: center;
    background: var(--surface-ground);
}

.loading-spinner p {
    margin-top: 12px;
    font-weight: 500;
    color: var(--primary-color);
    font-size: 13px;
}

.analysis-results {
    padding: 20px;
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
}

.results-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(16, 185, 129, 0.2);
}

.results-header i {
    font-size: 18px;
    color: #10b981;
}

.results-header h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color);
}

.confidence-badge {
    margin-left: auto;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
}

.confidence-badge.high {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.confidence-badge.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.confidence-badge.low {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.result-card {
    background: var(--surface-ground);
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s;
}

.result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-card.primary {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--surface-ground));
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.result-card.severity {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--surface-ground));
    border: 1px solid rgba(245, 158, 11, 0.2);
}

.result-card.full-width {
    grid-column: span 2;
}

.card-icon {
    margin-bottom: 10px;
}

.card-icon i {
    font-size: 20px;
    color: var(--primary-color);
}

.card-content label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-color-secondary);
    margin-bottom: 6px;
}

.value-large {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 10px;
}

.confidence-meter {
    display: flex;
    align-items: center;
    gap: 10px;
}

.meter-bar {
    flex: 1;
    height: 5px;
    background: var(--surface-border);
    border-radius: 3px;
    overflow: hidden;
}

.meter-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 3px;
    transition: width 0.6s ease;
}

.percentage {
    font-size: 12px;
    font-weight: 600;
    color: #10b981;
}

.severity-display {
    margin-top: 6px;
}

.severity-tag-large {
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
}

.transcript-card {
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), var(--surface-ground));
    border: 1px solid rgba(234, 179, 8, 0.2);
}

.transcript-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-color);
    font-style: italic;
}

.transcript-text i {
    font-size: 11px;
    color: #eab308;
    margin: 0 6px;
}

.results-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--surface-border);
}

.action-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn.export {
    background: transparent;
    border: 1px solid var(--surface-border);
    color: var(--text-color-secondary);
}

.action-btn.export:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.action-btn.apply {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
    color: white;
}

.action-btn.apply:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-wrapper {
  position: relative;
  display: inline-block;
}

:host ::ng-deep {
  .notification-button {
    .p-button {
      background: transparent !important;
      border: none !important;
      
      &:hover {
        background: rgba(245, 158, 11, 0.1) !important;
        transform: scale(1.05);
      }
    }
  }
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 1;
  pointer-events: none;
}



.top-predictions {
    margin-top: 20px;
    padding: 16px;
    background: var(--surface-ground);
    border-radius: 10px;
    border: 1px solid var(--surface-border);
}

.tp-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.tp-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
}

.tp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tp-item {
    display: grid;
    grid-template-columns: 120px 1fr 50px;
    gap: 10px;
    align-items: center;
}

.tp-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color);
}

.tp-bar {
    height: 6px;
    background: var(--surface-border);
    border-radius: 4px;
    overflow: hidden;
}

.tp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), #22c55e);
    transition: width 0.4s ease;
}

.tp-value {
    font-size: 12px;
    font-weight: 600;
    color: #10b981;
    text-align: right;
}

/* False Report Row Styling */
.false-report-row {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), var(--surface-card));
    border-left: 4px solid #dc2626;
    position: relative;
}

.false-report-row:hover {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), var(--surface-hover));
}

/* Optional: Add a strikethrough or warning icon */
.false-report-row td:first-child::before {
    content: "⚠️ ";
    font-size: 14px;
}


/* RATING DISPLAY SECTION - ENHANCED DESIGN */
.rating-display-section {
    margin: 24px 0;
    padding: 0;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(255, 251, 235, 0.1));
    border-radius: 20px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dark-mode .rating-display-section {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(0, 0, 0, 0.3));
}

.rating-display-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.15);
}

.rating-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-bottom: 2px solid rgba(253, 230, 138, 0.5);
}

.rating-header i {
    font-size: 24px;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    animation: starPulse 2s ease infinite;
}

@keyframes starPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.rating-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
}

.rating-content {
    padding: 24px;
    text-align: center;
}

.stars-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.stars-container ::ng-deep .p-rating {
    gap: 8px;
}

.stars-container ::ng-deep .p-rating .p-rating-icon {
    font-size: 28px;
    transition: all 0.2s ease;
}

.stars-container ::ng-deep .p-rating .p-rating-icon.p-rating-icon-active {
    color: #fbbf24;
    text-shadow: 0 0 5px rgba(251, 191, 36, 0.5);
}

.rating-value {
    font-size: 20px;
    font-weight: 800;
    color: #d97706;
    background: var(--surface-card);
    padding: 6px 16px;
    border-radius: 40px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    letter-spacing: 0.5px;
}

.rating-label {
    margin-top: 15px;
    font-size: 16px;
    font-weight: 600;
    color: #92400e;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50px;
    display: inline-block;
    width: auto;
    backdrop-filter: blur(5px);
}

.dark-mode .rating-label {
    background: rgba(0, 0, 0, 0.5);
    color: #fbbf24;
}

.rating-footer {
    margin-top: 15px;
    padding-top: 12px;
    border-top: 1px solid rgba(253, 230, 138, 0.3);
    font-size: 12px;
    color: #b45309;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.rating-footer i {
    font-size: 14px;
}

/* No Rating State */
.rating-display-section.no-rating {
    background: linear-gradient(135deg, var(--surface-ground), var(--surface-card));
    border: 1px solid var(--surface-border);
}

.rating-display-section.no-rating .rating-header {
    background: linear-gradient(135deg, var(--text-color-secondary), var(--text-color-secondary));
    border-bottom-color: var(--surface-border);
}

.no-rating-message {
    text-align: center;
    padding: 20px;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
}

.no-rating-message i {
    font-size: 20px;
    color: var(--text-color-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
    .rating-header {
        padding: 12px 20px;
    }
    
    .rating-header h3 {
        font-size: 16px;
    }
    
    .rating-content {
        padding: 18px;
    }
    
    .stars-container ::ng-deep .p-rating .p-rating-icon {
        font-size: 22px;
    }
    
    .rating-value {
        font-size: 16px;
        padding: 4px 12px;
    }
    
    .rating-label {
        font-size: 14px;
        padding: 8px 16px;
    }
}

/* Animation for new rating */
@keyframes ratingAppear {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.rating-display-section {
    animation: ratingAppear 0.4s ease-out;
}
`]
})
export class AdminIncidentComponent implements OnInit {

    @ViewChild('dt') dt!: Table;

    incidentService = inject(IncidentService);
    alertService = inject(AlertService);
    messageService = inject(MessageService);
    private sanitizer = inject(DomSanitizer);

    incidents$ = this.incidentService.getAllIncidents();
    alerts$ = this.alertService.getAllAlerts();

    detailsDialog = false;
    alertsDialog = false;
    imageDialog = false;
    assignDialog = false;

    selectedIncident: Incident | null = null;
    previewImage: string | null = null;
    selectedDepartment: string = '';

    audioAnalysis: any = null;
    isAnalyzing = false;
    audioError = false;
    unreadCount: number = 0;
    audioMenuItems = [
        {
            label: 'Download Audio',
            icon: 'pi pi-download',
            command: () => {
                if (this.selectedIncident?.audioPath) {
                    this.downloadAudio(this.selectedIncident.audioPath);
                }
            }
        },
        {
            label: 'Copy Audio Link',
            icon: 'pi pi-copy',
            command: () => {
                if (this.selectedIncident?.audioPath) {
                    const url = this.getAudioUrl(this.selectedIncident.audioPath);
                    navigator.clipboard.writeText(url);
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Copied!', 
                        detail: 'Audio link copied to clipboard',
                        life: 2000 
                    });
                }
            }
        }
    ];

    ngOnInit(): void {
        this.alerts$.subscribe(alerts => {
        this.unreadCount = alerts.filter(a => !a.isRead).length;
    });
    }

    onTypeFilter(table: Table, event: Event) {
        table.filter((event.target as HTMLSelectElement).value, 'type', 'equals');
    }
    

    onSeverityFilter(table: Table, event: Event) {
        table.filter((event.target as HTMLSelectElement).value, 'finalSeverity', 'equals');
    }

    onStatusFilter(table: Table, event: Event) {
        table.filter((event.target as HTMLSelectElement).value, 'status', 'equals');
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openDetails(incident: Incident) {
        this.detailsDialog = true;
        this.selectedIncident = { ...incident, photoUrls: incident.photoUrls ?? [] };
        this.audioAnalysis = null;
        this.isAnalyzing = false;
        this.audioError = false;
    }

    openAssignDialog(incident: Incident) {
        this.selectedIncident = incident;
        this.selectedDepartment = '';
        this.assignDialog = true;
    }

    assignIncident() {
        if (!this.selectedIncident || !this.selectedDepartment) return;

        this.incidentService
            .assignDomain(this.selectedIncident.id, this.selectedDepartment)
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Assigned',
                        detail: 'Incident assigned to ' + this.selectedDepartment
                    });
                    this.incidents$ = this.incidentService.getAllIncidents();
                    this.assignDialog = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Assignment failed'
                    });
                }
            });
    }

    onAlertClick(alert: Alert) {
    if (!alert?.incidentId) return;

    // ✅ CALL BACKEND
    if (!alert.isRead) {
        this.alertService.markAsRead(alert.id).subscribe({
            next: () => {
                alert.isRead = true;
                this.unreadCount--;    

            },
            error: (err) => console.error(err)
        });
    }

    this.alertsDialog = false;

    this.incidents$.subscribe(list => {
        const found = list.find(i => i.id === alert.incidentId);
        if (found) this.openDetails(found);
    });
}

    openAlerts() {
        this.detailsDialog = false;
        this.alertsDialog = true;
    }

    openFile(file: any) {
        if (file.type === 'pdf') window.open(file.url, '_blank');
        else {
            this.previewImage = file.url;
            this.imageDialog = true;
        }
    }

getAudioUrl(path: string): string {
    return `http://localhost:8089${path}`;
}

    

    onAudioError(event: any) {
        console.error('Audio loading error:', event);
        this.audioError = true;
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Audio Error', 
            detail: 'Could not load audio file. Please check if the file exists on the server.',
            life: 5000 
        });
    }

    onAudioLoaded() {
        this.audioError = false;
        console.log('Audio loaded successfully');
    }

    downloadAudio(path: string) {
        const url = this.getAudioUrl(path);
        const fileName = `audio_evidence_${this.selectedIncident?.id}.mp3`;
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Download Started', 
            detail: 'Audio file download has started',
            life: 2000 
        });
    }

    analyzeAudio(id: string) {
    this.isAnalyzing = true;

    this.incidentService.analyzeAudioByIncidentId(id).subscribe({
        next: (res) => {

            this.audioAnalysis = {
                label: res?.label ?? 'Unknown',
                confidence: res?.confidence ?? 0,
                severity: res?.severity ?? 'LOW',
                transcript: res?.transcript ?? '',

                // 🔥 MAP backend top_5 → UI topPredictions
                topPredictions: (res?.top_5 ?? []).map((p: any) => ({
                    label: p.label,
                    confidence: p.confidence,
                    class_id: p.class_id
                }))
            };

            this.isAnalyzing = false;

            this.messageService.add({
                severity: 'success',
                summary: 'Analysis Complete',
                detail: `AI detected: ${this.audioAnalysis.label} with ${(this.audioAnalysis.confidence * 100).toFixed(1)}% confidence`,
                life: 4000
            });
        },

        error: (err) => {
            console.error("Audio analysis failed", err);
            this.isAnalyzing = false;

            this.messageService.add({
                severity: 'error',
                summary: 'Analysis Failed',
                detail: 'Unable to analyze audio. Please try again.',
                life: 3000
            });

            this.audioAnalysis = null;
        }
    });
}

    exportAnalysisReport() {
        if (this.audioAnalysis) {
            const report = {
                incidentId: this.selectedIncident?.id,
                timestamp: new Date().toISOString(),
                analysis: this.audioAnalysis
            };
            const dataStr = JSON.stringify(report, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `audio_analysis_${this.selectedIncident?.id}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            this.messageService.add({ severity: 'success', summary: 'Report Exported', detail: 'Analysis report has been downloaded', life: 2000 });
        }
    }

    applyAnalysisToIncident() {
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Applied', 
            detail: 'AI analysis has been applied to the incident',
            life: 3000 
        });
    }

    getSeverityTag(s: string) {
        switch (s) {
            case 'HIGH': return 'danger';
            case 'MEDIUM': return 'warn';
            case 'LOW': return 'success';
            default: return 'info';
        }
    }

    getStatusTag(s: string) {
        switch (s) {
            case 'RESOLVED': return 'success';
            case 'IN_PROGRESS': return 'warn';
            case 'OPEN': return 'danger';
            case 'FALSE_REPORT': return 'danger'; 
            default: return 'info';
        }
    }


    getRatingLabel(rating: number): string {
    const labels: { [key: number]: string } = {
        1: 'Very Poor ⭐',
        2: 'Poor ⭐⭐',
        3: 'Average ⭐⭐⭐',
        4: 'Good ⭐⭐⭐⭐',
        5: 'Excellent ⭐⭐⭐⭐⭐'
    };
    return labels[rating] || `${rating} stars`;
}
}
