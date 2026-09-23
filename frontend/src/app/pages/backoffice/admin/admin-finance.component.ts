import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '@/app/pages/service/admin.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-finance',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, IconFieldModule, InputIconModule, InputTextModule],
    template: `
        <!-- Loading skeleton -->
        <div *ngIf="loading()" class="grid grid-cols-12 gap-4">
            <div *ngFor="let i of [1,2,3,4]" class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 animate-pulse">
                    <div class="flex justify-between mb-4">
                        <div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-4 w-32 rounded mb-4"></div>
                            <div class="bg-surface-200 dark:bg-surface-700 h-6 w-24 rounded"></div>
                        </div>
                        <div class="bg-surface-200 dark:bg-surface-700 rounded-border" style="width: 2.5rem; height: 2.5rem"></div>
                    </div>
                </div>
            </div>
        </div>

        <div *ngIf="summary()" class="grid grid-cols-12 gap-4 mb-4">
            <!-- Pending -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-red-50 dark:bg-red-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-red-500 font-medium mb-4">Pending Charges</span>
                            <div class="text-red-900 dark:text-red-100 font-medium text-xl">{{ summary()!.totalCharged - summary()!.totalCollected | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-red-100 dark:bg-red-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-receipt text-red-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">Awaiting payment</span>
                </div>
            </div>
            
            <!-- Collected -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-green-50 dark:bg-green-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-green-500 font-medium mb-4">Total Collected</span>
                            <div class="text-green-900 dark:text-green-100 font-medium text-xl">{{ summary()!.totalCollected | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-green-100 dark:bg-green-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-wallet text-green-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">Payments confirmed</span>
                </div>
            </div>

            <!-- Expenses -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-orange-50 dark:bg-orange-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-orange-500 font-medium mb-4">Total Expenses</span>
                            <div class="text-orange-900 dark:text-orange-100 font-medium text-xl">{{ summary()!.totalExpenses | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-shopping-cart text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">Platform-wide costs</span>
                </div>
            </div>

            <!-- Net Revenue -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 bg-blue-50 dark:bg-blue-900/20">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-blue-500 font-medium mb-4">Net Revenue</span>
                            <div class="text-blue-900 dark:text-blue-100 font-medium text-xl">{{ summary()!.netRevenue | number:'1.3-3' }} TND</div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-chart-line text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-surface-500 dark:text-surface-400">After platform expenses</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4" *ngIf="summary()">
            <!-- All Charges -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">All Platform Charges</div>
                <p-table #dtCharges [value]="summary()!.charges" [rows]="5" [paginator]="true" [globalFilterFields]="['title','organizationId', 'status']" [rowHover]="true" responsiveLayout="scroll">
                    <ng-template #caption>
                        <div class="flex justify-end mb-2">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText type="text" (input)="dtCharges.filterGlobal($any($event.target).value, 'contains')" placeholder="Search charges..." />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="title">Title <p-sortIcon field="title"></p-sortIcon></th>
                            <th pSortableColumn="amount">Amount <p-sortIcon field="amount"></p-sortIcon></th>
                            <th pSortableColumn="organizationId">Org ID <p-sortIcon field="organizationId"></p-sortIcon></th>
                            <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-charge>
                        <tr>
                            <td class="font-bold">{{ charge.title }}</td>
                            <td class="text-primary font-medium">{{ charge.amount | number:'1.3-3' }} TND</td>
                            <td class="text-muted-color">{{ charge.organizationId }}</td>
                            <td><p-tag [value]="charge.status" [severity]="charge.status === 'PAID' ? 'success' : charge.status === 'PARTIAL' ? 'warn' : 'danger'"></p-tag></td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>

            <!-- All Expenses -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">All Platform Expenses</div>
                <p-table #dtExpenses [value]="summary()!.expenses" [rows]="5" [paginator]="true" [globalFilterFields]="['title','organizationId', 'status']" [rowHover]="true" responsiveLayout="scroll">
                    <ng-template #caption>
                        <div class="flex justify-end mb-2">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText type="text" (input)="dtExpenses.filterGlobal($any($event.target).value, 'contains')" placeholder="Search expenses..." />
                            </p-iconfield>
                        </div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th pSortableColumn="title">Title <p-sortIcon field="title"></p-sortIcon></th>
                            <th pSortableColumn="amount">Amount <p-sortIcon field="amount"></p-sortIcon></th>
                            <th pSortableColumn="organizationId">Org ID <p-sortIcon field="organizationId"></p-sortIcon></th>
                            <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-exp>
                        <tr>
                            <td class="font-bold">{{ exp.title }}</td>
                            <td class="text-primary font-medium">{{ exp.amount | number:'1.3-3' }} TND</td>
                            <td class="text-muted-color">{{ exp.organizationId }}</td>
                            <td><p-tag [value]="exp.status" [severity]="exp.status === 'APPROVED' ? 'success' : exp.status === 'PENDING' ? 'warn' : 'danger'"></p-tag></td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class AdminFinanceComponent implements OnInit {
    summary = signal<any>(null);
    loading = signal(true);
    private svc = inject(AdminService);

    ngOnInit() {
        this.svc.getFinanceSummary().subscribe({
            next: (d) => {
                this.summary.set(d);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
