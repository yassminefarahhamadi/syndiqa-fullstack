import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Profile } from './profile.model';
import { ProfileService } from '../../../services/profile.service';

@Component({
    selector: 'app-profile-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, DialogModule,
        InputTextModule, InputNumberModule, ToggleButtonModule,
        TagModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-semibold mb-1">Profils financiers</h2>
                    <p class="text-surface-400 text-sm">Données financières et scores IA des utilisateurs</p>
                </div>
                <p-button label="Nouveau profil" icon="pi pi-plus" (onClick)="openNew()"></p-button>
            </div>

            <p-table
                [value]="profiles"
                [loading]="loading"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[5,10,25]"
                styleClass="p-datatable-sm">

                <ng-template #header>
                    <tr>
                        <th>Account ID</th>
                        <th>Salaire</th>
                        <th>Dépenses / mois</th>
                        <th>Revenu disponible</th>
                        <th>Ancienneté (ans)</th>
                        <th>Incidents</th>
                        <th>Hist. crédit (mois)</th>
                        <th>Score IA</th>
                        <th class="w-24">Actions</th>
                    </tr>
                </ng-template>

                <ng-template #body let-p>
                    <tr>
                        <td class="font-mono text-xs">{{ p.accountId | slice:0:12 }}…</td>
                        <td>{{ p.salary | number:'1.0-0' }} TND</td>
                        <td>{{ p.monthlyExpenses | number:'1.0-0' }} TND</td>
                        <td [class]="(p.disposableIncome ?? 0) < 0 ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'">
                            {{ (p.disposableIncome ?? 0) | number:'1.0-0' }} TND
                        </td>
                        <td>{{ p.yearsEmployed }} ans</td>
                        <td>
                            <p-tag
                                [value]="p.hasPaymentIncidents ? 'Oui' : 'Non'"
                                [severity]="p.hasPaymentIncidents ? 'danger' : 'success'">
                            </p-tag>
                        </td>
                        <td>{{ p.creditHistoryLength }} mois</td>
                        <td>
                            <p-tag
                                *ngIf="p.riskScore !== null && p.riskScore !== undefined"
                                [value]="(p.riskScore * 100 | number:'1.0-0') + '%'"
                                [severity]="getRiskSeverity(p.riskScore)">
                            </p-tag>
                            <span *ngIf="p.riskScore === null || p.riskScore === undefined" class="text-surface-400 text-xs">N/A</span>
                        </td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-pencil" [text]="true" severity="info" size="small" (onClick)="openEdit(p)"></p-button>
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="confirmDelete(p)"></p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #empty>
                    <tr>
                        <td colspan="9" class="text-center py-8 text-surface-400">
                            <i class="pi pi-user-minus text-3xl block mb-2"></i>
                            Aucun profil enregistré.
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Dialog Formulaire -->
        <p-dialog
            [(visible)]="dialogVisible"
            [modal]="true"
            [style]="{ width: '600px' }"
            [header]="editing ? 'Modifier le profil' : 'Nouveau profil'">

            <div class="grid grid-cols-2 gap-4 p-2">

                <div class="col-span-2 flex flex-col gap-1">
                    <label class="text-sm font-medium">Account ID *</label>
                    <input pInputText [(ngModel)]="form.accountId" [disabled]="editing" placeholder="ID du compte utilisateur" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Salaire mensuel (TND) *</label>
                    <p-inputNumber [(ngModel)]="form.salary" [min]="0" mode="decimal" [minFractionDigits]="2" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Dépenses mensuelles (TND)</label>
                    <p-inputNumber [(ngModel)]="form.monthlyExpenses" [min]="0" mode="decimal" [minFractionDigits]="2" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Années d'emploi *</label>
                    <p-inputNumber [(ngModel)]="form.yearsEmployed" [min]="0" [max]="50" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Historique crédit (mois) *</label>
                    <p-inputNumber [(ngModel)]="form.creditHistoryLength" [min]="0" />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium">Ratio loyer/revenu</label>
                    <p-inputNumber [(ngModel)]="form.rentToIncomeRatio" [min]="0" [max]="1" mode="decimal" [minFractionDigits]="2" placeholder="0.00 – 1.00" />
                </div>

                <div class="flex items-center gap-3 pt-5">
                    <label class="text-sm font-medium">Incidents de paiement</label>
                    <p-toggleButton
                        [(ngModel)]="form.hasPaymentIncidents"
                        onLabel="Oui"
                        offLabel="Non"
                        onIcon="pi pi-times-circle"
                        offIcon="pi pi-check-circle">
                    </p-toggleButton>
                </div>

                <div *ngIf="editing" class="col-span-2 flex flex-col gap-1">
                    <label class="text-sm font-medium">Score IA (0.00 – 1.00)</label>
                    <p-inputNumber [(ngModel)]="form.riskScore" [min]="0" [max]="1" mode="decimal" [minFractionDigits]="4" placeholder="Calculé par le modèle" />
                </div>

                <div *ngIf="form.salary && form.monthlyExpenses !== undefined" class="col-span-2 p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-sm">
                    <span class="text-surface-400">Revenu disponible estimé : </span>
                    <span class="font-semibold" [class]="(form.salary - (form.monthlyExpenses || 0)) < 0 ? 'text-red-400' : 'text-green-400'">
                        {{ (form.salary - (form.monthlyExpenses || 0)) | number:'1.0-0' }} TND
                    </span>
                </div>
            </div>

            <ng-template #footer>
                <p-button label="Annuler" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="dialogVisible = false"></p-button>
                <p-button [label]="editing ? 'Enregistrer' : 'Créer'" icon="pi pi-check" [loading]="saving" (onClick)="save()"></p-button>
            </ng-template>
        </p-dialog>
    `
})
export class ProfileListComponent implements OnInit {

    profiles: Profile[] = [];
    loading = false;
    saving = false;
    dialogVisible = false;
    editing = false;

    form: Profile = this.emptyForm();

    constructor(
        private profileService: ProfileService,
        private msg: MessageService,
        private confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.loading = true;
        this.profileService.getAll().subscribe({
            next: (data) => { this.profiles = data; this.loading = false; },
            error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les profils.' }); }
        });
    }

    openNew(): void {
        this.form = this.emptyForm();
        this.editing = false;
        this.dialogVisible = true;
    }

    openEdit(p: Profile): void {
        this.form = { ...p };
        this.editing = true;
        this.dialogVisible = true;
    }

    save(): void {
        if (!this.form.accountId?.trim()) {
            this.msg.add({ severity: 'warn', summary: 'Validation', detail: "L'Account ID est requis." });
            return;
        }
        this.saving = true;
        const call = this.editing
            ? this.profileService.update(this.form.id!, this.form)
            : this.profileService.create(this.form);

        call.subscribe({
            next: (saved) => {
                this.saving = false;
                this.dialogVisible = false;
                if (this.editing) {
                    this.profiles = this.profiles.map(p => p.id === saved.id ? saved : p);
                } else {
                    this.profiles = [saved, ...this.profiles];
                }
                this.msg.add({ severity: 'success', summary: 'Succès', detail: this.editing ? 'Profil mis à jour.' : 'Profil créé.' });
            },
            error: (err) => {
                this.saving = false;
                const detail = err.error?.message ?? 'Une erreur est survenue.';
                this.msg.add({ severity: 'error', summary: 'Erreur', detail });
            }
        });
    }

    confirmDelete(p: Profile): void {
        this.confirm.confirm({
            message: `Supprimer le profil du compte ${p.accountId.slice(0, 12)}… ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.profileService.delete(p.id!).subscribe({
                    next: () => {
                        this.profiles = this.profiles.filter(x => x.id !== p.id);
                        this.msg.add({ severity: 'success', summary: 'Supprimé', detail: 'Profil supprimé.' });
                    },
                    error: () => this.msg.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible.' })
                });
            }
        });
    }

    getRiskSeverity(score: number): 'success' | 'warn' | 'danger' {
        if (score < 0.3) return 'success';
        if (score < 0.6) return 'warn';
        return 'danger';
    }

    private emptyForm(): Profile {
        return {
            accountId: '',
            salary: 0,
            monthlyExpenses: 0,
            yearsEmployed: 0,
            hasPaymentIncidents: false,
            creditHistoryLength: 0,
            rentToIncomeRatio: null,
            riskScore: null
        };
    }
}
