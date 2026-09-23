/**
 * =============================================================================
 * HIERARCHICAL ASSET TREE VIEW - MODERN RECURSIVE VISUALIZATION
 * =============================================================================
 * Interactive tree visualization: Residence → Buildings → Apartments → Equipment
 * Showcases complete data relationships with drill-down capability
 * =============================================================================
 */

import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ResidenceService, Residence } from './residence-complete';
import { BuildingService, Building } from './building-complete';
import { ApartmentService, Apartment } from './apartment-complete';
import { ParkingSpotService, ParkingSpot } from './parking-spot-complete';
import { EquipmentService, Equipment } from './equipment-complete';
import { CommonAreaService } from './common-area-complete';

interface TreeNode {
  id?: string;
  name: string;
  type: 'residence' | 'building' | 'apartment' | 'parking' | 'equipment' | 'commonArea';
  icon: string;
  status?: string;
  data?: any;
  children?: TreeNode[];
  expanded?: boolean;
  level: number;
}

/**
 * Tree Node Component (Recursive)
 */
@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node group">
      <div class="flex items-center gap-3 p-3 rounded-2xl border border-transparent transition-all duration-300 hover:bg-surface-50 dark:hover:bg-surface-800/50 hover:border-surface-200 dark:hover:border-surface-700 hover:shadow-sm" [style.margin-left.px]="node.level * 24">
        <button 
          *ngIf="hasChildren"
          (click)="onToggle()"
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-primary-500 hover:text-white transition-all duration-300"
          [class.bg-primary-500]="node.expanded"
          [class.text-white]="node.expanded"
        >
          <i class="pi" [ngClass]="node.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
        </button>
        
        <div *ngIf="!hasChildren" class="w-8 h-8"></div>
        
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-surface-100 dark:bg-surface-800 group-hover:bg-white dark:group-hover:bg-surface-900 shadow-inner">
           {{ node.icon }}
        </div>
        
        <div class="flex flex-col">
           <span class="text-sm font-bold text-surface-900 dark:text-surface-0">{{ node.name }}</span>
           <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ node.type }}</span>
        </div>
        
        <div class="ml-auto flex items-center gap-2">
           <span *ngIf="node.status" 
             class="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest"
             [ngClass]="{
               'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': node.status.toLowerCase() === 'available' || node.status.toLowerCase() === 'operational',
               'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': node.status.toLowerCase() === 'maintenance',
               'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': node.status.toLowerCase() === 'broken' || node.status.toLowerCase() === 'closed',
               'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400': !['available', 'operational', 'maintenance', 'broken', 'closed'].includes(node.status.toLowerCase())
             }">
             {{ node.status }}
           </span>

           <div *ngIf="hasChildren" class="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-bold text-surface-500">
             {{ node.children!.length }}
           </div>
        </div>
      </div>

      <div *ngIf="node.expanded && hasChildren" class="mt-1 relative">
        <!-- Vertical connector line -->
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-100 dark:bg-surface-800 rounded-full" [style.margin-left.px]="node.level * 24"></div>
        
        <app-tree-node 
          *ngFor="let child of node.children"
          [node]="child"
          (toggleExpand)="onToggle()"
        ></app-tree-node>
      </div>
    </div>
  `,
  styles: [``]
})
export class TreeNodeComponent {
  @Input() node!: TreeNode;
  @Output() toggleExpand = new EventEmitter<TreeNode>();

  get hasChildren(): boolean {
    return !!this.node.children && this.node.children.length > 0;
  }

  onToggle(): void {
    this.node.expanded = !this.node.expanded;
    this.toggleExpand.emit(this.node);
  }
}

/**
 * Main Hierarchical Asset Tree Component
 */
@Component({
  selector: 'app-hierarchical-asset-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeNodeComponent, ButtonModule],
  template: `
    <!-- Header Section -->
    <div class="mb-8 p-8 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-primary-500/20 rounded-full blur-2xl"></div>
      
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-5">
           <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-md shadow-lg">
              <i class="pi pi-share-alt text-3xl text-white"></i>
           </div>
           <div>
              <h2 class="text-3xl font-extrabold text-white m-0 tracking-tight">Portfolio Hierarchy</h2>
              <p class="text-emerald-100 mt-2 m-0 opacity-90 text-sm flex items-center gap-2 font-medium">
                 <i class="pi pi-sitemap"></i>
                 Recursive asset structure from residence to individual equipment
              </p>
           </div>
        </div>
        
        <div class="flex items-center gap-3">
          <p-button label="Expand All" icon="pi pi-plus-circle" [outlined]="true" styleClass="text-white border-white/50 hover:bg-white/10" (onClick)="expandAll()" />
          <p-button label="Collapse All" icon="pi pi-minus-circle" [outlined]="true" styleClass="text-white border-white/50 hover:bg-white/10" (onClick)="collapseAll()" />
          <p-button icon="pi pi-arrow-left" [text]="true" styleClass="text-white hover:bg-white/10" (onClick)="goBack()" />
        </div>
      </div>
    </div>

    <!-- Main Tree Container -->
    <div class="bg-surface-0 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
       <div class="p-6 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex justify-between items-center">
          <div class="flex items-center gap-2">
             <i class="pi pi-info-circle text-primary-500"></i>
             <span class="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest">Interactive Asset Explorer</span>
          </div>
          <div class="flex gap-4">
             <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <span class="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">Structures</span>
             </div>
             <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span class="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">Equipment</span>
             </div>
          </div>
       </div>

       <div class="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div *ngIf="loading" class="flex flex-col items-center justify-center py-24">
             <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
             <p class="text-surface-500 font-medium">Mapping asset relationships...</p>
          </div>

          <div *ngIf="!loading && treeData.length > 0" class="space-y-2">
             <app-tree-node 
               *ngFor="let node of treeData"
               [node]="node"
               (toggleExpand)="onNodeToggle($event)">
             </app-tree-node>
          </div>

          <div *ngIf="!loading && treeData.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
             <div class="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
                <i class="pi pi-sitemap text-4xl text-surface-400"></i>
             </div>
             <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">No Asset Structure Found</h3>
             <p class="text-surface-500 max-w-sm mx-auto">Create residences and buildings first to see the hierarchical visualization of your portfolio.</p>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  `]
})
export class HierarchicalAssetTreeComponent implements OnInit {
  treeData: TreeNode[] = [];
  loading = true;
  searchTerm = '';
  filteredNodes: TreeNode[] = [];
  
  stats = {
    residences: 0,
    buildings: 0,
    apartments: 0,
    equipment: 0,
    parking: 0
  };

  constructor(
    private residenceService: ResidenceService,
    private buildingService: BuildingService,
    private apartmentService: ApartmentService,
    private parkingSpotService: ParkingSpotService,
    private equipmentService: EquipmentService,
    private commonAreaService: CommonAreaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHierarchy();
  }

  private loadHierarchy(): void {
    this.loading = true;
    this.residenceService.getAll().subscribe({
      next: (residences: Residence[]) => {
        this.stats.residences = residences.length;
        this.treeData = residences.map(r => ({
          id: r.id,
          name: r.name,
          type: 'residence',
          icon: '🏘️',
          level: 0,
          expanded: false,
          children: []
        }));

        // Load buildings for each residence
        let loadedCount = 0;
        if (this.treeData.length === 0) {
          this.loading = false;
          return;
        }

        this.treeData.forEach(resNode => {
          this.buildingService.getByResidence(resNode.id!).subscribe({
            next: (buildings: Building[]) => {
              this.stats.buildings += buildings.length;
              resNode.children = buildings.map(b => ({
                id: b.id,
                name: b.name,
                type: 'building',
                icon: '🏢',
                level: 1,
                expanded: false,
                children: []
              }));

              // Load leaf assets for each building
              resNode.children.forEach(buildNode => {
                this.loadBuildingLeaves(buildNode);
              });

              loadedCount++;
              if (loadedCount === this.treeData.length) {
                this.loading = false;
              }
            }
          });
        });
      },
      error: () => this.loading = false
    });
  }

  private loadBuildingLeaves(buildNode: TreeNode): void {
    // Apartments
    this.apartmentService.getByBuilding(buildNode.id!).subscribe((apartments: Apartment[]) => {
      this.stats.apartments += apartments.length;
      const aptNodes: TreeNode[] = apartments.map(a => ({
        id: a.id,
        name: `Unit ${a.unitNumber}`,
        type: 'apartment',
        icon: '🏠',
        status: a.status,
        level: 2,
        children: []
      }));
      buildNode.children = [...(buildNode.children || []), ...aptNodes];
    });

    // Equipment (Building Level)
    this.equipmentService.getByBuilding(buildNode.id!).subscribe((equipment: Equipment[]) => {
      this.stats.equipment += equipment.length;
      const equipNodes: TreeNode[] = equipment.map(e => ({
        id: e.id,
        name: e.name,
        type: 'equipment',
        icon: '⚙️',
        status: e.status,
        level: 2
      }));
      buildNode.children = [...(buildNode.children || []), ...equipNodes];
    });

    // Parking Spots
    this.parkingSpotService.getByBuilding(buildNode.id!).subscribe((spots: ParkingSpot[]) => {
      this.stats.parking += spots.length;
      const spotNodes: TreeNode[] = spots.map(s => ({
        id: s.id,
        name: `Spot ${s.number}`,
        type: 'parking',
        icon: '🅿️',
        status: s.status,
        level: 2
      }));
      buildNode.children = [...(buildNode.children || []), ...spotNodes];
    });
  }

  onNodeToggle(node: TreeNode): void {
    // Logic if needed when a node is expanded
  }

  expandAll(): void {
    this.toggleAll(this.treeData, true);
  }

  collapseAll(): void {
    this.toggleAll(this.treeData, false);
  }

  private toggleAll(nodes: TreeNode[], expanded: boolean): void {
    nodes.forEach(node => {
      node.expanded = expanded;
      if (node.children) {
        this.toggleAll(node.children, expanded);
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredNodes = [];
      return;
    }
    const results: TreeNode[] = [];
    this.searchRecursive(this.treeData, this.searchTerm.toLowerCase(), results);
    this.filteredNodes = results;
  }

  private searchRecursive(nodes: TreeNode[], term: string, results: TreeNode[]): void {
    nodes.forEach(node => {
      if (node.name.toLowerCase().includes(term)) {
        results.push(node);
      }
      if (node.children) {
        this.searchRecursive(node.children, term, results);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pages/backoffice/property/analytics']);
  }
}
