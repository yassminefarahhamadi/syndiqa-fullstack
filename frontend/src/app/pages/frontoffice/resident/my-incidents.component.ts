import { Building } from './../../backoffice/property/equipment-complete';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IncidentService } from '@/app/pages/service/incident.service';
import { ReportIncidentComponent } from './report-incident.component';
import { FormsModule } from '@angular/forms'; // Add this import

@Component({
  selector: 'app-my-incidents',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule, InputTextModule, ReportIncidentComponent,FormsModule],
  template: `
<div class="incidents-container">

  <!-- White Header Bar -->
  <div class="header-bar">
    <div class="header-content">
      <div class="header-text">
        <div class="section-label">
          <span class="label-dot"></span>
          INCIDENT MANAGEMENT
        </div>
        <h1 class="header-title">Incident History</h1>
      </div>
      <button pButton label="Report Incident" icon="pi pi-plus" class="p-button-primary" (click)="openReportIncident()"></button>
    </div>

     <!-- Search and Filter Section -->
  <div class="search-filter-section">
    <div class="search-wrapper">
      <i class="pi pi-search search-icon"></i>
      <input type="text" pInputText placeholder="Search by incident type, description, or location..." class="search-input" [(ngModel)]="searchTerm" (input)="onSearch()" />
      <button *ngIf="searchTerm" class="clear-search" (click)="clearSearch()">
        <i class="pi pi-times"></i>
      </button>
    </div>
    <div class="filter-tabs">
      <button class="filter-chip" [class.active]="selectedFilter === 'ALL'" (click)="setFilter('ALL')">
        <i class="pi pi-list"></i>
        All
        <span class="chip-count">{{ incidents.length }}</span>
      </button>
      <button class="filter-chip" [class.active]="selectedFilter === 'COMPLAINT'" (click)="setFilter('COMPLAINT')">
        <i class="pi pi-comment"></i>
        Complaints
        <span class="chip-count">{{ getCategoryCount('COMPLAINT') }}</span>
      </button>
      <button class="filter-chip" [class.active]="selectedFilter === 'SAFETY'" (click)="setFilter('SAFETY')">
        <i class="pi pi-shield"></i>
        Safety
        <span class="chip-count">{{ getCategoryCount('SAFETY') }}</span>
      </button>
      <button class="filter-chip" [class.active]="selectedFilter === 'PAYMENT'" (click)="setFilter('PAYMENT')">
        <i class="pi pi-credit-card"></i>
        Payment
        <span class="chip-count">{{ getCategoryCount('PAYMENT') }}</span>
      </button>
      <button class="filter-chip" [class.active]="selectedFilter === 'TECHNICAL'" (click)="setFilter('TECHNICAL')">
        <i class="pi pi-cog"></i>
        Technical
        <span class="chip-count">{{ getCategoryCount('TECHNICAL') }}</span>
      </button>
    </div>
  </div>
  </div>

 

  <!-- Search Results Info -->
  <div class="search-info" *ngIf="searchTerm && filteredIncidents.length > 0">
    <i class="pi pi-info-circle"></i>
    Found {{ filteredIncidents.length }} incident(s) matching "{{ searchTerm }}"
  </div>

  <!-- Incidents Grid -->
  <div class="incidents-grid" *ngIf="filteredIncidents.length > 0; else emptyState">
    <div class="incident-card" *ngFor="let incident of paginatedIncidents">
      
      <!-- Card Header -->
      <div class="card-header">
        <div class="incident-title-section">
          <i class="pi pi-building"></i>
          <div>
            <h3 class="incident-type" [innerHTML]="highlightText(incident.type)"></h3>
            <div class="incident-location">
              <i class="pi pi-map-marker"></i>
              <span [innerHTML]="highlightText(incident.buildingName)"></span>
            </div>
          </div>
        </div>
        <button class="card-menu-btn" (click)="viewDetails(incident)">
          <i class="pi pi-ellipsis-v"></i>
        </button>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <p class="incident-description" [innerHTML]="highlightText(incident.description)"></p>
        
        <div class="incident-tags">
          <span class="tag category" [class]="incident.category.toLowerCase()">
            <i [class]="getCategoryIcon(incident.category)"></i>
            {{ incident.category }}
          </span>
          <span class="tag severity" [class]="getSeverityClass(incident.finalSeverity)">
            <span class="severity-dot"></span>
            {{ incident.finalSeverity || 'Pending' }}
          </span>
        </div>

        <!-- Evidence Preview -->
        <div class="evidence-preview" *ngIf="hasEvidence(incident)">
          <div class="evidence-header">
            <i class="pi pi-paperclip"></i>
            <span>Evidence</span>
          </div>
          <div class="evidence-list">
            <div *ngFor="let file of incident.photoUrls.slice(0, 3)" class="evidence-item" (click)="openFile(file.url)">
              <img *ngIf="isImage(file)" [src]="file.url" class="evidence-thumb" />
              <div *ngIf="isPdf(file)" class="evidence-icon pdf">
                <i class="pi pi-file-pdf"></i>
              </div>
            </div>
            <div *ngIf="incident.audioUrl" class="evidence-item audio" (click)="playAudio(incident.audioUrl)">
              <div class="evidence-icon">
                <i class="pi pi-microphone"></i>
              </div>
            </div>
            <div *ngIf="(incident.photoUrls?.length || 0) > 3" class="evidence-more">
              +{{ incident.photoUrls.length - 3 }}
            </div>
          </div>
        </div>
      </div>

      
      <!-- Card Footer -->
      <div class="card-footer">
        <div class="date-info">
          <i class="pi pi-calendar"></i>
          <span>{{ incident.reportedAt | date:'MMM d, y' }}</span>
        </div>
        <div class="status-badge" [class]="getStatusClass(incident.status)">
          <i [class]="getStatusIcon(incident.status)"></i>
          {{ incident.status | titlecase  }}
        </div>
      </div>

      <!-- ⭐ RATING STARS SECTION - ONLY FOR RESOLVED INCIDENTS -->
      <div class="rating-section" *ngIf="incident.status === 'RESOLVED'">
        <div class="rating-label">Rate this incident:</div>
        <div class="rating-stars">
          <i 
            class="pi" 
            *ngFor="let star of [1,2,3,4,5]" 
            [ngClass]="star <= (incident.rating || 0) ? 'pi-star-fill' : 'pi-star'"
            (click)="rateIncident(incident, star)"
            (mouseenter)="hoverRating = star"
            (mouseleave)="hoverRating = null"
            [class.hover-star]="hoverRating && star <= hoverRating"
            style="cursor: pointer;">
          </i>
        </div>
        <div class="rating-value" *ngIf="incident.rating">
          {{ incident.rating }}/5
        </div>
      </div>
    </div>
  </div>

 <!-- Pagination -->
<div class="pagination-section" *ngIf="filteredIncidents.length > 0">
  <div class="pagination-info">
    Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
    {{ Math.min(currentPage * itemsPerPage, filteredIncidents.length) }} 
    of {{ filteredIncidents.length }} incidents
  </div>
  <div class="pagination-controls">
    <button pButton class="p-button-text" icon="pi pi-chevron-left" 
            (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1">
    </button>
    <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
    <button pButton class="p-button-text" icon="pi pi-chevron-right" 
            (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages">
    </button>
  </div>
</div>

  <!-- Empty State -->
  <ng-template #emptyState>
    <div class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>No Incidents Found</h3>
      <p *ngIf="!searchTerm">No incidents match your current filter criteria.</p>
      <p *ngIf="searchTerm">No incidents match "{{ searchTerm }}"</p>
      <button pButton label="Report New Incident" icon="pi pi-plus" class="p-button-primary" (click)="openReportIncident()"></button>
    </div>
  </ng-template>

  <!-- Details Modal -->
  <div class="modal-overlay" *ngIf="selectedIncident" (click)="closeDetails()">
    <div class="modal-container" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Incident Details</h3>
        <button class="modal-close" (click)="closeDetails()">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-group">
          <label>Incident Type</label>
          <p>{{ selectedIncident.type }}</p>
        </div>
        <div class="detail-group">
          <label>Location</label>
          <p>{{ selectedIncident.buildingName }}</p>
        </div>
        <div class="detail-group">
          <label>Description</label>
          <p>{{ selectedIncident.description }}</p>
        </div>
        <div class="detail-group">
          <label>Category</label>
          <p>{{ selectedIncident.category }}</p>
        </div>
        <div class="detail-group">
          <label>Severity</label>
          <p>{{ selectedIncident.finalSeverity || 'Pending' }}</p>
        </div>
        <div class="detail-group">
          <label>Status</label>
          <p>{{ selectedIncident.status }}</p>
        </div>
        <div class="detail-group">
          <label>Reported Date</label>
          <p>{{ selectedIncident.reportedAt | date:'full' }}</p>
        </div>
        <div class="detail-group" *ngIf="selectedIncident.resolvedAt">
          <label>Resolved Date</label>
          <p>{{ selectedIncident.resolvedAt | date:'full' }}</p>
        </div>
        <div class="detail-group" *ngIf="selectedIncident.rating">
          <label>Your Rating</label>
          <p>{{ selectedIncident.rating }}/5 ⭐</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Audio Modal -->
  <div class="audio-overlay" *ngIf="audioUrl" (click)="closeAudio()">
    <div class="audio-card" (click)="$event.stopPropagation()">
      <div class="audio-header">
        <i class="pi pi-microphone"></i>
        <h4>Audio Evidence</h4>
        <button class="audio-close" (click)="closeAudio()">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <audio controls autoplay [src]="audioUrl" class="audio-player"></audio>
    </div>
  </div>

  <!-- Report Incident Modal -->
  <div class="modal-overlay" *ngIf="showReportIncident" (click)="closeReportIncident()">
      
      <div class="modal-body">
        <app-report-incident (close)="closeReportIncident()"></app-report-incident>
      </div>
  </div>
</div>
  `,

  styles: [`
    .incidents-container {
      padding: 24px;
      min-height: 100vh;
    }

    /* White Header Bar - follows template design */
    .header-bar {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 24px 32px;
      margin-bottom: 24px;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--surface-border);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: var(--primary-color);
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .label-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
    }

    .header-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-color);
    }

    .header-subtitle {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 14px;
    }

    /* Search and Filter Section */
    .search-filter-section {
      margin-bottom: 24px;
    }

    .search-wrapper {
      position: relative;
      margin-bottom: 20px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-color-secondary);
      font-size: 16px;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      font-size: 14px;
      color: var(--text-color);
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
    }

    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .clear-search:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .filter-tabs {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-chip {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      padding: 8px 16px;
      border-radius: 40px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color-secondary);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-chip i {
      font-size: 14px;
    }

    .filter-chip .chip-count {
      background: var(--surface-hover);
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 4px;
    }

    .filter-chip.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--primary-color-text);
    }

    .filter-chip.active .chip-count {
      background: rgba(255, 255, 255, 0.2);
      color: var(--primary-color-text);
    }

    .filter-chip:hover:not(.active) {
      background: var(--surface-hover);
      border-color: var(--primary-color);
      color: var(--text-color);
    }

    /* Search Info */
    .search-info {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-color-secondary);
    }

    .search-info i {
      color: var(--primary-color);
      font-size: 14px;
    }

    /* Incidents Grid */
    .incidents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .incident-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s;
    }

    .incident-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow);
    }

    /* Card Header */
    .card-header {
      padding: 20px;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .incident-title-section {
      display: flex;
      gap: 12px;
      flex: 1;
    }

    .incident-title-section > i {
      font-size: 20px;
      color: var(--primary-color);
      margin-top: 2px;
    }

    .incident-type {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-color);
    }

    .incident-location {
      font-size: 12px;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .incident-location i {
      font-size: 11px;
    }

    .card-menu-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: var(--text-color-secondary);
      transition: all 0.2s;
    }

    .card-menu-btn:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    /* Card Body */
    .card-body {
      padding: 20px;
    }

    .incident-description {
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-color);
    }

    .incident-tags {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .tag.category {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .tag.category.complaint { background: #fef3c7; color: #d97706; }
    .tag.category.safety { background: #fee2e2; color: #dc2626; }
    .tag.category.payment { background: #dbeafe; color: #2563eb; }
    .tag.category.technical { background: #e0e7ff; color: var(--primary-color); }

    .tag.severity {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .tag.severity.critical { background: #fee2e2; color: #dc2626; }
    .tag.severity.high { background: #fef3c7; color: #d97706; }
    .tag.severity.medium { background: #d1fae5; color: #059669; }
    .tag.severity.low { background: #dbeafe; color: #3b82f6; }

    .severity-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }

    .tag.severity.critical .severity-dot { background: #dc2626; }
    .tag.severity.high .severity-dot { background: #d97706; }
    .tag.severity.medium .severity-dot { background: #059669; }
    .tag.severity.low .severity-dot { background: #3b82f6; }

    /* Highlight text */
    .highlight {
      background: rgba(124, 58, 237, 0.2);
      color: var(--primary-color);
      font-weight: 500;
      padding: 0 2px;
      border-radius: 3px;
    }

    /* Evidence Preview */
    .evidence-preview {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--surface-border);
    }

    .evidence-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
    }

    .evidence-list {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .evidence-item {
      cursor: pointer;
      transition: transform 0.2s;
    }

    .evidence-item:hover {
      transform: scale(1.05);
    }

    .evidence-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--surface-border);
    }

    .evidence-icon {
      width: 48px;
      height: 48px;
      background: var(--surface-hover);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
    }

    .evidence-icon.pdf {
      color: #dc2626;
    }

    .evidence-item.audio .evidence-icon {
      background: var(--primary-color);
      opacity: 0.9;
      color: white;
    }

    .evidence-more {
      width: 48px;
      height: 48px;
      background: var(--surface-hover);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    /* Card Footer */
    .card-footer {
      padding: 16px 20px;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .date-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-color-secondary);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-badge.info { background: #dbeafe; color: #2563eb; }
    .status-badge.warning { background: #fef3c7; color: #d97706; }
    .status-badge.success { background: #d1fae5; color: #059669; }
    .status-badge.danger { background: #fee2e2; color: #dc2626; }

    /* ⭐ RATING STARS SECTION STYLES */
    .rating-section {
      padding: 12px 20px 16px 20px;
      background: linear-gradient(135deg, #fef9e7 0%, #fff8e1 100%);
      border-top: 1px solid #ffe082;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .rating-label {
      font-size: 12px;
      font-weight: 600;
      color: #d97706;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rating-stars {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .rating-stars i {
      font-size: 18px;
      color: #fbbf24;
      transition: all 0.2s ease;
    }

    .rating-stars i:hover {
      transform: scale(1.2);
    }

    .rating-stars i.hover-star {
      transform: scale(1.1);
    }

    .rating-value {
      font-size: 11px;
      font-weight: 600;
      color: #b45309;
      background: #fffbeb;
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid #fde68a;
    }

    /* Dark mode for rating section */
    :host-context(.dark) .rating-section {
      background: linear-gradient(135deg, #422006 0%, #451a03 100%);
      border-top-color: #78350f;
    }

    :host-context(.dark) .rating-label {
      color: #fbbf24;
    }

    :host-context(.dark) .rating-value {
      color: #fcd34d;
      background: #78350f;
      border-color: #92400e;
    }

    /* Dark mode overrides */
    :host-context(.dark) .status-badge.info { background: #1e3a8a; color: #60a5fa; }
    :host-context(.dark) .status-badge.warning { background: #78350f; color: #fbbf24; }
    :host-context(.dark) .status-badge.success { background: #064e3b; color: #34d399; }
    :host-context(.dark) .status-badge.danger { background: #7f1d1d; color: #f87171; }
    
    :host-context(.dark) .tag.category.complaint { background: #78350f; color: #fbbf24; }
    :host-context(.dark) .tag.category.safety { background: #7f1d1d; color: #f87171; }
    :host-context(.dark) .tag.category.payment { background: #1e3a8a; color: #60a5fa; }
    :host-context(.dark) .tag.category.technical { background: #4c1d95; color: #a78bfa; }
    
    :host-context(.dark) .tag.severity.critical { background: #7f1d1d; color: #f87171; }
    :host-context(.dark) .tag.severity.high { background: #78350f; color: #fbbf24; }
    :host-context(.dark) .tag.severity.medium { background: #064e3b; color: #34d399; }
    :host-context(.dark) .tag.severity.low { background: #1e3a8a; color: #60a5fa; }

    /* Pagination */
    .pagination-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-top: 1px solid var(--surface-border);
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      font-size: 14px;
      color: var(--text-color-secondary);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-indicator {
      font-size: 14px;
      color: var(--text-color);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
    }

    .empty-state i {
      font-size: 64px;
      color: var(--text-color-secondary);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--text-color);
    }

    .empty-state p {
      margin: 0 0 20px 0;
      color: var(--text-color-secondary);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: var(--surface-card);
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
      animation: slideUp 0.2s;
      border: 1px solid var(--surface-border);
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .report-modal {
      max-width: 700px;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color);
    }

    .modal-close {
      background: transparent;
      border: none;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: var(--text-color-secondary);
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .modal-body {
      padding: 24px;
      max-height: calc(90vh - 80px);
      overflow-y: auto;
    }

    .detail-group {
      margin-bottom: 20px;
    }

    .detail-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color-secondary);
      margin-bottom: 6px;
    }

    .detail-group p {
      margin: 0;
      color: var(--text-color);
      font-size: 14px;
      line-height: 1.5;
    }

    /* Audio Overlay */
    .audio-overlay {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      animation: slideRight 0.3s;
    }

    @keyframes slideRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .audio-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 16px;
      min-width: 320px;
      box-shadow: var(--card-shadow);
    }

    .audio-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .audio-header i {
      font-size: 20px;
      color: var(--primary-color);
    }

    .audio-header h4 {
      margin: 0;
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
    }

    .audio-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
    }

    .audio-player {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .incidents-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .incidents-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filter-tabs {
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 4px;
      }

      .pagination-section {
        flex-direction: column;
        align-items: center;
      }

      .audio-card {
        min-width: calc(100vw - 32px);
        margin: 0 16px;
      }

      .rating-section {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class MyIncidentsComponent implements OnInit {
  Math = Math;
  private incidentService = inject(IncidentService);
  
  incidents: any[] = [];
  showReportIncident = false;
  selectedFilter: string = 'ALL';
  selectedIncident: any = null;
  audioUrl: string | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 9;
  searchTerm: string = '';
  hoverRating: number | null = null; // For star hover effect

  ngOnInit() {
    this.loadIncidents();
  }

  loadIncidents() {
    this.incidentService.getMyIncidents().subscribe({
      next: (res) => {
        this.incidents = (res || []).map(i => ({
          ...i,
          photoUrls: (i.evidencePhotos || []).map((p: string) => ({
            url: this.getFullUrl(p),
            name: p.split('/').pop(),
            type: this.detectFileType(p)
          })),
          audioUrl: i.audioPath ? this.getFullUrl(i.audioPath) : null,
          category: this.incidentService.detectCategory(i.type, i.description),
          rating: i.rating || 0 // Initialize rating
        }));
        this.currentPage = 1;
      },
      error: (err) => {
        console.error('Error loading my incidents', err);
      }
    });
  }

  // ⭐ RATE INCIDENT METHOD - For resolved incidents only
 rateIncident(incident: any, rating: number) {
  if (incident.status !== 'RESOLVED') {
    console.warn('Only resolved incidents can be rated');
    return;
  }

  incident.rating = rating;

  this.incidentService.rateIncident(incident.id, rating).subscribe({
    next: () => console.log('Rating saved successfully'),
    error: (err) => console.error('Error saving rating:', err)
  });
}

  getFullUrl(path: string): string {
    return `http://localhost:8089${path}`;
  }

  detectFileType(path: string): string {
    if (/\.(jpg|jpeg|png|webp)$/i.test(path)) return 'image';
    if (/\.pdf$/i.test(path)) return 'pdf';
    return 'file';
  }

  setFilter(f: string) {
    this.selectedFilter = f;
    this.currentPage = 1;
  }

  onSearch() {
    this.currentPage = 1;
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  get filteredIncidents() {
    let filtered = this.incidents;
    
    // Apply category filter
    if (this.selectedFilter !== 'ALL') {
      filtered = filtered.filter(i => i.category === this.selectedFilter);
    }
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.type?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term) ||
        i.buildingId?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  get paginatedIncidents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredIncidents.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredIncidents.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getCategoryCount(category: string) {
    return this.incidents.filter(i => i.category === category).length;
  }

  getStatusCount(status: string) {
    return this.incidents.filter(i => i.status === status).length;
  }

  getAvgResponseTime(): number {
    const resolved = this.incidents.filter(i => i.status === 'RESOLVED');
    if (resolved.length === 0) return 0;
    return Math.floor(Math.random() * 5) + 1;
  }

  hasEvidence(incident: any): boolean {
    return (incident.photoUrls && incident.photoUrls.length > 0) || incident.audioUrl;
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      'COMPLAINT': 'pi pi-comment',
      'SAFETY': 'pi pi-shield',
      'PAYMENT': 'pi pi-credit-card',
      'TECHNICAL': 'pi pi-cog'
    };
    return icons[category] || 'pi pi-tag';
  }

  getSeverityClass(severity: string) {
    if (!severity) return 'low';
    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'critical';
    if (s.includes('high')) return 'high';
    if (s.includes('medium')) return 'medium';
    return 'low';
  }

  getStatusClass(status: string) {
    if (!status) return 'info';
    const map: any = {
      'NEW': 'info',
      'IN_PROGRESS': 'warning',
      'RESOLVED': 'success',
      'UNDER_INVESTIGATION': 'warning',
      'FALSE_REPORT': 'danger'
    };
    return map[status.toUpperCase()] || 'info';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'NEW': 'pi pi-clock',
      'IN_PROGRESS': 'pi pi-spinner',
      'RESOLVED': 'pi pi-check',
      'UNDER_INVESTIGATION': 'pi pi-search',
      'FALSE_REPORT': 'pi pi-times'
    };
    return icons[status.toUpperCase()] || 'pi pi-info';
  }

  highlightText(text: string): string {
    if (!this.searchTerm || !text) return text;
    const regex = new RegExp(`(${this.escapeRegex(this.searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  openReportIncident() {
    this.showReportIncident = true;
  }

  closeReportIncident() {
    this.showReportIncident = false;
    this.loadIncidents();
  }

  viewDetails(incident: any) {
    this.selectedIncident = incident;
  }

  closeDetails() {
    this.selectedIncident = null;
  }

  playAudio(url: string) {
    this.audioUrl = url;
  }

  closeAudio() {
    this.audioUrl = null;
  }

  isImage(file: any) {
    return file?.type?.startsWith('image') || /\.(jpg|png|jpeg|webp)$/i.test(file?.name);
  }

  isPdf(file: any) {
    return file?.type === 'pdf' || /\.pdf$/i.test(file?.name);
  }

  openFile(url: string) {
    window.open(url, '_blank');
  }
}
