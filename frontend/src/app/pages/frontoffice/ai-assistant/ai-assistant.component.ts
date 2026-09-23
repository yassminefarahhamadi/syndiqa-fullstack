import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '@/app/core/auth/auth.service';
import { FinancialAssistantService } from '../financial-assistant/financial-assistant.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  confidence?: number;
}

interface SuggestedQuestion {
  icon: string;
  text: string;
  category: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    ChipModule,
    AvatarModule,
    ScrollPanelModule,
    DividerModule
  ],
  providers: [MessageService],
  template: `
    <!-- Background Orbs -->
    <div class="ds-bg-orbs">
        <div class="ds-orb ds-orb-1"></div>
        <div class="ds-orb ds-orb-2"></div>
    </div>

    <div class="ds-ai-container">
        <!-- Hero Section -->
        <section class="ds-ai-hero">
            <div class="ds-ai-badge">
                <i class="pi pi-sparkles ds-badge-icon"></i>
                <span class="ds-label-caps">INTELLIGENT FINANCIAL ADVISOR</span>
            </div>
            <h1 class="ds-display-lg">AI Financial Assistant</h1>
            <p class="ds-body-text">Real-time analysis, spending insights, and financial management for your residence portfolio.</p>
        </section>

        <!-- Chat Container -->
        <section class="ds-chat-area" #chatContainer>
            <!-- Empty State with Suggestion Grid -->
            <div *ngIf="chatMessages().length === 0" class="ds-empty-state">
                <!-- System Welcome -->
                <div class="ds-welcome-msg">
                    <div class="ds-ai-avatar">
                        <i class="pi pi-bolt"></i>
                    </div>
                    <div class="ds-ai-bubble">
                        <p>Hello! I'm your AI financial assistant. I can help you understand your wallet balance, analyze spending patterns, review charges, and provide financial insights. What would you like to know?</p>
                        <span class="ds-timestamp">Just now</span>
                    </div>
                </div>

                <!-- Suggestion Grid (Bento) -->
                <div class="ds-suggestion-grid">
                    <button *ngFor="let suggestion of suggestedQuestions"
                            (click)="askSuggestedQuestion(suggestion.text)"
                            class="ds-suggestion-card">
                        <div class="ds-suggestion-top">
                            <i [class]="suggestion.icon + ' ds-suggestion-icon'"></i>
                            <i class="pi pi-arrow-up-right ds-arrow-icon"></i>
                        </div>
                        <span class="ds-suggestion-title">{{ suggestion.category }}</span>
                        <p class="ds-suggestion-desc">{{ suggestion.text }}</p>
                    </button>
                </div>
            </div>

            <!-- Messages -->
            <div *ngIf="chatMessages().length > 0" class="ds-messages">
                <div *ngFor="let message of chatMessages()" class="ds-msg-row" [class.ds-msg-user]="message.role === 'user'">
                    <!-- AI Message -->
                    <ng-container *ngIf="message.role === 'assistant'">
                        <div class="ds-ai-avatar ds-avatar-sm">
                            <i class="pi pi-bolt"></i>
                        </div>
                        <div class="ds-ai-bubble">
                            <p class="ds-msg-content">{{ message.content }}</p>
                            <div *ngIf="message.confidence || message.sources?.length" class="ds-msg-meta">
                                <span *ngIf="message.confidence" class="ds-confidence">Confidence: {{ ((message.confidence || 0) * 100).toFixed(0) }}%</span>
                                <span *ngIf="message.sources?.length">{{ (message.sources?.length || 0) }} sources</span>
                            </div>
                            <span class="ds-timestamp">{{ message.timestamp | date:'shortTime' }}</span>
                        </div>
                    </ng-container>

                    <!-- User Message -->
                    <ng-container *ngIf="message.role === 'user'">
                        <div class="ds-user-bubble">
                            <p class="ds-msg-content">{{ message.content }}</p>
                            <span class="ds-timestamp ds-timestamp-user">{{ message.timestamp | date:'shortTime' }}</span>
                        </div>
                    </ng-container>
                </div>

                <!-- Loading indicator -->
                <div *ngIf="chatLoading()" class="ds-msg-row">
                    <div class="ds-ai-avatar ds-avatar-sm">
                        <i class="pi pi-bolt"></i>
                    </div>
                    <div class="ds-ai-bubble ds-typing">
                        <div class="ds-typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Input Bar -->
        <div class="ds-input-bar">
            <div class="ds-input-inner">
                <form [formGroup]="chatForm" (ngSubmit)="askQuestion()" class="ds-input-form">
                    <input
                        formControlName="question"
                        placeholder="Ask Syndiqa AI anything about your finances..."
                        class="ds-chat-input"
                        [disabled]="chatLoading()" />
                    <button type="submit" class="ds-send-btn" [disabled]="chatForm.invalid || chatLoading()">
                        <i class="pi pi-send"></i>
                    </button>
                </form>
            </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="ds-ai-sidebar">
            <div class="ds-glass-card ds-sidebar-card">
                <div class="ds-sidebar-row">
                    <span class="ds-sidebar-label">Messages</span>
                    <span class="ds-sidebar-value">{{ chatMessages().length }}</span>
                </div>
                <div class="ds-sidebar-row">
                    <span class="ds-sidebar-label">Session</span>
                    <span class="ds-sidebar-value">{{ sessionTime }}</span>
                </div>
            </div>
            <div class="ds-glass-card ds-sidebar-card ds-sidebar-actions">
                <button class="ds-action-btn" (click)="clearChat()" [disabled]="chatMessages().length === 0">
                    <i class="pi pi-trash"></i> Clear Chat
                </button>
                <button class="ds-action-btn" (click)="exportChat()" [disabled]="chatMessages().length === 0">
                    <i class="pi pi-download"></i> Export
                </button>
            </div>
        </div>
    </div>

    <p-toast />
  `,
  styles: [`
    :host { display:block; position:relative; font-family:'Inter',sans-serif; min-height:100vh; --ds-text:#1a2e23; --ds-muted:#64748b; --ds-bg:rgba(0,0,0,0.02); --ds-border:rgba(0,0,0,0.08); --ds-card-hover:rgba(0,0,0,0.04); color:var(--ds-text); }
    :host-context(.app-dark) { --ds-text:#dde4dd; --ds-muted:#86948a; --ds-bg:rgba(255,255,255,0.03); --ds-border:rgba(255,255,255,0.1); --ds-card-hover:rgba(255,255,255,0.05); }

    .ds-bg-orbs { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
    .ds-orb { position: absolute; border-radius: 50%; }
    .ds-orb-1 { top: 10%; left: 15%; width: 24rem; height: 24rem; background: rgba(78,222,163,0.05); filter: blur(120px); }
    .ds-orb-2 { bottom: 20%; right: 10%; width: 30rem; height: 30rem; background: rgba(59,130,246,0.04); filter: blur(150px); }

    .ds-ai-container { max-width:56rem; margin:0 auto; padding:0 1.25rem; display:flex; flex-direction:column; min-height:calc(100vh - 10rem); position:relative; }

    /* Hero */
    .ds-ai-hero { text-align: center; margin-bottom: 2rem; padding-top: 1rem; }
    .ds-ai-badge {
        display: inline-flex; align-items: center; gap: 0.5rem;
        padding: 0.375rem 0.75rem; border-radius: 9999px;
        background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
        margin-bottom: 1rem;
    }
    .ds-badge-icon { color: #4edea3; font-size: 14px; }
    .ds-label-caps { font-size: 12px; line-height: 16px; letter-spacing: 0.05em; font-weight: 700; text-transform: uppercase; color: #4edea3; margin: 0; }
    .ds-display-lg { font-size:3rem; line-height:3.5rem; font-weight:700; letter-spacing:-0.02em; color:var(--ds-text); margin:0 0 0.5rem; }
    .ds-body-text { font-size:1rem; color:var(--ds-muted); max-width:32rem; margin:0 auto; }

    /* Glass Card */
    .ds-glass-card {
        background:var(--ds-bg); backdrop-filter:blur(20px);
        border:1px solid var(--ds-border);
        border-radius:0.75rem; padding:1rem;
    }

    /* Chat Area */
    .ds-chat-area { flex: 1; overflow-y: auto; padding-bottom: 6rem; scroll-behavior: smooth; }
    .ds-chat-area::-webkit-scrollbar { width: 6px; }
    .ds-chat-area::-webkit-scrollbar-track { background: transparent; }
    .ds-chat-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

    /* Empty State */
    .ds-empty-state { display: flex; flex-direction: column; gap: 1.5rem; }

    /* Welcome Message */
    .ds-welcome-msg { display: flex; gap: 1rem; align-items: flex-start; }
    .ds-ai-avatar {
        width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; flex-shrink: 0;
        background: #10b981; display: flex; align-items: center; justify-content: center;
        color: #003824; font-size: 1rem;
    }
    .ds-avatar-sm { width: 2rem; height: 2rem; border-radius: 0.5rem; font-size: 0.875rem; }
    .ds-ai-bubble {
        background: linear-gradient(135deg, rgba(22,29,25,0.9), rgba(14,21,17,0.9));
        border: 1px solid rgba(255,255,255,0.05);
        padding: 1rem; border-radius: 0 0.75rem 0.75rem 0.75rem; max-width: 85%;
    }
    .ds-ai-bubble p { margin: 0; font-size: 1rem; line-height: 1.5; color: #dde4dd; }

    /* Suggestion Grid */
    .ds-suggestion-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 1rem; }
    @media (max-width: 640px) { .ds-suggestion-grid { grid-template-columns: 1fr; } }
    .ds-suggestion-card {
        background:var(--ds-bg); backdrop-filter:blur(20px);
        border:1px solid var(--ds-border);
        text-align:left; padding:1rem; border-radius:0.75rem; cursor:pointer;
        transition:all 0.2s; color:var(--ds-text);
    }
    .ds-suggestion-card:hover { background:var(--ds-card-hover); }
    .ds-suggestion-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .ds-suggestion-icon { color: #4edea3; font-size: 1.25rem; transition: transform 0.2s; }
    .ds-suggestion-card:hover .ds-suggestion-icon { transform: scale(1.1); }
    .ds-arrow-icon { color: #3c4a42; font-size: 0.75rem; }
    .ds-suggestion-title { display: block; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
    .ds-suggestion-desc { margin:0; font-size:0.875rem; color:var(--ds-muted); line-height:1.4; }

    /* Messages */
    .ds-messages { display: flex; flex-direction: column; gap: 1.25rem; }
    .ds-msg-row { display: flex; gap: 0.75rem; align-items: flex-start; }
    .ds-msg-user { flex-direction: row-reverse; }
    .ds-msg-content { margin:0; font-size:1rem; line-height:1.5; }
    .ds-user-bubble {
        background: linear-gradient(135deg, #10b981, #005236);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 1rem; border-radius: 0.75rem 0 0.75rem 0.75rem; max-width: 85%;
        color: #e0f5ec;
    }
    .ds-timestamp { display:block; font-size:10px; font-weight:700; letter-spacing:0.05em; color:var(--ds-muted); margin-top:0.5rem; }
    .ds-timestamp-user { color:rgba(255,255,255,0.6); }
    .ds-msg-meta { display:flex; gap:0.75rem; font-size:0.75rem; color:var(--ds-muted); margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--ds-border); }
    .ds-confidence { color: #4edea3; }

    /* Typing animation */
    .ds-typing { padding: 1rem 1.5rem; }
    .ds-typing-dots { display: flex; gap: 0.375rem; }
    .ds-typing-dots span {
        width: 8px; height: 8px; border-radius: 50%; background: #4edea3;
        animation: typingDot 1.4s infinite ease-in-out both;
    }
    .ds-typing-dots span:nth-child(1) { animation-delay: 0s; }
    .ds-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .ds-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

    /* Input Bar */
    .ds-input-bar { position: sticky; bottom: 0; padding: 1rem 0; z-index: 40; }
    .ds-input-inner {
        background:var(--ds-bg); backdrop-filter:blur(20px);
        border:1px solid var(--ds-border);
        border-radius:1rem; padding:0.5rem;
        box-shadow:0 -8px 48px rgba(0,0,0,0.1);
    }
    .ds-input-form { display: flex; align-items: center; gap: 0.5rem; }
    .ds-chat-input {
        flex:1; background:transparent; border:none; outline:none;
        color:var(--ds-text); font-size:1rem; padding:0.75rem;
        font-family:'Inter',sans-serif;
    }
    .ds-chat-input::placeholder { color:var(--ds-muted); }
    .ds-send-btn {
        padding: 0.75rem; background: #10b981; color: #003824; border: none;
        border-radius: 0.75rem; cursor: pointer; transition: all 0.2s;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }
    .ds-send-btn:hover { background: #6ffbbe; }
    .ds-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ds-send-btn:active { transform: scale(0.95); }

    /* Sidebar */
    .ds-ai-sidebar {
        position: fixed; top: 50%; right: 1.5rem; transform: translateY(-50%);
        display: none; flex-direction: column; gap: 0.75rem; width: 14rem;
    }
    @media (min-width: 1280px) { .ds-ai-sidebar { display: flex; } }
    .ds-sidebar-card { padding: 1rem; }
    .ds-sidebar-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
    .ds-sidebar-row:not(:last-child) { border-bottom:1px solid var(--ds-border); }
    .ds-sidebar-label { font-size:0.875rem; color:var(--ds-muted); }
    .ds-sidebar-value { font-weight:600; color:var(--ds-text); }
    .ds-sidebar-actions { display:flex; flex-direction:column; gap:0.5rem; }
    .ds-action-btn {
        display:flex; align-items:center; gap:0.5rem; width:100%;
        padding:0.625rem 0.75rem; background:transparent; border:1px solid var(--ds-border);
        border-radius:0.5rem; color:var(--ds-muted); font-size:0.875rem;
        cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif;
    }
    .ds-action-btn:hover { background:var(--ds-card-hover); color:var(--ds-text); }
    .ds-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  private auth = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private financialService = inject(FinancialAssistantService);

  // State
  chatMessages = signal<ChatMessage[]>([]);
  chatLoading = signal(false);
  chatForm: FormGroup;
  userId = this.auth.user()?.id || '';
  sessionTime = '0m';
  private sessionStart = new Date();
  private shouldScroll = false;
  private readonly STORAGE_KEY = 'syndiqa_ai_chat_history';

  suggestedQuestions: SuggestedQuestion[] = [
    { icon: 'pi pi-wallet', text: 'What is my current wallet balance?', category: 'Wallet Balance' },
    { icon: 'pi pi-chart-line', text: 'Analyze my spending patterns for the last 30 days.', category: 'Spending Patterns' },
    { icon: 'pi pi-money-bill', text: 'Show me my pending charges', category: 'Pending Charges' },
    { icon: 'pi pi-calendar', text: 'When is my next payment due?', category: 'Payment Schedule' }
  ];

  constructor() {
    this.chatForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
    });

    // Update session time every minute
    setInterval(() => {
      const diff = new Date().getTime() - this.sessionStart.getTime();
      const minutes = Math.floor(diff / 60000);
      this.sessionTime = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }, 60000);
  }

  ngOnInit(): void {
    this.loadChatHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  askQuestion(): void {
    if (this.chatForm.invalid) return;

    const question = this.chatForm.get('question')?.value;
    this.processQuestion(question);
  }

  askSuggestedQuestion(question: string): void {
    this.processQuestion(question);
  }

  private processQuestion(question: string): void {
    // Add user message
    this.chatMessages.update(messages => [...messages, {
      role: 'user',
      content: question,
      timestamp: new Date()
    }]);

    this.chatForm.reset();
    this.chatLoading.set(true);
    this.shouldScroll = true;

    this.financialService.askFinancialQuestion(question, this.userId).subscribe({
      next: (response: any) => {
        this.chatMessages.update(messages => [...messages, {
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          confidence: response.confidence
        }]);
        this.chatLoading.set(false);
        this.shouldScroll = true;
        this.saveChatHistory();
      },
      error: (error) => {
        this.chatLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to get response'
        });
      }
    });
  }

  clearChat(): void {
    this.chatMessages.set([]);
    this.chatForm.reset();
    this.sessionStart = new Date();
    this.sessionTime = '0m';
    this.saveChatHistory();
  }

  private saveChatHistory(): void {
    try {
      const messages = this.chatMessages().map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch (e) { console.warn('Failed to save chat history:', e); }
  }

  private loadChatHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const messages: ChatMessage[] = JSON.parse(stored).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        this.chatMessages.set(messages);
        this.shouldScroll = true;
      }
    } catch (e) { console.warn('Failed to load chat history:', e); }
  }

  exportChat(): void {
    const chatText = this.chatMessages().map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Exported',
      detail: 'Chat history exported successfully'
    });
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer && this.chatContainer.nativeElement) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          const element = this.chatContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }, 100);
      }
    } catch(err) { 
      console.error('Error scrolling to bottom:', err);
    }
  }
}
