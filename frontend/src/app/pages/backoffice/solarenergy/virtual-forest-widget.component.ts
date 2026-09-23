import { Component, OnInit, inject, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, ForestStats } from './gamification.service';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-virtual-forest-widget',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div class="card p-8 border-none shadow-2xl bg-gradient-to-b from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-900 overflow-hidden relative min-h-[450px] rounded-3xl">
      <!-- Background SVG Elements (Clouds/Sun) -->
      <div class="absolute top-10 right-10">
        <i class="pi pi-sun text-7xl text-amber-100 opacity-40 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"></i>
      </div>
      
      <div class="relative z-10">
         <div class="flex items-center gap-3 mb-1">
           <span class="px-2 py-1 rounded bg-black/10 dark:bg-white/20 text-[10px] font-black text-sky-950 dark:text-sky-100 uppercase tracking-widest backdrop-blur-sm">Ecological Impact</span>
         </div>
         <h3 class="text-3xl font-black text-sky-950 dark:text-surface-0 mb-2 tracking-tight">Building Virtual Forest</h3>
         <p class="text-sky-900 dark:text-sky-100 opacity-90 mb-8 max-w-[240px] text-sm leading-relaxed font-bold">Your solar production has directly contributed to these local green landmarks.</p>
         
         <div class="grid grid-cols-2 gap-3 mb-8">
             <div class="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4 rounded-2xl text-slate-900 dark:text-surface-0 border border-white/20 shadow-lg">
               <span class="block text-[10px] uppercase font-bold text-sky-950 dark:text-sky-300 tracking-wider mb-1">Total Trees</span>
               <div class="flex items-baseline gap-1">
                 <span class="text-3xl font-black">{{stats?.totalTrees || 0}}</span>
                 <span class="text-xs font-bold opacity-80">units</span>
               </div>
            </div>
            <div class="bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4 rounded-2xl text-slate-900 dark:text-surface-0 border border-white/20 shadow-lg">
               <span class="block text-[10px] uppercase font-bold text-sky-950 dark:text-sky-300 tracking-wider mb-1">CO2 Impact</span>
               <div class="flex items-baseline gap-1">
                 <span class="text-2xl font-black">{{stats?.co2AvoidedKg | number:'1.1-1'}}</span>
                 <span class="text-xs font-bold opacity-80">kg</span>
               </div>
            </div>
            <div class="col-span-2 bg-emerald-500/30 dark:bg-emerald-500/30 backdrop-blur-xl p-4 rounded-2xl text-slate-900 dark:text-surface-0 border border-white/20 shadow-lg flex justify-between items-center">
               <div>
                 <span class="block text-[10px] uppercase font-bold text-sky-950 dark:text-sky-300 tracking-wider mb-1">Ecosystem Status</span>
                 <span class="text-lg font-black tracking-tight uppercase">{{stats?.forestLevel || 'Seedling'}}</span>
               </div>
               <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                 <i class="pi pi-verified text-xl text-emerald-400"></i>
               </div>
            </div>
         </div>
      </div>

      <!-- Forest Visualization Canvas -->
      <div class="absolute bottom-[-10px] left-0 right-0 h-48 flex items-end justify-center px-4 overflow-hidden">
          <!-- Dynamic Tree Generation -->
          <div *ngFor="let tree of displayTrees" 
               [style.left.%]="tree.pos" 
               class="absolute transition-all duration-1000 transform scale-0 animate-grow"
               [style.animation-delay]="tree.delay + 'ms'"
               style="transform-origin: bottom center;">
            <svg width="40" height="60" viewBox="0 0 40 60">
              <rect x="17" y="45" width="6" height="15" fill="#5D4037" />
              <circle cx="20" cy="35" r="15" fill="#2E7D32" />
              <circle cx="12" cy="25" r="10" fill="#388E3C" />
              <circle cx="28" cy="25" r="10" fill="#43A047" />
            </svg>
          </div>
          
          <!-- Ground -->
          <div class="absolute bottom-0 w-full h-8 bg-emerald-800 opacity-40 blur-sm"></div>
      </div>
      
      <!-- Milestone Message -->
      <div *ngIf="milestoneMessage" class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
         <div class="bg-white p-4 rounded-xl shadow-2xl border-2 border-emerald-400 transform animate-bounce">
            <span class="text-xl font-bold text-emerald-700">🎉 {{milestoneMessage}}</span>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-grow {
      animation: growIn 1s forwards;
    }
    @keyframes growIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class VirtualForestWidgetComponent implements OnInit, OnChanges {
  @Input() buildingId?: string;
  @Input() stats: ForestStats | null = null;

  private gamificationService = inject(GamificationService);
  displayTrees: any[] = [];
  milestoneMessage: string | null = null;

  ngOnInit() {
    if (!this.stats) {
      this.refresh();
    } else {
      this.updateForestVisuals();
    }
  }

  ngOnChanges() {
    if (this.stats) {
      this.updateForestVisuals();
    } else {
      this.refresh();
    }
  }

  refresh() {
    if (!this.buildingId || this.stats) return;
    this.gamificationService.getForestStats(this.buildingId).subscribe(data => {
      this.stats = data;
      this.updateForestVisuals();
    });
  }

  updateForestVisuals() {
    if (!this.stats) return;
    const stats_limit = 50; // Cap visual trees for performance
    const treeCount = Math.min(stats_limit, this.stats.totalTrees);
    
    // Create random positions for trees if they don't exist
    this.displayTrees = [];
    for (let i = 0; i < treeCount; i++) {
      this.displayTrees.push({
        pos: Math.random() * 90 + 5,
        delay: Math.random() * 1000
      });
    }

    // Check for level milestones (for demo)
    if (this.stats.forestLevel !== 'SEEDLING') {
        this.milestoneMessage = `Niveau atteint : ${this.stats.forestLevel} !`;
        setTimeout(() => this.milestoneMessage = null, 5000);
    }
  }
}
