import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'features-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <section id="operations" class="py-16 px-6 lg:px-20">
            <div class="max-w-7xl mx-auto">
                <div class="text-center max-w-3xl mx-auto mb-12">
                    <div class="text-primary uppercase tracking-wide text-sm font-semibold mb-3">Operations</div>
                    <h2 class="text-4xl text-surface-900 dark:text-surface-0 font-semibold mb-4">Organized around the real work of a residence</h2>
                    <p class="text-xl text-surface-600 dark:text-surface-300 m-0">
                        Clear modules, consistent workflows, and a calmer interface for syndic teams and residents.
                    </p>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-6 xl:col-span-3">
                        <div class="card h-full mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 mb-4" style="width: 3rem; height: 3rem; border-radius: 8px">
                                <i class="pi pi-home text-emerald-700 dark:text-emerald-200 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Properties and residents</h3>
                            <p class="text-surface-600 dark:text-surface-300 m-0 line-height-3">Manage buildings, resident records, and occupancy structure without losing the operational context.</p>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-6 xl:col-span-3">
                        <div class="card h-full mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 mb-4" style="width: 3rem; height: 3rem; border-radius: 8px">
                                <i class="pi pi-wallet text-cyan-700 dark:text-cyan-200 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Charges and expenses</h3>
                            <p class="text-surface-600 dark:text-surface-300 m-0 line-height-3">Track billing, collections, and spending with a cleaner audit trail and fewer blind spots.</p>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-6 xl:col-span-3">
                        <div class="card h-full mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 mb-4" style="width: 3rem; height: 3rem; border-radius: 8px">
                                <i class="pi pi-megaphone text-orange-700 dark:text-orange-200 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Community life</h3>
                            <p class="text-surface-600 dark:text-surface-300 m-0 line-height-3">Run announcements, events, acknowledgements, registrations, and feedback from one place.</p>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-6 xl:col-span-3">
                        <div class="card h-full mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 mb-4" style="width: 3rem; height: 3rem; border-radius: 8px">
                                <i class="pi pi-bolt text-purple-700 dark:text-purple-200 text-xl"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Solar and AI insight</h3>
                            <p class="text-surface-600 dark:text-surface-300 m-0 line-height-3">Surface anomalies, highlight what matters, and keep operational signals close to the decisions they inform.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class FeaturesWidget {}
