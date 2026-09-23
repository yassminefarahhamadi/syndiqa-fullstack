import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AuthService } from '../../../core/auth/auth.service';
import { OrganizationActivityComponent } from './organization-activity.component';


// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Residence {
    id: string;
    name: string;
    address: string;
    city: string;
}

export interface Account {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    status: string;
}

export interface Organization {
    id?: string;
    name: string;
    address: string;
    city: string;
    managerAccountId: string;
    memberAccountIds: string[];
    buildingIds: string[];
    subscriptionPlan: 'BASIC' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'SUSPENDED';
    createdAt?: string;
}

@Component({
    selector: 'app-organization-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DataViewModule,
        ButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        MultiSelectModule,
        ToastModule,
        SelectButtonModule,
        OrganizationActivityComponent
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="flex flex-col gap-6">

            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold text-2xl">Organisations</div>
                    <p class="text-surface-500 dark:text-surface-400 text-sm mt-1">
                        {{ organizations.length }} organisation(s) enregistrée(s)
                    </p>
                </div>
                <p-button
                    *ngIf="!isResident"
                    label="Ajouter une organisation"
                    icon="pi pi-plus"
                    (onClick)="openAddDialog()">
                </p-button>
            </div>

            <!-- DataView card -->
            <div class="card">
                <p-dataview [value]="filteredOrganizations" [layout]="layout">

                    <ng-template #header>
                        <div class="flex flex-col gap-3">
                            <!-- Ligne 1 : titre + toggle -->
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-xl">
                                    Liste des organisations
                                    <span class="text-sm font-normal text-surface-400 ml-2">
                                        ({{ filteredOrganizations.length }} / {{ organizations.length }})
                                    </span>
                                </span>
                                <p-select-button [(ngModel)]="layout" [options]="layoutOptions" [allowEmpty]="false">
                                    <ng-template #item let-option>
                                        <i class="pi" [ngClass]="{ 'pi-bars': option === 'list', 'pi-table': option === 'grid' }"></i>
                                    </ng-template>
                                </p-select-button>
                            </div>
                            <!-- Ligne 2 : recherche + filtres -->
                            <div class="flex flex-wrap gap-2 items-center">
                                <div class="relative flex-1 min-w-48">
                                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
                                    <input pInputText
                                        [(ngModel)]="searchTerm"
                                        placeholder="Rechercher par nom, ville, adresse, manager..."
                                        class="w-full pl-9 text-sm" />
                                </div>
                                <p-select
                                    [(ngModel)]="filterStatus"
                                    [options]="[{ label: 'Tous les statuts', value: null }, { label: 'Active', value: 'ACTIVE' }, { label: 'Suspendue', value: 'SUSPENDED' }]"
                                    optionLabel="label"
                                    optionValue="value"
                                    [style]="{ minWidth: '160px' }"
                                    placeholder="Statut">
                                </p-select>
                                <p-select
                                    [(ngModel)]="filterPlan"
                                    [options]="[{ label: 'Tous les plans', value: null }, { label: 'Basic', value: 'BASIC' }, { label: 'Pro', value: 'PRO' }, { label: 'Enterprise', value: 'ENTERPRISE' }]"
                                    optionLabel="label"
                                    optionValue="value"
                                    [style]="{ minWidth: '160px' }"
                                    placeholder="Plan">
                                </p-select>
                                <p-button
                                    *ngIf="searchTerm || filterStatus || filterPlan"
                                    icon="pi pi-times"
                                    label="Effacer"
                                    severity="secondary"
                                    [outlined]="true"
                                    size="small"
                                    (onClick)="clearFilters()">
                                </p-button>
                            </div>
                        </div>
                    </ng-template>

                    <!-- ── LIST VIEW ── -->
                    <ng-template #list let-items>
                        <div class="flex flex-col">
                            <div *ngFor="let org of items; let i = index">
                                <div
                                    class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    [ngClass]="{ 'border-t border-surface': i !== 0 }">

                                    <div class="md:w-16 flex items-center justify-center">
                                        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-building text-2xl text-primary"></i>
                                        </div>
                                    </div>

                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-4">
                                        <div class="flex flex-col gap-1">
                                            <div class="text-lg font-semibold">{{ org.name }}</div>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-map-marker mr-1"></i>{{ org.address }}, {{ org.city }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-user mr-1"></i>Manager : {{ getManagerName(org.managerAccountId) }}
                                            </span>
                                        </div>

                                        <div class="flex flex-col md:items-end gap-3">
                                            <div class="flex gap-2 flex-wrap justify-end">
                                                <p-tag [value]="org.status" [severity]="getStatusSeverity(org.status)"></p-tag>
                                                <p-tag [value]="org.subscriptionPlan" severity="info"></p-tag>
                                            </div>
                                            <div class="flex gap-3 text-sm text-surface-500">
                                                <span><i class="pi pi-users mr-1"></i>{{ org.memberAccountIds.length }} membres</span>
                                                <span><i class="pi pi-home mr-1"></i>{{ org.buildingIds.length }} résidence(s)</span>
                                            </div>
                                            <div class="flex gap-2">
                                                <p-button icon="pi pi-eye" severity="info" [outlined]="true" size="small" (onClick)="openDetailsDialog(org)"></p-button>
                                                <p-button icon="pi pi-history" severity="secondary" [outlined]="true" size="small" pTooltip="Journal d'activité" (onClick)="openActivitiesDialog(org)"></p-button>
                                                <p-button *ngIf="!isResident" icon="pi pi-pencil" [outlined]="true" size="small" (onClick)="openEditDialog(org)"></p-button>
                                                <p-button *ngIf="!isResident" icon="pi pi-trash" severity="danger" [outlined]="true" size="small" (onClick)="deleteOrganization(org)"></p-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="organizations.length === 0" class="p-10 text-center text-surface-400">
                                <i class="pi pi-building text-4xl mb-3 block"></i>
                                Aucune organisation trouvée.
                            </div>
                        </div>
                    </ng-template>

                    <!-- ── GRID VIEW ── -->
                    <ng-template #grid let-items>
                        <div class="grid grid-cols-12 gap-4">
                            <div *ngFor="let org of items" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col gap-4">

                                    <div class="flex items-center justify-between">
                                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-building text-xl text-primary"></i>
                                        </div>
                                        <div class="flex gap-2">
                                            <p-tag [value]="org.status" [severity]="getStatusSeverity(org.status)"></p-tag>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="text-lg font-semibold">{{ org.name }}</div>
                                        <span class="text-surface-500 dark:text-surface-400 text-sm">
                                            <i class="pi pi-map-marker mr-1"></i>{{ org.city }}
                                        </span>
                                    </div>

                                    <div class="flex flex-col gap-2 text-sm text-surface-600 dark:text-surface-300">
                                        <div><i class="pi pi-map mr-2 text-surface-400"></i>{{ org.address }}</div>
                                        <div><i class="pi pi-user mr-2 text-surface-400"></i>{{ getManagerName(org.managerAccountId) }}</div>
                                        <div><i class="pi pi-users mr-2 text-surface-400"></i>{{ org.memberAccountIds.length }} membre(s)</div>
                                        <div><i class="pi pi-home mr-2 text-surface-400"></i>{{ org.buildingIds.length }} résidence(s)</div>
                                    </div>

                                    <div class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <p-tag [value]="org.subscriptionPlan" severity="info"></p-tag>
                                        <div class="flex gap-2">
                                            <p-button icon="pi pi-eye" severity="info" [outlined]="true" size="small" (onClick)="openDetailsDialog(org)"></p-button>
                                            <p-button icon="pi pi-history" severity="secondary" [outlined]="true" size="small" (onClick)="openActivitiesDialog(org)"></p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-pencil" [outlined]="true" size="small" (onClick)="openEditDialog(org)"></p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-trash" severity="danger" [outlined]="true" size="small" (onClick)="deleteOrganization(org)"></p-button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="organizations.length === 0" class="col-span-12 p-10 text-center text-surface-400">
                                <i class="pi pi-building text-4xl mb-3 block"></i>
                                Aucune organisation trouvée.
                            </div>
                        </div>
                    </ng-template>

                </p-dataview>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             DIALOG — FICHE DE SYNDICAT (style document officiel)
             ══════════════════════════════════════════════════════════ -->
        <p-dialog
            [(visible)]="detailsVisible"
            [modal]="true"
            [closable]="true"
            [style]="{ width: '860px', maxWidth: '98vw' }"
            [contentStyle]="{ padding: '0', background: '#f0ece4' }"
            header=" ">

            <ng-container *ngIf="selectedOrg">
                <!-- FEUILLE DOCUMENT -->
                <div style="background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,0.18);margin:24px;padding:60px 64px;font-family:Georgia,serif;color:#1a1208;position:relative;overflow:hidden;">

                    <!-- Filigrane -->
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:90px;font-weight:900;color:rgba(0,0,0,0.03);white-space:nowrap;pointer-events:none;user-select:none;letter-spacing:8px;">CLOUD4SAYA</div>

                    <!-- EN-TÊTE -->
                    <div style="text-align:center;margin-bottom:36px;">
                        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:10px;">Gestion de Copropriété</div>
                        <div style="font-size:26px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#1a1208;margin-bottom:6px;">Fiche de Syndicat</div>
                        <div style="font-size:13px;color:#8B7355;margin-top:4px;">Syndicat de Copropriété</div>
                        <div style="width:60px;height:3px;background:#8B7355;margin:14px auto 0;"></div>
                    </div>

                    <!-- RÉFÉRENCE & DATE -->
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;margin-bottom:36px;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;">
                        <span>Référence : <strong style="color:#1a1208;">{{ (selectedOrg.id ?? '').substring(0,8).toUpperCase() }}</strong></span>
                        <span>Créé le : <strong style="color:#1a1208;">{{ selectedOrg.createdAt ? (selectedOrg.createdAt | date:'dd/MM/yyyy') : '—' }}</strong></span>
                        <span>Statut : <strong [style.color]="selectedOrg.status === 'ACTIVE' ? '#2e7d32' : '#b71c1c'">{{ selectedOrg.status }}</strong></span>
                    </div>

                    <!-- ARTICLE I — IDENTIFICATION -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article I — Identification du Syndicat</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
                            <div style="background:#f5f0e4;padding:14px 18px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Dénomination</div>
                                <div style="font-size:16px;font-weight:bold;">{{ selectedOrg.name }}</div>
                            </div>
                            <div style="background:#f5f0e4;padding:14px 18px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Plan d'abonnement</div>
                                <div style="font-size:15px;font-weight:bold;">{{ selectedOrg.subscriptionPlan }}</div>
                            </div>
                            <div style="background:#f5f0e4;padding:14px 18px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Adresse</div>
                                <div style="font-weight:bold;">{{ selectedOrg.address }}</div>
                            </div>
                            <div style="background:#f5f0e4;padding:14px 18px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Ville</div>
                                <div style="font-weight:bold;">{{ selectedOrg.city }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE II — DIRECTION -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article II — Direction du Syndicat</div>
                        <div style="display:flex;align-items:center;gap:20px;padding:16px;background:#f5f0e4;border-radius:4px;">
                            <div style="width:48px;height:48px;border-radius:50%;background:#e8dfc8;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <span style="font-size:20px;font-weight:bold;color:#8B7355;">{{ getManagerName(selectedOrg.managerAccountId).charAt(0) }}</span>
                            </div>
                            <div>
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Syndic Administrateur (Manager)</div>
                                <div style="font-size:15px;font-weight:bold;">{{ getManagerName(selectedOrg.managerAccountId) }}</div>
                                <div style="font-size:12px;color:#6b5c40;margin-top:2px;">{{ getManagerEmail(selectedOrg.managerAccountId) }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE III — RÉSIDENCES -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">
                            Article III — Résidences Gérées ({{ selectedOrg.buildingIds.length }})
                        </div>
                        <div *ngIf="selectedOrg.buildingIds.length > 0; else noResidencesDoc">
                            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                                <thead>
                                    <tr style="background:#f5f0e4;">
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">#</th>
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Nom de la résidence</th>
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Adresse</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let rid of selectedOrg.buildingIds; let i = index" [style.background]="i % 2 === 1 ? '#f9f6ef' : 'white'">
                                        <td style="padding:8px 12px;color:#8B7355;border-bottom:1px solid #ede6d3;">{{ i + 1 }}</td>
                                        <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3;">{{ getResidenceName(rid) }}</td>
                                        <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3;">{{ getResidenceAddress(rid) || '—' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <ng-template #noResidencesDoc>
                            <div style="font-size:13px;color:#8B7355;font-style:italic;padding:12px 0;">Aucune résidence affectée à ce syndicat.</div>
                        </ng-template>
                    </div>

                    <!-- ARTICLE IV — MEMBRES -->
                    <div style="margin-bottom:32px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">
                            Article IV — Membres du Syndicat ({{ selectedOrg.memberAccountIds.length }})
                        </div>
                        <div *ngIf="selectedOrg.memberAccountIds.length > 0; else noMembersDoc">
                            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                                <thead>
                                    <tr style="background:#f5f0e4;">
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">#</th>
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Nom & Prénom</th>
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Email</th>
                                        <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Rôle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let mid of selectedOrg.memberAccountIds; let i = index" [style.background]="i % 2 === 1 ? '#f9f6ef' : 'white'">
                                        <td style="padding:8px 12px;color:#8B7355;border-bottom:1px solid #ede6d3;">{{ i + 1 }}</td>
                                        <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3;">{{ getMemberName(mid) }}</td>
                                        <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3;">{{ getMemberEmail(mid) }}</td>
                                        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;">
                                            <span style="font-size:10px;padding:3px 8px;border-radius:3px;font-weight:bold;letter-spacing:1px;"
                                                [style.background]="getMemberRole(mid) === 'RESIDENT' ? '#e8f5e9' : getMemberRole(mid) === 'TECHNICAL_STAFF' ? '#e3f2fd' : '#fff3e0'"
                                                [style.color]="getMemberRole(mid) === 'RESIDENT' ? '#2e7d32' : getMemberRole(mid) === 'TECHNICAL_STAFF' ? '#1565c0' : '#e65100'">
                                                {{ getMemberRole(mid) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <ng-template #noMembersDoc>
                            <div style="font-size:13px;color:#8B7355;font-style:italic;padding:12px 0;">Aucun membre enregistré dans ce syndicat.</div>
                        </ng-template>
                    </div>

                    <!-- PIED DE PAGE DOCUMENT -->
                    <div style="text-align:center;margin-top:28px;font-size:10px;color:#9e8c6d;border-top:1px dashed #d6c9a8;padding-top:12px;">
                        Document généré par CLOUD4SAYA — Plateforme de gestion de copropriété
                    </div>
                </div>
            </ng-container>

            <ng-template #footer>
                <div class="flex justify-between items-center px-6 py-3">
                    <p-button
                        icon="pi pi-print"
                        label="Imprimer / Exporter PDF"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="printOrganization(selectedOrg!)">
                    </p-button>
                    <div class="flex gap-2">
                        <p-button *ngIf="!isResident" label="Modifier" icon="pi pi-pencil" [outlined]="true"
                            (onClick)="detailsVisible = false; openEditDialog(selectedOrg!)">
                        </p-button>
                        <p-button label="Fermer" (onClick)="detailsVisible = false"></p-button>
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <!-- ── ACTIVITY DIALOG ── -->
        <app-organization-activity
            [(visible)]="activitiesVisible"
            [orgId]="activityOrgId"
            [orgName]="activityOrgName">
        </app-organization-activity>

        <!-- ── ADD / EDIT DIALOG ── -->
        <p-dialog
            [(visible)]="dialogVisible"
            [header]="editMode ? 'Modifier l\\'organisation' : 'Ajouter une organisation'"
            [modal]="true"
            [style]="{ width: '560px' }"
            [closable]="true">

            <div class="flex flex-col gap-4 pt-2">

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Nom <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.name" placeholder="Ex: Résidence Les Pins" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Adresse <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.address" placeholder="Ex: 12 Rue de la République" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Ville <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.city" placeholder="Ex: Tunis" />
                </div>

                <!-- Manager : liste déroulante SYNDIC_ADMIN -->
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Manager (Syndic Admin) <span class="text-red-500">*</span></label>
                    <p-select
                        [(ngModel)]="form.managerAccountId"
                        [options]="managers"
                        optionValue="id"
                        placeholder="Sélectionner un manager"
                        [filter]="true"
                        filterPlaceholder="Rechercher un manager..."
                        [showClear]="true">
                        <ng-template #selectedItem let-mgr>
                            {{ mgr.firstName }} {{ mgr.lastName }} — {{ mgr.email }}
                        </ng-template>
                        <ng-template #item let-mgr>
                            {{ mgr.firstName }} {{ mgr.lastName }} — {{ mgr.email }}
                        </ng-template>
                    </p-select>
                </div>

                <!-- Résidences : multiselect -->
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Résidences</label>
                    <p-multiselect
                        [(ngModel)]="form.buildingIds"
                        [options]="residences"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Sélectionner des résidences"
                        [filter]="true"
                        filterPlaceholder="Rechercher une résidence..."
                        [showClear]="true"
                        display="chip">
                        <ng-template #item let-res>
                            <div class="flex flex-col">
                                <span class="font-medium">{{ res.name }}</span>
                                <span class="text-xs text-surface-400">{{ res.address }}, {{ res.city }}</span>
                            </div>
                        </ng-template>
                    </p-multiselect>
                    <small class="text-surface-400">{{ form.buildingIds.length }} résidence(s) sélectionnée(s)</small>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Plan d'abonnement</label>
                    <p-select
                        [(ngModel)]="form.subscriptionPlan"
                        [options]="planOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Sélectionner un plan">
                    </p-select>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Statut</label>
                    <p-select
                        [(ngModel)]="form.status"
                        [options]="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Sélectionner un statut">
                    </p-select>
                </div>

            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <p-button label="Annuler" [outlined]="true" (onClick)="closeDialog()"></p-button>
                    <p-button
                        [label]="editMode ? 'Modifier' : 'Ajouter'"
                        [loading]="saving"
                        (onClick)="saveOrganization()">
                    </p-button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class OrganizationListComponent implements OnInit {

    private readonly API            = 'http://localhost:8089/api/organizations';
    private readonly RESIDENCES_API = 'http://localhost:8089/api/residences';
    private readonly MANAGERS_API   = 'http://localhost:8089/admin/accounts?role=SYNDIC_ADMIN';
    private readonly MEMBERS_API    = 'http://localhost:8089/admin/accounts';

    organizations: Organization[] = [];
    residences: Residence[]       = [];
    managers: Account[]           = [];
    allAccounts: Account[]        = [];

    layout: 'list' | 'grid' = 'list';
    layoutOptions = ['list', 'grid'];

    // ─── Recherche & filtres ────────────────────────────────────────────────
    searchTerm   = '';
    filterStatus: string | null = null;
    filterPlan:   string | null = null;

    get filteredOrganizations(): Organization[] {
        const term = this.searchTerm.toLowerCase().trim();
        return this.organizations.filter(org => {
            const matchText = !term ||
                org.name.toLowerCase().includes(term) ||
                org.city.toLowerCase().includes(term) ||
                (org.address || '').toLowerCase().includes(term) ||
                this.getManagerName(org.managerAccountId).toLowerCase().includes(term);
            const matchStatus = !this.filterStatus || org.status === this.filterStatus;
            const matchPlan   = !this.filterPlan   || org.subscriptionPlan === this.filterPlan;
            return matchText && matchStatus && matchPlan;
        });
    }

    clearFilters(): void {
        this.searchTerm   = '';
        this.filterStatus = null;
        this.filterPlan   = null;
    }

    dialogVisible     = false;
    detailsVisible    = false;
    activitiesVisible = false;
    editMode          = false;
    saving            = false;

    activityOrgId   = '';
    activityOrgName = '';

    form: Organization            = this.emptyForm();
    selectedOrg: Organization | null = null;

    planOptions = [
        { label: 'Basic',      value: 'BASIC'      },
        { label: 'Pro',        value: 'PRO'        },
        { label: 'Enterprise', value: 'ENTERPRISE' }
    ];

    statusOptions = [
        { label: 'Active',    value: 'ACTIVE'    },
        { label: 'Suspended', value: 'SUSPENDED' }
    ];

    get isResident(): boolean { return this.authService.isResident(); }
    get isSyndicAdmin(): boolean { return this.authService.isSyndicAdmin(); }

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadOrganizations();
        this.loadResidences();
        this.loadManagers();
        this.loadAllAccounts();
    }

    // ─── Data ────────────────────────────────────────────────────────────────────

    loadOrganizations(): void {
        this.http.get<Organization[]>(this.API).subscribe({
            next: (data) => {
                if (this.isSyndicAdmin) {
                    const userId = this.authService.user()?.id;
                    this.organizations = data.filter(org => org.managerAccountId === userId);
                    this.form.managerAccountId = userId ?? '';
                } else {
                    this.organizations = data;
                }
            },
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les organisations.')
        });
    }

    loadResidences(): void {
        this.http.get<Residence[]>(this.RESIDENCES_API).subscribe({
            next: (data) => (this.residences = data),
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les résidences.')
        });
    }

    loadManagers(): void {
        if (!this.authService.isPlatformAdmin()) return;
        this.http.get<Account[]>(this.MANAGERS_API).subscribe({
            next: (data) => (this.managers = data),
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les managers.')
        });
    }

    loadAllAccounts(): void {
        const url = this.authService.isPlatformAdmin()
            ? this.MEMBERS_API
            : 'http://localhost:8089/api/organizations/my-members';
        this.http.get<Account[]>(url).subscribe({
            next: (data) => (this.allAccounts = data),
            error: () => (this.allAccounts = [])
        });
    }

    saveOrganization(): void {
        if (!this.form.name || !this.form.address || !this.form.city || !this.form.managerAccountId) {
            this.toast('warn', 'Champs manquants', 'Veuillez remplir tous les champs obligatoires.');
            return;
        }

        this.saving = true;

        const request$ = this.editMode
            ? this.http.put<Organization>(`${this.API}/${this.form.id}`, this.form)
            : this.http.post<Organization>(this.API, this.form);

        request$.subscribe({
            next: () => {
                this.toast('success', 'Succès',
                    this.editMode ? 'Organisation modifiée.' : 'Organisation ajoutée.');
                this.closeDialog();
                this.loadOrganizations();
            },
            error: (err) => {
                this.toast('error', 'Erreur', err?.error?.message ?? 'Une erreur est survenue.');
            },
            complete: () => (this.saving = false)
        });
    }

    deleteOrganization(org: Organization): void {
        if (!confirm(`Supprimer "${org.name}" ?`)) return;
        this.http.delete(`${this.API}/${org.id}`).subscribe({
            next: () => {
                this.toast('success', 'Supprimé', `"${org.name}" a été supprimée.`);
                this.loadOrganizations();
            },
            error: () => this.toast('error', 'Erreur', 'Suppression échouée.')
        });
    }

    // ─── Dialog ──────────────────────────────────────────────────────────────────

    openAddDialog(): void {
        this.editMode = false;
        this.form = this.emptyForm();
        this.dialogVisible = true;
    }

    openEditDialog(org: Organization): void {
        this.editMode = true;
        this.form = { ...org, buildingIds: [...(org.buildingIds ?? [])] };
        this.dialogVisible = true;
    }

    openDetailsDialog(org: Organization): void {
        this.selectedOrg = org;
        this.detailsVisible = true;
    }

    openActivitiesDialog(org: Organization): void {
        this.activityOrgId   = org.id ?? '';
        this.activityOrgName = org.name;
        this.activitiesVisible = true;
    }

    closeDialog(): void {
        this.dialogVisible = false;
        this.saving = false;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
        return status === 'ACTIVE' ? 'success' : 'danger';
    }

    // ✅ Couleur du tag selon le rôle
    getRoleSeverity(role: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
        switch (role) {
            case 'PLATFORM_ADMIN': return 'danger';
            case 'SYNDIC_ADMIN':   return 'warn';
            case 'RESIDENT':       return 'success';
            case 'TECHNICAL_STAFF': return 'info';
            default:               return 'secondary';
        }
    }

    getManagerName(id: string): string {
        const acc = this.managers.find(a => a.id === id)
                 ?? this.allAccounts.find(a => a.id === id);
        return acc ? `${acc.firstName} ${acc.lastName}` : id;
    }

    getManagerEmail(id: string): string {
        const acc = this.managers.find(a => a.id === id)
                 ?? this.allAccounts.find(a => a.id === id);
        return acc ? acc.email : '';
    }

    getResidenceName(id: string): string {
        return this.residences.find(r => r.id === id)?.name ?? id;
    }

    getResidenceAddress(id: string): string {
        const r = this.residences.find(r => r.id === id);
        return r ? `${r.address}, ${r.city}` : '';
    }

    getMemberName(id: string): string {
        const acc = this.allAccounts.find(a => a.id === id);
        return acc ? `${acc.firstName} ${acc.lastName}` : id;
    }

    getMemberEmail(id: string): string {
        const acc = this.allAccounts.find(a => a.id === id);
        return acc ? acc.email : '';
    }

    // ✅ Retourne le rôle du membre
    getMemberRole(id: string): string {
        const acc = this.allAccounts.find(a => a.id === id);
        return acc ? acc.role : '—';
    }

    printOrganization(org: Organization): void {
        const ref      = (org.id ?? '').substring(0, 8).toUpperCase();
        const manager  = this.getManagerName(org.managerAccountId);
        const mgrEmail = this.getManagerEmail(org.managerAccountId);
        const created  = org.createdAt ? new Date(org.createdAt).toLocaleDateString('fr-FR') : '—';

        const residencesHtml = org.buildingIds.length
            ? org.buildingIds.map((rid, i) =>
                `<tr style="background:${i % 2 ? '#f9f6ef' : 'white'}">
                    <td style="padding:8px 12px;color:#8B7355;border-bottom:1px solid #ede6d3">${i + 1}</td>
                    <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3">${this.getResidenceName(rid)}</td>
                    <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3">${this.getResidenceAddress(rid) || '—'}</td>
                </tr>`).join('')
            : `<tr><td colspan="3" style="padding:12px;color:#8B7355;font-style:italic">Aucune résidence affectée.</td></tr>`;

        const membersHtml = org.memberAccountIds.length
            ? org.memberAccountIds.map((mid, i) =>
                `<tr style="background:${i % 2 ? '#f9f6ef' : 'white'}">
                    <td style="padding:8px 12px;color:#8B7355;border-bottom:1px solid #ede6d3">${i + 1}</td>
                    <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3">${this.getMemberName(mid)}</td>
                    <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3">${this.getMemberEmail(mid)}</td>
                    <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3">${this.getMemberRole(mid)}</td>
                </tr>`).join('')
            : `<tr><td colspan="4" style="padding:12px;color:#8B7355;font-style:italic">Aucun membre enregistré.</td></tr>`;

        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Fiche de Syndicat — ${org.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e8e0d0;padding:40px 20px;font-family:Georgia,serif;color:#1a1208}
.page{max-width:820px;margin:0 auto;background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:64px 72px;position:relative}
.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:80px;font-weight:900;color:rgba(0,0,0,.03);white-space:nowrap;pointer-events:none;letter-spacing:8px}
.header{text-align:center;margin-bottom:36px;border-bottom:2px solid #8B7355;padding-bottom:24px}
.header .sub{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:10px}
.header h1{font-size:26px;font-weight:bold;letter-spacing:4px;text-transform:uppercase}
.header .type{font-size:13px;color:#8B7355;margin-top:4px}
.meta{display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;margin-bottom:36px}
.section{margin-bottom:28px}
.section-title{font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.box{background:#f5f0e4;padding:14px 18px;border-radius:4px}
.box-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px}
.manager-card{display:flex;align-items:center;gap:20px;padding:16px;background:#f5f0e4;border-radius:4px}
.avatar{width:48px;height:48px;border-radius:50%;background:#e8dfc8;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#8B7355;flex-shrink:0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;background:#f5f0e4}
.foot{text-align:center;margin-top:28px;font-size:10px;color:#9e8c6d;border-top:1px dashed #d6c9a8;padding-top:12px}
@media print{body{background:white;padding:0}.page{box-shadow:none;border:none;padding:48px}}
</style></head><body>
<div class="page">
<div class="wm">CLOUD4SAYA</div>
<div class="header"><div class="sub">Gestion de Copropriété</div><h1>Fiche de Syndicat</h1><div class="type">Syndicat de Copropriété</div></div>
<div class="meta"><span>Référence : <strong>${ref}</strong></span><span>Créé le : <strong>${created}</strong></span><span>Statut : <strong>${org.status}</strong></span></div>
<div class="section"><div class="section-title">Article I — Identification du Syndicat</div>
<div class="grid2">
<div class="box"><div class="box-label">Dénomination</div><div style="font-size:15px;font-weight:bold">${org.name}</div></div>
<div class="box"><div class="box-label">Plan d'abonnement</div><div style="font-size:15px;font-weight:bold">${org.subscriptionPlan}</div></div>
<div class="box"><div class="box-label">Adresse</div><div style="font-weight:bold">${org.address}</div></div>
<div class="box"><div class="box-label">Ville</div><div style="font-weight:bold">${org.city}</div></div>
</div></div>
<div class="section"><div class="section-title">Article II — Direction du Syndicat</div>
<div class="manager-card"><div class="avatar">${manager.charAt(0)}</div>
<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px">Syndic Administrateur</div>
<div style="font-size:15px;font-weight:bold">${manager}</div>
<div style="font-size:12px;color:#6b5c40;margin-top:2px">${mgrEmail}</div></div></div></div>
<div class="section"><div class="section-title">Article III — Résidences Gérées (${org.buildingIds.length})</div>
<table><thead><tr><th>#</th><th>Résidence</th><th>Adresse</th></tr></thead><tbody>${residencesHtml}</tbody></table></div>
<div class="section"><div class="section-title">Article IV — Membres du Syndicat (${org.memberAccountIds.length})</div>
<table><thead><tr><th>#</th><th>Nom & Prénom</th><th>Email</th><th style="text-align:center">Rôle</th></tr></thead><tbody>${membersHtml}</tbody></table></div>
<div class="foot">Document généré par CLOUD4SAYA — Plateforme de gestion de copropriété</div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    }

    private emptyForm(): Organization {
        return {
            name: '',
            address: '',
            city: '',
            managerAccountId: '',
            memberAccountIds: [],
            buildingIds: [],
            subscriptionPlan: 'BASIC',
            status: 'ACTIVE'
        };
    }

    private toast(severity: string, summary: string, detail: string): void {
        this.messageService.add({ severity, summary, detail, life: 3000 });
    }
}
