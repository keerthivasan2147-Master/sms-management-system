import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type ChatMode = 'customer' | 'sales';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: ChatMode;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private msgId = 0;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);

  // ─── OpenAI Config (plug in your key when ready) ───────────────────────
  private openAiKey: string | null = (environment as any).openAiKey ?? null;
  private openAiModel = 'gpt-4o-mini';

  // ─── System prompts per mode ────────────────────────────────────────────
  private systemPrompts: Record<ChatMode, string> = {
    customer: `You are a friendly Customer Support Assistant for "SMS Portal" — a Sales Management System.
Help customers with: account queries, invoice questions, order status, product info, complaints, and general help.
Be concise, professional, and empathetic. If asked about specific data, explain you can look it up in the system.
Always respond in plain text without markdown formatting.`,

    sales: `You are an expert Sales Support Assistant for "SMS Portal" — a Sales Management System.
Help sales staff with: creating invoices, managing customers, tracking items, understanding reports, gross margins, and sales analytics.
Provide actionable sales advice, best practices, and help interpret dashboard metrics.
You know about the system features: Invoice Entry, Customer Management, Item Management, Sales Reports, and Dashboard analytics.
Always respond in plain text without markdown formatting.`,
  };

  // ─── Smart offline responses ────────────────────────────────────────────
  private offlineRules: Record<ChatMode, Array<{ patterns: string[]; response: string }>> = {
    customer: [
      {
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
        response: "Hello! 👋 Welcome to Customer Support. I'm here to help you with your account, invoices, orders, and any other questions. How can I assist you today?",
      },
      {
        patterns: ['invoice', 'bill', 'receipt', 'billing'],
        response: "I can help you with invoice queries! Your invoices are managed by our sales team. For a specific invoice, you can ask for the invoice number (e.g., INV-001) and I'll guide you on how to retrieve it through the system. Is there a specific invoice you're looking for?",
      },
      {
        patterns: ['order', 'purchase', 'buy', 'bought'],
        response: "For order status and history, our team tracks all purchases through the Sales Invoice system. Each order has a unique invoice number. Could you provide the invoice number or the date range of your purchase so we can assist you better?",
      },
      {
        patterns: ['account', 'profile', 'details', 'information'],
        response: "Your customer account holds your contact details, purchase history, and transaction records. If you need to update any information or have questions about your account, our team will be happy to assist. What specifically would you like to know about your account?",
      },
      {
        patterns: ['refund', 'return', 'cancel', 'cancellation'],
        response: "I understand you're looking into a refund or return. Our policy allows returns within 30 days of purchase with original receipt. Please provide your invoice number and our team will process your request promptly. Would you like me to escalate this to our returns department?",
      },
      {
        patterns: ['payment', 'pay', 'price', 'cost', 'amount'],
        response: "For payment queries, all amounts are detailed in your invoice. We accept various payment methods. If you have questions about a specific charge or need a payment breakdown, please share your invoice number and I can provide detailed information.",
      },
      {
        patterns: ['product', 'item', 'stock', 'available', 'availability'],
        response: "Our product catalog is managed through the Items section of the SMS system. We carry a wide range of products. For specific availability, pricing, or product details, could you tell me what item you're interested in?",
      },
      {
        patterns: ['contact', 'phone', 'email', 'reach', 'speak'],
        response: "You can reach our support team via:\n• Email: support@smsportal.com\n• Phone: +1-800-SMS-HELP\n• Live Chat: You're already here! 😊\n\nOur team is available Mon-Fri, 9AM-6PM. Is there anything else I can help you with?",
      },
      {
        patterns: ['complaint', 'problem', 'issue', 'wrong', 'error', 'mistake'],
        response: "I'm sorry to hear you're experiencing an issue. Your satisfaction is our top priority. Could you describe the problem in detail? I'll make sure to escalate this to the appropriate team and ensure it's resolved as quickly as possible.",
      },
      {
        patterns: ['thank', 'thanks', 'appreciate', 'great', 'perfect', 'awesome'],
        response: "You're very welcome! 😊 It's my pleasure to help. Is there anything else you need assistance with? We're always here for you!",
      },
      {
        patterns: ['bye', 'goodbye', 'see you', 'closing', 'done'],
        response: "Thank you for contacting Customer Support! Have a wonderful day. Don't hesitate to reach out if you need anything else. Goodbye! 👋",
      },
    ],
    sales: [
      {
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        response: "Hello! 👋 I'm your Sales Support Assistant. I can help you with invoicing, customer management, sales analytics, performance reports, and best practices. What would you like help with today?",
      },
      {
        patterns: ['invoice', 'create invoice', 'new invoice', 'make invoice'],
        response: "To create a new invoice:\n1. Click 'Invoice Entry' in the navigation bar\n2. The system auto-generates the next invoice number\n3. Select a Customer Code (or add a new customer)\n4. Add items using the item search — it auto-fills price and description\n5. Review the total and gross margin at the bottom\n6. Click 'Save' to save the invoice\n\nPro tip: Keep an eye on the Gross Margin % — aim for 25%+ for healthy profitability!",
      },
      {
        patterns: ['customer', 'customers', 'client', 'add customer', 'new customer'],
        response: "Customer Management tips:\n• Navigate to 'Customers' to view all registered accounts\n• Add new customers with a unique Customer Code, name, contact, and mobile\n• Customer codes help link invoices to accounts for easy tracking\n• Regularly review customer purchase patterns to identify top clients\n\nCurrent system shows 10 registered client accounts. Would you like tips on customer retention strategies?",
      },
      {
        patterns: ['item', 'product', 'inventory', 'stock', 'add item'],
        response: "Item Management guide:\n• Go to 'Items' in the navigation to manage your product catalog\n• Each item has: Code, Description, Unit, Cost Price, and Selling Price\n• The system auto-calculates Gross Margin = (Selling - Cost) / Selling × 100\n• Keep selling prices updated to maintain healthy margins\n\nTip: Items with 30%+ margin contribute most to your bottom line!",
      },
      {
        patterns: ['report', 'sales report', 'analytics', 'analysis'],
        response: "Sales Reports & Analytics:\n• Navigate to 'Sales Report' for detailed transaction analysis\n• Filter by date range to see period-specific performance\n• Dashboard shows: Total Revenue, Gross Profit, Top-Selling Item, Client Network\n• Current metrics: $38,943 total revenue | $10,598 gross profit (27.2% margin)\n\nWould you like tips on how to use reports to boost sales performance?",
      },
      {
        patterns: ['dashboard', 'metrics', 'kpi', 'performance'],
        response: "Your Dashboard Key Metrics:\n📊 Total Revenue: $38,943 (8 invoices)\n💰 Gross Profit: $10,598 (27.2% margin)\n🏆 Top Item: Anker 737 Power (41 units sold)\n👥 Client Network: 10 accounts\n\nInsight: Your 27.2% gross margin is solid. To improve it, focus on high-margin items and upsell premium products. Would you like specific strategies?",
      },
      {
        patterns: ['margin', 'profit', 'gross margin', 'profitability'],
        response: "Gross Margin Analysis:\n• Current overall margin: 27.2% — This is good!\n• Industry benchmark for retail: 25-35%\n• Formula: (Selling Price - Cost) / Selling Price × 100\n\nTo improve margins:\n1. Focus on high-margin items (30%+ margin)\n2. Upsell premium product bundles\n3. Review cost prices with suppliers quarterly\n4. Set minimum margin thresholds per product category",
      },
      {
        patterns: ['revenue', 'sales', 'target', 'goal'],
        response: "Sales Performance Insights:\n• Total revenue: $38,943 from 8 invoices\n• Average invoice value: ~$4,868\n• To hit $50K target: Need ~$11K more revenue\n\nStrategies to boost revenue:\n1. Increase average order value through upselling\n2. Re-engage existing 10 customers with follow-up calls\n3. Focus on top-selling categories like electronics\n4. Create bundle deals for slow-moving inventory",
      },
      {
        patterns: ['tip', 'advice', 'best practice', 'strategy', 'improve'],
        response: "Top Sales Best Practices for SMS Portal:\n1. 📞 Follow up with customers 7 days after purchase\n2. 📊 Review your Sales Report weekly — track trends\n3. 🏷️ Keep item prices competitive — monitor margins\n4. 👥 Segment customers by purchase frequency\n5. 🎯 Set monthly revenue targets and track via Dashboard\n6. 📦 Identify top 20% of items driving 80% of revenue\n7. 💬 Use Customer Support chat to resolve issues quickly",
      },
      {
        patterns: ['help', 'how', 'guide', 'tutorial'],
        response: "I can help you with:\n🔹 Creating & managing invoices\n🔹 Customer account management\n🔹 Product catalog & inventory\n🔹 Reading sales reports & analytics\n🔹 Understanding dashboard metrics\n🔹 Sales strategies & best practices\n🔹 Gross margin optimization\n\nWhat specific area would you like guidance on?",
      },
      {
        patterns: ['thank', 'thanks', 'appreciate', 'great', 'perfect'],
        response: "You're welcome! Great selling! 🚀 Remember, the key to sales success is consistency and data-driven decisions. The SMS Portal dashboard is your best tool — use it daily! Is there anything else I can help you with?",
      },
    ],
  };

  private getOfflineResponse(message: string, mode: ChatMode): string {
    const lower = message.toLowerCase();
    const rules = this.offlineRules[mode];
    for (const rule of rules) {
      if (rule.patterns.some(p => lower.includes(p))) {
        return rule.response;
      }
    }
    // Default fallback
    if (mode === 'customer') {
      return "Thank you for reaching out! I'd be happy to help with your query. Could you provide more details about what you need? For specific account or invoice information, having your customer code or invoice number handy will help us assist you faster.";
    } else {
      return "Great question! For detailed guidance on that topic, I recommend checking the relevant section in SMS Portal — Dashboard for metrics, Sales Report for analytics, and Invoice Entry for transaction management. Could you be more specific about what you'd like help with so I can give you a more targeted answer?";
    }
  }

  async sendMessage(content: string, mode: ChatMode): Promise<void> {
    // Add user message
    this.messages.update(msgs => [
      ...msgs,
      { id: ++this.msgId, role: 'user', content, timestamp: new Date(), mode },
    ]);

    this.isLoading.set(true);

    try {
      let reply: string;

      if (this.openAiKey) {
        reply = await this.callOpenAI(content, mode);
      } else {
        // Simulate a natural typing delay
        await this.delay(800 + Math.random() * 600);
        reply = this.getOfflineResponse(content, mode);
      }

      this.messages.update(msgs => [
        ...msgs,
        { id: ++this.msgId, role: 'assistant', content: reply, timestamp: new Date(), mode },
      ]);
    } catch (err) {
      this.messages.update(msgs => [
        ...msgs,
        {
          id: ++this.msgId,
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
          mode,
        },
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async callOpenAI(userMessage: string, mode: ChatMode): Promise<string> {
    const history = this.messages()
      .slice(-10)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAiKey}`,
      },
      body: JSON.stringify({
        model: this.openAiModel,
        messages: [
          { role: 'system', content: this.systemPrompts[mode] },
          ...history,
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    return data.choices[0].message.content;
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
