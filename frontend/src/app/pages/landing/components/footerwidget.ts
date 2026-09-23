import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'footer-widget',
    imports: [RouterModule],
    template: `
        <footer class="mt-20 px-6 lg:px-20 pb-12">
            <div class="max-w-7xl mx-auto border-t border-surface-200 dark:border-surface-700 pt-8">
                <div class="grid grid-cols-12 gap-8 items-start">
                    <div class="col-span-12 lg:col-span-4">
                        <a (click)="router.navigate(['/landing'], { fragment: 'home' })" class="flex items-center cursor-pointer mb-4">
                            <img src="logo-syndiQA.png" alt="SyndiQA Logo" style="height: 2.75rem; object-fit: contain;" class="mr-3" />
                            <span class="text-2xl font-semibold text-surface-900 dark:text-surface-0">SyndiQA</span>
                        </a>
                        <p class="text-surface-600 dark:text-surface-300 m-0 line-height-3">
                            Clearer operations for residences, cleaner communication for residents, and better visibility for every daily decision.
                        </p>
                    </div>

                    <div class="col-span-12 sm:col-span-4 lg:col-span-2">
                        <div class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Portal</div>
                        <a routerLink="/auth/login" class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Enter portal</a>
                        <a class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Resident access</a>
                    </div>

                    <div class="col-span-12 sm:col-span-4 lg:col-span-3">
                        <div class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Modules</div>
                        <a class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Community events</a>
                        <a class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Announcements</a>
                        <a class="block text-surface-600 dark:text-surface-300 cursor-pointer">Maintenance workflow</a>
                    </div>

                    <div class="col-span-12 sm:col-span-4 lg:col-span-3">
                        <div class="font-semibold text-surface-900 dark:text-surface-0 mb-3">Operations</div>
                        <a class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Charges and expenses</a>
                        <a class="block text-surface-600 dark:text-surface-300 mb-2 cursor-pointer">Solar and analytics</a>
                        <a class="block text-surface-600 dark:text-surface-300 cursor-pointer">Support</a>
                    </div>
                </div>
            </div>
        </footer>
    `
})
export class FooterWidget {
    constructor(public router: Router) {}
}
