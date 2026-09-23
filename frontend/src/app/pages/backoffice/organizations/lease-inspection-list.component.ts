import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    LeaseInspection,
    InspectionItem,
    InspectionType,
    InspectionCondition,
    ItemCategory,
    LeaseInspectionStatus,
    ItemComparison,
    InspectionComparison
} from './lease-inspection.model';

interface Lease {
    id?: string;
    accountId: string;
    apartmentId: string;
    buildingId: string;
    organizationId: string;
}

interface Account {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AiAnalysisResult {
    condition: InspectionCondition;
    description: string;
    damagesDetected: string[];
    estimatedCost: number;
    confidence: number;
    recommendations: string;
}

@Component({
    selector: 'app-lease-inspection-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule, DataViewModule, ButtonModule, TagModule,
        DialogModule, InputTextModule, InputNumberModule, SelectModule,
        ToastModule, SelectButtonModule, DatePickerModule, TextareaModule,
        FileUploadModule, ProgressSpinnerModule, ProgressBarModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <!-- Hidden file inputs -->
        <input #fileInput type="file" accept="image/*" multiple (change)="onFileSelected($event)" class="hidden" />
        <input #itemFileInput type="file" accept="image/*" (change)="onItemFileSelected($event)" class="hidden" />

        <div class="flex flex-col gap-6">

            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-semibold text-2xl">Inspections de baux</div>
                    <p class="text-surface-500 dark:text-surface-400 text-sm mt-1">
                        {{ filteredInspections.length }} inspection(s) enregistrée(s)
                    </p>
                </div>
                <p-button *ngIf="!isResident" label="Ajouter une inspection" icon="pi pi-fw pi-address-book"
                    (onClick)="openAddDialog()"></p-button>
            </div>

            <div class="card">
                <p-dataview [value]="filteredInspections" [layout]="layout">

                    <ng-template #header>
                        <div class="flex flex-col gap-3">
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-xl">
                                    Liste des inspections
                                    <span class="text-sm font-normal text-surface-400 ml-2">
                                        ({{ filteredInspections.length }} / {{ inspections.length }})
                                    </span>
                                </span>
                                <p-select-button [(ngModel)]="layout" [options]="layoutOptions" [allowEmpty]="false">
                                    <ng-template #item let-option>
                                        <i class="pi" [ngClass]="{ 'pi-bars': option === 'list', 'pi-table': option === 'grid' }"></i>
                                    </ng-template>
                                </p-select-button>
                            </div>
                            <div class="flex flex-wrap gap-2 items-center">
                                <div class="relative flex-1 min-w-48">
                                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm"></i>
                                    <input pInputText [(ngModel)]="searchTerm"
                                        placeholder="Rechercher par appartement, bail, inspecteur..."
                                        class="w-full pl-9 text-sm" />
                                </div>
                                <p-select [(ngModel)]="filterType"
                                    [options]="[
                                        { label: 'Tous les types', value: null },
                                        { label: 'Initiale',       value: 'INITIAL' },
                                        { label: 'Finale',         value: 'FINAL' },
                                        { label: 'Routine',        value: 'ROUTINE' },
                                        { label: 'Dommages',       value: 'DAMAGE_REPORT' }
                                    ]"
                                    optionLabel="label" optionValue="value" [style]="{ minWidth: '160px' }" placeholder="Type">
                                </p-select>
                                <p-select [(ngModel)]="filterStatus"
                                    [options]="[
                                        { label: 'Tous les statuts', value: null },
                                        { label: 'En attente',       value: 'PENDING' },
                                        { label: 'Complétée',        value: 'COMPLETED' },
                                        { label: 'Contestée',        value: 'DISPUTED' }
                                    ]"
                                    optionLabel="label" optionValue="value" [style]="{ minWidth: '160px' }" placeholder="Statut">
                                </p-select>
                                <p-select [(ngModel)]="filterCondition"
                                    [options]="[
                                        { label: 'Toutes conditions', value: null },
                                        { label: 'Excellent',         value: 'EXCELLENT' },
                                        { label: 'Bon',               value: 'GOOD' },
                                        { label: 'Acceptable',        value: 'ACCEPTABLE' },
                                        { label: 'Mauvais',           value: 'POOR' },
                                        { label: 'Endommagé',         value: 'DAMAGED' }
                                    ]"
                                    optionLabel="label" optionValue="value" [style]="{ minWidth: '165px' }" placeholder="Condition">
                                </p-select>
                                <p-button *ngIf="searchTerm || filterType || filterStatus || filterCondition"
                                    icon="pi pi-times" label="Effacer" severity="secondary"
                                    [outlined]="true" size="small" (onClick)="clearFilters()">
                                </p-button>
                            </div>
                        </div>
                    </ng-template>

                    <!-- LIST VIEW -->
                    <ng-template #list let-items>
                        <div class="flex flex-col">
                            <div *ngFor="let insp of items; let i = index">
                                <div class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                                    [ngClass]="{ 'border-t border-surface': i !== 0 }">
                                    <div class="md:w-16 flex items-center justify-center">
                                        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-clipboard-check text-2xl text-primary"></i>
                                        </div>
                                    </div>
                                    <div class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-4">
                                        <div class="flex flex-col gap-1">
                                            <div class="text-lg font-semibold">
                                                Inspection — {{ getTypeLabel(insp.inspectionType) }}
                                            </div>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-home mr-1"></i>Apt. {{ insp.apartmentId }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-file-edit mr-1"></i>Bail : {{ getLeaseSummary(insp.leaseId) }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-calendar mr-1"></i>{{ insp.inspectionDate | date:'dd/MM/yyyy' }}
                                            </span>
                                            <span class="text-surface-500 dark:text-surface-400 text-sm">
                                                <i class="pi pi-user mr-1"></i>Inspecteur : {{ getAccountName(insp.inspectorAccountId) }}
                                            </span>
                                        </div>
                                        <div class="flex flex-col md:items-end gap-3">
                                            <div class="flex gap-2 flex-wrap justify-end">
                                                <p-tag [value]="getStatusLabel(insp.status)" [severity]="getStatusSeverity(insp.status)"></p-tag>
                                                <p-tag [value]="getConditionLabel(insp.condition)" [severity]="getConditionSeverity(insp.condition)"></p-tag>
                                                <p-tag *ngIf="insp.inspectionType === 'FINAL'" value="Comparaison dispo" severity="info"></p-tag>
                                            </div>
                                            <div class="text-sm text-surface-500">
                                                {{ insp.items?.length || 0 }} item(s) — Coûts : {{ (insp.costsEstimated || 0) | currency:'TND':'symbol':'1.2-2' }}
                                            </div>
                                            <div class="flex gap-2">
                                                <p-button icon="pi pi-eye" severity="info" [outlined]="true" size="small"
                                                    pTooltip="Voir le rapport" (onClick)="openInspectionDetails(insp)"></p-button>
                                                <p-button *ngIf="!isResident" icon="pi pi-pencil" [outlined]="true" size="small"
                                                    (onClick)="openEditDialog(insp)"></p-button>
                                                <p-button *ngIf="!isResident" icon="pi pi-trash" severity="danger" [outlined]="true" size="small"
                                                    (onClick)="deleteInspection(insp)"></p-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div *ngIf="inspections.length === 0" class="p-10 text-center text-surface-400">
                                <i class="pi pi-clipboard-check text-4xl mb-3 block"></i>
                                Aucune inspection trouvée.
                            </div>
                        </div>
                    </ng-template>

                    <!-- GRID VIEW -->
                    <ng-template #grid let-items>
                        <div class="grid grid-cols-12 gap-4">
                            <div *ngFor="let insp of items" class="col-span-12 sm:col-span-6 lg:col-span-4 p-2">
                                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col gap-4">
                                    <div class="flex items-center justify-between">
                                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <i class="pi pi-clipboard-check text-xl text-primary"></i>
                                        </div>
                                        <p-tag [value]="getStatusLabel(insp.status)" [severity]="getStatusSeverity(insp.status)"></p-tag>
                                    </div>
                                    <div>
                                        <div class="text-lg font-semibold">{{ getTypeLabel(insp.inspectionType) }}</div>
                                        <span class="text-surface-500 text-sm">Apt. {{ insp.apartmentId }}</span>
                                    </div>
                                    <div class="flex flex-col gap-2 text-sm text-surface-600 dark:text-surface-300">
                                        <div><i class="pi pi-calendar mr-2 text-surface-400"></i>{{ insp.inspectionDate | date:'dd/MM/yy' }}</div>
                                        <div><i class="pi pi-user mr-2 text-surface-400"></i>{{ getAccountName(insp.inspectorAccountId) }}</div>
                                        <div><i class="pi pi-list mr-2 text-surface-400"></i>{{ insp.items?.length || 0 }} item(s)</div>
                                        <div><i class="pi pi-wallet mr-2 text-surface-400"></i>{{ (insp.costsEstimated || 0) | currency:'TND':'symbol':'1.2-2' }}</div>
                                    </div>
                                    <div class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
                                        <p-tag [value]="getConditionLabel(insp.condition)" [severity]="getConditionSeverity(insp.condition)"></p-tag>
                                        <div class="flex gap-2">
                                            <p-button icon="pi pi-eye" severity="info" [outlined]="true" size="small"
                                                pTooltip="Voir le rapport" (onClick)="openInspectionDetails(insp)"></p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-pencil" [outlined]="true" size="small"
                                                (onClick)="openEditDialog(insp)"></p-button>
                                            <p-button *ngIf="!isResident" icon="pi pi-trash" severity="danger" [outlined]="true" size="small"
                                                (onClick)="deleteInspection(insp)"></p-button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div *ngIf="inspections.length === 0" class="col-span-12 p-10 text-center text-surface-400">
                                <i class="pi pi-clipboard-check text-4xl mb-3 block"></i>
                                Aucune inspection trouvée.
                            </div>
                        </div>
                    </ng-template>
                </p-dataview>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             DIALOG — ADD / EDIT
             ══════════════════════════════════════════════════════════ -->
        <p-dialog [(visible)]="dialogVisible"
            [header]="editMode ? 'Modifier l\\'inspection' : 'Ajouter une inspection'"
            [modal]="true" [style]="{ width: '860px' }" [closable]="true">

            <div class="flex flex-col gap-4 pt-2">

                <!-- Bail -->
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Bail <span class="text-red-500">*</span></label>
                    <p-select [(ngModel)]="form.leaseId" [options]="leases" optionValue="id"
                        placeholder="Sélectionner un bail" [filter]="true" [showClear]="true"
                        (onChange)="onLeaseChange($event)">
                        <ng-template #selectedItem let-l>Apt. {{ l.apartmentId }} — {{ getAccountName(l.accountId) }}</ng-template>
                        <ng-template #item let-l>Apt. {{ l.apartmentId }} — {{ getAccountName(l.accountId) }}</ng-template>
                    </p-select>
                </div>

                <!-- Avertissement INITIAL déjà existant -->
                <div *ngIf="hasInitialForSelectedLease"
                    class="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded">
                    <i class="pi pi-exclamation-triangle text-yellow-500 mt-0.5"></i>
                    <span class="text-sm text-yellow-800 dark:text-yellow-200">
                        Un état des lieux <strong>INITIAL</strong> existe déjà pour ce bail. Le type INITIAL est désactivé.
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Type <span class="text-red-500">*</span></label>
                        <p-select [(ngModel)]="form.inspectionType" [options]="availableInspectionTypes"
                            optionLabel="label" optionValue="value"
                            (onChange)="onInspectionTypeChange($event.value)"></p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Date <span class="text-red-500">*</span></label>
                        <p-datepicker [(ngModel)]="inspectionDateObj" dateFormat="yy-mm-dd" [showIcon]="true"></p-datepicker>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Inspecteur</label>
                        <p-select [(ngModel)]="form.inspectorAccountId" [options]="accounts"
                            optionValue="id" [filter]="true" [showClear]="true">
                            <ng-template #selectedItem let-a>{{ a.firstName }} {{ a.lastName }}</ng-template>
                            <ng-template #item let-a>{{ a.firstName }} {{ a.lastName }} — {{ a.email }}</ng-template>
                        </p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Manager</label>
                        <p-select [(ngModel)]="form.managerAccountId" [options]="accounts"
                            optionValue="id" [filter]="true" [showClear]="true">
                            <ng-template #selectedItem let-a>{{ a.firstName }} {{ a.lastName }}</ng-template>
                            <ng-template #item let-a>{{ a.firstName }} {{ a.lastName }} — {{ a.email }}</ng-template>
                        </p-select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Condition globale</label>
                        <p-select [(ngModel)]="form.condition" [options]="conditionOptions"
                            optionLabel="label" optionValue="value"></p-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Statut</label>
                        <p-select [(ngModel)]="form.status" [options]="inspectionStatusOptions"
                            optionLabel="label" optionValue="value"></p-select>
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Description générale</label>
                    <textarea pTextarea [(ngModel)]="form.overallCondition" rows="2"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Coûts estimés (TND)</label>
                        <p-inputnumber [(ngModel)]="form.costsEstimated" [minFractionDigits]="2" [maxFractionDigits]="2"></p-inputnumber>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-sm">Signé par</label>
                        <input pInputText [(ngModel)]="form.signedBy" />
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">URL du rapport PDF</label>
                    <input pInputText [(ngModel)]="form.reportUrl" placeholder="https://..." />
                </div>

                <!-- SECTION PHOTOS GLOBALES + IA GLOBALE -->
                <div class="flex flex-col gap-3 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <label class="font-semibold flex items-center gap-2">
                            <i class="pi pi-image"></i>
                            Photos générales
                            <span class="text-sm text-surface-500 font-normal">({{ form.photosUrls.length }})</span>
                        </label>
                        <div class="flex gap-2">
                            <p-button icon="pi pi-upload" label="Ajouter des photos" size="small" [outlined]="true"
                                [loading]="uploadingPhotos" (onClick)="fileInput.click()">
                            </p-button>
                            <p-button icon="pi pi-sparkles" label="Analyser avec IA" size="small" severity="help"
                                [loading]="analyzingAi" [disabled]="!form.photosUrls.length"
                                (onClick)="analyzeWithAi()">
                            </p-button>
                        </div>
                    </div>

                    <div *ngIf="form.photosUrls.length" class="grid grid-cols-4 gap-3">
                        <div *ngFor="let url of form.photosUrls; let i = index"
                            class="relative group border border-surface-200 dark:border-surface-700 rounded overflow-hidden aspect-square">
                            <img [src]="url" alt="Photo inspection" class="w-full h-full object-cover" />
                            <button type="button" (click)="removePhoto(i)"
                                class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="pi pi-times text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div *ngIf="!form.photosUrls.length"
                        class="text-center py-4 text-surface-400 border border-dashed border-surface-300 dark:border-surface-700 rounded">
                        <i class="pi pi-image text-2xl block mb-1"></i>
                        <span class="text-sm">Aucune photo générale</span>
                    </div>

                    <!-- Résultat IA globale -->
                    <div *ngIf="aiResult" class="p-4 rounded border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 flex flex-col gap-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-sparkles text-purple-600 text-xl"></i>
                                <span class="font-semibold text-purple-900 dark:text-purple-200">Analyse IA globale</span>
                                <p-tag [value]="'Confiance: ' + aiResult.confidence + '%'"
                                    [severity]="aiResult.confidence >= 70 ? 'success' : aiResult.confidence >= 40 ? 'warn' : 'danger'">
                                </p-tag>
                            </div>
                            <p-button icon="pi pi-times" [text]="true" size="small" severity="secondary" (onClick)="aiResult = null"></p-button>
                        </div>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="font-medium text-surface-600 dark:text-surface-300">Condition :</span>
                                <p-tag [value]="getConditionLabel(aiResult.condition)" [severity]="getConditionSeverity(aiResult.condition)" class="ml-2"></p-tag>
                            </div>
                            <div>
                                <span class="font-medium text-surface-600 dark:text-surface-300">Coût estimé :</span>
                                <span class="ml-2 font-semibold">{{ aiResult.estimatedCost | currency:'TND':'symbol':'1.2-2' }}</span>
                            </div>
                        </div>
                        <p class="text-sm">{{ aiResult.description }}</p>
                        <div *ngIf="aiResult.damagesDetected.length">
                            <div class="font-medium text-surface-600 dark:text-surface-300 text-sm mb-1">Dommages détectés :</div>
                            <ul class="list-disc list-inside text-sm space-y-1">
                                <li *ngFor="let d of aiResult.damagesDetected">{{ d }}</li>
                            </ul>
                        </div>
                        <p *ngIf="aiResult.recommendations" class="text-sm italic">{{ aiResult.recommendations }}</p>
                        <div class="flex justify-end pt-2 border-t border-purple-200 dark:border-purple-800">
                            <p-button icon="pi pi-check" label="Appliquer au formulaire" size="small" (onClick)="applyAiResult()"></p-button>
                        </div>
                    </div>
                </div>

                <!-- DOMMAGES -->
                <div class="flex flex-col gap-2 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div class="flex items-center justify-between">
                        <label class="font-medium text-sm">Dommages trouvés</label>
                        <p-button icon="pi pi-plus" size="small" [text]="true" label="Ajouter" (onClick)="addDamage()"></p-button>
                    </div>
                    <div *ngFor="let d of form.damagesFound; let i = index" class="flex gap-2">
                        <input pInputText [(ngModel)]="form.damagesFound[i]" class="flex-1" placeholder="Description" />
                        <p-button icon="pi pi-times" severity="danger" [text]="true" (onClick)="removeDamage(i)"></p-button>
                    </div>
                </div>

                <!-- ITEMS INSPECTÉS -->
                <div class="flex flex-col gap-3 border-t border-surface-200 dark:border-surface-700 pt-4">
                    <div class="flex items-center justify-between">
                        <label class="font-semibold flex items-center gap-2">
                            <i class="pi pi-list"></i>
                            Items inspectés
                            <span class="text-sm font-normal text-surface-400">({{ form.items.length }})</span>
                        </label>
                        <div class="flex gap-2">
                            <p-button *ngIf="form.inspectionType === 'FINAL' && form.leaseId"
                                icon="pi pi-download" label="Charger depuis INITIAL"
                                size="small" severity="secondary" [outlined]="true"
                                [loading]="loadingInitialItems"
                                (onClick)="loadInitialItemsForFinal(true)"
                                pTooltip="Charge les items de l'inspection INITIAL (écrase les items actuels)">
                            </p-button>
                            <p-button icon="pi pi-plus" size="small" label="Ajouter un item" (onClick)="addItem()"></p-button>
                        </div>
                    </div>

                    <!-- Bandeau info si FINAL -->
                    <div *ngIf="form.inspectionType === 'FINAL' && form.items.length > 0"
                        class="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-800 dark:text-blue-200">
                        <i class="pi pi-info-circle"></i>
                        Inspection FINAL : mettez à jour l'état de chaque item. Les items marqués <strong>MISSING</strong> seront comptabilisés dans la déduction caution.
                    </div>

                    <div *ngFor="let item of form.items; let i = index"
                        class="p-3 border border-surface-200 dark:border-surface-700 rounded flex flex-col gap-2"
                        [ngClass]="{ 'border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-950/10': item.aiAnalyzed }">

                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-sm">Item #{{ i + 1 }}</span>
                                <p-tag *ngIf="item.aiAnalyzed" value="IA" severity="secondary" [rounded]="true"></p-tag>
                                <span *ngIf="item.photosUrls.length" class="text-xs text-surface-500">
                                    <i class="pi pi-image mr-1"></i>{{ item.photosUrls.length }} photo(s)
                                </span>
                            </div>
                            <div class="flex items-center gap-1">
                                <!-- Upload photo de l'item -->
                                <p-button
                                    icon="pi pi-camera"
                                    size="small"
                                    [text]="true"
                                    severity="secondary"
                                    pTooltip="Ajouter une photo à cet item"
                                    (onClick)="triggerItemPhoto(i, itemFileInput)">
                                </p-button>
                                <!-- Analyser l'item avec IA -->
                                <p-button
                                    icon="pi pi-sparkles"
                                    size="small"
                                    [text]="true"
                                    severity="help"
                                    pTooltip="Analyser cet item avec l'IA"
                                    [disabled]="!item.photosUrls.length || !item.itemName"
                                    [loading]="analyzingItemIndex === i"
                                    (onClick)="analyzeItemWithAi(i)">
                                </p-button>
                                <p-button icon="pi pi-trash" severity="danger" [text]="true" size="small"
                                    (onClick)="removeItem(i)"></p-button>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2">
                            <input pInputText [(ngModel)]="item.itemName" placeholder="Nom (ex: Télévision, Lave-linge...)" />
                            <p-select [(ngModel)]="item.category" [options]="categoryOptions"
                                optionLabel="label" optionValue="value" placeholder="Catégorie"></p-select>
                            <p-select [(ngModel)]="item.condition" [options]="conditionOptionsWithMissing"
                                optionLabel="label" optionValue="value"></p-select>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <textarea pTextarea [(ngModel)]="item.notes" rows="1" placeholder="Observations..."></textarea>
                            <div class="flex flex-col gap-1">
                                <label class="text-xs text-surface-500">Coût réparation estimé (TND)</label>
                                <p-inputnumber [(ngModel)]="item.estimatedRepairCost"
                                    [minFractionDigits]="2" [maxFractionDigits]="2" placeholder="0.00"></p-inputnumber>
                            </div>
                        </div>

                        <!-- Miniatures photos de l'item -->
                        <div *ngIf="item.photosUrls.length" class="flex gap-2 flex-wrap">
                            <div *ngFor="let url of item.photosUrls; let pi = index"
                                class="relative group w-14 h-14 border border-surface-200 dark:border-surface-700 rounded overflow-hidden">
                                <img [src]="url" class="w-full h-full object-cover" />
                                <button type="button" (click)="removeItemPhoto(i, pi)"
                                    class="absolute top-0 right-0 bg-red-500 text-white rounded-bl w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="pi pi-times text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="form.items.length === 0"
                        class="text-center py-6 text-surface-400 border border-dashed border-surface-300 dark:border-surface-700 rounded">
                        <i class="pi pi-list text-3xl block mb-2"></i>
                        <span class="text-sm">Aucun item ajouté. Cliquez sur "Ajouter un item" ou chargez depuis INITIAL.</span>
                    </div>
                </div>
            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <p-button label="Annuler" [outlined]="true" (onClick)="closeDialog()"></p-button>
                    <p-button [label]="editMode ? 'Modifier' : 'Ajouter'" [loading]="saving" (onClick)="saveInspection()"></p-button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- ══════════════════════════════════════════════════════════
             DIALOG — PROCÈS-VERBAL D'ÉTAT DES LIEUX
             ══════════════════════════════════════════════════════════ -->
        <p-dialog [(visible)]="inspectionDetailsVisible" [modal]="true" [closable]="true"
            [style]="{ width: '860px', maxWidth: '98vw' }"
            [contentStyle]="{ padding: '0', background: '#f0ece4' }" header=" ">

            <ng-container *ngIf="selectedInspectionDetails">
                <div style="background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,.18);margin:24px;padding:48px 56px;font-family:Georgia,serif;color:#1a1208;position:relative;overflow:hidden;">
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:90px;font-weight:900;color:rgba(0,0,0,.03);white-space:nowrap;pointer-events:none;user-select:none;letter-spacing:8px;">CLOUD4SAYA</div>

                    <!-- EN-TÊTE -->
                    <div style="text-align:center;margin-bottom:32px;">
                        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:10px;">Gestion de Copropriété</div>
                        <div style="font-size:24px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#1a1208;margin-bottom:4px;">Procès-Verbal d'État des Lieux</div>
                        <div style="font-size:14px;color:#8B7355;margin-top:4px;">{{ getTypeLabel(selectedInspectionDetails.inspectionType) }}</div>
                        <div style="width:60px;height:3px;background:#8B7355;margin:14px auto 0;"></div>
                    </div>

                    <!-- MÉTA -->
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;margin-bottom:32px;">
                        <span>Réf. : <strong style="color:#1a1208;">{{ (selectedInspectionDetails.id ?? '').substring(0,8).toUpperCase() }}</strong></span>
                        <span>Date : <strong style="color:#1a1208;">{{ selectedInspectionDetails.inspectionDate | date:'dd/MM/yyyy' }}</strong></span>
                        <span>Statut : <strong [style.color]="selectedInspectionDetails.status==='COMPLETED'?'#2e7d32':selectedInspectionDetails.status==='PENDING'?'#e65100':'#b71c1c'">{{ getStatusLabel(selectedInspectionDetails.status) }}</strong></span>
                    </div>

                    <!-- ARTICLE I — IDENTIFICATION -->
                    <div style="margin-bottom:24px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:14px;">Article I — Identification</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
                            <div style="display:flex;flex-direction:column;gap:6px;">
                                <div><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8B7355;">Appartement</span><br><strong>{{ selectedInspectionDetails.apartmentId }}</strong></div>
                                <div><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8B7355;">Bail concerné</span><br><strong>{{ getLeaseSummary(selectedInspectionDetails.leaseId) }}</strong></div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:6px;">
                                <div><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8B7355;">Inspecteur</span><br><strong>{{ getAccountName(selectedInspectionDetails.inspectorAccountId) }}</strong></div>
                                <div><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8B7355;">Locataire</span><br><strong>{{ getAccountName(selectedInspectionDetails.tenantAccountId) }}</strong></div>
                            </div>
                        </div>
                    </div>

                    <!-- ARTICLE II — ÉTAT GÉNÉRAL -->
                    <div style="margin-bottom:24px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:14px;">Article II — État Général du Logement</div>
                        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
                            <div style="background:#f5f0e4;padding:10px 20px;border-radius:4px;text-align:center;">
                                <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Condition globale</div>
                                <div style="font-size:16px;font-weight:bold;">{{ getConditionLabel(selectedInspectionDetails.condition) }}</div>
                            </div>
                        </div>
                        <div *ngIf="selectedInspectionDetails.overallCondition" style="font-size:13px;color:#4a3f2a;line-height:1.8;background:#f5f0e4;padding:12px 16px;border-radius:4px;">
                            {{ selectedInspectionDetails.overallCondition }}
                        </div>
                    </div>

                    <!-- ARTICLE III — ÉLÉMENTS INSPECTÉS -->
                    <div *ngIf="selectedInspectionDetails.items.length" style="margin-bottom:24px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:14px;">Article III — Éléments Inspectés</div>
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <thead>
                                <tr style="background:#f5f0e4;">
                                    <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Élément</th>
                                    <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Catégorie</th>
                                    <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">État</th>
                                    <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Observations</th>
                                    <th style="text-align:right;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;">Coût rép.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let item of selectedInspectionDetails.items; let odd = odd" [style.background]="odd ? '#f9f6ef' : 'white'">
                                    <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3;">
                                        {{ item.itemName }}
                                        <span *ngIf="item.aiAnalyzed" style="font-size:10px;color:#7c3aed;margin-left:6px;">✨ IA</span>
                                    </td>
                                    <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;color:#5a4e35;font-size:11px;">{{ getCategoryLabel(item.category) }}</td>
                                    <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;">{{ getConditionLabel(item.condition) }}</td>
                                    <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3;">{{ item.notes || '—' }}</td>
                                    <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #ede6d3;">
                                        {{ item.estimatedRepairCost ? (item.estimatedRepairCost | currency:'TND':'symbol':'1.2-2') : '—' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- ARTICLE IV — DOMMAGES -->
                    <div *ngIf="selectedInspectionDetails.damagesFound.length" style="margin-bottom:24px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:14px;">Article IV — Dommages Constatés</div>
                        <ul style="padding-left:20px;font-size:13px;color:#4a3f2a;line-height:1.9;">
                            <li *ngFor="let dmg of selectedInspectionDetails.damagesFound">{{ dmg }}</li>
                        </ul>
                    </div>

                    <!-- ARTICLE V — ESTIMATION FINANCIÈRE -->
                    <div style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:14px;">Article V — Estimation Financière</div>
                        <div style="background:#f5f0e4;padding:16px;border-radius:4px;text-align:center;display:inline-block;min-width:200px;">
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:6px;">Coûts estimés</div>
                            <div style="font-size:22px;font-weight:bold;">{{ (selectedInspectionDetails.costsEstimated || 0) | currency:'TND':'symbol':'1.3-3' }}</div>
                        </div>
                    </div>

                    <!-- ARTICLE VI — COMPARAISON INITIAL → FINAL (visible seulement sur inspection FINAL) -->
                    <div *ngIf="selectedInspectionDetails.inspectionType === 'FINAL'" style="margin-bottom:28px;">
                        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:6px;margin-bottom:14px;">
                            Article VI — Comparaison État des Lieux (INITIAL → FINAL)
                        </div>

                        <div *ngIf="loadingComparison" style="text-align:center;padding:20px;color:#8B7355;">
                            Chargement de la comparaison...
                        </div>

                        <div *ngIf="!loadingComparison && !comparisonData" style="text-align:center;padding:16px;color:#8B7355;background:#f5f0e4;border-radius:4px;">
                            Aucune inspection INITIAL trouvée pour ce bail.
                        </div>

                        <ng-container *ngIf="!loadingComparison && comparisonData">
                            <!-- Score global de dégradation -->
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
                                <div style="background:#f5f0e4;padding:14px;border-radius:4px;text-align:center;">
                                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Score dégradation</div>
                                    <div style="font-size:22px;font-weight:bold;"
                                        [style.color]="comparisonData.degradationScore >= 60 ? '#b71c1c' : comparisonData.degradationScore >= 30 ? '#e65100' : '#2e7d32'">
                                        {{ comparisonData.degradationScore }}%
                                    </div>
                                </div>
                                <div style="background:#f5f0e4;padding:14px;border-radius:4px;text-align:center;">
                                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Items dégradés</div>
                                    <div style="font-size:22px;font-weight:bold;color:#e65100;">
                                        {{ comparisonData.degradedItems }} / {{ comparisonData.totalItems }}
                                    </div>
                                </div>
                                <div style="background:#ffeaea;padding:14px;border-radius:4px;text-align:center;border:1px solid #ffcdd2;">
                                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8B7355;margin-bottom:4px;">Déduction caution estimée</div>
                                    <div style="font-size:20px;font-weight:bold;color:#b71c1c;">
                                        {{ comparisonData.totalEstimatedDeduction | currency:'TND':'symbol':'1.2-2' }}
                                    </div>
                                </div>
                            </div>

                            <!-- Tableau comparatif item par item -->
                            <table *ngIf="comparisonData.itemComparisons.length" style="width:100%;border-collapse:collapse;font-size:12px;">
                                <thead>
                                    <tr style="background:#ede6f7;">
                                        <th style="text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;border-bottom:1px solid #d6c9a8;">Élément</th>
                                        <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;border-bottom:1px solid #d6c9a8;">État initial</th>
                                        <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;border-bottom:1px solid #d6c9a8;">État final</th>
                                        <th style="text-align:center;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;border-bottom:1px solid #d6c9a8;">Évolution</th>
                                        <th style="text-align:right;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7c3aed;border-bottom:1px solid #d6c9a8;">Déduction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let cmp of comparisonData.itemComparisons; let odd = odd"
                                        [style.background]="cmp.missing ? '#fff0f0' : cmp.degraded ? '#fff8e6' : (odd ? '#f9f6ef' : 'white')">
                                        <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3;">{{ cmp.itemName }}</td>
                                        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;">{{ getConditionLabel(cmp.initialCondition) }}</td>
                                        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;"
                                            [style.color]="cmp.missing ? '#b71c1c' : cmp.degraded ? '#e65100' : '#2e7d32'">
                                            <strong>{{ getConditionLabel(cmp.finalCondition) }}</strong>
                                        </td>
                                        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;">
                                            <span *ngIf="cmp.missing" style="color:#b71c1c;font-weight:bold;">❌ Manquant</span>
                                            <span *ngIf="!cmp.missing && cmp.degraded" style="color:#e65100;">↘ Dégradé</span>
                                            <span *ngIf="!cmp.missing && !cmp.degraded" style="color:#2e7d32;">✓ OK</span>
                                        </td>
                                        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #ede6d3;font-weight:bold;"
                                            [style.color]="cmp.estimatedDeduction > 0 ? '#b71c1c' : '#2e7d32'">
                                            {{ cmp.estimatedDeduction > 0 ? (cmp.estimatedDeduction | currency:'TND':'symbol':'1.2-2') : '—' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </ng-container>
                    </div>

                    <!-- SIGNATURES -->
                    <div style="border-top:1px solid #d6c9a8;padding-top:28px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;">
                            <div style="text-align:center;">
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px;">L'Inspecteur</div>
                                <div style="border-bottom:1px solid #8B7355;height:48px;margin-bottom:8px;"></div>
                                <div style="font-size:12px;color:#4a3f2a;">{{ getAccountName(selectedInspectionDetails.inspectorAccountId) }}</div>
                                <div style="font-size:10px;color:#8B7355;margin-top:2px;">Signature</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px;">Le Locataire</div>
                                <div style="border-bottom:1px solid #8B7355;height:48px;margin-bottom:8px;"></div>
                                <div style="font-size:12px;color:#4a3f2a;">{{ getAccountName(selectedInspectionDetails.tenantAccountId) }}</div>
                                <div style="font-size:10px;color:#8B7355;margin-top:2px;">Lu et approuvé — Signature</div>
                            </div>
                        </div>
                    </div>

                    <div style="text-align:center;margin-top:28px;font-size:10px;color:#9e8c6d;border-top:1px dashed #d6c9a8;padding-top:12px;">
                        Document généré par CLOUD4SAYA — Plateforme de gestion de copropriété
                    </div>
                </div>
            </ng-container>

            <ng-template #footer>
                <div class="flex justify-between items-center px-6 py-3">
                    <p-button icon="pi pi-print" label="Imprimer / Exporter PDF"
                        severity="secondary" [outlined]="true"
                        (onClick)="printInspection(selectedInspectionDetails!)">
                    </p-button>
                    <p-button label="Fermer" (onClick)="inspectionDetailsVisible = false"></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class LeaseInspectionListComponent implements OnInit {

    private readonly API            = 'http://localhost:8089/api/lease-inspections';
    private readonly LEASES_API     = 'http://localhost:8089/api/leases';
    private readonly ACCOUNTS_API   = 'http://localhost:8089/admin/accounts';
    private readonly MY_MEMBERS_API = 'http://localhost:8089/api/organizations/my-members';
    private readonly UPLOAD_API     = 'http://localhost:8089/api/uploads/inspection-photos';
    private readonly AI_API         = 'http://localhost:8089/api/ai/analyze-inspection';
    private readonly AI_ITEM_API    = 'http://localhost:8089/api/ai/analyze-item';

    inspections: LeaseInspection[] = [];
    leases: Lease[] = [];
    accounts: Account[] = [];

    layout: 'list' | 'grid' = 'list';
    layoutOptions = ['list', 'grid'];

    // ─── Recherche & filtres ────────────────────────────────────────────────────
    searchTerm      = '';
    filterType:      string | null = null;
    filterStatus:    string | null = null;
    filterCondition: string | null = null;

    get filteredInspections(): LeaseInspection[] {
        const term = this.searchTerm.toLowerCase().trim();
        return this.inspections.filter(insp => {
            const matchText = !term ||
                (insp.apartmentId || '').toLowerCase().includes(term) ||
                (insp.leaseId     || '').toLowerCase().includes(term) ||
                this.getAccountName(insp.inspectorAccountId).toLowerCase().includes(term);
            const matchType      = !this.filterType      || insp.inspectionType === this.filterType;
            const matchStatus    = !this.filterStatus    || insp.status          === this.filterStatus;
            const matchCondition = !this.filterCondition || insp.condition        === this.filterCondition;
            return matchText && matchType && matchStatus && matchCondition;
        });
    }

    clearFilters(): void {
        this.searchTerm      = '';
        this.filterType      = null;
        this.filterStatus    = null;
        this.filterCondition = null;
    }

    inspectionDetailsVisible    = false;
    selectedInspectionDetails: LeaseInspection | null = null;
    comparisonData: InspectionComparison | null = null;
    loadingComparison = false;

    dialogVisible = false;
    editMode      = false;
    saving        = false;

    uploadingPhotos    = false;
    analyzingAi        = false;
    aiResult: AiAnalysisResult | null = null;

    analyzingItemIndex: number | null = null;
    activeItemIndex:    number | null = null;
    loadingInitialItems = false;

    hasInitialForSelectedLease = false;

    form: LeaseInspection = this.emptyForm();
    inspectionDateObj: Date | null = null;

    inspectionTypeOptions = [
        { label: 'Initiale',  value: 'INITIAL' },
        { label: 'Finale',    value: 'FINAL' },
        { label: 'Routine',   value: 'ROUTINE' },
        { label: 'Dommages',  value: 'DAMAGE_REPORT' }
    ];

    get availableInspectionTypes() {
        return this.hasInitialForSelectedLease
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

    conditionOptionsWithMissing = [
        ...this.conditionOptions,
        { label: 'Manquant', value: 'MISSING' }
    ];

    categoryOptions = [
        { label: 'Électroménager',  value: 'ELECTROMENAGER', icon: 'pi pi-bolt' },
        { label: 'Mobilier',        value: 'MOBILIER',        icon: 'pi pi-objects-column' },
        { label: 'Équipement',      value: 'EQUIPEMENT',      icon: 'pi pi-wrench' },
        { label: 'Sanitaire',       value: 'SANITAIRE',       icon: 'pi pi-droplet' },
        { label: 'Menuiserie',      value: 'MENUISERIE',      icon: 'pi pi-th-large' },
        { label: 'Autre',           value: 'AUTRE',           icon: 'pi pi-tag' }
    ];

    inspectionStatusOptions = [
        { label: 'En attente', value: 'PENDING' },
        { label: 'Complétée',  value: 'COMPLETED' },
        { label: 'Contestée',  value: 'DISPUTED' }
    ];

    get isResident(): boolean      { return this.authService.isResident(); }
    get isPlatformAdmin(): boolean { return this.authService.isPlatformAdmin(); }

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadInspections();
        this.loadLeases();
        this.loadAccounts();
    }

    loadInspections(): void {
        this.http.get<LeaseInspection[]>(this.API).subscribe({
            next: (data) => (this.inspections = data),
            error: () => (this.inspections = [])
        });
    }

    loadLeases(): void {
        this.http.get<Lease[]>(this.LEASES_API).subscribe({
            next: (data) => (this.leases = data),
            error: () => this.toast('error', 'Erreur', 'Impossible de charger les baux.')
        });
    }

    loadAccounts(): void {
        const url = this.authService.isPlatformAdmin() ? this.ACCOUNTS_API : this.MY_MEMBERS_API;
        this.http.get<Account[]>(url).subscribe({
            next: (data) => (this.accounts = data),
            error: () => (this.accounts = [])
        });
    }

    // ─── Sélection du bail ──────────────────────────────────────────────────────

    onLeaseChange(event: any): void {
        const lease = this.leases.find(l => l.id === event.value);
        if (lease) {
            this.form.apartmentId     = lease.apartmentId;
            this.form.organizationId  = lease.organizationId;
            this.form.tenantAccountId = lease.accountId;
        }

        if (!event.value) {
            this.hasInitialForSelectedLease = false;
            this.form.items = [];
            return;
        }

        // Un seul appel HTTP : on récupère les inspections du bail
        // et on extrait les items de l'INITIAL directement dans cette même réponse
        this.http.get<any[]>(`${this.API}/lease/${event.value}`).subscribe({
            next: (inspections) => {
                const initialInsp = inspections.find((i: any) => i.inspectionType === 'INITIAL');
                this.hasInitialForSelectedLease = !!initialInsp;

                if (this.hasInitialForSelectedLease && this.form.inspectionType === 'INITIAL') {
                    this.form.inspectionType = 'FINAL';
                    this.toast('warn', 'Inspection INITIAL déjà existante',
                        'Le type a été changé en FINAL. Les items de l\'inspection initiale ont été chargés.');
                }

                // Pré-remplir les items depuis l'INITIAL dès maintenant (même réponse HTTP)
                if (this.form.inspectionType === 'FINAL' && initialInsp) {
                    this.populateItemsFromInitial(initialInsp.items || []);
                }
            },
            error: () => { this.hasInitialForSelectedLease = false; }
        });
    }

    onInspectionTypeChange(type: string): void {
        if (type === 'FINAL' && this.form.leaseId) {
            // Recharger depuis le serveur si le type est changé manuellement
            this.loadInitialItemsForFinal();
        }
    }

    private populateItemsFromInitial(initialItems: any[]): void {
        if (!initialItems || initialItems.length === 0) {
            this.toast('warn', 'Aucun item',
                'L\'inspection INITIAL ne contient aucun item. Ajoutez-en manuellement.');
            return;
        }
        this.form.items = initialItems.map((item: any) => ({
            id: item.id ?? null,
            itemName: item.itemName,
            category: (item.category ?? 'AUTRE') as ItemCategory,
            condition: 'ACCEPTABLE' as InspectionCondition,
            notes: '',
            photosUrls: [],
            estimatedRepairCost: 0,
            aiAnalyzed: false
        }));
        this.toast('success', `${initialItems.length} item(s) pré-chargé(s)`,
            'Items de l\'état des lieux INITIAL importés. Modifiez leur état selon l\'état actuel.');
    }

    // ─── Chargement auto des items INITIAL pour l'inspection FINAL ──────────────

    loadInitialItemsForFinal(forceOverwrite = false): void {
        if (!this.form.leaseId) return;

        // Si items existent déjà et que ce n'est pas un chargement forcé → demander confirmation
        if (!forceOverwrite && this.form.items?.length > 0) {
            if (!confirm(`${this.form.items.length} item(s) déjà présent(s). Remplacer par les items de l'inspection INITIAL ?`)) return;
        }

        this.loadingInitialItems = true;
        this.http.get<InspectionItem[]>(`${this.API}/lease/${this.form.leaseId}/initial-items`).subscribe({
            next: (items) => {
                this.loadingInitialItems = false;
                if (items.length === 0) {
                    this.toast('warn', 'Aucun item', 'L\'inspection INITIAL ne contient aucun item.');
                    return;
                }
                this.form.items = items.map(item => ({
                    id: item.id,
                    itemName: item.itemName,
                    category: (item.category ?? 'AUTRE') as ItemCategory,
                    condition: 'ACCEPTABLE' as InspectionCondition,
                    notes: '',
                    photosUrls: [],
                    estimatedRepairCost: 0,
                    aiAnalyzed: false
                }));
                this.toast('success', `${items.length} item(s) chargé(s)`,
                    'Items importés depuis l\'inspection INITIAL. Mettez à jour leur état avant de sauvegarder.');
            },
            error: () => {
                this.loadingInitialItems = false;
                this.toast('error', 'Erreur', 'Impossible de charger les items de l\'inspection INITIAL.');
            }
        });
    }

    // ─── Photos globales ─────────────────────────────────────────────────────────

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
                if (!this.form.photosUrls) this.form.photosUrls = [];
                this.form.photosUrls.push(...urls);
                this.toast('success', 'Photos ajoutées', `${urls.length} photo(s) uploadée(s).`);
            },
            error: () => this.toast('error', 'Erreur', 'L\'upload des photos a échoué.'),
            complete: () => { this.uploadingPhotos = false; event.target.value = ''; }
        });
    }

    removePhoto(index: number): void {
        this.form.photosUrls.splice(index, 1);
    }

    // ─── Photos par item ─────────────────────────────────────────────────────────

    triggerItemPhoto(index: number, input: HTMLInputElement): void {
        this.activeItemIndex = index;
        input.value = '';
        input.click();
    }

    onItemFileSelected(event: any): void {
        const file: File = event.target.files?.[0];
        if (!file || this.activeItemIndex === null) return;

        const formData = new FormData();
        formData.append('files', file);

        this.http.post<string[]>(this.UPLOAD_API, formData).subscribe({
            next: (urls) => {
                if (!this.form.items[this.activeItemIndex!].photosUrls) {
                    this.form.items[this.activeItemIndex!].photosUrls = [];
                }
                this.form.items[this.activeItemIndex!].photosUrls.push(...urls);
                this.toast('success', 'Photo ajoutée', 'Photo uploadée pour l\'item.');
            },
            error: () => this.toast('error', 'Erreur', 'Upload échoué.')
        });
    }

    removeItemPhoto(itemIndex: number, photoIndex: number): void {
        this.form.items[itemIndex].photosUrls.splice(photoIndex, 1);
    }

    // ─── IA globale ───────────────────────────────────────────────────────────────

    analyzeWithAi(): void {
        if (!this.form.photosUrls?.length) return;

        this.analyzingAi = true;
        this.aiResult = null;
        this.toast('info', 'Analyse en cours', 'L\'IA analyse vos photos...');

        this.fetchPhotosAsBlobs(this.form.photosUrls).then(blobs => {
            const formData = new FormData();
            blobs.forEach((blob, i) => formData.append('photos', blob, `photo-${i}.jpg`));

            this.http.post<AiAnalysisResult>(this.AI_API, formData).subscribe({
                next: (result) => {
                    this.aiResult = result;
                    this.toast('success', '✨ Analyse terminée', `Condition : ${this.getConditionLabel(result.condition)}`);
                },
                error: (err) => this.toast('error', 'Erreur IA', err?.error?.message ?? 'Analyse IA échouée.'),
                complete: () => (this.analyzingAi = false)
            });
        }).catch(() => {
            this.toast('error', 'Erreur', 'Impossible de récupérer les photos.');
            this.analyzingAi = false;
        });
    }

    applyAiResult(): void {
        if (!this.aiResult) return;
        this.form.condition = this.aiResult.condition;
        const existing = this.form.overallCondition?.trim() || '';
        this.form.overallCondition = existing
            ? `${existing}\n\n[Analyse IA] ${this.aiResult.description}`
            : this.aiResult.description;
        if (this.aiResult.damagesDetected?.length) {
            if (!this.form.damagesFound) this.form.damagesFound = [];
            this.form.damagesFound.push(...this.aiResult.damagesDetected);
        }
        if (this.aiResult.estimatedCost > 0) {
            this.form.costsEstimated = this.aiResult.estimatedCost;
        }
        this.toast('success', 'Appliqué', 'Résultats IA appliqués au formulaire.');
        this.aiResult = null;
    }

    // ─── IA par item ─────────────────────────────────────────────────────────────

    analyzeItemWithAi(index: number): void {
        const item = this.form.items[index];
        if (!item?.photosUrls?.length || !item.itemName) return;

        this.analyzingItemIndex = index;
        this.toast('info', 'Analyse IA', `Analyse de "${item.itemName}" en cours...`);

        fetch(item.photosUrls[0])
            .then(r => r.blob())
            .then(blob => {
                const formData = new FormData();
                formData.append('photo', blob, 'item-photo.jpg');
                formData.append('itemName', item.itemName);

                this.http.post<AiAnalysisResult>(this.AI_ITEM_API, formData).subscribe({
                    next: (result) => {
                        this.form.items[index].condition       = result.condition;
                        this.form.items[index].notes           = result.description;
                        this.form.items[index].estimatedRepairCost = result.estimatedCost;
                        this.form.items[index].aiAnalyzed      = true;
                        this.toast('success', '✨ Item analysé',
                            `"${item.itemName}" : ${this.getConditionLabel(result.condition)} — ${result.estimatedCost} TND`);
                        this.analyzingItemIndex = null;
                    },
                    error: (err) => {
                        this.toast('error', 'Erreur IA', err?.error?.message ?? 'Analyse de l\'item échouée.');
                        this.analyzingItemIndex = null;
                    }
                });
            })
            .catch(() => {
                this.toast('error', 'Erreur', 'Impossible de récupérer la photo de l\'item.');
                this.analyzingItemIndex = null;
            });
    }

    private async fetchPhotosAsBlobs(urls: string[]): Promise<Blob[]> {
        return Promise.all(urls.map(url => fetch(url).then(r => r.blob())));
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────────

    saveInspection(): void {
        if (!this.form.leaseId || !this.inspectionDateObj) {
            this.toast('warn', 'Champs manquants', 'Bail et date sont obligatoires.');
            return;
        }
        this.form.inspectionDate = this.toISODate(this.inspectionDateObj);
        this.saving = true;

        const req$ = this.editMode
            ? this.http.put<LeaseInspection>(`${this.API}/${this.form.id}`, this.form)
            : this.http.post<LeaseInspection>(this.API, this.form);

        req$.subscribe({
            next: () => {
                this.toast('success', 'Succès', this.editMode ? 'Inspection modifiée.' : 'Inspection créée.');
                this.closeDialog();
                this.loadInspections();
            },
            error: (err) => this.toast('error', 'Erreur', err?.error?.message ?? 'Erreur survenue.'),
            complete: () => (this.saving = false)
        });
    }

    deleteInspection(insp: LeaseInspection): void {
        if (!confirm('Supprimer cette inspection ?')) return;
        this.http.delete(`${this.API}/${insp.id}`).subscribe({
            next: () => { this.toast('success', 'Supprimé', 'Inspection supprimée.'); this.loadInspections(); },
            error: () => this.toast('error', 'Erreur', 'Suppression échouée.')
        });
    }

    openAddDialog(): void {
        this.editMode = false;
        this.form = this.emptyForm();
        this.inspectionDateObj = new Date();
        this.aiResult = null;
        this.hasInitialForSelectedLease = false;
        this.dialogVisible = true;
    }

    openEditDialog(insp: LeaseInspection): void {
        this.editMode = true;
        this.form = {
            ...insp,
            items:        [...(insp.items || [])],
            damagesFound: [...(insp.damagesFound || [])],
            photosUrls:   [...(insp.photosUrls || [])]
        };
        this.inspectionDateObj = insp.inspectionDate ? new Date(insp.inspectionDate) : null;
        this.aiResult = null;
        this.hasInitialForSelectedLease = false;
        this.dialogVisible = true;

        // Si inspection FINAL sans items → charger automatiquement depuis INITIAL
        if (insp.inspectionType === 'FINAL' && insp.leaseId && (!insp.items || insp.items.length === 0)) {
            this.loadInitialItemsForFinal();
        }
    }

    closeDialog(): void {
        this.dialogVisible = false;
        this.saving  = false;
        this.aiResult = null;
    }

    openInspectionDetails(insp: LeaseInspection): void {
        this.selectedInspectionDetails = insp;
        this.comparisonData = null;
        this.inspectionDetailsVisible = true;

        if (insp.inspectionType === 'FINAL' && insp.leaseId) {
            this.loadingComparison = true;
            this.http.get<InspectionComparison>(`${this.API}/lease/${insp.leaseId}/comparison`).subscribe({
                next: (data) => { this.comparisonData = data; this.loadingComparison = false; },
                error: () => { this.loadingComparison = false; }
            });
        }
    }

    addItem(): void {
        this.form.items.push({
            itemName: '', category: 'AUTRE', condition: 'ACCEPTABLE',
            notes: '', photosUrls: [], estimatedRepairCost: 0, aiAnalyzed: false
        });
    }
    removeItem(i: number): void { this.form.items.splice(i, 1); }
    addDamage(): void           { this.form.damagesFound.push(''); }
    removeDamage(i: number): void { this.form.damagesFound.splice(i, 1); }

    getCategoryLabel(cat?: ItemCategory | null): string {
        return this.categoryOptions.find(o => o.value === cat)?.label ?? 'Autre';
    }

    // ─── Print / Export PDF ──────────────────────────────────────────────────────

    printInspection(insp: LeaseInspection): void {
        const inspector = this.getAccountName(insp.inspectorAccountId);
        const tenant    = this.getAccountName(insp.tenantAccountId);
        const lease     = this.getLeaseSummary(insp.leaseId);
        const ref       = (insp.id ?? '').substring(0, 8).toUpperCase();
        const fmt       = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        const cur       = (v: any) => Number(v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 });
        const typeLabels: Record<string, string> = { INITIAL: 'État des lieux d\'entrée', FINAL: 'État des lieux de sortie', ROUTINE: 'Inspection de routine', DAMAGE_REPORT: 'Rapport de dommages' };
        const condLabels: Record<string, string> = { EXCELLENT: 'Excellent', GOOD: 'Bon', ACCEPTABLE: 'Acceptable', POOR: 'Mauvais', DAMAGED: 'Endommagé', MISSING: 'Manquant' };
        const catLabels: Record<string, string>  = { ELECTROMENAGER: 'Électroménager', MOBILIER: 'Mobilier', EQUIPEMENT: 'Équipement', SANITAIRE: 'Sanitaire', MENUISERIE: 'Menuiserie', AUTRE: 'Autre' };

        const itemsHtml = (insp.items ?? []).map((item, i) =>
            `<tr style="background:${i % 2 ? '#f9f6ef' : 'white'}">
                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3">${item.itemName}${item.aiAnalyzed ? ' <span style="font-size:10px;color:#7c3aed">✨ IA</span>' : ''}</td>
                <td style="padding:8px 12px;text-align:center;font-size:11px;color:#5a4e35;border-bottom:1px solid #ede6d3">${catLabels[item.category ?? 'AUTRE'] ?? 'Autre'}</td>
                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3">${condLabels[item.condition] ?? item.condition}</td>
                <td style="padding:8px 12px;color:#5a4e35;border-bottom:1px solid #ede6d3">${item.notes || '—'}</td>
                <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #ede6d3">${item.estimatedRepairCost ? cur(item.estimatedRepairCost) : '—'}</td>
            </tr>`).join('');

        const damagesHtml = (insp.damagesFound ?? []).map(d => `<li>${d}</li>`).join('');

        const cmp = this.comparisonData;
        const comparisonHtml = (insp.inspectionType === 'FINAL' && cmp) ? `
            <div class="sec">
                <div class="sec-title" style="color:#7c3aed;border-bottom:2px solid #7c3aed">Article VI — Comparaison État des Lieux (INITIAL → FINAL)</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
                    <div class="box"><div class="lbl">Score dégradation</div><div style="font-size:20px;font-weight:bold;color:${cmp.degradationScore >= 60 ? '#b71c1c' : cmp.degradationScore >= 30 ? '#e65100' : '#2e7d32'}">${cmp.degradationScore}%</div></div>
                    <div class="box"><div class="lbl">Items dégradés</div><div style="font-size:20px;font-weight:bold;color:#e65100">${cmp.degradedItems} / ${cmp.totalItems}</div></div>
                    <div class="box" style="border:1px solid #ffcdd2;background:#fff0f0"><div class="lbl">Déduction caution</div><div style="font-size:18px;font-weight:bold;color:#b71c1c">${cur(cmp.totalEstimatedDeduction)}</div></div>
                </div>
                <table>
                    <thead><tr style="background:#ede6f7">
                        <th style="color:#7c3aed">Élément</th>
                        <th style="color:#7c3aed;text-align:center">Initial</th>
                        <th style="color:#7c3aed;text-align:center">Final</th>
                        <th style="color:#7c3aed;text-align:center">Évolution</th>
                        <th style="color:#7c3aed;text-align:right">Déduction</th>
                    </tr></thead>
                    <tbody>
                        ${cmp.itemComparisons.map((c, i) => `
                            <tr style="background:${c.missing ? '#fff0f0' : c.degraded ? '#fff8e6' : i % 2 ? '#f9f6ef' : 'white'}">
                                <td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #ede6d3">${c.itemName}</td>
                                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3">${condLabels[c.initialCondition] ?? c.initialCondition}</td>
                                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3;color:${c.missing ? '#b71c1c' : c.degraded ? '#e65100' : '#2e7d32'};font-weight:bold">${condLabels[c.finalCondition] ?? c.finalCondition}</td>
                                <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #ede6d3">${c.missing ? '❌ Manquant' : c.degraded ? '↘ Dégradé' : '✓ OK'}</td>
                                <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #ede6d3;color:${c.estimatedDeduction > 0 ? '#b71c1c' : '#2e7d32'};font-weight:bold">${c.estimatedDeduction > 0 ? cur(c.estimatedDeduction) : '—'}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>` : '';

        const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>État des Lieux — ${ref}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#e8e0d0;padding:40px 20px;font-family:Georgia,serif;color:#1a1208}
.page{max-width:780px;margin:0 auto;background:#fdfaf5;border:1px solid #d6c9a8;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:60px 68px;position:relative}
.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);font-size:80px;font-weight:900;color:rgba(0,0,0,.03);white-space:nowrap;pointer-events:none;letter-spacing:8px}
.header{text-align:center;margin-bottom:32px;border-bottom:2px solid #8B7355;padding-bottom:20px}
.sub{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#8B7355;margin-bottom:8px}
h1{font-size:22px;font-weight:bold;letter-spacing:3px;text-transform:uppercase}.type{font-size:14px;color:#8B7355;margin-top:4px}
.meta{display:flex;justify-content:space-between;font-size:12px;color:#6b5c40;background:#f5f0e4;padding:10px 16px;border-left:3px solid #8B7355;margin-bottom:28px}
.sec{margin-bottom:22px}.sec-title{font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;padding-bottom:6px;margin-bottom:12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.lbl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8B7355}
.box{background:#f5f0e4;padding:12px 16px;border-radius:4px;text-align:center}
table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:8px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;border-bottom:1px solid #d6c9a8;background:#f5f0e4}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:24px;border-top:1px solid #d6c9a8;padding-top:24px}
.sig{text-align:center}.sig-lbl{font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#6b5c40;margin-bottom:20px}
.sig-line{border-bottom:1px solid #8B7355;height:48px;margin-bottom:8px}.sig-name{font-size:12px;color:#4a3f2a}.sig-hint{font-size:10px;color:#8B7355;margin-top:2px}
.foot{text-align:center;margin-top:24px;font-size:10px;color:#9e8c6d;border-top:1px dashed #d6c9a8;padding-top:10px}
@media print{body{background:white;padding:0}.page{box-shadow:none;border:none;padding:48px}}
</style></head><body>
<div class="page"><div class="wm">CLOUD4SAYA</div>
<div class="header"><div class="sub">Gestion de Copropriété</div><h1>Procès-Verbal d'État des Lieux</h1><div class="type">${typeLabels[insp.inspectionType] ?? insp.inspectionType}</div></div>
<div class="meta"><span>Réf. : <strong>${ref}</strong></span><span>Date : <strong>${fmt(insp.inspectionDate)}</strong></span><span>Statut : <strong>${insp.status}</strong></span></div>
<div class="sec"><div class="sec-title">Article I — Identification</div>
<div class="grid2">
<div style="display:flex;flex-direction:column;gap:8px;font-size:13px"><div><div class="lbl">Appartement</div><strong>${insp.apartmentId}</strong></div><div><div class="lbl">Bail</div><strong>${lease}</strong></div></div>
<div style="display:flex;flex-direction:column;gap:8px;font-size:13px"><div><div class="lbl">Inspecteur</div><strong>${inspector}</strong></div><div><div class="lbl">Locataire</div><strong>${tenant}</strong></div></div>
</div></div>
<div class="sec"><div class="sec-title">Article II — État Général</div>
<div class="box" style="display:inline-block;min-width:180px;margin-bottom:12px"><div class="lbl" style="margin-bottom:4px">Condition globale</div><div style="font-size:16px;font-weight:bold">${condLabels[insp.condition] ?? insp.condition}</div></div>
${insp.overallCondition ? `<div style="font-size:13px;color:#4a3f2a;line-height:1.8;background:#f5f0e4;padding:12px 16px;border-radius:4px">${insp.overallCondition}</div>` : ''}
</div>
${itemsHtml ? `<div class="sec"><div class="sec-title">Article III — Éléments Inspectés</div><table><thead><tr><th>Élément</th><th style="text-align:center">Catégorie</th><th style="text-align:center">État</th><th>Observations</th><th style="text-align:right">Coût rép.</th></tr></thead><tbody>${itemsHtml}</tbody></table></div>` : ''}
${damagesHtml ? `<div class="sec"><div class="sec-title">Article IV — Dommages Constatés</div><ul style="padding-left:20px;font-size:13px;color:#4a3f2a;line-height:1.9">${damagesHtml}</ul></div>` : ''}
<div class="sec"><div class="sec-title">Article V — Estimation Financière</div>
<div class="box" style="display:inline-block;min-width:200px"><div class="lbl" style="margin-bottom:6px">Coûts estimés</div><div style="font-size:22px;font-weight:bold">${cur(insp.costsEstimated)}</div></div></div>
${comparisonHtml}
<div class="sigs"><div class="sig"><div class="sig-lbl">L'Inspecteur</div><div class="sig-line"></div><div class="sig-name">${inspector}</div><div class="sig-hint">Signature</div></div>
<div class="sig"><div class="sig-lbl">Le Locataire</div><div class="sig-line"></div><div class="sig-name">${tenant}</div><div class="sig-hint">Lu et approuvé — Signature</div></div></div>
<div class="foot">Document généré par CLOUD4SAYA — Plateforme de gestion de copropriété</div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    getTypeLabel(t: string): string {
        return this.inspectionTypeOptions.find(o => o.value === t)?.label ?? t;
    }
    getStatusLabel(s: string): string {
        return this.inspectionStatusOptions.find(o => o.value === s)?.label ?? s;
    }
    getConditionLabel(c: string): string {
        return this.conditionOptionsWithMissing.find(o => o.value === c)?.label ?? c;
    }
    getStatusSeverity(s: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (s) {
            case 'COMPLETED': return 'success';
            case 'PENDING':   return 'warn';
            case 'DISPUTED':  return 'danger';
            default:          return 'info';
        }
    }
    getConditionSeverity(c: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (c) {
            case 'EXCELLENT':  return 'success';
            case 'GOOD':       return 'info';
            case 'ACCEPTABLE': return 'warn';
            case 'POOR':       return 'danger';
            case 'DAMAGED':    return 'danger';
            case 'MISSING':    return 'danger';
            default:           return 'secondary';
        }
    }
    getAccountName(id?: string): string {
        if (!id) return '—';
        const a = this.accounts.find(x => x.id === id);
        return a ? `${a.firstName} ${a.lastName}` : '—';
    }
    getLeaseSummary(leaseId?: string): string {
        if (!leaseId) return '—';
        const l = this.leases.find(x => x.id === leaseId);
        if (!l) return '—';
        return `Apt. ${l.apartmentId} — ${this.getAccountName(l.accountId)}`;
    }

    private toISODate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    private emptyForm(): LeaseInspection {
        return {
            leaseId: '', apartmentId: '', organizationId: '',
            inspectionType: 'INITIAL',
            inspectorAccountId: '', tenantAccountId: '', managerAccountId: '',
            inspectionDate: '',
            condition: 'ACCEPTABLE',
            items: [], overallCondition: '',
            damagesFound: [], costsEstimated: 0,
            photosUrls: [], reportUrl: '', signedBy: '',
            status: 'PENDING'
        };
    }

    private toast(severity: string, summary: string, detail: string): void {
        this.messageService.add({ severity, summary, detail, life: 3000 });
    }
}
