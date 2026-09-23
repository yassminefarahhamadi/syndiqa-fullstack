import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Nora from '@primeuix/themes/nora';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';
import { cacheInterceptor } from './app/core/interceptors/cache.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, cacheInterceptor])),
        provideZoneChangeDetection({ eventCoalescing: true }),
        providePrimeNG({ theme: { preset: Nora, options: { darkModeSelector: '.app-dark' } } })
    ]
};
