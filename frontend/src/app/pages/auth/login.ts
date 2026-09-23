import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule, ButtonModule, CheckboxModule, InputTextModule,
        PasswordModule, FormsModule, RouterModule, RippleModule,
        MessageModule, ProgressSpinnerModule, AppFloatingConfigurator
    ],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <!-- SyndiQA Logo -->
                            <div class="mb-4">
                                <img src="logo-syndiQA.png" alt="SyndiQA Logo" style="height: 3rem; object-fit: contain;" />
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4"
                                 style="font-family: 'Fira Sans', sans-serif;">
                                Welcome Back
                            </div>
                            <span class="text-muted-color font-medium"
                                  style="font-family: 'Fira Sans', sans-serif;">
                                Sign in to your account
                            </span>
                        </div>

                        <!-- Error Message -->
                        @if (errorMessage()) {
                            <p-message severity="error" [text]="errorMessage()!" styleClass="w-full mb-4" />
                        }

                        <div>
                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
                                   style="font-family: 'Fira Sans', sans-serif;">Email</label>
                            <input pInputText id="email" type="email" placeholder="Email address"
                                   class="w-full md:w-120 mb-8"
                                   [(ngModel)]="email"
                                   (keyup.enter)="onLogin()"
                                   [disabled]="loading()" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"
                                   style="font-family: 'Fira Sans', sans-serif;">Password</label>
                            <p-password id="password" [(ngModel)]="password"
                                        placeholder="Password"
                                        [toggleMask]="true"
                                        styleClass="mb-4" [fluid]="true" [feedback]="false"
                                        (keyup.enter)="onLogin()"
                                        [disabled]="loading()">
                            </p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="rememberMe" id="rememberme" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme" style="font-family: 'Fira Sans', sans-serif;">Remember me</label>
                                </div>
                                <a routerLink="/auth/forgot-password"
                                   class="font-medium no-underline ml-2 text-right cursor-pointer text-primary"
                                   style="font-family: 'Fira Sans', sans-serif;">
                                    Forgot password?
                                </a>
                            </div>

                            <p-button [label]="loading() ? 'Signing in...' : 'Sign In'"
                                      styleClass="w-full"
                                      [loading]="loading()"
                                      [disabled]="loading() || !email || !password"
                                      (click)="onLogin()">
                            </p-button>

                            <div class="text-center mt-6" style="font-family: 'Fira Sans', sans-serif;">
                                <span class="text-muted-color">Don't have an account? </span>
                                <a routerLink="/auth/register" class="text-primary font-medium cursor-pointer no-underline">
                                    Contact your Syndic
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    email: string = '';
    password: string = '';
    rememberMe: boolean = false;

    loading = signal(false);
    errorMessage = signal<string | null>(null);

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    onLogin(): void {
        if (!this.email || !this.password || this.loading()) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.loading.set(false);
                // Route based on role
                const route = this.authService.getDefaultRoute();
                this.router.navigate([route]);
            },
            error: (err) => {
                this.loading.set(false);
                if (err.status === 401 || err.status === 403) {
                    this.errorMessage.set('Invalid email or password');
                } else if (err.status === 0) {
                    this.errorMessage.set('Cannot connect to server. Is the backend running?');
                } else {
                    this.errorMessage.set(err.error?.message ?? 'Login failed. Please try again.');
                }
            }
        });
    }
}
