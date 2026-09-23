import { Component, OnInit, inject, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamificationService, EcoChallenge } from './gamification.service';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-challenge-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ProgressBarModule, TagModule, ButtonModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex justify-between items-center px-2">
        <h3 class="text-2xl font-black flex items-center gap-3 text-surface-900 dark:text-surface-0 tracking-tight">
            <span class="p-2 rounded-lg bg-orange-500/10">
              <i class="pi pi-compass text-orange-500 text-xl"></i>
            </span>
            Active Eco-Challenges
        </h3>
        <p-button *ngIf="isAdmin" icon="pi pi-plus" label="Set Goal" severity="contrast" rounded="true" (onClick)="createNewChallenge()"></p-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="challenges && challenges.length > 0; else emptyState">
        <div *ngFor="let ch of visibleChallenges" 
             class="group relative p-6 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          
          <!-- Decorative element -->
          <div class="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

          <div class="flex justify-between items-start mb-4 relative z-10">
             <div class="flex flex-col">
                <span class="text-[10px] text-orange-500 dark:text-orange-400 font-black uppercase tracking-[0.2em] mb-1">Building Goal</span>
                <h4 class="text-xl font-bold text-surface-900 dark:text-surface-0 leading-tight">{{ch.title}}</h4>
             </div>
             <div class="flex flex-col items-end gap-2">
                <p-tag [value]="ch.status" [severity]="getStatusSeverity(ch.status)" styleClass="font-bold"></p-tag>
                <p-button *ngIf="isAdmin && ch.id" icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="deleteChallenge(ch.id)" size="small"></p-button>
             </div>
          </div>
          
          <p class="text-surface-500 dark:text-surface-400 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{{ch.description}}</p>
          
          <div class="mt-auto relative z-10">
            <div class="flex justify-between text-sm mb-3">
               <span class="font-bold text-surface-900 dark:text-surface-0">{{calculateProgress(ch) | number:'1.2-2'}}% Reached</span>
               <span class="text-surface-400 dark:text-surface-500 font-medium">{{ch.currentKwh | number:'1.2-2'}} / {{ch.targetKwh | number:'1.1-1'}} kWh</span>
            </div>
            <p-progressBar [value]="calculateProgress(ch)" [showValue]="false" 
                          styleClass="h-2 rounded-full bg-surface-200 dark:bg-surface-800"
                          [style]="{'--p-progressbar-value-background': 'linear-gradient(90deg, #f59e0b, #fbbf24)'}"></p-progressBar>
          </div>
          
          <div class="flex items-center justify-between mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 text-xs relative z-10">
             <div class="flex items-center gap-2 text-surface-500 dark:text-surface-400">
               <i class="pi pi-calendar-times"></i>
               <span>Deadline: {{ch.endDate | date:'mediumDate'}}</span>
             </div>
             <div *ngIf="calculateProgress(ch) >= 100" class="text-emerald-500 animate-pulse font-bold">
               <i class="pi pi-check-circle"></i> Complete
             </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-4" *ngIf="challenges.length > displayLimit">
        <p-button [label]="showAll ? 'Show Less' : 'Show All (' + challenges.length + ')'" 
                  [icon]="showAll ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                  [outlined]="true" severity="secondary" rounded="true"
                  (onClick)="toggleShowAll()"></p-button>
      </div>

      <ng-template #emptyState>
        <div class="p-16 flex flex-col items-center justify-center bg-surface-0/50 dark:bg-surface-900/50 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-800 transition-colors">
           <div class="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-6">
             <i class="pi pi-flag-fill text-3xl text-surface-300 dark:text-surface-600"></i>
           </div>
           <h4 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Challenges Active</h4>
           <p class="text-surface-500 dark:text-surface-400 text-center max-w-xs">Your building is currently without a sustainability goal. Check back soon for the next solar sprint!</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .dashed-border {
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
    }
  `]
})
export class ChallengeDashboardComponent implements OnInit, OnChanges {
  @Input() buildingId?: string;
  @Input() challenges: EcoChallenge[] = [];
  @Input() isAdmin: boolean = false;

  private gamificationService = inject(GamificationService);
  
  showAll = false;
  displayLimit = 3;

  get visibleChallenges() {
    return this.showAll ? this.challenges : this.challenges.slice(0, this.displayLimit);
  }

  ngOnInit() {
    if (this.challenges.length === 0) {
      this.loadChallenges();
    }
  }

  ngOnChanges() {
    if (this.challenges.length === 0) {
      this.loadChallenges();
    }
  }

  loadChallenges() {
    if (!this.buildingId || this.challenges.length > 0) return;
    this.gamificationService.getChallenges(this.buildingId).subscribe(data => {
      this.challenges = data.filter(c => c.status === 'ACTIVE');
    });
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }

  calculateProgress(ch: EcoChallenge): number {
    return Math.min(100, (ch.currentKwh / ch.targetKwh) * 100);
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'ACTIVE': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      default: return 'secondary';
    }
  }

  createNewChallenge() {
    // Logic for syndic to create a placeholder challenge for demo
    if (!this.buildingId) return;
    const newCh: EcoChallenge = {
        title: 'Spring Energy Sprint',
        description: 'Aggregate 200kWh production this month!',
        targetKwh: 200,
        currentKwh: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
        buildingId: this.buildingId
    };
    this.gamificationService.createChallenge(newCh).subscribe(() => this.loadChallenges());
  }

  deleteChallenge(id: string) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.gamificationService.deleteChallenge(id).subscribe(() => {
        this.challenges = this.challenges.filter(c => c.id !== id);
      });
    }
  }
}
