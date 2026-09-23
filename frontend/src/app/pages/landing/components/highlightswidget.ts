import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'highlights-widget',
    imports: [CommonModule],
    template: `
        <section id="highlights" class="py-10 px-6 lg:px-20">
            <div class="max-w-7xl mx-auto grid grid-cols-12 gap-8 items-center">
                <div class="col-span-12 lg:col-span-6">
                    <div class="rounded-border overflow-hidden border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900">
                        <img
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
                            alt="Residents using mobile digital services"
                            class="w-full block"
                            style="aspect-ratio: 16 / 10; object-fit: cover;"
                        />
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-6">
                    <div class="text-primary uppercase tracking-wide text-sm font-semibold mb-3">Experience</div>
                    <h2 class="text-4xl text-surface-900 dark:text-surface-0 font-semibold mb-4">Simple enough for residents, structured enough for operations</h2>
                    <p class="text-xl text-surface-600 dark:text-surface-300 line-height-3 mb-6">
                        Residents should be able to read an announcement, register for an event, acknowledge an important notice, and report an issue without friction. Syndic teams should be able to follow all of that without losing the thread.
                    </p>

                    <div class="flex flex-col gap-4">
                        <div class="card mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Resident experience</div>
                            <div class="text-surface-600 dark:text-surface-300">Clean paths for communication, participation, payments, and maintenance requests.</div>
                        </div>
                        <div class="card mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-2">Syndic command center</div>
                            <div class="text-surface-600 dark:text-surface-300">Charges, announcements, community follow-up, and operational visibility stay aligned.</div>
                        </div>
                        <div class="card mb-0 border border-surface-200 dark:border-surface-700">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-2">AI where it helps</div>
                            <div class="text-surface-600 dark:text-surface-300">Use AI for prioritization and draft support without making the product feel noisy or overbuilt.</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class HighlightsWidget {}
