import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Subject, switchMap, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LeaseInspection, InspectionItem, InspectionCondition } from './lease-inspection.model';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AiAnalysisResult {
    condition: InspectionCondition;
    description: string;
    damagesDetected: string[];
    estimatedCost: number;
    confidence: number;
    recommendations: string;
}

interface TenantRiskResult {
    prediction: number;
    riskScore: number;
    label: string;
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

export interface Account {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    status: string;
}

export interface Lease {
    id?: string;
    accountId: string;
    apartmentId: string;
    buildingId: string;
    organizationId: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    depositAmount: number;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
    owner: boolean;
    contractFileUrl: string;
    createdAt?: string;
}

@Component({
    selector: 'app-lease-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DataViewModule,
        ButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        ToastModule,
        SelectButtonModule,
        DatePickerModule,
        ToggleSwitchModule,
        TextareaModule,
        TooltipModule,
        RouterModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="flex flex-col gap-6">

            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold text-2xl">Baux</div>
                    <p class="text-surface-500 dark:text-surface-400 text-sm mt-1">
                        {{ filteredLeases.length }} bail(s) enregistré(s)
                    </p>
                </div>
                <div class="flex gap-2">
                    <p-button
                        label="Tableau de bord"
                        icon="pi pi-chart-bar"
                        severity="secondary"
                        [routerLink]="dashboardUrl">
                    </p-button>
                    <p-button
                        *ngIf="!isResident"
                        label="Ajouter un bail"
                        icon="pi pi-plus"
                        (onClick)="openAddDialog()">
                    </p-button>
                </div>
            </div>

            <!-- DataView card -->
            <div class="card">
                <p-dataview [value]="filteredLeases" [layout]="layout">

                    <ng-template #header>
                        <div class="flex flex-col gap-3">
                            <!-- Ligne 1 : titre + toggle -->
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-xl">
                                    Liste des baux
                                    <span class="text-sm font-normal text-surface-400 ml-2">
                                        ({{ filteredLeases.length }} / {{ leases.length }})
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
                                        placeholder="Rechercher par appartement, locataire, organisation..."
                                        class="w-full pl-9 text-sm" />
                                </div>
                                <p-select
                                    [(ngModel)]="filterStatus"
                                    [options]="[
                                        { label: 'Tous les statuts', value: null },
                                        { label: 'En attente',       value: 'PENDING' },
                                        { label: 'Actif',            value: 'ACTIVE' },
                                        { label: 'Expiré',           value: 'EXPIRED' },
                                        { label: 'Résilié',          value: 'TERMINATED' }
                                    ]"
                                    optionLabel="label"
                                    optionValue="value"
                                    [style]="{ minWidth: '170px' }"
                                    placeholder="Statut">
                                </p-select>
                                <p-select
                                    [(ngModel)]="filterOwner"
                                    [options]="[
                                        { label: 'Propriétaire & Locataire', value: null },
                                        { label: 'Propriétaires seulement',  value: true },
                                        { label: 'Locataires seulement',     value: false }
                                    ]"
                                    optionLabel="label"
                                    optionValue="value"
                                    [style]="{ minWidth: '200px' }"
                                    placeholder="Type">
                                </p-select>
                                <p-button
                                    *ngIf="searchTerm || filterStatus !== null || filterOwner !== null"
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
                            <div *ngFor="let lease of items; let i = index">
                                <div
                                    class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    [ngClass]="{ 'border-t border-surface': i !== 0 }">

                                    <!-- Icon avatar -->
                                    <div class="md:w-16 flex items-center justify-center">
                                        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-file-edit text-2xl text-primary"></i>
                                        </div>
                                    </div>

