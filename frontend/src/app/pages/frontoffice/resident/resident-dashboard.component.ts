import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ChargeService } from '../../service/charge.service';
import { PaymentService } from '../../service/payment.service';
import { ResidentProfileService, ResidentProfileData } from '../../service/resident-profile.service';

@Component({
    selector: 'app-resident-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, ButtonModule],
    template: `
        <!-- Deep Space Background Orbs -->
        <div class="ds-bg-orbs">
            <div class="ds-orb ds-orb-1"></div>
            <div class="ds-orb ds-orb-2"></div>
            <div class="ds-orb ds-orb-3"></div>
        </div>

        <div class="ds-container">
            <!-- Hero Welcome & Portal Status -->
            <div class="ds-hero">
                <div class="ds-hero-content">
                    <span class="ds-label-caps ds-label-muted">WELCOME BACK</span>
                    <h1 class="ds-display-lg">Resident Dashboard</h1>
                    <p class="ds-body-text">Your lease details, upcoming charges, and maintenance history all at a glance.</p>
                </div>
                <div class="ds-portal-status">
                    <div class="ds-ping-wrapper">
                        <span class="ds-ping"></span>
                        <span class="ds-ping-dot"></span>
                    </div>
                    <div>
                        <p class="ds-label-caps ds-label-muted" style="font-size: 10px;">System Status</p>
                        <p class="ds-title-sm">Portal Active</p>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading()" class="ds-loading">
                <i class="pi pi-spin pi-spinner ds-spinner"></i>
            </div>

            <ng-container *ngIf="!loading()">
                <!-- Bento Grid Layout -->
                <div class="ds-bento-grid">

                    <!-- Main Lease Card -->
                    <div class="ds-lease-card" *ngIf="hasProfile()">
                        <div class="ds-lease-image">
                            <div class="ds-lease-overlay"></div>
                            <div class="ds-lease-badge">
                                <span class="ds-premium-badge">PREMIUM UNIT</span>
                                <h2 class="ds-headline-md">{{ buildingName() }} • Apt {{ apartmentNumber() }}</h2>
                            </div>
                        </div>
                        <div class="ds-lease-stats">
                            <div class="ds-lease-stat">
                                <p class="ds-label-caps ds-label-muted">MOVE-IN DATE</p>
                                <p class="ds-title-sm">{{ moveInDate() }}</p>
                            </div>
                            <div class="ds-lease-stat">
                                <p class="ds-label-caps ds-label-muted">CONTRACT END</p>
                                <p class="ds-title-sm ds-text-primary">{{ leaseEndDate() }}</p>
                            </div>
                            <div class="ds-lease-stat">
                                <p class="ds-label-caps ds-label-muted">SYNDICATE</p>
                                <p class="ds-title-sm">{{ organizationEmail() }}</p>
                            </div>
                            <div class="ds-lease-stat ds-lease-action">
                                <p class="ds-label-caps ds-label-muted">PHONE</p>
                                <p class="ds-title-sm">{{ organizationPhone() }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Financial Quick Stats -->
                    <div class="ds-finance-column">
                        <!-- Outstanding Balance -->
                        <div class="ds-glass-card ds-balance-card">
                            <div class="ds-card-header">
                                <div class="ds-icon-wrap ds-icon-primary">
                                    <i class="pi pi-wallet"></i>
                                </div>
                                <span class="ds-due-badge">{{ unpaidCharges().length }} UNPAID</span>
                            </div>
                            <p class="ds-label-caps ds-label-muted">OUTSTANDING BALANCE</p>
                            <p class="ds-display-value">{{ outstandingBalance() | number:'1.3-3' }} <span class="ds-currency">TND</span></p>
                        </div>

                        <!-- Total Paid & Next Due -->
                        <div class="ds-split-row">
                            <div class="ds-glass-card ds-mini-card">
                                <div class="ds-mini-header">
                                    <p class="ds-label-caps ds-label-muted">TOTAL PAID</p>
                                    <i class="pi pi-check-circle ds-text-emerald"></i>
                                </div>
                                <p class="ds-mini-value">{{ totalPaid() | number:'1.3-3' }}</p>
                                <p class="ds-mini-sub">{{ paymentCount() }} payments</p>
                            </div>
                            <div class="ds-glass-card ds-mini-card">
                                <div class="ds-mini-header">
                                    <p class="ds-label-caps ds-label-muted">NEXT DUE</p>
                                    <i class="pi pi-calendar ds-text-amber"></i>
                                </div>
                                <p class="ds-mini-value ds-mini-date">{{ nextDueDate() || '—' }}</p>
                                <p class="ds-mini-sub">Auto-pay disabled</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Charges Table -->
                <div class="ds-glass-card ds-charges-section">
                    <div class="ds-section-header">
                        <h3 class="ds-headline-md">Recent Charges</h3>
                        <div class="ds-filter-pills">
                            <button class="ds-pill ds-pill-active">ALL</button>
                        </div>
                    </div>

                    <div class="ds-table-wrap" *ngIf="recentCharges().length > 0; else noCharges">
                        <table class="ds-table">
                            <thead>
                                <tr>
                                    <th class="ds-label-caps ds-label-muted">DESCRIPTION</th>
                                    <th class="ds-label-caps ds-label-muted">DUE DATE</th>
                                    <th class="ds-label-caps ds-label-muted">STATUS</th>
                                    <th class="ds-label-caps ds-label-muted ds-text-right">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let charge of recentCharges()" class="ds-table-row">
                                    <td>
                                        <div class="ds-charge-desc">
                                            <div class="ds-charge-icon" [class.ds-icon-emerald]="charge.status === 'PAID'" [class.ds-icon-amber]="charge.status !== 'PAID'">
                                                <i class="pi" [class.pi-check]="charge.status === 'PAID'" [class.pi-receipt]="charge.status !== 'PAID'"></i>
                                            </div>
                                            <span class="ds-charge-label">{{ charge.label }}</span>
                                        </div>
                                    </td>
                                    <td class="ds-text-muted">{{ charge.dueDate | date:'MMM dd, yyyy' }}</td>
                                    <td>
                                        <span class="ds-status-pill"
                                              [class.ds-status-paid]="charge.status === 'PAID'"
                                              [class.ds-status-pending]="charge.status === 'PENDING'"
                                              [class.ds-status-overdue]="charge.status === 'OVERDUE'"
                                              [class.ds-status-partial]="charge.status === 'PARTIALLY_PAID'">
                                            {{ charge.status }}
                                        </span>
                                    </td>
                                    <td class="ds-text-right ds-amount">{{ charge.amount | number:'1.3-3' }} TND</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <ng-template #noCharges>
                        <div class="ds-empty">
                            <i class="pi pi-inbox ds-empty-icon"></i>
                            <p>No charges found</p>
                        </div>
                    </ng-template>
                </div>
            </ng-container>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            position: relative;
            font-family: 'Inter', sans-serif;
            --ds-text: #1a2e23;
            --ds-muted: #64748b;
            --ds-bg: rgba(0,0,0,0.02);
            --ds-border: rgba(0,0,0,0.08);
            --ds-primary: #4edea3;
            --ds-surface: #f8fafb;
            --ds-card-hover: rgba(0,0,0,0.04);
            --ds-orb-opacity: 0.03;
            color: var(--ds-text);
            min-height: 100vh;
        }
        :host-context(.app-dark) {
            --ds-text: #dde4dd;
            --ds-muted: #86948a;
            --ds-bg: rgba(255,255,255,0.03);
            --ds-border: rgba(255,255,255,0.1);
            --ds-surface: #0e1511;
            --ds-card-hover: rgba(255,255,255,0.05);
            --ds-orb-opacity: 0.05;
        }

        /* ═══ Background Orbs ═══ */
        .ds-bg-orbs { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
        .ds-orb { position: absolute; border-radius: 50%; }
        .ds-orb-1 { top: 10%; left: 15%; width: 24rem; height: 24rem; background: rgba(78,222,163,var(--ds-orb-opacity)); filter: blur(120px); }
        .ds-orb-2 { bottom: 20%; right: 10%; width: 30rem; height: 30rem; background: rgba(59,130,246,var(--ds-orb-opacity)); filter: blur(150px); }
        .ds-orb-3 { top: 50%; left: 50%; width: 20rem; height: 20rem; background: rgba(16,185,129,var(--ds-orb-opacity)); filter: blur(100px); transform: translate(-50%, -50%); }

        /* ═══ Container ═══ */
        .ds-container { max-width: 80rem; margin: 0 auto; padding: 0 1.5rem; }

        /* ═══ Typography ═══ */
        .ds-display-lg { font-size: 3rem; line-height: 3.5rem; font-weight: 700; letter-spacing: -0.02em; color: var(--ds-text); margin: 0.25rem 0; }
        .ds-headline-md { font-size: 1.5rem; line-height: 2rem; font-weight: 600; letter-spacing: -0.01em; color: var(--ds-text); margin: 0; }
        .ds-title-sm { font-size: 1.125rem; line-height: 1.5rem; font-weight: 600; color: var(--ds-text); margin: 0.25rem 0 0; }
        .ds-body-text { font-size: 1rem; line-height: 1.5rem; color: var(--ds-muted); max-width: 28rem; margin: 0; }
        .ds-label-caps { font-size: 12px; line-height: 16px; letter-spacing: 0.05em; font-weight: 700; text-transform: uppercase; margin: 0; }
        .ds-label-muted { color: var(--ds-muted); }
        .ds-text-primary { color: #4edea3 !important; }
        .ds-text-emerald { color: #10b981; }
        .ds-text-amber { color: #ffb95f; }
        .ds-text-muted { color: var(--ds-muted); }
        .ds-text-right { text-align: right; }
        .ds-currency { font-size: 1rem; opacity: 0.7; font-weight: 500; }

        /* ═══ Hero ═══ */
        .ds-hero { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem; padding-top: 0.5rem; }
        .ds-hero-content { flex: 1; }

        .ds-portal-status {
            display: flex; align-items: center; gap: 1rem;
            background: var(--ds-bg); backdrop-filter: blur(20px);
            padding: 1rem 1.5rem; border-radius: 0.75rem;
            border: 1px solid var(--ds-border);
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .ds-ping-wrapper { position: relative; display: flex; width: 0.75rem; height: 0.75rem; }
        .ds-ping { position: absolute; display: inline-flex; width: 100%; height: 100%; border-radius: 50%; background: rgba(52,211,153,0.75); animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
        .ds-ping-dot { position: relative; display: inline-flex; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #10b981; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }

        /* ═══ Glass Card ═══ */
        .ds-glass-card {
            background: var(--ds-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--ds-border);
            border-radius: 1rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        .ds-glass-card:hover { background: var(--ds-card-hover); }

        /* ═══ Bento Grid ═══ */
        .ds-bento-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        @media (min-width: 768px) { .ds-bento-grid { grid-template-columns: 7fr 5fr; } }

        /* ═══ Lease Card ═══ */
        .ds-lease-card {
            background: var(--ds-bg); backdrop-filter: blur(20px);
            border: 1px solid var(--ds-border);
            border-radius: 1rem; overflow: hidden;
        }
        .ds-lease-image {
            position: relative; height: 12rem; overflow: hidden;
            background: linear-gradient(135deg, #0e1511 0%, #1a2e23 50%, #0e1511 100%);
        }
        .ds-lease-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #0a0a0a, transparent); }
        .ds-lease-badge { position: absolute; bottom: 1.5rem; left: 1.5rem; }
        .ds-premium-badge {
            display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
            padding: 0.25rem 0.75rem; border-radius: 9999px;
            background: rgba(16,185,129,0.2); color: #6ffbbe;
            backdrop-filter: blur(12px); border: 1px solid rgba(16,185,129,0.3);
            margin-bottom: 0.5rem;
        }
        .ds-lease-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; padding: 1.5rem; }
        @media (min-width: 1024px) { .ds-lease-stats { grid-template-columns: repeat(4, 1fr); } }
        .ds-lease-action { display: flex; flex-direction: column; }

        /* ═══ Finance Column ═══ */
        .ds-finance-column { display: flex; flex-direction: column; gap: 1.5rem; }

        .ds-balance-card {
            flex: 1; border: 1px solid rgba(16,185,129,0.2) !important;
            background: rgba(16,185,129,0.05) !important;
        }
        .ds-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .ds-icon-wrap { padding: 0.75rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
        .ds-icon-primary { background: rgba(16,185,129,0.1); color: #4edea3; }
        .ds-due-badge {
            font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
            background: rgba(255,255,255,0.05); color: #86948a;
            padding: 0.25rem 0.5rem; border-radius: 0.25rem;
        }
        .ds-display-value { font-size: 2.5rem; font-weight: 700; color: var(--ds-text); line-height: 1; margin: 0.5rem 0; }

        .ds-split-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .ds-mini-card { padding: 1.25rem; }
        .ds-mini-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .ds-mini-value { font-size: 1.25rem; font-weight: 700; color: var(--ds-text); margin: 0; }
        .ds-mini-date { font-size: 1rem; }
        .ds-mini-sub { font-size: 12px; color: var(--ds-muted); margin: 0.25rem 0 0; }

        /* ═══ Charges Table ═══ */
        .ds-charges-section { padding: 0; overflow: hidden; margin-bottom: 2rem; }
        .ds-section-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.5rem; border-bottom: 1px solid var(--ds-border);
            flex-wrap: wrap; gap: 1rem;
        }
        .ds-filter-pills { display: flex; gap: 0.5rem; }
        .ds-pill {
            padding: 0.375rem 1rem; border-radius: 9999px; border: none; cursor: pointer;
            font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
            background: transparent; color: var(--ds-muted); transition: all 0.2s;
        }
        .ds-pill:hover { color: var(--ds-text); }
        .ds-pill-active { background: var(--ds-bg); color: var(--ds-text); }

        .ds-table-wrap { overflow-x: auto; }
        .ds-table { width: 100%; text-align: left; border-collapse: collapse; }
        .ds-table th { padding: 1rem 1.5rem; font-size: 11px; border-bottom: 1px solid var(--ds-border); }
        .ds-table td { padding: 1rem 1.5rem; }
        .ds-table-row { transition: background 0.2s; border-bottom: 1px solid var(--ds-border); }
        .ds-table-row:hover { background: var(--ds-card-hover); }

        .ds-charge-desc { display: flex; align-items: center; gap: 0.75rem; }
        .ds-charge-icon {
            width: 2.5rem; height: 2.5rem; border-radius: 0.5rem;
            display: flex; align-items: center; justify-content: center; font-size: 0.875rem;
        }
        .ds-icon-emerald { background: rgba(16,185,129,0.1); color: #10b981; }
        .ds-icon-amber { background: rgba(238,152,0,0.1); color: #ffb95f; }
        .ds-charge-label { font-weight: 500; color: var(--ds-text); }

        .ds-amount { font-weight: 700; color: var(--ds-text); white-space: nowrap; }

        .ds-status-pill {
            display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px;
            font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .ds-status-paid { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .ds-status-pending { background: rgba(238,152,0,0.1); color: #ffb95f; border: 1px solid rgba(238,152,0,0.2); }
        .ds-status-overdue { background: rgba(255,180,171,0.1); color: #ffb4ab; border: 1px solid rgba(255,180,171,0.2); }
        .ds-status-partial { background: rgba(59,130,246,0.1); color: #89ceff; border: 1px solid rgba(59,130,246,0.2); }

        /* ═══ Empty & Loading ═══ */
        .ds-empty { text-align: center; padding: 3rem; color: var(--ds-muted); }
        .ds-empty-icon { font-size: 3rem; margin-bottom: 0.75rem; display: block; }
        .ds-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; }
        .ds-spinner { font-size: 2.5rem; color: #4edea3; }
    `]
})
export class ResidentDashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private chargeService = inject(ChargeService);
    private paymentService = inject(PaymentService);
    private residentProfileService = inject(ResidentProfileService);

    loading = signal(true);
    charges = signal<any[]>([]);
    payments = signal<any[]>([]);
    profileData = signal<ResidentProfileData | null>(null);

    // Computed values for profile
    hasProfile = computed(() => this.profileData()?.profile !== null && this.profileData()?.profile !== undefined);
    buildingName = computed(() => this.profileData()?.building?.name || 'N/A');
    apartmentNumber = computed(() => this.profileData()?.apartment?.unitNumber || 'N/A');
    moveInDate = computed(() => {
        const date = this.profileData()?.profile?.moveInDate;
        return date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    });
    leaseEndDate = computed(() => {
        const date = this.profileData()?.profile?.moveOutDate;
        return date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    });
    organizationEmail = computed(() => 'contact@syndiqa.tn'); // TODO: Get from organization
    organizationPhone = computed(() => '+216 71 000 000'); // TODO: Get from organization

    // Computed values
    unpaidCharges = computed(() => 
        this.charges().filter(c => c.status === 'PENDING' || c.status === 'OVERDUE' || c.status === 'PARTIALLY_PAID')
    );

    paidCharges = computed(() => 
        this.charges().filter(c => c.status === 'PAID')
    );

    outstandingBalance = computed(() => 
        this.unpaidCharges().reduce((sum, c) => sum + (c.amount - (c.paidAmount || 0)), 0)
    );

    totalPaid = computed(() => 
        this.payments().reduce((sum, p) => sum + p.amount, 0)
    );

    paymentCount = computed(() => this.payments().length);

    nextDueDate = computed(() => {
        const pending = this.unpaidCharges()
            .filter(c => c.dueDate)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        if (pending.length === 0) return null;
        
        const date = new Date(pending[0].dueDate);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    });

    recentCharges = computed(() => 
        this.charges()
            .sort((a, b) => new Date(b.createdAt || b.dueDate).getTime() - new Date(a.createdAt || a.dueDate).getTime())
            .slice(0, 5)
    );

    ngOnInit(): void {
        this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            this.loading.set(true);
            const userId = this.authService.user()?.id;

            if (!userId) {
                console.error('User ID not found');
                return;
            }

            // Load all data in parallel
            const [userCharges, payments, profileData] = await Promise.all([
                this.chargeService.getMyCharges().toPromise(),
                this.paymentService.getByUser(userId).toPromise(),
                this.residentProfileService.getMyProfile().toPromise().catch(err => {
                    console.error('Failed to load profile:', err);
                    return null;
                })
            ]);

            this.charges.set(userCharges || []);
            this.payments.set(payments || []);
            this.profileData.set(profileData || null);

            console.log('=== DASHBOARD DATA LOADED ===');
            console.log('User ID:', userId);
            console.log('Charges:', userCharges?.length || 0);
            console.log('Payments:', payments?.length || 0);
            console.log('Profile Data:', profileData);
            console.log('Has Profile:', this.hasProfile());
            console.log('Building Name:', this.buildingName());
            console.log('Apartment Number:', this.apartmentNumber());
            console.log('============================');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            this.loading.set(false);
        }
    }

    getChargeSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status?.toUpperCase()) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warn';
            case 'OVERDUE': return 'danger';
            case 'PARTIALLY_PAID': return 'info';
            default: return 'info';
        }
    }
}
