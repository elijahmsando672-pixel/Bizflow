import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  timestamp?: string;
}

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async processIncomingMessage(payload: any) {
    const { From, Body, To } = payload;

    const session = await this.prisma.whatsAppSession.findFirst({
      where: { phoneNumber: From },
    });

    if (!session) {
      return this.sendMessage(From, 'Welcome to BizFlow! Please link your WhatsApp in your dashboard.');
    }

    const command = Body.trim().toLowerCase();
    const response = await this.handleCommand(command, session.businessId);

    await this.prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date() },
    });

    return this.sendMessage(From, response);
  }

  private async handleCommand(command: string, businessId: string): Promise<string> {
    const commands: Record<string, (bid: string) => Promise<string>> = {
      help: () => Promise.resolve(this.getHelpMenu()),
      sale: (bid) => this.logSale(bid, command),
      expense: (bid) => this.logExpense(bid, command),
      stock: (bid) => this.getStockSummary(bid),
      tasks: (bid) => this.getTasks(bid),
      summary: (bid) => this.getDailySummary(bid),
      invoice: (bid) => this.generateInvoice(bid, command),
    };

    const [cmd] = command.split(' ');
    const handler = commands[cmd];

    if (handler) {
      return handler(businessId);
    }

    if (['hi', 'hello', 'hey'].includes(command)) {
      return this.getWelcomeMessage();
    }

    return `Unknown command. Type "help" for available commands.`;
  }

  private getHelpMenu(): string {
    return `*BizFlow Commands*

📊 *Sale* - Log a sale
Format: sale [amount] [description]
Example: sale 500 Coffee cups

💸 *Expense* - Log an expense
Format: expense [amount] [description]
Example: expense 50 Office supplies

📦 *Stock* - Check inventory

✅ *Tasks* - View pending tasks

📈 *Summary* - Get daily P&L

🧾 *Invoice* - Generate invoice
Format: invoice [customer name]`;
  }

  private getWelcomeMessage(): string {
    return `👋 Welcome to *BizFlow*!

Manage your business from WhatsApp.

Type *help* to see available commands.`;
  }

  private async logSale(businessId: string, command: string): Promise<string> {
    const parts = command.split(' ');
    const amount = parseFloat(parts[1]);

    if (isNaN(amount)) {
      return 'Invalid amount. Format: sale [amount] [description]';
    }

    const description = parts.slice(2).join(' ') || 'Sale via WhatsApp';

    await this.prisma.transaction.create({
      data: {
        businessId,
        type: 'INCOME',
        amount,
        description,
        date: new Date(),
      },
    });

    return `✅ Sale logged: $${amount.toFixed(2)}\n${description}`;
  }

  private async logExpense(businessId: string, command: string): Promise<string> {
    const parts = command.split(' ');
    const amount = parseFloat(parts[1]);

    if (isNaN(amount)) {
      return 'Invalid amount. Format: expense [amount] [description]';
    }

    const description = parts.slice(2).join(' ') || 'Expense via WhatsApp';

    await this.prisma.transaction.create({
      data: {
        businessId,
        type: 'EXPENSE',
        amount,
        description,
        date: new Date(),
      },
    });

    return `✅ Expense logged: $${amount.toFixed(2)}\n${description}`;
  }

  private async getStockSummary(businessId: string): Promise<string> {
    const [allProducts, total] = await Promise.all([
      this.prisma.product.findMany({ where: { businessId } }),
      this.prisma.product.count({ where: { businessId } }),
    ]);

    const lowStock = allProducts
      .filter(p => p.stock <= (p.lowStockAlert ?? 10))
      .slice(0, 5);

    let response = `📦 *Inventory Summary*\n\n`;
    response += `Total Products: ${total}\n`;

    if (lowStock.length > 0) {
      response += `\n⚠️ *Low Stock:*\n`;
      lowStock.forEach((p) => {
        response += `• ${p.name}: ${p.stock} left\n`;
      });
    } else {
      response += `\n✅ All products are well stocked`;
    }

    return response;
  }

  private async getTasks(businessId: string): Promise<string> {
    const tasks = await this.prisma.task.findMany({
      where: { businessId, status: { not: 'DONE' } },
      take: 5,
      orderBy: { priority: 'desc' },
    });

    if (tasks.length === 0) {
      return '✅ No pending tasks!';
    }

    let response = `✅ *Pending Tasks*\n\n`;
    tasks.forEach((t) => {
      const emoji = t.priority === 'URGENT' ? '🔴' : t.priority === 'HIGH' ? '🟠' : '🟡';
      response += `${emoji} ${t.title}\n`;
      if (t.dueDate) {
        response += `   Due: ${new Date(t.dueDate).toLocaleDateString()}\n`;
      }
      response += '\n';
    });

    return response;
  }

  private async getDailySummary(businessId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [income, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'INCOME', date: { gte: today } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'EXPENSE', date: { gte: today } },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount) || 0;
    const totalExpenses = Number(expenses._sum.amount) || 0;
    const profit = totalIncome - totalExpenses;

    return `📈 *Daily Summary*

💰 Revenue: $${totalIncome.toFixed(2)}
💸 Expenses: $${totalExpenses.toFixed(2)}
${profit >= 0 ? '✅' : '❌'} Net Profit: $${profit.toFixed(2)}`;
  }

  private async generateInvoice(businessId: string, command: string): Promise<string> {
    const customerName = command.replace('invoice', '').trim();

    if (!customerName) {
      return 'Please specify customer name. Format: invoice [customer name]';
    }

    return `🧾 Invoice for ${customerName}\n\nPlease visit your BizFlow dashboard to generate and send the invoice.`;
  }

  async sendMessage(to: string, body: string) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get('TWILIO_WHATSAPP_FROM');

    if (!accountSid || !authToken) {
      console.log('WhatsApp: Twilio not configured');
      return { success: false };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: fromNumber || '',
            To: to,
            Body: body,
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        console.error(`Twilio API error (${response.status}):`, errorBody);
        return { success: false, error: `Twilio API responded with ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp send error:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  verifyWebhook(query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verifyToken = this.configService.get('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      return parseInt(challenge);
    }

    return false;
  }
}
