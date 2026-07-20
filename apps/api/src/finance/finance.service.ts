import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from './dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(businessId: string, filters: TransactionFiltersDto) {
    const { type, category, startDate, endDate, customerId, page = 1, limit = 20 } = filters;

    const where = {
      businessId,
      ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
      ...(category && { category }),
      ...(customerId && { customerId }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true } } },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransaction(businessId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async createTransaction(businessId: string, dto: CreateTransactionDto) {
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const product = await this.prisma.product.findFirst({
          where: { id: item.productId, businessId },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        if (dto.type === 'INCOME' && product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}: ${product.stock} available, ${item.quantity} requested`,
          );
        }
      }
    }

    const data: any = {
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      category: dto.category,
      reference: dto.reference,
      date: dto.date ? new Date(dto.date) : new Date(),
      businessId,
      customerId: dto.customerId,
    };

    if (dto.items && dto.items.length > 0) {
      data.items = {
        create: dto.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      };

      if (dto.type === 'INCOME') {
        for (const item of dto.items) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    return this.prisma.transaction.create({
      data,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  }

  async updateTransaction(businessId: string, id: string, dto: UpdateTransactionDto) {
    await this.getTransaction(businessId, id);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.date && { date: new Date(dto.date) }),
      },
    });
  }

  async deleteTransaction(businessId: string, id: string) {
    const tx = await this.getTransaction(businessId, id);

    if (tx.type === 'INCOME' && tx.items?.length > 0) {
      for (const item of tx.items) {
        await this.prisma.product.update({
          where: { id: item.productId! },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return this.prisma.transaction.delete({ where: { id } });
  }

  async getSummary(businessId: string) {
    const [incomeResult, expenseResult, byCategory] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ['type', 'category'],
        where: { businessId },
        _sum: { amount: true },
      }),
    ]);

    const income = Number(incomeResult._sum.amount) || 0;
    const expenses = Number(expenseResult._sum.amount) || 0;

    return {
      total: {
        income,
        expense: expenses,
        profit: income - expenses,
      },
      counts: {
        income: incomeResult._count,
        expense: expenseResult._count,
      },
      byCategory: byCategory.map((c) => ({
        type: c.type,
        category: c.category || 'uncategorized',
        amount: Number(c._sum.amount) || 0,
      })),
    };
  }

  async getCategories(businessId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { businessId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return transactions.map((t) => t.category).filter(Boolean);
  }

  async getReceipt(businessId: string, id: string) {
    const tx = await this.getTransaction(businessId, id);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    return {
      receipt: {
        id: tx.id,
        number: tx.reference || `RCP-${tx.id.slice(0, 8).toUpperCase()}`,
        date: tx.date,
        type: tx.type,
        description: tx.description,
      },
      business: business
        ? { name: business.name, currency: business.currency }
        : null,
      customer: tx.customer,
      items: tx.items?.map((i) => ({
        product: i.product?.name ?? 'Unknown',
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
      summary: {
        subtotal: Number(tx.amount),
        total: Number(tx.amount),
      },
    };
  }
}
