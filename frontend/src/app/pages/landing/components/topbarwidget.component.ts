import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';

@Component({
    selector: 'topbar-widget',
    imports: [RouterModule, StyleClassModule, ButtonModule, RippleModule, AppFloatingConfigurator],
    template: `
        <a class="flex items-center" href="#">
            <img src="logo-syndiQA.png" alt="SyndiQA Logo" style="height: 3rem; object-fit: contain;" class="mr-4" />
        </a>

        <a pButton [text]="true" severity="secondary" [rounded]="true" pRipple class="lg:hidden!" pStyleClass="@next" enterFromClass="hidden" leaveToClass="hidden" [hideOnOutsideClick]="true">
            <i class="pi pi-bars text-2xl!"></i>
        </a>

        <div class="items-center bg-surface-0/95 dark:bg-surface-900/95 backdrop-blur-sm grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-8 lg:px-0 z-20 rounded-border">
            <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-8">
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'home' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-lg">
                        <span>Overview</span>
                    </a>
                </li>
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'operations' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-lg">
                        <span>Operations</span>
                    </a>
                </li>
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'highlights' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-lg">
                        <span>Experience</span>
                    </a>
                </li>
            </ul>
            <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2 items-center">
                <button pButton label="Enter Portal" icon="pi pi-arrow-right" routerLink="/auth/login"></button>
                <app-floating-configurator [float]="false" />
            </div>
        </div>
    `
})
export class TopbarWidget {
    constructor(public router: Router) {}
}
