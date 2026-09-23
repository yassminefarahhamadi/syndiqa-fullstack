import { Component, OnInit, inject, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AdminService, OrgItem } from '@/app/pages/service/admin.service';

@Component({
    selector: 'app-admin-organizations',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, DialogModule, InputTextModule, SelectModule, TagModule, IconFieldModule, InputIconModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card">
            <p-toast />
            <p-confirmDialog />

            <div class="font-semibold text-xl mb-4">Organizations</div>

            <p-table #dt [value]="organizations()" [rows]="10" [paginator]="true" [globalFilterFields]="['name','city','status']"
                     [rowHover]="true" dataKey="id" responsiveLayout="scroll" [loading]="loading()">
                <ng-template #caption>
                    <div class="flex justify-between items-center mb-4">
                        <button pButton pRipple label="New" icon="pi pi-plus" class="p-button-success" (click)="openNew()"></button>
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Search..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th pSortableColumn="city">City <p-sortIcon field="city"></p-sortIcon></th>
                        <th>Plan</th>
                        <th>Members</th>
                        <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                        <th>Actions</th>
                    </tr>
                </ng-template>
                <ng-template #body let-org>
                    <tr>
                        <td>
                            <span class="font-bold block">{{ org.name }}</span>
                            <span class="text-sm text-muted-color">{{ org.address }}</span>
                        </td>
                        <td>{{ org.city }}</td>
                        <td><p-tag [value]="org.subscriptionPlan" severity="info"></p-tag></td>
                        <td>{{ org.memberAccountIds?.length || 0 }}</td>
                        <td><p-tag [value]="org.status" [severity]="org.status === 'ACTIVE' ? 'success' : 'danger'"></p-tag></td>
                        <td>
                            <div class="flex gap-2">
                                <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" (click)="editOrg(org)"></button>
                                <button pButton pRipple icon="pi pi-power-off" class="p-button-rounded p-button-text" [ngClass]="org.status === 'ACTIVE' ? 'p-button-danger' : 'p-button-success'" (click)="toggleStatus(org)"></button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="6">No organizations found.</td></tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="dialog" [style]="{width: '450px'}" header="{{ isEdit ? 'Edit Organization' : 'New Organization' }}" [modal]="true">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4 mt-4">
                        <div class="flex flex-col gap-2">
                            <label for="name" class="font-medium text-surface-900 dark:text-surface-0">Name</label>
                            <input type="text" pInputText id="name" [(ngModel)]="form.name" class="w-full" required autofocus />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="address" class="font-medium text-surface-900 dark:text-surface-0">Address</label>
                            <input type="text" pInputText id="address" [(ngModel)]="form.address" class="w-full" required />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="city" class="font-medium text-surface-900 dark:text-surface-0">City</label>
                                <input type="text" pInputText id="city" [(ngModel)]="form.city" class="w-full" required />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="plan" class="font-medium text-surface-900 dark:text-surface-0">Subscription Plan</label>
                                <p-select id="plan" [options]="plans" [(ngModel)]="form.subscriptionPlan" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                        </div>
                    </div>
                </ng-template>

                <ng-template pTemplate="footer">
                    <button pButton pRipple label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="dialog = false"></button>
                    <button pButton pRipple label="Save" icon="pi pi-check" class="p-button-primary" (click)="save()"></button>
                </ng-template>
            </p-dialog>
        </div>
    `
})
export class AdminOrganizationsComponent implements OnInit {
    private svc = inject(AdminService);
    private msg = inject(MessageService);

    organizations = signal<OrgItem[]>([]);
    loading = signal(true);
    dialog = false;
    isEdit = false;
    form: any = {};
    plans = ['BASIC', 'PRO', 'ENTERPRISE'];

    ngOnInit() { this.load(); }

    load() { 
        this.loading.set(true);
        this.svc.getOrganizations().subscribe({
            next: (d) => {
                this.organizations.set(d);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        }); 
    }

    openNew() { this.form = { subscriptionPlan: 'BASIC' }; this.isEdit = false; this.dialog = true; }

    editOrg(org: OrgItem) { this.form = { ...org }; this.isEdit = true; this.dialog = true; }

    save() {
        const obs = this.isEdit
            ? this.svc.updateOrganization(this.form.id, this.form)
            : this.svc.createOrganization(this.form);
        obs.subscribe({
            next: () => { 
                this.msg.add({ severity: 'success', summary: 'Success', detail: this.isEdit ? 'Organization updated' : 'Organization created' }); 
                this.dialog = false; 
                this.load(); 
            },
            error: (e: any) => this.msg.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Operation failed' })
        });
    }

    toggleStatus(org: OrgItem) {
        const next = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        this.svc.updateOrgStatus(org.id, next).subscribe({
            next: () => { 
                this.msg.add({ severity: 'success', summary: 'Status Updated' }); 
                this.load(); 
            },
            error: (e: any) => this.msg.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Failed' })
        });
    }
}
