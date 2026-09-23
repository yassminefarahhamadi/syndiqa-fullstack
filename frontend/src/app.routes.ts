import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard, noAuthGuard } from './app/core/auth/auth.guard';

export const appRoutes: Routes = [
    { path: '', redirectTo: '/landing', pathMatch: 'full' },
     {
        path: 'incidents/:id/process',
        loadComponent: () =>
            import('./app/pages/frontoffice/resident/incident-timeline.component')
                .then(m => m.IncidentProcessComponent)
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./app/pages/dashboard/dashboard-router.component').then(m => m.DashboardRouterComponent)
            },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    {
        path: 'auth',
        canActivate: [noAuthGuard],
        loadChildren: () => import('./app/pages/auth/auth.routes')
    },
    { path: '**', redirectTo: '/notfound' }
];