                                    <!-- Main info -->
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-4">
                                        <div class="flex flex-col gap-1">
                                            <div class="text-lg font-semibold">Appartement : {{ lease.apartmentId }}</div>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-user mr-1"></i>Locataire : {{ getAccountName(lease.accountId) }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-home mr-1"></i>Bâtiment : {{ lease.buildingId }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-building mr-1"></i>Organisation : {{ getOrganizationName(lease.organizationId) }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-calendar mr-1"></i>
                                                {{ lease.startDate | date:'dd/MM/yyyy' }} → {{ lease.endDate | date:'dd/MM/yyyy' }}
                                            </span>
                                        </div>

                                        <!-- Financials + actions -->
                                        <div class="flex flex-col md:items-end gap-3">
                                            <div class="flex gap-2 flex-wrap justify-end">
                                                <p-tag
                                                    [value]="lease.status"
                                                    [severity]="getStatusSeverity(lease.status)">
                                                </p-tag>
                                                <p-tag
                                                    [value]="lease.owner ? 'Propriétaire' : 'Locataire'"
                                                    severity="info">
                                                </p-tag>
                                            </div>
                                            <div class="flex flex-col items-end gap-1 text-sm">
                                                <span class="text-xl font-semibold">{{ lease.monthlyRent | currency:'TND':'symbol':'1.2-2' }} / mois</span>
                                                <span class="text-surface-500 dark:text-surface-400">
                                                    Caution : {{ lease.depositAmount | currency:'TND':'symbol':'1.2-2' }}
                                                </span>
                                            </div>
                                            <div class="flex gap-2 flex-wrap justify-end">
                                                <p-button
                                                    icon="pi pi-eye"
                                                    severity="info"
                                                    [outlined]="true"
                                                    size="small"
                                                    pTooltip="Voir le contrat"
                                                    (onClick)="openLeaseDetails(lease)">
                                                </p-button>
                                                <!-- Activer (PENDING uniquement) -->
                                                <p-button
                                                    *ngIf="!isResident && lease.status === 'PENDING'"
                                                    icon="pi pi-check-circle"
                                                    label="Activer"
                                                    severity="success"
                                                    [outlined]="true"
                                                    size="small"
                                                    pTooltip="Nécessite un état des lieux INITIAL complété"
                                                    (onClick)="activateLease(lease)">
                                                </p-button>
                                                <!-- Résilier (ACTIVE uniquement) -->
                                                <p-button
                                                    *ngIf="!isResident && lease.status === 'ACTIVE'"
                                                    icon="pi pi-times-circle"
                                                    label="Résilier"
                                                    severity="warn"
                                                    [outlined]="true"
                                                    size="small"
                                                    pTooltip="Nécessite un état des lieux FINAL complété"
                                                    (onClick)="terminateLease(lease)">
                                                </p-button>
                                                <p-button
                                                    *ngIf="!isResident"
                                                    icon="pi pi-fw pi-file-check"
                                                    severity="help"
                                                    [outlined]="true"
                                                    size="small"
                                                    pTooltip="Ajouter une inspection"
                                                    (onClick)="openInspectionDialog(lease)">
                                                </p-button>
                                                <p-button
                                                    *ngIf="!isResident"
                                                    icon="pi pi-pencil"
                                                    [outlined]="true"
                                                    size="small"
                                                    (onClick)="openEditDialog(lease)">
                                                </p-button>
                                                <p-button
                                                    *ngIf="!isResident"
                                                    icon="pi pi-trash"
                                                    severity="danger"
                                                    [outlined]="true"
                                                    size="small"
                                                    (onClick)="deleteLease(lease)">
                                                </p-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="leases.length === 0" class="p-10 text-center text-surface-400">
                                <i class="pi pi-file-edit text-4xl mb-3 block"></i>
                                Aucun bail trouvé.
                            </div>
                        </div>
                    </ng-template>

                    <!-- ── GRID VIEW ── -->
                    <ng-template #grid let-items>
                        <div class="grid grid-cols-12 gap-4">
                            <div *ngFor="let lease of items" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col gap-4">

                                    <!-- Card header -->
                                    <div class="flex items-center justify-between">
                                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-file-edit text-xl text-primary"></i>
                                        </div>
                                        <div class="flex gap-2">
                                            <p-tag [value]="lease.status" [severity]="getStatusSeverity(lease.status)"></p-tag>
                                        </div>
                                    </div>

                                    <!-- Apartment & tenant -->
                                    <div>
                                        <div class="text-lg font-semibold">Apt. {{ lease.apartmentId }}</div>
                                        <span class="text-surface-500 dark:text-surface-400 text-sm">
                                            <i class="pi pi-user mr-1"></i>{{ getAccountName(lease.accountId) }}
                                        </span>
                                    </div>

                                    <!-- Details -->
                                    <div class="flex flex-col gap-2 text-sm text-surface-600 dark:text-surface-300">
                                        <div><i class="pi pi-home mr-2 text-surface-400"></i>Bâtiment : {{ lease.buildingId }}</div>
                                        <div><i class="pi pi-building mr-2 text-surface-400"></i>Org. : {{ getOrganizationName(lease.organizationId) }}</div>
                                        <div>
                                            <i class="pi pi-calendar mr-2 text-surface-400"></i>
                                            {{ lease.startDate | date:'dd/MM/yy' }} → {{ lease.endDate | date:'dd/MM/yy' }}
                                        </div>
                                        <div><i class="pi pi-wallet mr-2 text-surface-400"></i>{{ lease.monthlyRent | currency:'TND':'symbol':'1.2-2' }} / mois</div>
                                        <div><i class="pi pi-shield mr-2 text-surface-400"></i>Caution : {{ lease.depositAmount | currency:'TND':'symbol':'1.2-2' }}</div>
                                    </div>

                                    <!-- Footer -->
                                    <div class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <p-tag
                                            [value]="lease.owner ? 'Propriétaire' : 'Locataire'"
                                            severity="info">
                                        </p-tag>
                                        <div class="flex gap-2 flex-wrap">
                                            <p-button
                                                icon="pi pi-eye"
                                                severity="info"
                                                [outlined]="true"
                                                size="small"
                                                pTooltip="Voir le contrat"
                                                (onClick)="openLeaseDetails(lease)">
                                            </p-button>
                                            <p-button
                                                *ngIf="!isResident && lease.status === 'PENDING'"
                                                icon="pi pi-check-circle"
                                                severity="success"
                                                [outlined]="true"
                                                size="small"
                                                pTooltip="Activer le bail"
                                                (onClick)="activateLease(lease)">
                                            </p-button>
                                            <p-button
                                                *ngIf="!isResident && lease.status === 'ACTIVE'"
                                                icon="pi pi-times-circle"
                                                severity="warn"
                                                [outlined]="true"
                                                size="small"
                                                pTooltip="Résilier le bail"
                                                (onClick)="terminateLease(lease)">
                                            </p-button>
                                            <p-button
                                                *ngIf="!isResident"
                                                icon="pi pi-fw pi-file-check"
                                                severity="help"
                                                [outlined]="true"
                                                size="small"
                                                pTooltip="Ajouter une inspection"
                                                (onClick)="openInspectionDialog(lease)">
                                            </p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-pencil" [outlined]="true" size="small" (onClick)="openEditDialog(lease)"></p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-trash" severity="danger" [outlined]="true" size="small" (onClick)="deleteLease(lease)"></p-button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="leases.length === 0" class="col-span-12 p-10 text-center text-surface-400">
                                <i class="pi pi-file-edit text-4xl mb-3 block"></i>
                                Aucun bail trouvé.
                            </div>
                        </div>
                    </ng-template>

                </p-dataview>
            </div>
        </div>

        <!-- ── ADD / EDIT LEASE DIALOG ── -->
        <p-dialog
            [(visible)]="dialogVisible"
            [header]="editMode ? 'Modifier le bail' : 'Ajouter un bail'"
            [modal]="true"
            [style]="{ width: '560px' }"
            [closable]="true">

            <div class="flex flex-col gap-4 pt-2">

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Locataire <span class="text-red-500">*</span></label>
                    <p-select
                        [(ngModel)]="form.accountId"
                        (ngModelChange)="onTenantOrRentChange()"
                        [options]="accounts"
                        optionValue="id"
                        placeholder="Sélectionner un locataire"
                        [filter]="true"
                        filterPlaceholder="Rechercher un locataire..."
                        [showClear]="true">
                        <ng-template #selectedItem let-acc>
                            {{ acc.firstName }} {{ acc.lastName }} — {{ acc.email }}
                        </ng-template>
                        <ng-template #item let-acc>
                            {{ acc.firstName }} {{ acc.lastName }} — {{ acc.email }}
                        </ng-template>
                    </p-select>

                    <!-- Risk score badge -->
                    <div *ngIf="tenantRiskLoading" class="flex items-center gap-2 mt-1 text-sm text-surface-500">
                        <i class="pi pi-spin pi-spinner"></i> Analyse du profil en cours...
                    </div>
                    <!-- Loyer manquant -->
                    <div *ngIf="form.accountId && !(form.monthlyRent > 0) && !tenantRiskLoading && !tenantRiskResult"
                        class="flex items-center gap-2 mt-1 text-xs text-surface-400">
                        <i class="pi pi-arrow-down"></i> Entrez le loyer mensuel pour obtenir le score de risque.
                    </div>
                    <!-- Aucun profil -->
                    <div *ngIf="tenantRiskResult && tenantRiskResult.status === 'no_profile'"
                        class="flex items-center gap-2 mt-2 p-3 rounded border bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200">
                        <i class="pi pi-info-circle text-yellow-500"></i>
                        Ce locataire ne possède pas encore de profil — le score de risque n'est pas disponible.
                    </div>

                    <!-- Profil existant mais données financières manquantes -->
                    <div *ngIf="tenantRiskResult && tenantRiskResult.status === 'incomplete_profile'"
                        class="flex items-center gap-2 mt-2 p-3 rounded border bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700 text-sm text-orange-800 dark:text-orange-200">
                        <i class="pi pi-exclamation-circle text-orange-500"></i>
                        Profil incomplet — les données financières (revenus, ancienneté, historique crédit) ne sont pas renseignées.
                    </div>

                    <!-- Service IA indisponible -->
                    <div *ngIf="tenantRiskResult && tenantRiskResult.status === 'error'"
                        class="flex items-center gap-2 mt-2 p-3 rounded border bg-surface-100 border-surface-300 dark:bg-surface-700/30 dark:border-surface-600 text-sm text-surface-500">
                        <i class="pi pi-server text-surface-400"></i>
                        Service d'analyse IA indisponible — démarrez le service Python (port 5000) pour obtenir le score.
                    </div>

                    <!-- Score disponible -->
                    <div *ngIf="tenantRiskResult && tenantRiskResult.status === 'success'"
                        class="flex items-center gap-3 mt-2 p-3 rounded border"
                        [ngClass]="{
                            'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700': tenantRiskResult.prediction === 0,
                            'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700': tenantRiskResult.prediction === 1
                        }">
                        <i class="pi text-xl"
                            [ngClass]="{
                                'pi-check-circle text-green-600': tenantRiskResult.prediction === 0,
                                'pi-exclamation-triangle text-red-600': tenantRiskResult.prediction === 1
                            }"></i>
                        <div>
                            <div class="font-semibold text-sm"
                                [ngClass]="{
                                    'text-green-800 dark:text-green-200': tenantRiskResult.prediction === 0,
                                    'text-red-800 dark:text-red-200': tenantRiskResult.prediction === 1
                                }">
                                {{ tenantRiskResult.prediction === 0 ? 'Bon locataire' : 'Locataire risqué' }}
                            </div>
                            <div class="text-xs text-surface-500 dark:text-surface-400">
                                Score de risque : {{ (tenantRiskResult.riskScore * 100) | number:'1.0-0' }}%
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">ID Appartement <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.apartmentId" placeholder="Ex: apt_101" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">ID Bâtiment <span class="text-red-500">*</span></label>
                    <input pInputText [(ngModel)]="form.buildingId" placeholder="Ex: building_001" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Organisation <span class="text-red-500">*</span></label>
                    <p-select
                        [(ngModel)]="form.organizationId"
                        [options]="organizations"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Sélectionner une organisation"
                        [filter]="true"
                        filterPlaceholder="Rechercher une organisation..."
                        [showClear]="true"
                        [disabled]="authService.isSyndicAdmin()">
                    </p-select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Date de début <span class="text-red-500">*</span></label>
                        <p-datepicker
                            [(ngModel)]="startDateObj"
                            dateFormat="yy-mm-dd"
                            [showIcon]="true"
                            placeholder="yyyy-mm-dd">
                        </p-datepicker>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Date de fin <span class="text-red-500">*</span></label>
                        <p-datepicker
                            [(ngModel)]="endDateObj"
                            dateFormat="yy-mm-dd"
                            [showIcon]="true"
                            placeholder="yyyy-mm-dd">
                        </p-datepicker>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Loyer mensuel (TND) <span class="text-red-500">*</span></label>
                        <p-inputnumber
                            [(ngModel)]="form.monthlyRent"
                            (ngModelChange)="onTenantOrRentChange()"
                            [minFractionDigits]="2"
                            [maxFractionDigits]="2"
                            placeholder="Ex: 850.00">
                        </p-inputnumber>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Caution (TND) <span class="text-red-500">*</span></label>
                        <p-inputnumber
                            [(ngModel)]="form.depositAmount"
                            [minFractionDigits]="2"
                            [maxFractionDigits]="2"
                            placeholder="Ex: 1700.00">
                        </p-inputnumber>
                    </div>
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

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">URL du contrat</label>
                    <input pInputText [(ngModel)]="form.contractFileUrl" placeholder="https://..." />
                </div>

                <div class="flex items-center gap-3">
                    <p-toggle-switch [(ngModel)]="form.owner" inputId="ownerToggle"></p-toggle-switch>
                    <label for="ownerToggle" class="font-medium text-sm cursor-pointer">
                        Propriétaire (cocher si le compte est propriétaire)
                    </label>
                </div>

            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <p-button label="Annuler" [outlined]="true" (onClick)="closeDialog()"></p-button>
                    <p-button
                        [label]="editMode ? 'Modifier' : 'Ajouter'"
                        [loading]="saving"
                        (onClick)="saveLease()">
                    </p-button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- ── INSPECTION DIALOG ── -->
        <p-dialog
            [(visible)]="inspectionDialogVisible"
            header="Ajouter une inspection"
            [modal]="true"
            [style]="{ width: '720px' }"
            [closable]="true">

            <div class="flex flex-col gap-4 pt-2" *ngIf="selectedLeaseForInspection">

                <!-- Bail concerné (lecture seule) -->
                <div class="p-3 bg-primary/5 rounded border border-primary/20">
                    <div class="text-sm text-surface-600 dark:text-surface-300">Bail sélectionné</div>
                    <div class="font-semibold">
                        Apt. {{ selectedLeaseForInspection.apartmentId }} — {{ getAccountName(selectedLeaseForInspection.accountId) }}
                    </div>
                </div>

                <!-- Avertissement : inspection INITIAL déjà existante -->
                <div *ngIf="selectedLeaseHasInitial"
                    class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded">
                    <i class="pi pi-exclamation-triangle text-yellow-500 mt-0.5"></i>
                    <div class="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Attention :</strong> Un état des lieux INITIAL existe déjà pour ce bail.
                        Le type INITIAL est désactivé — vous pouvez créer une inspection FINALE, de ROUTINE ou un rapport de DOMMAGES.
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Type d'inspection <span class="text-red-500">*</span></label>
                        <p-select
                            [(ngModel)]="inspectionForm.inspectionType"
                            [options]="availableInspectionTypes"
                            optionLabel="label"
                            optionValue="value">
                        </p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Date d'inspection <span class="text-red-500">*</span></label>
                        <p-datepicker
                            [(ngModel)]="inspectionDateObj"
                            dateFormat="yy-mm-dd"
                            [showIcon]="true">
                        </p-datepicker>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Inspecteur</label>
                        <p-select
                            [(ngModel)]="inspectionForm.inspectorAccountId"
                            [options]="accounts"
                            optionValue="id"
                            placeholder="Sélectionner"
                            [filter]="true"
                            [showClear]="true">
                            <ng-template #selectedItem let-acc>{{ acc.firstName }} {{ acc.lastName }}</ng-template>
                            <ng-template #item let-acc>{{ acc.firstName }} {{ acc.lastName }} — {{ acc.email }}</ng-template>
                        </p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Manager</label>
                        <p-select
                            [(ngModel)]="inspectionForm.managerAccountId"
                            [options]="accounts"
                            optionValue="id"
                            placeholder="Sélectionner"
                            [filter]="true"
                            [showClear]="true">
                            <ng-template #selectedItem let-acc>{{ acc.firstName }} {{ acc.lastName }}</ng-template>
                            <ng-template #item let-acc>{{ acc.firstName }} {{ acc.lastName }} — {{ acc.email }}</ng-template>
                        </p-select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Condition globale</label>
                        <p-select
                            [(ngModel)]="inspectionForm.condition"
                            [options]="conditionOptions"
                            optionLabel="label"
                            optionValue="value">
                        </p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Statut</label>
                        <p-select
                            [(ngModel)]="inspectionForm.status"
                            [options]="inspectionStatusOptions"
                            optionLabel="label"
                            optionValue="value">
                        </p-select>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Description générale</label>
                    <textarea pTextarea [(ngModel)]="inspectionForm.overallCondition" rows="2"
                        placeholder="Décrivez l'état général..."></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Coûts estimés (TND)</label>
                        <p-inputnumber [(ngModel)]="inspectionForm.costsEstimated"
                            [minFractionDigits]="2" [maxFractionDigits]="2"></p-inputnumber>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Signé par</label>
                        <input pInputText [(ngModel)]="inspectionForm.signedBy" placeholder="Nom du signataire" />
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">URL du rapport PDF</label>
                    <input pInputText [(ngModel)]="inspectionForm.reportUrl" placeholder="https://..." />
                </div>

                <!-- ── PHOTOS + IA ── -->
                <div class="flex flex-col gap-3 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <label class="font-semibold flex items-center gap-2">
                            <i class="pi pi-image"></i>
                            Photos de l'inspection
                            <span class="text-sm text-surface-500 font-normal">
                                ({{ inspectionForm.photosUrls.length }})
                            </span>
                        </label>
                        <div class="flex gap-2">
                            <input
                                #fileInputInspection
                                type="file"
                                accept="image/*"
                                multiple
                                (change)="onFileSelected($event)"
                                class="hidden" />
                            <p-button
                                icon="pi pi-upload"
                                label="Ajouter des photos"
                                size="small"
                                [outlined]="true"
                                [loading]="uploadingPhotos"
                                (onClick)="fileInputInspection.click()">
                            </p-button>
                            <p-button
                                icon="pi pi-sparkles"
                                label="Analyser avec IA"
                                size="small"
                                severity="help"
                                [loading]="analyzingAi"
                                [disabled]="!inspectionForm.photosUrls.length"
                                (onClick)="analyzeWithAi()">
                            </p-button>
                        </div>
                    </div>

                    <!-- Preview photos -->
                    <div *ngIf="inspectionForm.photosUrls.length" class="grid grid-cols-4 gap-3">
                        <div *ngFor="let url of inspectionForm.photosUrls; let i = index"
                            class="relative group border border-surface-200 dark:border-surface-700 rounded overflow-hidden aspect-square">
                            <img [src]="url" alt="Photo inspection" class="w-full h-full object-cover" />
                            <button
                                type="button"
                                (click)="removePhoto(i)"
                                class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="pi pi-times text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div *ngIf="!inspectionForm.photosUrls.length"
                        class="text-center py-6 text-surface-400 border border-dashed border-surface-300 dark:border-surface-700 rounded">
                        <i class="pi pi-image text-3xl block mb-2"></i>
                        <span class="text-sm">Aucune photo ajoutée</span>
                    </div>

                    <!-- Résultat IA -->
                    <div *ngIf="aiResult"
                        class="p-4 rounded border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 flex flex-col gap-3">

                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-sparkles text-purple-600 text-xl"></i>
                                <span class="font-semibold text-purple-900 dark:text-purple-200">Analyse IA</span>
                                <p-tag
                                    [value]="'Confiance: ' + aiResult.confidence + '%'"
                                    [severity]="aiResult.confidence >= 70 ? 'success' : aiResult.confidence >= 40 ? 'warn' : 'danger'">
                                </p-tag>
                            </div>
                            <p-button icon="pi pi-times" [text]="true" size="small" severity="secondary"
                                (onClick)="aiResult = null"></p-button>
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="font-medium text-surface-600 dark:text-surface-300">Condition détectée :</span>
                                <p-tag
                                    [value]="getConditionLabel(aiResult.condition)"
                                    [severity]="getConditionSeverity(aiResult.condition)"
                                    class="ml-2">
                                </p-tag>
                            </div>
                            <div>
                                <span class="font-medium text-surface-600 dark:text-surface-300">Coût estimé :</span>
                                <span class="ml-2 font-semibold">{{ aiResult.estimatedCost | currency:'TND':'symbol':'1.2-2' }}</span>
                            </div>
                        </div>

                        <div>
                            <div class="font-medium text-surface-600 dark:text-surface-300 text-sm mb-1">Description :</div>
                            <p class="text-sm">{{ aiResult.description }}</p>
                        </div>

                        <div *ngIf="aiResult.damagesDetected.length">
                            <div class="font-medium text-surface-600 dark:text-surface-300 text-sm mb-1">
                                Dommages détectés ({{ aiResult.damagesDetected.length }}) :
                            </div>
                            <ul class="list-disc list-inside text-sm space-y-1">
                                <li *ngFor="let d of aiResult.damagesDetected">{{ d }}</li>
                            </ul>
                        </div>

                        <div *ngIf="aiResult.recommendations">
                            <div class="font-medium text-surface-600 dark:text-surface-300 text-sm mb-1">Recommandations :</div>
                            <p class="text-sm italic">{{ aiResult.recommendations }}</p>
                        </div>

                        <div class="flex justify-end gap-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p-button icon="pi pi-check" label="Appliquer au formulaire" size="small"
                                (onClick)="applyAiResult()"></p-button>
                        </div>
                    </div>
                </div>

                <!-- Dommages trouvés -->
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <label class="font-medium text-sm">Dommages trouvés</label>
                        <p-button icon="pi pi-plus" size="small" [text]="true" label="Ajouter"
                            (onClick)="addDamage()"></p-button>
                    </div>
                    <div *ngFor="let d of inspectionForm.damagesFound; let i = index" class="flex gap-2">
                        <input pInputText [(ngModel)]="inspectionForm.damagesFound[i]"
                            placeholder="Description du dommage" class="flex-1" />
                        <p-button icon="pi pi-times" severity="danger" [text]="true"
                            (onClick)="removeDamage(i)"></p-button>
                    </div>
                </div>

                <!-- Items détaillés -->
                <div class="flex flex-col gap-2 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div class="flex items-center justify-between">
                        <label class="font-semibold">Items inspectés</label>
                        <p-button icon="pi pi-plus" size="small" label="Ajouter un item"
                            (onClick)="addItem()"></p-button>
                    </div>

                    <div *ngFor="let item of inspectionForm.items; let i = index"
                        class="p-3 border border-surface-200 dark:border-surface-700 rounded flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="font-medium text-sm">Item #{{ i + 1 }}</span>
                            <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                                (onClick)="removeItem(i)"></p-button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <input pInputText [(ngModel)]="item.itemName" placeholder="Nom de l'item (ex: Mur salon)" />
                            <p-select [(ngModel)]="item.condition" [options]="conditionOptions"
                                optionLabel="label" optionValue="value"></p-select>
                        </div>
                        <textarea pTextarea [(ngModel)]="item.notes" rows="1" placeholder="Notes..."></textarea>
                    </div>
                </div>

            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <p-button label="Annuler" [outlined]="true" (onClick)="closeInspectionDialog()"></p-button>
                    <p-button label="Créer l'inspection" [loading]="savingInspection"
                        (onClick)="saveInspection()"></p-button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- ══════════════════════════════════════════════════════════
             DIALOG — CONTRAT DE LOCATION (style document officiel)
             ══════════════════════════════════════════════════════════ -->
        <p-dialog
            [(visible)]="leaseDetailsVisible"
            [modal]="true"
            [closable]="true"
            [style]="{ width: '820px', maxWidth: '98vw' }"
            [contentStyle]="{ padding: '0', background: '#f0ece4' }"
            header=" ">

            <ng-container *ngIf="selectedLeaseDetails">
                <!-- FEUILLE CONTRAT -->
                <div style="background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,0.18);margin:24px;padding:60px 64px;font-family:Georgia,serif;color:#1a1208;position:relative;overflow:hidden;">

                    <!-- filigrane -->
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:90px;font-weight:900;color:rgba(0,0,0,0.03);white-space:nowrap;pointer-events:none;user-select:none;letter-spacing:8px;">CLOUD4SAYA</div>

                    <!-- EN-TÊTE -->
                    <div style="text-align:center;margin-bottom:36px;">
                        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:10px;">Gestion de Copropriété</div>
                        <div style="font-size:26px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;color:#1a1208;margin-bottom:6px;">Contrat de Location</div>
                        <div style="width:60px;height:3px;background:#8B7355;margin:14px auto 0;"></div>
                    </div>

                    <!-- RÉFÉRENCE & DATE -->
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;margin-bottom:36px;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;">
                        <span>Référence : <strong style="color:#1a1208;">{{ (selectedLeaseDetails.id ?? '').substring(0,8).toUpperCase() }}</strong></span>
                        <span>Établi le : <strong style="color:#1a1208;">{{ selectedLeaseDetails.createdAt | date:'dd/MM/yyyy' }}</strong></span>
                        <span>Statut : <strong [style.color]="selectedLeaseDetails.status==='ACTIVE'?'#2e7d32':selectedLeaseDetails.status==='PENDING'?'#e65100':'#b71c1c'">{{ selectedLeaseDetails.status }}</strong></span>
                    </div>

                    <!-- ARTICLE I — LES PARTIES -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article I — Les Parties</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                            <div>
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:8px;">Le Bailleur</div>
                                <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">{{ getOrganizationName(selectedLeaseDetails.organizationId) }}</div>
                                <div style="font-size:13px;color:#4a3f2a;margin-bottom:2px;">{{ getOrganizationObj(selectedLeaseDetails.organizationId)?.address }}</div>
                                <div style="font-size:13px;color:#4a3f2a;margin-bottom:2px;">{{ getOrganizationObj(selectedLeaseDetails.organizationId)?.city }}</div>
                                <div style="font-size:13px;color:#4a3f2a;margin-top:6px;">Manager : <strong>{{ getAccountName(getOrganizationObj(selectedLeaseDetails.organizationId)?.managerAccountId ?? '') }}</strong></div>
                            </div>
                            <div>
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:8px;">Le Locataire</div>
                                <div style="font-size:14px;font-weight:bold;margin-bottom:4px;">{{ getAccountName(selectedLeaseDetails.accountId) }}</div>
                                <div style="font-size:13px;color:#4a3f2a;">{{ getAccountEmail(selectedLeaseDetails.accountId) }}</div>
                                <div style="font-size:12px;color:#8B7355;margin-top:6px;">
                                    <span *ngIf="selectedLeaseDetails.owner">Propriétaire occupant</span>
                                    <span *ngIf="!selectedLeaseDetails.owner">Locataire</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE II — LE BIEN LOUÉ -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article II — Le Bien Loué</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
                            <div style="background:#f5f0e4;padding:12px 16px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Appartement</div>
                                <div style="font-weight:bold;">{{ selectedLeaseDetails.apartmentId }}</div>
                            </div>
                            <div style="background:#f5f0e4;padding:12px 16px;border-radius:4px;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Bâtiment / Résidence</div>
                                <div style="font-weight:bold;">{{ selectedLeaseDetails.buildingId }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE III — DURÉE -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article III — Durée du Contrat</div>
                        <div style="font-size:13px;line-height:2;color:#2a2010;">
                            Le présent contrat prend effet le <strong>{{ selectedLeaseDetails.startDate | date:'dd MMMM yyyy' }}</strong>
                            et se termine le <strong>{{ selectedLeaseDetails.endDate | date:'dd MMMM yyyy' }}</strong>,
                            soit une durée de <strong>{{ getDurationMonths(selectedLeaseDetails.startDate, selectedLeaseDetails.endDate) }} mois</strong>.
                        </div>
                    </div>

                    <!-- ARTICLE IV — CONDITIONS FINANCIÈRES -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px;">Article IV — Conditions Financières</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div style="background:#f5f0e4;padding:16px;border-radius:4px;text-align:center;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Loyer mensuel</div>
                                <div style="font-size:22px;font-weight:bold;color:#1a1208;">{{ selectedLeaseDetails.monthlyRent | currency:'TND':'symbol':'1.3-3' }}</div>
                            </div>
                            <div style="background:#f5f0e4;padding:16px;border-radius:4px;text-align:center;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Dépôt de garantie</div>
                                <div style="font-size:22px;font-weight:bold;color:#1a1208;">{{ selectedLeaseDetails.depositAmount | currency:'TND':'symbol':'1.3-3' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE V — CLAUSES -->
                    <div style="margin-bottom:32px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:12px;">Article V — Clauses Générales</div>
                        <div style="font-size:12px;color:#5a4e35;line-height:1.8;text-align:justify;">
                            Le locataire s'engage à utiliser le bien loué conformément à sa destination et à l'entretenir en bon état.
                            Toute modification structurelle est soumise à l'accord préalable écrit du bailleur.
                            Le présent contrat est régi par les dispositions légales en vigueur relatives aux baux d'habitation.
                            En cas de litige, les parties s'engagent à privilégier la voie amiable avant tout recours judiciaire.
                        </div>
                    </div>

                    <!-- SIGNATURES -->
                    <div style="border-top:1px solid #d6c9a8;padding-top:28px;margin-top:8px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-bottom:8px;">
                            <div style="text-align:center;">
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px;">Pour le Bailleur</div>
                                <div style="border-bottom:1px solid #8B7355;height:48px;margin-bottom:8px;"></div>
                                <div style="font-size:12px;color:#4a3f2a;">{{ getAccountName(getOrganizationObj(selectedLeaseDetails.organizationId)?.managerAccountId ?? '') }}</div>
                                <div style="font-size:10px;color:#8B7355;margin-top:2px;">Cachet & Signature</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px;">Pour le Locataire</div>
                                <div style="border-bottom:1px solid #8B7355;height:48px;margin-bottom:8px;"></div>
                                <div style="font-size:12px;color:#4a3f2a;">{{ getAccountName(selectedLeaseDetails.accountId) }}</div>
                                <div style="font-size:10px;color:#8B7355;margin-top:2px;">Lu et approuvé — Signature</div>
                            </div>
                        </div>
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
                        (onClick)="printLease(selectedLeaseDetails!)">
                    </p-button>
                    <p-button label="Fermer" (onClick)="leaseDetailsVisible = false"></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class LeaseListComponent implements OnInit, OnDestroy {

    private readonly API              = 'http://localhost:8089/api/leases';
    private readonly ORGS_API         = 'http://localhost:8089/api/organizations';
    private readonly ACCOUNTS_API     = 'http://localhost:8089/admin/accounts';
    private readonly MY_MEMBERS_API   = 'http://localhost:8089/api/organizations/my-members';
    private readonly INSPECTIONS_API  = 'http://localhost:8089/api/lease-inspections';
    private readonly UPLOAD_API       = 'http://localhost:8089/api/uploads/inspection-photos';
    private readonly AI_API           = 'http://localhost:8089/api/ai/analyze-inspection';
    private readonly RISK_API         = 'http://localhost:8089/api/leases/tenant-risk';

    leases: Lease[] = [];
    organizations: Organization[] = [];
    accounts: Account[] = [];

    layout: 'list' | 'grid' = 'list';
    layoutOptions = ['list', 'grid'];

    // ─── Recherche & filtres ────────────────────────────────────────────────
    searchTerm   = '';
    filterStatus: string | null = null;
    filterOwner:  boolean | null = null;

    get filteredLeases(): Lease[] {
        const term = this.searchTerm.toLowerCase().trim();
        return this.leases.filter(lease => {
            const matchText = !term ||
                lease.apartmentId.toLowerCase().includes(term) ||
                lease.buildingId.toLowerCase().includes(term) ||
                this.getAccountName(lease.accountId).toLowerCase().includes(term) ||
                this.getOrganizationName(lease.organizationId).toLowerCase().includes(term);
            const matchStatus = !this.filterStatus || lease.status === this.filterStatus;
            const matchOwner  = this.filterOwner === null || lease.owner === this.filterOwner;
            return matchText && matchStatus && matchOwner;
        });
    }

    clearFilters(): void {
        this.searchTerm   = '';
        this.filterStatus = null;
        this.filterOwner  = null;
    }

    // ─── Lease details (contract view) ─────────────────────────────────────
    leaseDetailsVisible   = false;
    selectedLeaseDetails: Lease | null = null;

    // ─── Tenant Risk state ──────────────────────────────────────────────────
    tenantRiskResult: TenantRiskResult | null = null;
    tenantRiskLoading = false;

    private riskTrigger$ = new Subject<{ tenantAccountId: string; monthlyRent: number }>();
    private destroy$     = new Subject<void>();

    // ─── Lease form state ───────────────────────────────────────────────────
    dialogVisible = false;
    editMode = false;
    saving = false;

    form: Lease = this.emptyForm();

    startDateObj: Date | null = null;
    endDateObj: Date | null = null;

    statusOptions = [
        { label: 'En attente', value: 'PENDING'    },
        { label: 'Actif',      value: 'ACTIVE'     },
        { label: 'Expiré',     value: 'EXPIRED'    },
        { label: 'Résilié',    value: 'TERMINATED' }
    ];

    // ─── Inspection form state ──────────────────────────────────────────────
    inspectionDialogVisible = false;
    savingInspection = false;
    uploadingPhotos = false;
    analyzingAi = false;
    aiResult: AiAnalysisResult | null = null;
    selectedLeaseForInspection: Lease | null = null;
    selectedLeaseHasInitial = false;
    inspectionDateObj: Date | null = null;

    inspectionForm: LeaseInspection = this.emptyInspectionForm();

    inspectionTypeOptions = [
        { label: 'Initiale',  value: 'INITIAL' },
        { label: 'Finale',    value: 'FINAL' },
        { label: 'Routine',   value: 'ROUTINE' },
        { label: 'Dommages',  value: 'DAMAGE_REPORT' }
    ];

    get availableInspectionTypes() {
        return this.selectedLeaseHasInitial
            ? this.inspectionTypeOptions.filter(o => o.value !== 'INITIAL')
            : this.inspectionTypeOptions;
    }

    conditionOptions = [
        { label: 'Excellent',  value: 'EXCELLENT' },
        { label: 'Bon',        value: 'GOOD' },
        { label: 'Acceptable', value: 'ACCEPTABLE' },
        { label: 'Mauvais',    value: 'POOR' },
        { label: 'Endommagé',  value: 'DAMAGED' }
    ];

    inspectionStatusOptions = [
        { label: 'En attente', value: 'PENDING' },
        { label: 'Complétée',  value: 'COMPLETED' },
        { label: 'Contestée',  value: 'DISPUTED' }
    ];

    get isResident(): boolean        { return this.authService.isResident(); }
    get isPlatformAdmin(): boolean   { return this.authService.isPlatformAdmin(); }
    get dashboardUrl(): string {
        return this.authService.isPlatformAdmin()
            ? '/pages/admin/organizations/dashboard'
            : '/pages/backoffice/organizations/dashboard';
    }

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        protected authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadLeases();
        this.loadOrganizations();
        this.loadAccounts();

        this.riskTrigger$.pipe(
            debounceTime(400),
            distinctUntilChanged((a, b) => a.tenantAccountId === b.tenantAccountId && a.monthlyRent === b.monthlyRent),
            switchMap(payload => {
                this.tenantRiskLoading = true;
                this.tenantRiskResult  = null;
                return this.http.post<TenantRiskResult>(this.RISK_API, payload).pipe(
                    catchError(() => {
                        this.tenantRiskLoading = false;
                        return of(null);
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe(result => {
            if (result !== null) {
                this.tenantRiskResult = result;
                this.tenantRiskLoading = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ─── Data ────────────────────────────────────────────────────────────────

    loadLeases(): void {
        this.http.get<Lease[]>(this.API).subscribe({
            next: (data) => (this.leases = data),
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les baux.')
        });
    }

    loadOrganizations(): void {
        this.http.get<Organization[]>(this.ORGS_API).subscribe({
            next: (data) => (this.organizations = data),
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les organisations.')
        });
    }

    loadAccounts(): void {
        const url = this.authService.isPlatformAdmin()
            ? this.ACCOUNTS_API
            : this.MY_MEMBERS_API;
        this.http.get<Account[]>(url).subscribe({
            next: (data) => (this.accounts = data),
            error: () => (this.accounts = [])
        });
    }

    // ─── Lease CRUD ──────────────────────────────────────────────────────────

    saveLease(): void {
        if (!this.form.accountId || !this.form.apartmentId || !this.form.buildingId ||
            !this.form.organizationId || !this.startDateObj || !this.endDateObj) {
            this.toast('warn', 'Champs manquants', 'Veuillez remplir tous les champs obligatoires.');
            return;
        }

        this.form.startDate = this.toISODate(this.startDateObj);
        this.form.endDate   = this.toISODate(this.endDateObj);

        this.saving = true;

        const request$ = this.editMode
            ? this.http.put<Lease>(`${this.API}/${this.form.id}`, this.form)
            : this.http.post<Lease>(this.API, this.form);

        request$.subscribe({
            next: () => {
                this.toast('success', 'Succès',
                    this.editMode ? 'Bail modifié.' : 'Bail ajouté.');
                this.closeDialog();
                this.loadLeases();
            },
            error: (err) => {
                this.toast('error', 'Erreur', err?.error?.message ?? 'Une erreur est survenue.');
            },
            complete: () => (this.saving = false)
        });
    }

    deleteLease(lease: Lease): void {
        if (!confirm(`Supprimer le bail de l'appartement "${lease.apartmentId}" ?`)) return;
        this.http.delete(`${this.API}/${lease.id}`).subscribe({
            next: () => {
                this.toast('success', 'Supprimé', 'Le bail a été supprimé.');
                this.loadLeases();
            },
            error: () => this.toast('error', 'Erreur', 'Suppression échouée.')
        });
    }

    onTenantOrRentChange(): void {
        this.tenantRiskResult = null;
        this.tenantRiskLoading = false;
        if (!this.form.accountId || !(this.form.monthlyRent > 0)) return;
        this.riskTrigger$.next({
            tenantAccountId: this.form.accountId,
            monthlyRent: this.form.monthlyRent
        });
    }

    openAddDialog(): void {
        this.editMode = false;
        this.form = this.emptyForm();
        if (this.authService.isSyndicAdmin()) {
            this.form.organizationId = this.authService.organizationId() ?? '';
        }
        this.startDateObj = null;
        this.endDateObj   = null;
        this.tenantRiskResult = null;
        this.dialogVisible = true;
    }

    openEditDialog(lease: Lease): void {
        this.editMode = true;
        this.form = { ...lease };
        this.startDateObj = lease.startDate ? new Date(lease.startDate) : null;
        this.endDateObj   = lease.endDate   ? new Date(lease.endDate)   : null;
        this.dialogVisible = true;
    }

    closeDialog(): void {
        this.dialogVisible = false;
        this.saving = false;
        this.tenantRiskResult = null;
    }

    // ─── Actions métier ──────────────────────────────────────────────────────

    activateLease(lease: Lease): void {
        this.http.patch<Lease>(`${this.API}/${lease.id}/activate`, {}).subscribe({
            next: () => {
                this.toast('success', 'Bail activé', 'Le bail est maintenant actif.');
                this.loadLeases();
            },
            error: (err) => this.toast('error', 'Activation impossible',
                err?.error?.message ?? 'Une erreur est survenue.')
        });
    }

    terminateLease(lease: Lease): void {
        if (!confirm(`Résilier le bail de l'appartement "${lease.apartmentId}" ? Cette action est irréversible.`)) return;
        this.http.patch<Lease>(`${this.API}/${lease.id}/terminate`, {}).subscribe({
            next: () => {
                this.toast('success', 'Bail résilié', 'Le bail a été résilié avec succès.');
                this.loadLeases();
            },
            error: (err) => this.toast('error', 'Résiliation impossible',
                err?.error?.message ?? 'Une erreur est survenue.')
        });
    }

    // ─── Inspection ──────────────────────────────────────────────────────────

    openInspectionDialog(lease: Lease): void {
        this.selectedLeaseForInspection = lease;
        this.selectedLeaseHasInitial = false;
        this.inspectionForm = this.emptyInspectionForm();
        this.inspectionForm.leaseId         = lease.id!;
        this.inspectionForm.apartmentId     = lease.apartmentId;
        this.inspectionForm.organizationId  = lease.organizationId;
        this.inspectionForm.tenantAccountId = lease.accountId;
        this.inspectionDateObj = new Date();

        // Vérifier si une inspection INITIAL existe déjà pour ce bail
        this.http.get<any[]>(`${this.INSPECTIONS_API}/lease/${lease.id}`).subscribe({
            next: (inspections) => {
                this.selectedLeaseHasInitial = inspections.some(i => i.inspectionType === 'INITIAL');
                if (this.selectedLeaseHasInitial) {
                    this.inspectionForm.inspectionType = 'FINAL';
                }
            },
            error: () => { this.selectedLeaseHasInitial = false; }
        });

        this.aiResult = null;
        this.inspectionDialogVisible = true;
    }

    closeInspectionDialog(): void {
        this.inspectionDialogVisible = false;
        this.selectedLeaseForInspection = null;
        this.selectedLeaseHasInitial = false;
        this.savingInspection = false;
        this.aiResult = null;
    }

    addItem(): void {
        this.inspectionForm.items.push({
            itemName: '',
            condition: 'ACCEPTABLE',
            notes: '',
            photosUrls: []
        });
    }

    removeItem(i: number): void {
        this.inspectionForm.items.splice(i, 1);
    }

    addDamage(): void {
        this.inspectionForm.damagesFound.push('');
    }

    removeDamage(i: number): void {
        this.inspectionForm.damagesFound.splice(i, 1);
    }

    // ─── Photo Upload ────────────────────────────────────────────────────────

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        this.uploadingPhotos = true;
        this.http.post<string[]>(this.UPLOAD_API, formData).subscribe({
            next: (urls) => {
                this.inspectionForm.photosUrls.push(...urls);
                this.toast('success', 'Photos ajoutées', `${urls.length} photo(s) uploadée(s).`);
            },
            error: () => this.toast('error', 'Erreur', 'L\'upload des photos a échoué.'),
            complete: () => {
                this.uploadingPhotos = false;
                event.target.value = '';
            }
        });
    }

    removePhoto(index: number): void {
        this.inspectionForm.photosUrls.splice(index, 1);
    }

    // ─── IA Analysis ─────────────────────────────────────────────────────────

    analyzeWithAi(): void {
        if (!this.inspectionForm.photosUrls.length) {
            this.toast('warn', 'Aucune photo', 'Veuillez d\'abord ajouter des photos.');
            return;
        }
        this.analyzingAi = true;
        this.aiResult = null;
        this.toast('info', 'Analyse en cours', 'L\'IA analyse vos photos...');

        this.fetchPhotosAsBlobs(this.inspectionForm.photosUrls).then(blobs => {
            const formData = new FormData();
            blobs.forEach((blob, i) => formData.append('photos', blob, `photo-${i}.jpg`));

            this.http.post<AiAnalysisResult>(this.AI_API, formData).subscribe({
                next: (result) => {
                    this.aiResult = result;
                    this.toast('success', 'Analyse terminée',
                        `Condition détectée: ${this.getConditionLabel(result.condition)}`);
                },
                error: (err) => this.toast('error', 'Erreur IA',
                    err?.error?.message ?? 'L\'analyse IA a échoué.'),
                complete: () => (this.analyzingAi = false)
            });
        }).catch(() => {
            this.toast('error', 'Erreur', 'Impossible de récupérer les photos.');
            this.analyzingAi = false;
        });
    }

    private async fetchPhotosAsBlobs(urls: string[]): Promise<Blob[]> {
        return Promise.all(urls.map(url => fetch(url).then(r => r.blob())));
    }

    applyAiResult(): void {
        if (!this.aiResult) return;

        this.inspectionForm.condition = this.aiResult.condition;

        const existing = this.inspectionForm.overallCondition?.trim() || '';
        this.inspectionForm.overallCondition = existing
            ? `${existing}\n\n[Analyse IA] ${this.aiResult.description}`
            : this.aiResult.description;

        if (this.aiResult.damagesDetected?.length) {
            this.inspectionForm.damagesFound.push(...this.aiResult.damagesDetected);
        }

        if (this.aiResult.estimatedCost > 0) {
            this.inspectionForm.costsEstimated = this.aiResult.estimatedCost;
        }

        this.toast('success', 'Appliqué', 'Les résultats IA ont été appliqués au formulaire.');
        this.aiResult = null;
    }

    // ─── Helpers condition/IA ────────────────────────────────────────────────

    getConditionLabel(c: string): string {
        return this.conditionOptions.find(o => o.value === c)?.label ?? c;
    }

    getConditionSeverity(c: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (c) {
            case 'EXCELLENT':  return 'success';
            case 'GOOD':       return 'info';
            case 'ACCEPTABLE': return 'warn';
            case 'POOR':       return 'danger';
            case 'DAMAGED':    return 'danger';
            default:           return 'secondary';
        }
    }

    saveInspection(): void {
        if (!this.inspectionDateObj) {
            this.toast('warn', 'Champs manquants', 'La date d\'inspection est obligatoire.');
            return;
        }
        this.inspectionForm.inspectionDate = this.toISODate(this.inspectionDateObj);
        this.savingInspection = true;

        this.http.post<LeaseInspection>(this.INSPECTIONS_API, this.inspectionForm).subscribe({
            next: () => {
                this.toast('success', 'Succès', 'Inspection créée avec succès.');
                this.closeInspectionDialog();
            },
            error: (err) => this.toast('error', 'Erreur',
                err?.error?.message ?? 'Création de l\'inspection échouée.'),
            complete: () => (this.savingInspection = false)
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
        switch (status) {
            case 'ACTIVE':     return 'success';
            case 'PENDING':    return 'warn';
            case 'EXPIRED':    return 'secondary';
            case 'TERMINATED': return 'danger';
            default:           return 'info';
        }
    }

    getOrganizationName(id: string): string {
        return this.organizations.find(o => o.id === id)?.name ?? '—';
    }

    getOrganizationObj(id: string): Organization | undefined {
        return this.organizations.find(o => o.id === id);
    }

    getAccountName(id: string): string {
        const acc = this.accounts.find(a => a.id === id);
        return acc ? `${acc.firstName} ${acc.lastName}` : '—';
    }

    getAccountEmail(id: string): string {
        return this.accounts.find(a => a.id === id)?.email ?? '—';
    }

    getDurationMonths(start: string, end: string): number {
        if (!start || !end) return 0;
        const s = new Date(start), e = new Date(end);
        return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
    }

    openLeaseDetails(lease: Lease): void {
        this.selectedLeaseDetails = lease;
        this.leaseDetailsVisible  = true;
    }

    printLease(lease: Lease): void {
        const org     = this.getOrganizationObj(lease.organizationId);
        const tenant  = this.getAccountName(lease.accountId);
        const email   = this.getAccountEmail(lease.accountId);
        const manager = this.getAccountName(org?.managerAccountId ?? '');
        const orgName = org?.name ?? '—';
        const addr    = `${org?.address ?? ''}, ${org?.city ?? ''}`;
        const months  = this.getDurationMonths(lease.startDate, lease.endDate);
        const fmt = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : '—';
        const cur = (v: any) => Number(v).toLocaleString('fr-FR', { style:'currency', currency:'TND', minimumFractionDigits:3 });
        const ref = (lease.id ?? '').substring(0, 8).toUpperCase();

        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Contrat de Location — ${ref}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e8e0d0;padding:40px 20px;font-family:Georgia,serif;color:#1a1208}
.page{max-width:780px;margin:0 auto;background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:64px 72px;position:relative}
.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:80px;font-weight:900;color:rgba(0,0,0,.03);white-space:nowrap;pointer-events:none;letter-spacing:8px}
.header{text-align:center;margin-bottom:36px;border-bottom:2px solid #8B7355;padding-bottom:24px}
.header .sub{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:10px}
.header h1{font-size:26px;font-weight:bold;letter-spacing:4px;text-transform:uppercase}
.meta{display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;margin-bottom:36px}
.section{margin-bottom:28px}
.section-title{font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.box{background:#f5f0e4;padding:14px 18px;border-radius:4px}
.box-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px}
.box-value{font-size:22px;font-weight:bold;text-align:center}
.clause{font-size:12px;color:#5a4e35;line-height:1.9;text-align:justify}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:28px;border-top:1px solid #d6c9a8;padding-top:28px}
.sig{text-align:center}
.sig-label{font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px}
.sig-line{border-bottom:1px solid #8B7355;height:52px;margin-bottom:8px}
.sig-name{font-size:12px;color:#4a3f2a}
.sig-hint{font-size:10px;color:#8B7355;margin-top:2px}
.footer{text-align:center;margin-top:28px;font-size:10px;color:#9e8c6d;border-top:1px dashed #d6c9a8;padding-top:12px}
@media print{body{background:white;padding:0}.page{box-shadow:none;border:none;padding:48px}}
</style></head><body>
<div class="page">
<div class="wm">CLOUD4SAYA</div>
<div class="header"><div class="sub">Gestion de Copropriété</div><h1>Contrat de Location</h1></div>
<div class="meta"><span>Référence : <strong>${ref}</strong></span><span>Statut : <strong>${lease.status}</strong></span></div>
<div class="section"><div class="section-title">Article I — Les Parties</div>
<div class="grid2">
<div><div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:8px">Le Bailleur</div>
<div style="font-size:14px;font-weight:bold;margin-bottom:4px">${orgName}</div>
<div style="font-size:13px;color:#4a3f2a">${addr}</div>
<div style="font-size:13px;color:#4a3f2a;margin-top:6px">Manager : <strong>${manager}</strong></div></div>
<div><div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:8px">Le Locataire</div>
<div style="font-size:14px;font-weight:bold;margin-bottom:4px">${tenant}</div>
<div style="font-size:13px;color:#4a3f2a">${email}</div>
<div style="font-size:12px;color:#8B7355;margin-top:6px">${lease.owner ? 'Propriétaire occupant' : 'Locataire'}</div></div>
</div></div>
<div class="section"><div class="section-title">Article II — Le Bien Loué</div>
<div class="grid2">
<div class="box"><div class="box-label">Appartement</div><div style="font-size:14px;font-weight:bold">${lease.apartmentId}</div></div>
<div class="box"><div class="box-label">Bâtiment / Résidence</div><div style="font-size:14px;font-weight:bold">${lease.buildingId}</div></div>
</div></div>
<div class="section"><div class="section-title">Article III — Durée du Contrat</div>
<div style="font-size:13px;line-height:2;color:#2a2010">Le présent contrat prend effet le <strong>${fmt(lease.startDate)}</strong> et se termine le <strong>${fmt(lease.endDate)}</strong>, soit une durée de <strong>${months} mois</strong>.</div></div>
<div class="section"><div class="section-title">Article IV — Conditions Financières</div>
<div class="grid2">
<div class="box" style="text-align:center"><div class="box-label">Loyer mensuel</div><div class="box-value">${cur(lease.monthlyRent)}</div></div>
<div class="box" style="text-align:center"><div class="box-label">Dépôt de garantie</div><div class="box-value">${cur(lease.depositAmount)}</div></div>
</div></div>
<div class="section"><div class="section-title">Article V — Clauses Générales</div>
<div class="clause">Le locataire s'engage à utiliser le bien loué conformément à sa destination et à l'entretenir en bon état. Toute modification structurelle est soumise à l'accord préalable écrit du bailleur. Le présent contrat est régi par les dispositions légales en vigueur relatives aux baux d'habitation. En cas de litige, les parties s'engagent à privilégier la voie amiable avant tout recours judiciaire.</div></div>
<div class="sigs"><div class="sig"><div class="sig-label">Pour le Bailleur</div><div class="sig-line"></div><div class="sig-name">${manager}</div><div class="sig-hint">Cachet & Signature</div></div>
<div class="sig"><div class="sig-label">Pour le Locataire</div><div class="sig-line"></div><div class="sig-name">${tenant}</div><div class="sig-hint">Lu et approuvé — Signature</div></div></div>
<div class="footer">Document généré par CLOUD4SAYA — Plateforme de gestion de copropriété</div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    }

    private toISODate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private emptyForm(): Lease {
        return {
            accountId: '',
            apartmentId: '',
            buildingId: '',
            organizationId: '',
            startDate: '',
            endDate: '',
            monthlyRent: 0,
            depositAmount: 0,
            status: 'PENDING',
            owner: false,
            contractFileUrl: ''
        };
    }

    private emptyInspectionForm(): LeaseInspection {
        return {
            leaseId: '',
            apartmentId: '',
            organizationId: '',
            inspectionType: 'INITIAL',
            inspectorAccountId: '',
            tenantAccountId: '',
            managerAccountId: '',
            inspectionDate: '',
            condition: 'ACCEPTABLE',
            items: [],
            overallCondition: '',
            damagesFound: [],
            costsEstimated: 0,
            photosUrls: [],
            reportUrl: '',
            signedBy: '',
            status: 'PENDING'
        };
    }

    private toast(severity: string, summary: string, detail: string): void {
        this.messageService.add({ severity, summary, detail, life: 3000 });
    }
}
