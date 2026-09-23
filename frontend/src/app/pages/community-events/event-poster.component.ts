import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-event-poster',
    standalone: true,
    imports: [CommonModule, TagModule],
    template: `
        <div
            class="relative overflow-hidden rounded-border bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
            [ngClass]="sizeClass"
            style="aspect-ratio: 4 / 5"
        >
            <img *ngIf="posterUrl" [src]="posterUrl" [alt]="title + ' poster'" class="w-full h-full object-cover block bg-white" />

            <div *ngIf="!posterUrl" class="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <i class="pi pi-calendar-plus text-4xl text-primary mb-3"></i>
                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ categoryLabel }}</div>
                <div class="text-surface-500 text-sm mt-1">{{ fallbackText }}</div>
            </div>
        </div>
    `
})
export class EventPosterComponent implements OnChanges, OnDestroy {
    @Input() svg: string | null | undefined;
    @Input() title = 'Community event';
    @Input() category?: string;
    @Input() size: 'thumb' | 'small' | 'large' = 'small';

    posterUrl: string | null = null;

    get sizeClass(): string {
        if (this.size === 'thumb') return 'w-24 shrink-0';
        return this.size === 'large' ? 'w-full max-w-[420px]' : 'w-full mb-4';
    }

    get categoryLabel(): string {
        return this.category ? this.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Community Event';
    }

    get fallbackText(): string {
        return this.svg === null ? 'Default event visual' : 'Event visual';
    }

    ngOnChanges() {
        this.revokePosterUrl();

        if (!this.svg) {
            this.posterUrl = null;
            return;
        }

        const blob = new Blob([this.svg], { type: 'image/svg+xml' });
        this.posterUrl = URL.createObjectURL(blob);
    }

    ngOnDestroy() {
        this.revokePosterUrl();
    }

    private revokePosterUrl() {
        if (this.posterUrl) {
            URL.revokeObjectURL(this.posterUrl);
            this.posterUrl = null;
        }
    }
}
