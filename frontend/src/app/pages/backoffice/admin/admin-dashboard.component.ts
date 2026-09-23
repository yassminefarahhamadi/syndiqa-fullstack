import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AdminService, DashboardStats } from '@/app/pages/service/admin.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule],
    template: `
        <!-- Loading Skeleton -->
        <div *ngIf="loading()" class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
                <div class="card mb-0">
                    <div class="flex items-center gap-4">
                        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
                        <div>
                            <div class="text-surface-500 font-medium uppercase tracking-wide text-sm">SYNCHRONIZING</div>
                            <div class="text-surface-900 dark:text-surface-0 font-bold text-xl mt-1">Loading Platform Telemetry...</div>
                        </div>
                    </div>
                </div>
            </div>
            <div *ngFor="let i of [1,2,3,4]" class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 animate-pulse">
                    <div class="flex justify-between mb-4">
                        <div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-4 w-32 rounded mb-3"></div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-7 w-20 rounded"></div>
                        </div>
                        <div class="bg-surface-200 dark:bg-surface-700 rounded-border" style="width: 2.5rem; height: 2.5rem"></div>
                    </div>
                    <div class="bg-surface-200 dark:bg-surface-700 h-4 w-24 rounded"></div>
                </div>
            </div>
        </div>

        <!-- Live Data -->
        <div *ngIf="stats()" class="grid grid-cols-12 gap-4">
            
            <!-- Hero Header -->
            <div class="col-span-12">
                <div class="card mb-0 flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                        <div class="text-surface-500 dark:text-surface-400 font-medium mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> GLOBAL SYSTEM HEALTH
                        </div>
                        <h1 class="text-3xl text-surface-900 dark:text-surface-0 font-bold mb-1 mt-0">Platform Oversight</h1>
                        <p class="text-surface-600 dark:text-surface-400 m-0">Central aggregated metrics for global infrastructure.</p>
                    </div>
                </div>
            </div>

            <!-- Primary KPIs -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-blue-50 dark:bg-blue-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-blue-500 font-medium mb-3">Total Active Syndicates</span>
                            <div class="text-blue-900 dark:text-blue-100 font-medium text-2xl">{{ stats()!.totalOrganizations }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-building text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">Active Tenants </span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-green-50 dark:bg-green-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-green-500 font-medium mb-3">Active Tenants</span>
                            <div class="text-green-900 dark:text-green-100 font-medium text-2xl">{{ stats()!.totalAccounts }}</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-users text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">{{ stats()!.activeAccounts }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> active, </span>
                    <span class="text-red-500 font-medium">{{ stats()!.suspendedAccounts }}</span>
                    <span class="text-surface-500 dark:text-surface-400"> suspended</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-orange-50 dark:bg-orange-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-orange-500 font-medium mb-3">Total Collected</span>
                            <div class="text-orange-900 dark:text-orange-100 font-medium text-2xl">{{ stats()!.totalCollected | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-dollar text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">Platform-wide aggregate</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-purple-50 dark:bg-purple-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-purple-500 font-medium mb-3">Aggregate Revenue</span>
                            <div class="text-purple-900 dark:text-purple-100 font-medium text-2xl">{{ stats()!.netRevenue | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-chart-line text-purple-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">After platform expenses</span>
                </div>
            </div>

            <!-- Detailed Breakdown -->
            <div class="col-span-12 xl:col-span-4">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Role Distribution</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Syndic Admins</span>
                                <span class="text-surface-500">{{ stats()!.totalSyndicAdmins }}</span>
                            </span>
                        </li>
                        <li class="flex items-center py-3 border-b border-surface-200 dark:border-surface-700">
                            <div class="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Residents</span>
                                <span class="text-surface-500">{{ stats()!.totalResidents }}</span>
                            </span>
                        </li>
                        <li class="flex items-center py-3">
                            <div class="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            <span class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center">
                                <span class="font-medium">Technical Staff</span>
                                <span class="text-surface-500">{{ stats()!.totalStaff }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Financial Ledger</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center flex-col py-2">
                            <div class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center mb-2">
                                <span class="font-medium">Gross Billing</span>
                                <span class="text-surface-900 dark:text-surface-0 font-bold">{{ stats()!.totalChargeAmount | number:'1.3-3' }} TND</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-border h-2 mb-4">
                                <div class="bg-primary-500 h-full rounded-border" style="width: 100%"></div>
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 w-full flex justify-between items-center mb-2">
                                <span class="font-medium">Gross Expenses</span>
                                <span class="text-red-500 font-bold">{{ stats()!.totalExpenseAmount | number:'1.3-3' }} TND</span>
                            </div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-border h-2">
                                <div class="bg-red-500 h-full rounded-border" style="width: 100%"></div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-4">
                <div class="card">
                    <div class="font-semibold text-xl mb-4">Infrastructure Logs</div>
                    <ul class="p-0 mx-0 mt-0 mb-0 list-none">
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Registered Leases</span>
                            <p-tag [value]="stats()!.totalLeases.toString()" severity="info"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Charges Issued</span>
                            <p-tag [value]="stats()!.totalCharges.toString()" severity="success"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3 border-b border-surface-200 dark:border-surface-700">
                            <span class="text-surface-700 dark:text-surface-300">Payments Validated</span>
                            <p-tag [value]="stats()!.totalPayments.toString()" severity="success"></p-tag>
                        </li>
                        <li class="flex items-center justify-between py-3">
                            <span class="text-surface-700 dark:text-surface-300">Maintenance Ops</span>
                            <p-tag [value]="stats()!.totalMaintenanceRequests.toString()" severity="warn"></p-tag>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `
})
export class AdminDashboardComponent implements OnInit {
    private adminService = inject(AdminService);
    
    stats = signal<DashboardStats | null>(null);
    loading = signal(true);

    ngOnInit() {
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
                this.stats.set(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load dashboard', err);
                this.loading.set(false);
            }
        });
    }
}
