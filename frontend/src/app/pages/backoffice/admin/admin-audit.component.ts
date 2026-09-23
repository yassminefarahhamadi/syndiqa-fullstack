import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService, AuditLogItem } from '@/app/pages/service/admin.service';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-audit',
    standalone: true,
    imports: [CommonModule, TableModule, IconFieldModule, InputIconModule, InputTextModule],
    providers: [DatePipe],
    template: `
        <div class="card">
            <div class="font-semibold text-xl mb-4">Platform Audit Logs</div>
            <p class="text-muted-color mb-4">Immutable record of all system actions</p>
            
            <p-table #dt [value]="logs()" [rows]="15" [paginator]="true" [globalFilterFields]="['action','accountId','ip']" [rowHover]="true" responsiveLayout="scroll" [loading]="loading()">
                <ng-template #caption>
                    <div class="flex justify-end mb-2">
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Search logs..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="timestamp">Timestamp <p-sortIcon field="timestamp"></p-sortIcon></th>
                        <th pSortableColumn="accountId">Account ID <p-sortIcon field="accountId"></p-sortIcon></th>
                        <th pSortableColumn="action">Action <p-sortIcon field="action"></p-sortIcon></th>
                        <th pSortableColumn="ip">IP Address <p-sortIcon field="ip"></p-sortIcon></th>
                        <th>User Agent</th>
                    </tr>
                </ng-template>
                <ng-template #body let-log>
                    <tr>
                        <td class="font-mono text-sm whitespace-nowrap">{{ log.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                        <td class="font-mono text-primary">{{ log.accountId }}</td>
                        <td><span class="font-medium bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">{{ log.action }}</span></td>
                        <td class="text-muted-color">{{ log.ip }}</td>
                        <td class="text-sm truncate max-w-xs" [title]="log.userAgent">{{ log.userAgent }}</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="5">No audit logs found.</td></tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class AdminAuditComponent implements OnInit {
    logs = signal<AuditLogItem[]>([]);
    loading = signal(true);
    private svc = inject(AdminService);

    ngOnInit() {
        this.svc.getAuditLogs().subscribe({
            next: (d) => {
                this.logs.set(d);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
