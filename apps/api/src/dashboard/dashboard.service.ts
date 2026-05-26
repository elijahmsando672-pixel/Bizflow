import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(businessId: string) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const [
      totalRevenue,
      totalExpenses,
      totalCustomers,
      lowStockProducts,
      pendingTasks,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          businessId,
          type: 'INCOME',
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          businessId,
          type: 'EXPENSE',
          date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.product.findMany({
        where: { businessId },
        select: { stock: true, lowStockAlert: true },
      }).then(products => products.filter(p => p.stock <= (p.lowStockAlert ?? 10)).length),
      this.prisma.task.count({
        where: { businessId, status: { not: 'DONE' } },
      }),
      this.prisma.transaction.findMany({
        where: { businessId },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true } },
        },
      }),
    ]);

    const revenue = Number(totalRevenue._sum.amount) || 0;
    const expenses = Number(totalExpenses._sum.amount) || 0;

    return {
      summary: {
        revenue,
        expenses,
        profit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
      },
      counts: {
        customers: totalCustomers,
        lowStockProducts,
        pendingTasks,
      },
      recentTransactions,
    };
  }

  async getChartData(businessId: string, days: number = 30) {
    const now = new Date();
    const startDate = startOfDay(subDays(now, days));

    const transactions = await this.prisma.transaction.findMany({
      where: {
        businessId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const dailyData: Record<string, { income: number; expense: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = subDays(now, days - 1 - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      const dateKey = t.date.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        const amount = Number(t.amount);
        if (t.type === 'INCOME') {
          dailyData[dateKey].income += amount;
        } else {
          dailyData[dateKey].expense += amount;
        }
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
    }));
  }

  async getActivityFeed(businessId: string, limit: number = 20) {
    const [transactions, tasks] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.task.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { assignedTo: { select: { name: true } } },
      }),
    ]);

    const activities = [
      ...transactions.map((t) => ({
        id: t.id,
        type: 'transaction' as const,
        action: t.type === 'INCOME' ? 'recorded_income' : 'recorded_expense',
        description: `${t.type === 'INCOME' ? 'Income' : 'Expense'} of $${Number(t.amount).toFixed(2)}`,
        amount: Number(t.amount),
        customer: t.customer?.name,
        date: t.createdAt,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        action: `task_${t.status.toLowerCase()}`,
        description: `Task "${t.title}" marked as ${t.status.toLowerCase().replace('_', ' ')}`,
        assignedTo: t.assignedTo?.name,
        date: t.createdAt,
      })),
    ];

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }

  async getStats(businessId: string) {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subDays(thisMonth, 1));

    const [thisMonthData, lastMonthData] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          businessId,
          date: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          businessId,
          date: { gte: lastMonth, lt: thisMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const getAmount = (data: typeof thisMonthData, type: 'INCOME' | 'EXPENSE') =>
      Number(data.find((d) => d.type === type)?._sum.amount) || 0;

    const thisRevenue = getAmount(thisMonthData, 'INCOME');
    const lastRevenue = getAmount(lastMonthData, 'INCOME');
    const thisExpenses = getAmount(thisMonthData, 'EXPENSE');
    const lastExpenses = getAmount(lastMonthData, 'EXPENSE');

    return {
      revenue: {
        current: thisRevenue,
        previous: lastRevenue,
        change: lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0,
      },
      expenses: {
        current: thisExpenses,
        previous: lastExpenses,
        change: lastExpenses > 0 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0,
      },
      profit: {
        current: thisRevenue - thisExpenses,
        previous: lastRevenue - lastExpenses,
      },
    };
  }
}
