import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DataCacheService } from '@/app/core/services/data-cache.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule],
    template: `
        <div class="grid grid-cols-12 gap-6" *ngIf="data()">
            
            <!-- Hero Header -->
            <div class="col-span-12">
                <div class="card p-8 mb-2 border border-surface-200 dark:border-surface-700 relative overflow-hidden flex items-center justify-between group bg-surface-0 dark:bg-surface-900 shadow-sm hover:shadow-md transition-shadow">
                    <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div class="absolute right-20 bottom-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:-translate-x-10 transition-transform duration-1000"></div>
                    <div class="relative z-10 w-full">
                        <div class="text-surface-500 dark:text-surface-400 font-medium mb-3 uppercase tracking-widest text-xs flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" [ngClass]="loading() ? 'bg-orange-500' : 'bg-green-500 animate-pulse'"></span> 
                            {{ loading() ? 'SYNCHRONIZING SECURE TUNNEL...' : 'LOCAL SYNDICATE ACTIVE' }}
                        </div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-extrabold mb-1 mt-0 tracking-tight">{{ data()?.organizationName || 'Syndicate Hub' }}</h1>
                        <div class="flex flex-wrap gap-2 mt-2 mb-3">
                            <p-tag *ngFor="let res of data()?.residenceNames" [value]="res" severity="info" [rounded]="true" icon="pi pi-home"></p-tag>
                            <p-tag *ngFor="let bld of data()?.buildingNames" [value]="bld" severity="secondary" [rounded]="true" icon="pi pi-building"></p-tag>
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 m-0 max-w-xl leading-relaxed">Central command for unified building management, financial ledgers, and resident tracking.</p>
                    </div>
                </div>
            </div>

            <!-- Primary KPIs -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-blue-50 dark:bg-blue-900/20 shadow-sm hover:shadow-lg border border-blue-100 dark:border-blue-800/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex justify-between mb-4">
                        <div>
                            <span class="block text-blue-500 font-medium mb-2 uppercase tracking-wider text-xs">Managed Operations</span>
                            <div class="text-blue-900 dark:text-blue-100 font-bold text-3xl">
                                {{ data()?.totalBuildings || 0 }} <span class="text-xl font-medium">Bldgs</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 rounded-xl" style="width: 3rem; height: 3rem">
                            <i class="pi pi-building text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 mt-4 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <span class="bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-bold">{{ data()?.totalApartments || 0 }}</span>
                        <span>Total Operational Units</span>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-green-50 dark:bg-green-900/20 shadow-sm hover:shadow-lg border border-green-100 dark:border-green-800/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex justify-between mb-4">
                        <div>
                            <span class="block text-green-500 font-medium mb-2 uppercase tracking-wider text-xs">Active Residents</span>
                            <div class="text-green-900 dark:text-green-100 font-bold text-3xl">
                                {{ data()?.totalResidents || 0 }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-xl" style="width: 3rem; height: 3rem">
                            <i class="pi pi-users text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 mt-4 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <span class="bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-md font-bold">{{ data()?.totalTenants || 0 }} tenants</span>
                        <span>&bull;</span>
                        <span class="bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-md font-bold">{{ data()?.totalOwners || 0 }} owners</span>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-orange-50 dark:bg-orange-900/20 shadow-sm hover:shadow-lg border border-orange-100 dark:border-orange-800/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex justify-between mb-4">
                        <div>
                            <span class="block text-orange-500 font-medium mb-2 uppercase tracking-wider text-xs">Total Charged</span>
                            <div class="text-orange-900 dark:text-orange-100 font-bold text-3xl">
                                {{ data()?.totalCharged | number:'1.2-2' }} <span class="text-lg font-medium opacity-80">TND</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 rounded-xl" style="width: 3rem; height: 3rem">
                            <i class="pi pi-receipt text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 mt-4 text-sm text-surface-600 dark:text-surface-400">
                        Gross invoices issued
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-red-50 dark:bg-red-900/20 shadow-sm hover:shadow-lg border border-red-100 dark:border-red-800/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex justify-between mb-4">
                        <div>
                            <span class="block text-red-500 font-medium mb-2 uppercase tracking-wider text-xs">Overdue Balance</span>
                            <div class="text-red-900 dark:text-red-100 font-bold text-3xl">
                                {{ data()?.totalOverdue | number:'1.2-2' }} <span class="text-lg font-medium opacity-80">TND</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-800/50 rounded-xl" style="width: 3rem; height: 3rem">
                            <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 mt-4 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <span class="bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 px-2 py-1 rounded-md font-bold">{{ data()?.overdueChargesCount || 0 }}</span>
                        <span>unpaid charges</span>
                    </div>
                </div>
            </div>

            <!-- Detailed Breakdown -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card mb-0 h-full bg-teal-50 dark:bg-teal-900/20 shadow-sm border border-teal-100 dark:border-teal-800/30 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div class="absolute -left-10 -top-10 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                    <div class="relative z-10 flex justify-between items-center mb-6">
                        <div>
                            <span class="block text-teal-600 font-medium mb-1 uppercase tracking-wider text-xs">Financial Collection</span>
                            <div class="text-teal-900 dark:text-teal-100 font-bold text-3xl">
                                {{ data()?.collectionRate || 0 }}% <span class="text-lg font-medium text-teal-600 dark:text-teal-400">Success Rate</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-teal-100 dark:bg-teal-900/40 rounded-xl" style="width: 3.5rem; height: 3.5rem">
                            <i class="pi pi-chart-pie text-teal-600 dark:text-teal-400 text-2xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 w-full bg-surface-200 dark:bg-surface-700 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
                        <div class="absolute top-0 left-0 h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out" 
                             [style.width.%]="data()?.collectionRate || 0"></div>
                    </div>
                    <div class="relative z-10 grid grid-cols-2 gap-4">
                        <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div class="text-surface-500 text-xs uppercase tracking-wider mb-1">Total Collected</div>
                            <div class="text-green-500 font-bold text-xl">{{ data()?.totalCollected | number:'1.2-2' }} TND</div>
                        </div>
                        <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div class="text-surface-500 text-xs uppercase tracking-wider mb-1">Global Actual Expenses</div>
                            <div class="text-red-500 font-bold text-xl">{{ data()?.totalExpenses | number:'1.2-2' }} TND</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-6">
                <div class="card h-full shadow-sm hover:shadow-md transition-shadow bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                    <div class="font-bold text-xl mb-6 text-surface-900 dark:text-surface-0 flex items-center gap-2">
                        <i class="pi pi-list text-primary"></i> Global Operations Ledger
                    </div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none flex flex-col gap-6">
                        <li>
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium text-surface-700 dark:text-surface-300">Total Rent & Charges Invoiced</span>
                                <span class="text-surface-900 dark:text-surface-0 font-bold bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-xl">{{ data()?.totalCharged | number:'1.2-2' }} TND</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                <div class="bg-primary-500 h-full rounded-full" style="width: 100%"></div>
                            </div>
                        </li>
                        <li>
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium text-surface-700 dark:text-surface-300">Total Realized Utility Expenses</span>
                                <span class="text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-xl">{{ data()?.totalExpenses | number:'1.2-2' }} TND</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                <div class="bg-red-500 h-full rounded-full transition-all duration-1000" [style.width.%]="(data()?.totalExpenses / (data()?.totalCharged || 1)) * 100"></div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card h-full shadow-sm overflow-hidden bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 p-0">
                    <div class="p-6 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/20">
                        <div class="font-bold text-xl text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <i class="pi pi-history text-primary"></i> Recent Overdue Alerts & Actions Timeline
                        </div>
                    </div>
                    
                    @if (data()?.recentOverdueCharges?.length === 0) {
                        <div class="flex flex-col items-center justify-center py-12 px-4">
                            <div class="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                <i class="pi pi-check text-green-500 text-3xl"></i>
                            </div>
                            <span class="text-surface-600 dark:text-surface-400 font-medium text-lg text-center">No recent overdue charges!<br>Perfect collection rate maintained.</span>
                        </div>
                    } @else {
                        <div class="p-4 max-h-[450px] overflow-y-auto">
                            <ul class="p-0 mx-0 mt-0 mb-0 list-none flex flex-col gap-3">
                                @for (charge of data()?.recentOverdueCharges; track charge) {
                                    <li class="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all duration-200 group">
                                        <div class="flex items-center gap-4">
                                            <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                                                <i class="pi pi-exclamation-circle text-red-500"></i>
                                            </div>
                                            <div>
                                                <span class="block text-surface-900 dark:text-surface-0 font-bold mb-1">{{charge.label}}</span>
                                                <div class="text-sm text-surface-500 flex items-center gap-2">
                                                    <i class="pi pi-calendar text-xs"></i> Due: {{ charge.dueDate }} 
                                                    <span class="text-surface-300">&bull;</span>
                                                    <i class="pi pi-user text-xs"></i> {{charge.residentName}} (Apt {{charge.apartmentNumber}})
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="text-right flex flex-col items-end">
                                                <span class="font-bold text-red-500 text-lg">{{charge.amount | number:'1.2-2'}} TND</span>
                                            </div>
                                            <p-tag value="Finance Review" severity="danger" [rounded]="true"></p-tag>
                                        </div>
                                    </li>
                                }
                            </ul>
                        </div>
                    }
                </div>
            </div>
        </div>

        <div *ngIf="!data()" class="flex flex-col justify-center items-center h-96 gap-4">
            <div class="w-16 h-16 border-4 border-surface-200 border-t-primary-500 rounded-full animate-spin"></div>
            <div class="text-surface-500 font-medium tracking-widest uppercase text-sm animate-pulse">Initializing Secure Uplink</div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private http = inject(HttpClient);
    private cacheService = inject(DataCacheService);
    
    data = signal<any>(null);
    loading = signal<boolean>(true);

    ngOnInit() {
        this.fetchDashboard();
    }

    private fetchDashboard() {
        // Only show loading spinner on first visit (when no data exists yet)
        if (!this.data()) {
            this.loading.set(true);
        }

        this.cacheService.getOrFetch(
            'syndic:dashboard',
            () => this.http.get<any>('http://localhost:8089/api/v1/syndic/dashboard'),
            3 * 60 * 1000 // 3 minutes
        ).subscribe({
            next: (res) => {
                this.data.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load dashboard:', err);
                this.loading.set(false);
            }
        });
    }
}
