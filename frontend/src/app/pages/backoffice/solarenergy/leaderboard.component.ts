import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamificationService, LeaderboardEntry } from './gamification.service';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, CardModule, TagModule, SelectModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="p-8 rounded-3xl shadow-2xl relative overflow-hidden mb-2" 
           style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white;">
        <div class="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div class="flex flex-wrap justify-between items-center gap-6 relative z-10">
          <div class="flex-1 min-w-[300px]">
            <h2 class="text-4xl font-black flex items-center gap-4 text-white m-0 tracking-tight">
              <i class="pi pi-trophy text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.6)] animate-bounce-slow"></i>
              Building Efficiency Leaderboard
            </h2>
            <p class="text-emerald-50 mt-2 text-lg font-medium opacity-100 drop-shadow-sm">
              Tunisia's brightest solar communities ranked by real-time performance.
            </p>
          </div>
          
          <div class="flex items-center gap-4 bg-black/20 p-4 rounded-2xl backdrop-blur-xl border border-white/30 shadow-inner">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] uppercase font-black tracking-widest text-emerald-200">View Mode</span>
              <p-select [options]="[ {label: 'Monthly', value: 'month'}, {label: 'Daily', value: 'date'} ]" 
                       [(ngModel)]="leaderboardType" optionLabel="label" optionValue="value" 
                       (onChange)="onTypeChange()" class="w-36" 
                       styleClass="border-none bg-transparent !text-white !font-bold shadow-none p-0"></p-select>
            </div>

            <div class="w-px h-10 bg-white/20"></div>

            <div class="flex flex-col gap-1">
              <span class="text-[10px] uppercase font-black tracking-widest text-emerald-200">Selected Period</span>
              <input [type]="leaderboardType" [(ngModel)]="selectedDate" (change)="loadLeaderboard()" 
                     class="bg-transparent text-white border-none font-black outline-none cursor-pointer focus:text-amber-200 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <p-card styleClass="border-round-2xl overflow-hidden shadow-sm dark:bg-surface-900 border-surface-200 dark:border-surface-800"
              [header]="(leaderboardType === 'month' ? 'Monthly' : 'Daily') + ' Performance Rankings'">
        <p-table [value]="entries" [responsiveLayout]="'stack'" styleClass="p-datatable-striped p-datatable-sm shadow-inner rounded-xl overflow-hidden border border-surface-200 dark:border-surface-800"
                 [paginator]="true" [rows]="5" [showCurrentPageReport]="true" [loading]="loading"
                 currentPageReportTemplate="Showing {first} to {last} of {totalRecords} buildings"
                 [tableStyle]="{'min-width': '50rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th class="w-16 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">Rank</th>
              <th class="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">Building Name</th>
              <th class="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">Energy (kWh)</th>
              <th class="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">Savings (TND)</th>
              <th class="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">CO2 Avoided</th>
              <th class="bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-0">Badge</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-entry>
            <tr [class.rank-1-row]="entry.rank === 1" 
                class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-200">
              <td>
                <div class="flex items-center justify-center w-10 h-10 rounded-full font-black shadow-lg transform hover:scale-110 transition-transform cursor-default" 
                     [ngClass]="{
                       'rank-1-color': entry.rank === 1,
                       'rank-2-color': entry.rank === 2,
                       'rank-3-color': entry.rank === 3,
                       'bg-surface-100 dark:bg-surface-800 text-surface-400 border border-surface-200 dark:border-surface-700': entry.rank > 3
                     }">
                  {{entry.rank}}
                </div>
              </td>
              <td class="text-lg font-black text-surface-900 dark:text-surface-0">{{entry.buildingName}}</td>
              <td class="text-surface-700 dark:text-surface-300 font-medium">{{entry.totalEnergyKwh | number:'1.2-2'}}</td>
              <td class="text-emerald-600 dark:text-emerald-400 font-black text-lg">{{entry.savingsTND | currency:'TND':'TND '}}</td>
              <td class="text-sky-600 dark:text-sky-400 font-semibold">{{entry.co2AvoidedKg | number:'1.2-2'}} kg</td>
              <td>
                <p-tag [value]="entry.badge" [severity]="getBadgeSeverity(entry.rank)" styleClass="font-bold px-3"></p-tag>
              </td>
            </tr>
          </ng-template>
        </p-table>
        
        <div *ngIf="entries.length === 0" class="flex flex-col items-center justify-center p-16 text-surface-400">
           <i class="pi pi-bolt text-5xl mb-4 opacity-20"></i>
           <p class="text-lg font-medium">No production recorded for this period</p>
           <p class="text-sm opacity-60">Try selecting a different date or initializing the demo seeder.</p>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .rank-1-color {
        background: linear-gradient(135deg, #ffd700 0%, #daa520 100%) !important;
        color: #1a1a1a !important; /* Dark text for better contrast on yellow */
        border: 2px solid #fef3c7 !important;
    }
    .rank-2-color {
        background: linear-gradient(135deg, #c0c0c0 0%, #8e8e8e 100%) !important;
        color: white !important;
        border: 2px solid #f1f5f9 !important;
    }
    .rank-3-color {
        background: linear-gradient(135deg, #cd7f32 0%, #a0522d 100%) !important;
        color: white !important;
        border: 2px solid #ffedd5 !important;
    }
    :host ::ng-deep .rank-1-row {
        background: rgba(251, 191, 36, 0.1) !important; /* Increased intensity */
    }
    .app-dark :host ::ng-deep .rank-1-row {
        background: rgba(251, 191, 36, 0.15) !important;
        box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.08);
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  
  entries: LeaderboardEntry[] = [];
  leaderboardType: 'month' | 'date' = 'month';
  selectedDate: string = new Date().toISOString().substring(0, 7); // Default to current month
  loading: boolean = false;

  ngOnInit() {
    this.loadLeaderboard();
  }

  onTypeChange() {
    // Reset date based on type
    const now = new Date();
    this.selectedDate = this.leaderboardType === 'month' 
      ? now.toISOString().substring(0, 7) 
      : now.toISOString().substring(0, 10);
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.loading = true;
    this.gamificationService.getLeaderboard(this.selectedDate).subscribe({
      next: (data) => {
        this.entries = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getBadgeSeverity(rank: number): any {
    if (rank === 1) return 'success';
    if (rank === 2) return 'info';
    if (rank === 3) return 'warning';
    return 'secondary';
  }
}
