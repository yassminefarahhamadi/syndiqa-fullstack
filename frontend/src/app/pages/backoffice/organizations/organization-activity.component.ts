import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

export interface OrganizationActivity {
    id: string;
    organizationId: string;
    type: string;
    description: string;
    actorAccountId: string | null;
    targetId: string | null;
    createdAt: string;
}

const ACTIVITY_META: Record<string, { icon: string; color: string; label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
    ORGANIZATION_CREATED:   { icon: 'pi-building',            color: '#22c55e', label: 'Création',            severity: 'success' },
    ORGANIZATION_SUSPENDED: { icon: 'pi-ban',                 color: '#f97316', label: 'Suspension',          severity: 'warn'    },
    ORGANIZATION_ACTIVATED: { icon: 'pi-check-circle',        color: '#22c55e', label: 'Activation',          severity: 'success' },
    SUBSCRIPTION_CHANGED:   { icon: 'pi-credit-card',         color: '#3b82f6', label: 'Abonnement',          severity: 'info'    },
    MEMBER_ADDED:           { icon: 'pi-user-plus',           color: '#22c55e', label: 'Membre ajouté',       severity: 'success' },
    MEMBER_REMOVED:         { icon: 'pi-user-minus',          color: '#ef4444', label: 'Membre retiré',       severity: 'danger'  },
    BUILDING_ADDED:         { icon: 'pi-home',                color: '#22c55e', label: 'Résidence ajoutée',   severity: 'success' },
    BUILDING_REMOVED:       { icon: 'pi-trash',               color: '#ef4444', label: 'Résidence retirée',   severity: 'danger'  },
    LEASE_CREATED:          { icon: 'pi-file',                color: '#3b82f6', label: 'Bail créé',           severity: 'info'    },
    LEASE_ACTIVATED:        { icon: 'pi-check',               color: '#22c55e', label: 'Bail activé',         severity: 'success' },
    LEASE_TERMINATED:       { icon: 'pi-times-circle',        color: '#ef4444', label: 'Bail résilié',        severity: 'danger'  },
    LEASE_EXPIRED:          { icon: 'pi-clock',               color: '#f97316', label: 'Bail expiré',         severity: 'warn'    },
    INSPECTION_CREATED:     { icon: 'pi-eye',                 color: '#3b82f6', label: 'Inspection créée',    severity: 'info'    },
    INSPECTION_COMPLETED:   { icon: 'pi-check-square',        color: '#22c55e', label: 'Inspection complète', severity: 'success' },
    INSPECTION_DISPUTED:    { icon: 'pi-exclamation-triangle',color: '#f97316', label: 'Inspection contestée',severity: 'warn'    },
};

@Component({
    selector: 'app-organization-activity',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, TagModule, ProgressSpinnerModule, SelectModule],
    template: `
        <p-dialog
            [(visible)]="visible"
            [modal]="true"
            [closable]="true"
            [style]="{ width: '680px', maxWidth: '98vw' }"
            (onHide)="onHide()">

            <ng-template #header>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <i class="pi pi-history text-primary"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-lg">Journal d'activité</div>
                        <div class="text-surface-400 text-xs">{{ orgName }}</div>
                    </div>
                </div>
            </ng-template>

            <!-- Filtres -->
            <div class="flex gap-2 mb-4 flex-wrap">
                <p-select
                    [(ngModel)]="filterType"
                    [options]="typeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tous les types"
                    [showClear]="true"
                    [style]="{ minWidth: '200px' }">
                </p-select>
                <p-button
                    *ngIf="filterType"
                    icon="pi pi-times"
                    severity="secondary"
                    [outlined]="true"
                    size="small"
                    label="Effacer"
                    (onClick)="filterType = null">
                </p-button>
                <span class="ml-auto text-surface-400 text-sm self-center">
                    {{ filteredActivities.length }} événement(s)
                </span>
            </div>

            <!-- Chargement -->
            <div *ngIf="loading" class="flex justify-center py-10">
                <p-progress-spinner [style]="{ width: '40px', height: '40px' }"></p-progress-spinner>
            </div>

            <!-- Vide -->
            <div *ngIf="!loading && filteredActivities.length === 0" class="text-center py-10 text-surface-400">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                <span>Aucune activité enregistrée.</span>
            </div>

            <!-- Timeline -->
            <div *ngIf="!loading && filteredActivities.length > 0" class="flex flex-col gap-0">
                <div *ngFor="let act of filteredActivities; let last = last" class="flex gap-3">
                    <!-- Ligne verticale + icône -->
                    <div class="flex flex-col items-center" style="width: 36px; flex-shrink: 0">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            [style.background]="getMeta(act.type).color + '22'">
                            <i class="pi text-sm" [ngClass]="getMeta(act.type).icon"
                               [style.color]="getMeta(act.type).color"></i>
                        </div>
                        <div *ngIf="!last" class="flex-1 w-px bg-surface-200 dark:bg-surface-700 my-1" style="min-height: 20px"></div>
                    </div>

                    <!-- Contenu -->
                    <div class="flex-1 pb-4">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <p-tag
                                    [value]="getMeta(act.type).label"
                                    [severity]="getMeta(act.type).severity"
                                    [style]="{ fontSize: '11px' }">
                                </p-tag>
                                <div class="mt-1 text-sm text-surface-700 dark:text-surface-200">{{ act.description }}</div>
                            </div>
                            <div class="text-xs text-surface-400 whitespace-nowrap flex-shrink-0 mt-1">
                                {{ act.createdAt | date:'dd/MM/yyyy HH:mm' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </p-dialog>
    `
})
export class OrganizationActivityComponent implements OnChanges {

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() orgId: string | null = null;
    @Input() orgName = '';

    activities: OrganizationActivity[] = [];
    loading = false;
    filterType: string | null = null;

    typeOptions = Object.entries(ACTIVITY_META).map(([value, meta]) => ({
        label: meta.label,
        value
    }));

    get filteredActivities(): OrganizationActivity[] {
        if (!this.filterType) return this.activities;
        return this.activities.filter(a => a.type === this.filterType);
    }

    constructor(private http: HttpClient) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']?.currentValue === true && this.orgId) {
            this.load();
        }
        if (changes['visible']?.currentValue === false) {
            this.activities = [];
            this.filterType = null;
        }
    }

    onHide(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.activities = [];
        this.filterType = null;
    }

    private load(): void {
        this.loading = true;
        this.http.get<OrganizationActivity[]>(
            `http://localhost:8089/api/organizations/${this.orgId}/activities`
        ).subscribe({
            next: (data) => { this.activities = data; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    getMeta(type: string) {
        return ACTIVITY_META[type] ?? { icon: 'pi-circle', color: '#94a3b8', label: type, severity: 'secondary' as const };
    }
}
