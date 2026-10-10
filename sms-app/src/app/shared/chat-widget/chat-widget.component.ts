import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMode, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isAuthenticated()) {
    <!-- Floating Chat Button -->
    <div class="chat-fab-wrapper">
      @if (!isOpen()) {
        <div class="chat-mode-picker" [class.visible]="showPicker()">
          <button class="mode-btn customer-btn" (click)="openChat('customer')" title="Customer Support">
            <span class="material-symbols-outlined">support_agent</span>
            <span>Customer Support</span>
          </button>
          <button class="mode-btn sales-btn" (click)="openChat('sales')" title="Sales Support">
            <span class="material-symbols-outlined">trending_up</span>
            <span>Sales Support</span>
          </button>
        </div>
        <button class="chat-fab" (click)="togglePicker()" [class.active]="showPicker()" title="AI Assistant">
          <span class="material-symbols-outlined fab-icon-chat">smart_toy</span>
          <span class="material-symbols-outlined fab-icon-close">close</span>
          <span class="fab-pulse"></span>
        </button>
      }
    </div>

    <!-- Chat Window -->
    @if (isOpen()) {
      <div class="chat-window" [class.visible]="isOpen()">
        <!-- Header -->
        <div class="chat-header" [class.sales-header]="activeMode() === 'sales'">
          <div class="chat-header-info">
            <div class="chat-avatar" [class.sales-avatar]="activeMode() === 'sales'">
              <span class="material-symbols-outlined">
                {{ activeMode() === 'customer' ? 'support_agent' : 'trending_up' }}
              </span>
            </div>
            <div class="chat-title-area">
              <span class="chat-title">
                {{ activeMode() === 'customer' ? 'Customer Support' : 'Sales Support' }}
              </span>
              <span class="chat-status">
                <span class="status-dot"></span>
                AI Assistant • Online
              </span>
            </div>
          </div>
          <div class="chat-header-actions">
            <!-- TTS Toggle -->
            <button
              class="header-btn"
              [class.tts-active]="ttsEnabled()"
              (click)="toggleTts()"
              [title]="ttsEnabled() ? 'Turn off voice responses' : 'Turn on voice responses'"
            >
              <span class="material-symbols-outlined">
                {{ ttsEnabled() ? 'volume_up' : 'volume_off' }}
              </span>
            </button>
            <button class="header-btn" (click)="switchMode()" title="Switch Mode">
              <span class="material-symbols-outlined">swap_horiz</span>
            </button>
            <button class="header-btn" (click)="clearChat()" title="Clear Chat">
              <span class="material-symbols-outlined">refresh</span>
            </button>
            <button class="header-btn close-btn" (click)="closeChat()" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <!-- Mode Badge -->
        <div class="mode-badge-bar">
          <button
            class="mode-badge"
            [class.active]="activeMode() === 'customer'"
            (click)="switchToMode('customer')"
          >
            <span class="material-symbols-outlined">support_agent</span>
            Customer
          </button>
          <button
            class="mode-badge"
            [class.active]="activeMode() === 'sales'"
            (click)="switchToMode('sales')"
          >
            <span class="material-symbols-outlined">trending_up</span>
            Sales
          </button>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages" #messagesContainer>
          <!-- Welcome message -->
          @if (currentMessages().length === 0) {
            <div class="welcome-card" [class.sales-welcome]="activeMode() === 'sales'">
              <div class="welcome-icon">
                <span class="material-symbols-outlined">
                  {{ activeMode() === 'customer' ? 'support_agent' : 'trending_up' }}
                </span>
              </div>
              <h3>{{ activeMode() === 'customer' ? 'Customer Support' : 'Sales Support' }}</h3>
              <p>{{ activeMode() === 'customer'
                ? 'Hello! I\'m here to help with account queries, invoices, orders, and more.'
                : 'Hi! I can help with invoicing, analytics, customer management, and sales strategies.' }}
              </p>
              <div class="quick-prompts">
                @for (prompt of quickPrompts(); track prompt) {
                  <button class="quick-prompt-btn" (click)="sendQuickPrompt(prompt)">
                    {{ prompt }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Messages -->
          @for (msg of currentMessages(); track msg.id) {
            <div class="message-row" [class.user-row]="msg.role === 'user'">
              @if (msg.role === 'assistant') {
                <div class="msg-avatar" [class.sales-msg-avatar]="msg.mode === 'sales'">
                  <span class="material-symbols-outlined">
                    {{ msg.mode === 'customer' ? 'support_agent' : 'trending_up' }}
                  </span>
                </div>
              }
              <div class="message-bubble" [class.user-bubble]="msg.role === 'user'" [class.assistant-bubble]="msg.role === 'assistant'" [class.sales-bubble]="msg.role === 'assistant' && msg.mode === 'sales'">
                <p class="msg-text">{{ msg.content }}</p>
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>
          }

          <!-- Typing Indicator -->
          @if (isLoading()) {
            <div class="message-row">
              <div class="msg-avatar" [class.sales-msg-avatar]="activeMode() === 'sales'">
                <span class="material-symbols-outlined">
                  {{ activeMode() === 'customer' ? 'support_agent' : 'trending_up' }}
                </span>
              </div>
              <div class="typing-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <!-- Voice status banner -->
          @if (isListening()) {
            <div class="voice-banner">
              <div class="voice-waves">
                <span class="wave"></span><span class="wave"></span><span class="wave"></span>
                <span class="wave"></span><span class="wave"></span>
              </div>
              <span class="voice-label">Listening... speak now</span>
              <button class="voice-cancel" (click)="stopListening()" title="Cancel">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }
          <div class="input-wrapper">
            <!-- Mic Button -->
            <button
              class="mic-btn"
              (click)="toggleListening()"
              [class.recording]="isListening()"
              [class.no-support]="!speechSupported"
              [title]="isListening() ? 'Stop recording' : speechSupported ? 'Start voice input' : 'Voice not supported in this browser'"
            >
              <span class="material-symbols-outlined">
                {{ isListening() ? 'stop_circle' : 'mic' }}
              </span>
              @if (isListening()) { <span class="mic-pulse"></span> }
            </button>
            <input
              #inputField
              type="text"
              class="chat-input"
              [(ngModel)]="inputText"
              (keydown.enter)="sendMessage()"
              [placeholder]="isListening() ? '🎤 Listening...' : activeMode() === 'customer' ? 'Ask about your account, invoice...' : 'Ask about sales, reports, metrics...'"
              [disabled]="isLoading()"
              maxlength="500"
            />
            <button
              class="send-btn"
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || isLoading()"
              [class.sales-send]="activeMode() === 'sales'"
              title="Send message"
            >
              <span class="material-symbols-outlined">send</span>
            </button>
          </div>
          <p class="powered-by">
            <span class="material-symbols-outlined" style="font-size:12px">auto_awesome</span>
            Powered by AI • Voice-Enabled Assistant
            @if (ttsEnabled()) {
              <span class="tts-badge">🔊 TTS ON</span>
            }
          </p>
        </div>
      </div>
    }
    } <!-- end isAuthenticated -->
  `,
  styles: [`
    /* ── FAB ──────────────────────────────────────────── */
    .chat-fab-wrapper {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .chat-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(99,102,241,0.5);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      overflow: visible;
    }

    .chat-fab:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(99,102,241,0.65); }
    .chat-fab.active { background: linear-gradient(135deg, #6366f1, #3b82f6); }

    .chat-fab .material-symbols-outlined { font-size: 26px; color: #fff; transition: all 0.25s; position: absolute; }
    .fab-icon-chat { opacity: 1; transform: scale(1) rotate(0deg); }
    .fab-icon-close { opacity: 0; transform: scale(0) rotate(-90deg); }
    .chat-fab.active .fab-icon-chat { opacity: 0; transform: scale(0) rotate(90deg); }
    .chat-fab.active .fab-icon-close { opacity: 1; transform: scale(1) rotate(0deg); }

    .fab-pulse {
      position: absolute;
      width: 100%; height: 100%;
      border-radius: 50%;
      background: rgba(99,102,241,0.35);
      animation: pulse-ring 2.5s ease-out infinite;
      pointer-events: none;
    }

    @keyframes pulse-ring {
      0%   { transform: scale(1); opacity: 0.6; }
      80%  { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* ── Mode Picker ──────────────────────────────────── */
    .chat-mode-picker {
      display: flex;
      flex-direction: column;
      gap: 8px;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }

    .chat-mode-picker.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 24px;
      border: none;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    }

    .mode-btn .material-symbols-outlined { font-size: 18px; }
    .mode-btn:hover { transform: translateX(-4px); }

    .customer-btn { background: linear-gradient(135deg,#22c55e,#16a34a); color: #fff; }
    .sales-btn    { background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff; }

    /* ── Chat Window ──────────────────────────────────── */
    .chat-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 390px;
      height: 580px;
      background: #0f172a;
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
      z-index: 9999;
      animation: slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    /* ── Header ───────────────────────────────────────── */
    .chat-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15));
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .chat-header.sales-header {
      background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.15));
    }

    .chat-header-info { display: flex; align-items: center; gap: 10px; }

    .chat-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(34,197,94,0.4);
    }

    .chat-avatar.sales-avatar {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 12px rgba(245,158,11,0.4);
    }

    .chat-avatar .material-symbols-outlined { font-size: 20px; color: #fff; }

    .chat-title-area { display: flex; flex-direction: column; }
    .chat-title { font-size: 0.92rem; font-weight: 700; color: #f1f5f9; }
    .chat-status { font-size: 0.7rem; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e;
      animation: blink 2s ease-in-out infinite;
    }

    @keyframes blink {
      0%,100% { opacity: 1; } 50% { opacity: 0.4; }
    }

    .chat-header-actions { display: flex; gap: 4px; }

    .header-btn {
      width: 30px; height: 30px; border-radius: 8px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }

    .header-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
    .header-btn .material-symbols-outlined { font-size: 16px; }
    .close-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }

    /* ── Mode Badge Bar ───────────────────────────────── */
    .mode-badge-bar {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }

    .mode-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 12px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.1);
      background: transparent; color: #64748b;
      cursor: pointer; transition: all 0.2s;
    }

    .mode-badge .material-symbols-outlined { font-size: 14px; }

    .mode-badge.active {
      background: rgba(59,130,246,0.2);
      border-color: rgba(59,130,246,0.4);
      color: #60a5fa;
    }

    .mode-badge:nth-child(2).active {
      background: rgba(245,158,11,0.15);
      border-color: rgba(245,158,11,0.4);
      color: #fbbf24;
    }

    /* ── Messages ─────────────────────────────────────── */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .chat-messages::-webkit-scrollbar { width: 4px; }
    .chat-messages::-webkit-scrollbar-track { background: transparent; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }

    /* Welcome Card */
    .welcome-card {
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      animation: fadeIn 0.4s ease;
    }

    .welcome-card.sales-welcome {
      background: rgba(245,158,11,0.08);
      border-color: rgba(245,158,11,0.2);
    }

    .welcome-icon {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      box-shadow: 0 4px 16px rgba(34,197,94,0.3);
    }

    .sales-welcome .welcome-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 16px rgba(245,158,11,0.3);
    }

    .welcome-icon .material-symbols-outlined { font-size: 24px; color: #fff; }

    .welcome-card h3 { color: #f1f5f9; font-size: 1rem; margin: 0 0 6px; }
    .welcome-card p  { color: #94a3b8; font-size: 0.8rem; margin: 0 0 14px; line-height: 1.5; }

    .quick-prompts { display: flex; flex-direction: column; gap: 6px; }

    .quick-prompt-btn {
      padding: 7px 12px; border-radius: 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #cbd5e1; font-size: 0.78rem; cursor: pointer;
      text-align: left; transition: all 0.2s;
    }

    .quick-prompt-btn:hover {
      background: rgba(99,102,241,0.15);
      border-color: rgba(99,102,241,0.35);
      color: #a5b4fc;
      transform: translateX(3px);
    }

    /* Message Rows */
    .message-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      animation: fadeIn 0.3s ease;
    }

    .user-row { flex-direction: row-reverse; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .msg-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 2px 8px rgba(34,197,94,0.3);
    }

    .msg-avatar.sales-msg-avatar {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 2px 8px rgba(245,158,11,0.3);
    }

    .msg-avatar .material-symbols-outlined { font-size: 14px; color: #fff; }

    .message-bubble {
      max-width: 76%;
      padding: 10px 14px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .assistant-bubble {
      background: rgba(30,41,59,0.9);
      border: 1px solid rgba(255,255,255,0.07);
      border-bottom-left-radius: 4px;
    }

    .sales-bubble {
      border-color: rgba(245,158,11,0.15);
      background: rgba(30,41,59,0.95);
    }

    .user-bubble {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }

    .msg-text {
      font-size: 0.83rem;
      line-height: 1.55;
      color: #e2e8f0;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .user-bubble .msg-text { color: #fff; }

    .msg-time {
      font-size: 0.65rem;
      color: #475569;
      align-self: flex-end;
    }

    .user-bubble .msg-time { color: rgba(255,255,255,0.6); }

    /* Typing Indicator */
    .typing-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 12px 16px;
      background: rgba(30,41,59,0.9);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; border-bottom-left-radius: 4px;
    }

    .dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #94a3b8;
      animation: bounce 1.2s ease-in-out infinite;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-6px); }
    }

    /* ── Input Area ───────────────────────────────────── */
    .chat-input-area {
      padding: 10px 12px 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(0,0,0,0.2);
      flex-shrink: 0;
    }

    .input-wrapper { display: flex; gap: 8px; align-items: center; }

    .chat-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(30,41,59,0.8);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      color: #e2e8f0;
      font-size: 0.83rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-input::placeholder { color: #475569; }
    .chat-input:focus { border-color: rgba(99,102,241,0.5); }
    .chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

    .send-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
    }

    .send-btn.sales-send { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.35); }
    .send-btn:hover:not(:disabled) { transform: scale(1.08); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn .material-symbols-outlined { font-size: 18px; color: #fff; }

    .powered-by {
      text-align: center; font-size: 0.65rem; color: #334155;
      margin: 6px 0 0; display: flex; align-items: center; justify-content: center; gap: 3px;
    }
  `],
})
export class ChatWidgetComponent implements AfterViewChecked {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;

  isOpen = signal(false);
  showPicker = signal(false);
  activeMode = signal<ChatMode>('customer');
  inputText = '';

  // ── Voice state ──────────────────────────────────────────
  isListening = signal(false);
  ttsEnabled = signal(false);
  readonly speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  private recognition: any = null;
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  isAuthenticated = this.authService.isAuthenticated;
  isLoading = this.chatService.isLoading;

  currentMessages = computed(() =>
    this.chatService.messages().filter(m => m.mode === this.activeMode())
  );

  private quickPromptsMap: Record<ChatMode, string[]> = {
    customer: [
      '🧾 I have a question about my invoice',
      '📦 What is my order status?',
      '💳 I need help with a payment',
      '🔄 How do I request a refund?',
    ],
    sales: [
      '📊 Show me today\'s sales metrics',
      '🧾 How do I create a new invoice?',
      '📈 How can I improve gross margin?',
      '👥 How do I add a new customer?',
    ],
  };

  quickPrompts = computed(() => this.quickPromptsMap[this.activeMode()]);

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  togglePicker(): void {
    this.showPicker.update(v => !v);
  }

  openChat(mode: ChatMode): void {
    this.activeMode.set(mode);
    this.isOpen.set(true);
    this.showPicker.set(false);
    this.shouldScroll = true;
    setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
  }


  switchMode(): void {
    this.activeMode.update(m => (m === 'customer' ? 'sales' : 'customer'));
    this.shouldScroll = true;
  }

  switchToMode(mode: ChatMode): void {
    this.activeMode.set(mode);
    this.shouldScroll = true;
  }

  clearChat(): void {
    this.chatService.clearMessages();
  }

  async sendMessage(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;
    this.inputText = '';
    this.shouldScroll = true;
    await this.chatService.sendMessage(text, this.activeMode());
    this.shouldScroll = true;
    // Speak latest assistant reply if TTS is on
    if (this.ttsEnabled()) {
      const msgs = this.chatService.messages();
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') this.speak(last.content);
    }
  }

  async sendQuickPrompt(prompt: string): Promise<void> {
    await this.chatService.sendMessage(prompt, this.activeMode());
    this.shouldScroll = true;
    if (this.ttsEnabled()) {
      const msgs = this.chatService.messages();
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant') this.speak(last.content);
    }
  }

  // ── Voice Assistant Methods ───────────────────────────────
  toggleListening(): void {
    if (!this.speechSupported) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (this.isListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onstart = () => {
      this.isListening.set(true);
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      this.inputText = final || interim;
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
      // Auto-send if we captured final text
      if (this.inputText.trim()) {
        setTimeout(() => this.sendMessage(), 300);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening.set(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions in your browser.');
      }
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening.set(false);
  }

  toggleTts(): void {
    this.ttsEnabled.update(v => !v);
    if (!this.ttsEnabled() && this.synth) {
      this.synth.cancel(); // Stop any ongoing speech
    }
  }

  private speak(text: string): void {
    if (!this.synth || !this.ttsEnabled()) return;
    this.synth.cancel();
    // Strip emojis for cleaner speech
    const clean = text.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;
    // Prefer a natural-sounding voice
    const voices = this.synth.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.lang === 'en-US'
    );
    if (preferred) utterance.voice = preferred;
    this.synth.speak(utterance);
  }

  closeChat(): void {
    this.stopListening();
    if (this.synth) this.synth.cancel();
    this.isOpen.set(false);
    this.showPicker.set(false);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
