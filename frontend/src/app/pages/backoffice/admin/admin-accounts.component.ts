import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PasswordModule } from 'primeng/password';
import { AdminService, AccountItem, OrgItem } from '@/app/pages/service/admin.service';
import { RoleBadgePipe } from '@/app/core/pipes/role-badge.pipe';

@Component({
    selector: 'app-admin-accounts',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, ToastModule,
        DialogModule, InputTextModule, SelectModule, TagModule, IconFieldModule,
        InputIconModule, ConfirmDialogModule, PasswordModule, RoleBadgePipe
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="card">
            <p-toast />
            <p-confirmDialog />

            <!-- Loading State -->
            <div *ngIf="loading()" class="flex items-center gap-4 mb-4">
                <i class="pi pi-spin pi-spinner text-xl text-primary"></i>
                <span class="text-surface-500 font-medium">Loading accounts...</span>
            </div>

            <div class="font-semibold text-xl mb-4">Platform Accounts</div>

            <p-table #dt [value]="accounts()" [rows]="10" [paginator]="true" [globalFilterFields]="['email','firstName','lastName','role','status']"
                     [rowHover]="true" dataKey="id" responsiveLayout="scroll" [loading]="loading()">
                <ng-template #caption>
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex gap-2">
                            <button pButton pRipple label="Add Account" icon="pi pi-user-plus" class="p-button-success" (click)="openNew()"></button>
                            <p-select [options]="filterRoles" [(ngModel)]="selectedRole" placeholder="Filter by Role" (onChange)="load()" [showClear]="true"></p-select>
                        </div>
                        <p-iconfield iconPosition="left">
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Search accounts..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="email">User <p-sortIcon field="email"></p-sortIcon></th>
                        <th pSortableColumn="role">Role <p-sortIcon field="role"></p-sortIcon></th>
                        <th>Organization</th>
                        <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                        <th>Actions</th>
                    </tr>
                </ng-template>
                <ng-template #body let-acc>
                    <tr>
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center bg-blue-100 text-blue-500 rounded-full font-bold" style="width: 2.5rem; height: 2.5rem">
                                    {{ acc.firstName?.[0] || '?' }}{{ acc.lastName?.[0] || '' }}
                                </div>
                                <div>
                                    <span class="font-bold block">{{ acc.firstName }} {{ acc.lastName }}</span>
                                    <span class="text-sm text-muted-color">{{ acc.email }}</span>
                                </div>
                            </div>
                        </td>
                        <td><p-tag [value]="acc.role | roleBadge" [severity]="getRoleSeverity(acc.role)"></p-tag></td>
                        <td>{{ getOrgName(acc.organizationId) || 'Platform Level' }}</td>
                        <td><p-tag [value]="acc.status" [severity]="getStatusSeverity(acc.status)"></p-tag></td>
                        <td>
                            <div class="flex gap-2">
                                <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" (click)="editAccount(acc)"></button>
                                <button pButton pRipple icon="pi pi-key" class="p-button-rounded p-button-warning p-button-text" (click)="requestPasswordReset(acc)" title="Reset Password"></button>
                                <button pButton pRipple [icon]="acc.status === 'ACTIVE' ? 'pi pi-ban' : 'pi pi-check-circle'" 
                                        class="p-button-rounded p-button-text" 
                                        [ngClass]="acc.status === 'ACTIVE' ? 'p-button-danger' : 'p-button-success'"
                                        (click)="toggleStatus(acc, acc.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')"></button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="5">No accounts found.</td></tr>
                </ng-template>
            </p-table>

            <p-dialog [(visible)]="dialog" [style]="{width: '550px'}" header="{{ isEdit ? 'Edit Account' : 'New Account' }}" [modal]="true">
                <ng-template pTemplate="content">
                    <div class="flex flex-col gap-4 mt-4">
                        <div class="flex flex-col gap-2">
                            <label for="email" class="font-medium text-surface-900 dark:text-surface-0">Email</label>
                            <input pInputText id="email" [(ngModel)]="form.email" class="w-full" />
                        </div>
                        <div *ngIf="!isEdit" class="flex flex-col gap-2">
                            <label for="password" class="font-medium text-surface-900 dark:text-surface-0">Initial Password</label>
                            <p-password id="password" [(ngModel)]="form.password" [toggleMask]="true" styleClass="w-full"></p-password>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="first" class="font-medium text-surface-900 dark:text-surface-0">First Name</label>
                                <input pInputText id="first" [(ngModel)]="form.firstName" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="last" class="font-medium text-surface-900 dark:text-surface-0">Last Name</label>
                                <input pInputText id="last" [(ngModel)]="form.lastName" class="w-full" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <label for="phone" class="font-medium text-surface-900 dark:text-surface-0">Phone</label>
                                <input pInputText id="phone" [(ngModel)]="form.phone" class="w-full" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="role" class="font-medium text-surface-900 dark:text-surface-0">Role</label>
                                <p-select id="role" [options]="roles" [(ngModel)]="form.role" styleClass="w-full" appendTo="body"></p-select>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2" *ngIf="!isEdit">
                            <label for="org" class="font-medium text-surface-900 dark:text-surface-0">Organization</label>
                            <p-select id="org" [options]="orgOptions()" [(ngModel)]="form.organizationId" optionLabel="label" optionValue="value" styleClass="w-full" appendTo="body"></p-select>
                        </div>

                        <ng-container *ngIf="form.role === 'TECHNICAL_STAFF' && !isEdit">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col gap-2">
                                    <label for="jobTitle" class="font-medium text-surface-900 dark:text-surface-0">Job Title</label>
                                    <input pInputText id="jobTitle" [(ngModel)]="form.jobTitle" class="w-full" />
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label for="department" class="font-medium text-surface-900 dark:text-surface-0">Department</label>
                                    <input pInputText id="department" [(ngModel)]="form.department" class="w-full" />
                                </div>
                            </div>
                        </ng-container>
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
export class AdminAccountsComponent implements OnInit {
    private svc = inject(AdminService);
    private msg = inject(MessageService);
    private confirm = inject(ConfirmationService);

    accounts = signal<AccountItem[]>([]);
    organizations = signal<OrgItem[]>([]);
    orgOptions = signal<{label: string, value: string}[]>([]);
    loading = signal(true);
    
    dialog = false;
    isEdit = false;
    form: any = {};
    
    roles = ['PLATFORM_ADMIN', 'SYNDIC_ADMIN', 'RESIDENT', 'TECHNICAL_STAFF'];
    filterRoles = [
        { label: 'All Roles', value: null },
        { label: 'Platform Admins', value: 'PLATFORM_ADMIN' },
        { label: 'Syndic Admins', value: 'SYNDIC_ADMIN' },
        { label: 'Residents', value: 'RESIDENT' },
        { label: 'Technical Staff', value: 'TECHNICAL_STAFF' }
    ];
    selectedRole: string | null = null;

    ngOnInit() {
        this.loadOrgs();
        this.load();
    }

    load() {
        this.loading.set(true);
        this.svc.getAccounts(this.selectedRole || undefined).subscribe({
            next: (d) => {
                this.accounts.set(d);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    loadOrgs() {
        this.svc.getOrganizations().subscribe(d => {
            this.organizations.set(d);
            const opts = d.map(o => ({ label: o.name, value: o.id }));
            opts.unshift({ label: 'None (Platform Level)', value: '' });
            this.orgOptions.set(opts);
        });
    }

    getOrgName(id: string): string {
        return this.organizations().find(o => o.id === id)?.name || '';
    }

    openNew() {
        this.form = { role: 'RESIDENT', password: 'Password123!' };
        this.isEdit = false;
        this.dialog = true;
    }

    editAccount(acc: AccountItem) {
        this.form = { ...acc };
        this.isEdit = true;
        this.dialog = true;
    }

    save() {
        const obs = this.isEdit
            ? this.svc.updateAccount(this.form.id, this.form)
            : this.svc.createAccount(this.form);

        obs.subscribe({
            next: () => {
                this.msg.add({ severity: 'success', summary: 'Success', detail: 'Account saved' });
                this.dialog = false;
                this.load();
            },
            error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Failed' })
        });
    }

    toggleStatus(acc: AccountItem, status: string) {
        this.svc.updateAccountStatus(acc.id, status).subscribe({
            next: () => {
                this.msg.add({ severity: 'success', summary: 'Status Updated' });
                this.load();
            },
            error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Failed' })
        });
    }

    requestPasswordReset(acc: AccountItem) {
        this.confirm.confirm({
            message: 'Are you sure you want to force a password reset to Reset123! for this user?',
            header: 'Confirm Password Reset',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.svc.resetPassword(acc.id, 'Reset123!').subscribe({
                    next: () => {
                        this.msg.add({ severity: 'success', summary: 'Password Reset', detail: 'Password set to Reset123!' });
                    },
                    error: (e) => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to reset password' })
                });
            }
        });
    }

    getRoleSeverity(role: string): any {
        switch (role) {
            case 'PLATFORM_ADMIN': return 'danger';
            case 'SYNDIC_ADMIN': return 'warn';
            case 'TECHNICAL_STAFF': return 'info';
            case 'RESIDENT': return 'success';
            default: return 'secondary';
        }
    }

    getStatusSeverity(status: string): any {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'SUSPENDED': return 'danger';
            case 'PENDING': return 'warn';
            default: return 'secondary';
        }
    }
}
