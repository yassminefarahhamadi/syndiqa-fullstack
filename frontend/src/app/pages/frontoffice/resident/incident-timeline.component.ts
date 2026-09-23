import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { IncidentService , Incident } from '@/app/pages/service/incident.service';

@Component({
  selector: 'app-incident-process',
  standalone: true,
  imports: [CommonModule],

  template: `
<div class="container" *ngIf="incident; else loading">

  <h2>🚀 Incident Timeline</h2>

  <!-- INFO CARD -->
  <div class="card info">
        <div><b>Reported By : </b>{{ incident.reportedBy }}</div>

    <!--<div><b>ID:</b> {{ incident.id }}</div>-->
        <div><b>Building:</b> {{ incident.buildingName }}</div>

    
    <div><b>Description:</b> {{ incident.description }}</div>
    <div>
      <b>Status:</b>
      <span class="badge" [ngClass]="incident.status">
        {{ incident.status }}
      </span>
    </div>
  </div>

  <!-- 🔥 ZIGZAG TIMELINE -->
  <div class="timeline-zigzag">

    <div class="step left" [class.active]="isActive('NEW')">
      <div class="content">🆕 New</div>
    </div>

    <div class="step right" [class.active]="isActive('TAKEN')">
      <div class="content">📥 Taken</div>
    </div>

    <div class="step left" [class.active]="isActive('UNDER_INVESTIGATION')">
      <div class="content">🔍 Investigation</div>
    </div>

    <div class="step right" [class.active]="isActive('IN_PROGRESS')">
      <div class="content">⚙️ In Progress</div>
    </div>

    <div class="step left" [class.active]="isActive('RESOLVED')">
      <div class="content">✅ Resolved</div>
    </div>

    <div class="step right danger" *ngIf="incident.status === 'FALSE_REPORT'">
      <div class="content">🚫 False Report</div>
    </div>

  </div>
<div *ngIf="incident?.assignedTo && incident.assignedTo !== this.techEmail"
 style="color:red; font-weight:bold;">
  🔒 This incident is assigned to another technician
</div>
<br>
  <!-- ACTIONS -->
  <div class="card actions">
    <h3>⚡ Actions</h3>

    <div class="buttons">
     <button class="btn"
        (click)="takeIncident()"
        [disabled]="!canTake() ">
  Take
</button>

<button class="btn warn"
        (click)="investigate()"
        [disabled]="!canInvestigate() || !isOwner()">
  Investigate
</button>

<button class="btn info"
        (click)="setInProgress()"
        [disabled]="!canSetInProgress() || !isOwner()">
  Progress
</button>

<button class="btn success"
        (click)="resolve()"
        [disabled]="!canResolve() || !isOwner()">
  Resolve
</button>

<button class="btn danger"
        (click)="markFalse()"
        [disabled]="!canMarkFalse() || !isOwner()">
  False
</button> </div>

  </div>

</div>

<ng-template #loading>
  <p>Loading incident...</p>
</ng-template>
  `,

  styles: [`

.container {
  max-width: 900px;
  margin: auto;
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

/* CARD */
.card {
  background: var(--surface-card);
  padding: 18px;
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}

/* BADGE */
.badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.NEW { background:#dbeafe; color:#1d4ed8; }
.badge.TAKEN { background:#fef3c7; color:#92400e; }
.badge.UNDER_INVESTIGATION { background:#fde68a; color:#92400e; }
.badge.IN_PROGRESS { background:#e0f2fe; color:#0369a1; }
.badge.RESOLVED { background:#dcfce7; color:#166534; }
.badge.FALSE_REPORT { background:#fee2e2; color:#991b1b; }

/* 🔥 ZIGZAG TIMELINE */
.timeline-zigzag {
  position: relative;
  margin: 40px 0;
  padding: 20px 0;
}

/* CENTER LINE */
.timeline-zigzag::before {
  content: '';
  position: absolute;
  left: 50%;
  width: 3px;
  height: 100%;
  background: #e5e7eb;
  transform: translateX(-50%);
}

/* STEP */
.step {
  position: relative;
  width: 50%;
  padding: 10px 20px;
  box-sizing: border-box;
}

/* LEFT */
.step.left {
  left: 0;
  text-align: right;
}

/* RIGHT */
.step.right {
  left: 50%;
}

/* CONTENT */
.step .content {
  display: inline-block;
  padding: 10px 14px;
  border-radius: 10px;
  background: #f3f4f6;
  font-size: 13px;
  transition: 0.3s;
}

/* ACTIVE */
.step.active .content {
  background: var(--primary-color);
  color: white;
  font-weight: 600;
  transform: scale(1.05);
}

/* DOT */
.step::after {
  content: '';
  position: absolute;
  top: 15px;
  width: 16px;
  height: 16px;
  background: #d1d5db;
  border-radius: 50%;
  z-index: 1;
}

/* DOT LEFT */
.step.left::after {
  right: -8px;
}

/* DOT RIGHT */
.step.right::after {
  left: -8px;
}

/* ACTIVE DOT */
.step.active::after {
  background: var(--primary-color);
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
}

/* FALSE */
.step.danger .content {
  background: #fee2e2;
  color: #991b1b;
  font-weight: 600;
}

/* ACTIONS */
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  background: var(--primary-color);
  color: white;
  font-weight: 500;
  transition: 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn.warn { background: #f59e0b; }
.btn.info { background: #3b82f6; }
.btn.success { background: #10b981; }
.btn.danger { background: #ef4444; }

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

  `]
})
export class IncidentProcessComponent implements OnInit, OnDestroy {

