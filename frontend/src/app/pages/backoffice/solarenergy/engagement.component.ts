import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardComponent } from './leaderboard.component';
import { ChallengeDashboardComponent } from './challenge-dashboard.component';
import { VirtualForestWidgetComponent } from './virtual-forest-widget.component';
import { AuthService } from '@/app/core/auth/auth.service';
import { SolarService, SolarSystem } from './solar.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { GamificationService } from './gamification.service';
import { BuildingService } from '../property/building-complete';

@Component({
  selector: 'app-engagement',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LeaderboardComponent, 
    ChallengeDashboardComponent, VirtualForestWidgetComponent,
    SelectModule, TabsModule
  ],
  template: `
    <div class="flex flex-col gap-8 p-4 bg-surface-50/50 dark:bg-surface-950/20 min-h-screen">
      <!-- Top Section: Global Leaderboard always visible -->
      <app-leaderboard></app-leaderboard>

      <!-- Bottom Section: Building-Specific Engagement -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-lg transition-all duration-300">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <i class="pi pi-building text-emerald-600 dark:text-emerald-400 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-xl font-bold m-0 text-surface-900 dark:text-surface-0">My Community Performance</h3>
                  <p class="text-sm text-surface-500 dark:text-surface-400 m-0">Real-time engagement for your building</p>
                </div>
             </div>
             
             <div class="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 p-2 pr-4 rounded-xl border border-surface-200 dark:border-surface-700">
               <span class="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest pl-2">Select Community:</span>
               <p-select [options]="systems" [(ngModel)]="selectedSystemId" optionLabel="nameTranslate" optionValue="id" 
                         placeholder="Change Building" class="w-72" (onChange)="onSystemChange()" [filter]="true" filterBy="nameTranslate"
                         styleClass="border-none bg-transparent shadow-none"
                         panelStyleClass="dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl"></p-select>
             </div>
          </div>

          <app-challenge-dashboard [buildingId]="selectedBuildingId" 
                                   [challenges]="summary?.activeChallenges"
                                   [isAdmin]="isAdmin"></app-challenge-dashboard>
        </div>

        <div class="lg:col-span-1">
          <app-virtual-forest-widget [buildingId]="selectedBuildingId"
                                     [stats]="summary?.forestStats"></app-virtual-forest-widget>
        </div>
      </div>
    </div>
  `
})
export class EngagementComponent implements OnInit {
  private solarService = inject(SolarService);
  private authService = inject(AuthService);
  private gamificationService = inject(GamificationService);
  private buildingService = inject(BuildingService);

  systems: any[] = [];
  selectedSystemId: string | null = null;
  selectedBuildingId: string | undefined = undefined;
  
  summary: any = null;
  isAdmin = false;

  ngOnInit() {
    this.isAdmin = this.authService.isPlatformAdmin() || this.authService.isSyndicAdmin();
    
    // Load buildings first to have names ready for the dropdown
    this.buildingService.getAll().subscribe(buildings => {
      this.solarService.getSolarSystems().subscribe(sData => {
          this.systems = sData.map(s => {
            const b = buildings.find(build => build.id === s.buildingId);
            return { 
              ...s, 
              nameTranslate: b ? b.name : 'Building ' + s.buildingId.substring(0,5) 
            };
          }); 
          
          if (this.systems.length > 0) {
              this.selectedSystemId = this.systems[0].id;
              this.selectedBuildingId = this.systems[0].buildingId;
              this.loadSummary();
          }
      });
    });
  }

  onSystemChange() {
    const sys = this.systems.find(s => s.id === this.selectedSystemId);
    this.selectedBuildingId = sys ? sys.buildingId : undefined;
    this.loadSummary();
  }

  loadSummary() {
    if (!this.selectedBuildingId) return;
    
    this.gamificationService.getEngagementSummary(this.selectedBuildingId).subscribe(data => {
      this.summary = data;
      // Update the dropdown label with the real name once we have it
      const currentSys = this.systems.find(s => s.buildingId === this.selectedBuildingId);
      if (currentSys) {
          currentSys.nameTranslate = data.buildingName;
      }
    });
  }
}
