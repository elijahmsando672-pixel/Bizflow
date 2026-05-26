import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getCustomers(businessId: string, search?: string, page = 1, limit = 20) {
    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomer(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: { select: { transactions: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async createCustomer(businessId: string, data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    whatsappId?: string;
    notes?: string;
    tags?: string[];
  }) {
    return this.prisma.customer.create({
      data: { ...data, businessId },
    });
  }

  async updateCustomer(businessId: string, id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    whatsappId: string;
    notes: string;
    tags: string[];
  }>) {
    await this.getCustomer(businessId, id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async deleteCustomer(businessId: string, id: string) {
    await this.getCustomer(businessId, id);
    return this.prisma.customer.delete({ where: { id } });
  }

  async getCustomerHistory(businessId: string, id: string) {
    await this.getCustomer(businessId, id);

    const [transactions, stats] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { customerId: id },
        orderBy: { date: 'desc' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.transaction.aggregate({
        where: { customerId: id, type: 'INCOME' },
        _sum: { amount: true },
      }),
    ]);

    return {
      transactions,
      totalSpent: Number(stats._sum.amount) || 0,
    };
  }
}