  incidentId!: string;
  incident: any;
 
   techEmail!: string;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private incidentService: IncidentService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
 this.incidentId = this.route.snapshot.paramMap.get('id')!;
  this.techEmail = this.route.snapshot.queryParamMap.get('tech')!;
  
    if (isPlatformBrowser(this.platformId)) {
      this.load();
      this.sub = interval(5000).subscribe(() => this.load(false));
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

 load(show = true) {
  this.incidentService.getIncidentById(this.incidentId).subscribe({
    next: (res) => {

      this.incident = res;
      console.log('Loaded incident:', res);

      // 👇 fetch building name separately
      if (res.buildingId) {
        this.incidentService.getBuildingById(res.buildingId).subscribe({
          next: (b) => {
            this.incident.buildingName = b.name; // adjust if API uses different field
            this.cd.detectChanges();
          }
        });
      }

      this.cd.detectChanges();
    }
  });
}

  // ACTIONS
  takeIncident() { this.update('TAKEN'); }
  investigate() { this.update('UNDER_INVESTIGATION'); }
  setInProgress() { this.update('IN_PROGRESS'); }
  resolve() { this.update('RESOLVED'); }
  markFalse() { this.update('FALSE_REPORT'); }
isOwner(): boolean {
  return this.incident?.assignedTo === this.techEmail;
}
  update(stage: string) {

  const map: any = {
    TAKEN: 'take',
    UNDER_INVESTIGATION: 'investigate',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolve',
    FALSE_REPORT: 'false'
  };

  const action = map[stage];

  // 🚨 TAKE needs email
  if (action === 'take') {
    this.incidentService
      .updateIncidentStage(this.incidentId, action, this.techEmail)
      .subscribe(() => this.load());
    return;
  }

  // ✅ others don't need email
  this.incidentService
    .updateIncidentStage(this.incidentId, action)
    .subscribe(() => this.load());
}

  // RULES
  canTake() { return this.incident?.status === 'NEW'; }
  canInvestigate() { return this.incident?.status === 'TAKEN'; }
  canSetInProgress() { return this.incident?.status === 'UNDER_INVESTIGATION'; }
  canResolve() { return this.incident?.status === 'IN_PROGRESS'; }
  canMarkFalse() { return this.incident?.status === 'UNDER_INVESTIGATION'; }

  // ACTIVE STEP
  isActive(step: string) {
    const order = ['NEW','TAKEN','UNDER_INVESTIGATION','IN_PROGRESS','RESOLVED'];
    return order.indexOf(step) <= order.indexOf(this.incident?.status);
  }
}
