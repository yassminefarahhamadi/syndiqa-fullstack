import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'hero-widget',
    imports: [ButtonModule, RouterModule],
    template: `
        <section
            id="hero"
            class="px-6 lg:px-20 py-10 lg:py-16"
            style="
                background:
                    linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(15, 23, 42, 0.78)),
                    url('https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80') center/cover;
            "
        >
            <div class="grid grid-cols-12 gap-8 items-center min-h-[38rem]">
                <div class="col-span-12 xl:col-span-6">
                    <div class="max-w-3xl">
                        <div class="text-primary-200 uppercase tracking-wide text-sm font-semibold mb-4">SyndiQA</div>

                        <h1 class="text-5xl lg:text-7xl font-bold text-white leading-tight m-0" style="text-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);">
                            One operating system for your residences, residents, finances, and community life.
                        </h1>

                        <p class="text-xl lg:text-2xl text-surface-100 mt-6 mb-0 line-height-3">
                            Bring every building, resident, charge, event, announcement, and maintenance action into one clear command center built for faster decisions and stronger communities.
                        </p>

                        <div class="flex flex-col sm:flex-row gap-3 mt-8">
                            <button pButton type="button" label="Enter Portal" icon="pi pi-arrow-right" routerLink="/auth/login"></button>
                            <button pButton type="button" label="Explore Modules" icon="pi pi-compass" severity="secondary" outlined (click)="scrollTo('operations')"></button>
                        </div>

                        <div class="grid grid-cols-12 gap-3 mt-10">
                            <div class="col-span-12 sm:col-span-4">
                                <div class="rounded-border border border-white/15 bg-white/8 backdrop-blur-sm p-4 h-full">
                                    <div class="text-surface-300 text-sm mb-2">Community</div>
                                    <div class="text-white text-2xl font-semibold">Events and notices</div>
                                </div>
                            </div>
                            <div class="col-span-12 sm:col-span-4">
                                <div class="rounded-border border border-white/15 bg-white/8 backdrop-blur-sm p-4 h-full">
                                    <div class="text-surface-300 text-sm mb-2">Operations</div>
                                    <div class="text-white text-2xl font-semibold">Charges and maintenance</div>
                                </div>
                            </div>
                            <div class="col-span-12 sm:col-span-4">
                                <div class="rounded-border border border-white/15 bg-white/8 backdrop-blur-sm p-4 h-full">
                                    <div class="text-surface-300 text-sm mb-2">Insight</div>
                                    <div class="text-white text-2xl font-semibold">Solar and AI visibility</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 xl:col-span-6 flex justify-center xl:justify-end">
                    <div class="w-full max-w-3xl rounded-border overflow-hidden border border-white/15 shadow-2xl bg-surface-950/90 backdrop-blur-sm">
                        <img
                            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
                            alt="Modern residential building for syndic and community management"
                            class="w-full block"
                            style="aspect-ratio: 16 / 10; object-fit: cover;"
                        />
                        <div class="grid grid-cols-12 gap-4 p-5 border-t border-white/10 bg-surface-950/95">
                            <div class="col-span-12 md:col-span-6">
                                <div class="text-surface-400 text-sm mb-1">Community overview</div>
                                <div class="text-surface-0 font-semibold text-xl mb-2">Events, acknowledgements, and resident follow-up</div>
                                <div class="text-surface-300">Keep communication visible and measurable across the whole residence.</div>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <div class="text-surface-400 text-sm mb-1">Operational control</div>
                                <div class="text-surface-0 font-semibold text-xl mb-2">Charges, maintenance, and building activity in one view</div>
                                <div class="text-surface-300">Reduce scattered follow-up and make daily decisions easier to track.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class HeroWidget {
    scrollTo(sectionId: string): void {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
