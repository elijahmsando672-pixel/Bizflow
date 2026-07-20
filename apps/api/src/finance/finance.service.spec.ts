import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PrismaService } from '../common/prisma.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: PrismaService;

  const mockBusinessId = 'biz-1';

  const mockTransaction = {
    id: 'tx-1',
    type: 'INCOME',
    amount: 100,
    description: 'Test sale',
    category: 'Sales',
    reference: 'RCP-001',
    date: new Date(),
    businessId: mockBusinessId,
    customerId: null,
    customer: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const filters = { page: 1, limit: 20 };
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await service.getTransactions(mockBusinessId, filters);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply type filter when provided', async () => {
      const filters = { type: 'INCOME' as const, page: 1, limit: 20 };
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await service.getTransactions(mockBusinessId, filters);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'INCOME' }),
        }),
      );
    });
  });

  describe('getTransaction', () => {
    it('should return a transaction when found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(mockBusinessId, 'tx-1');

      expect(result.id).toBe('tx-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.getTransaction(mockBusinessId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTransaction', () => {
    it('should create a simple expense transaction', async () => {
      const dto = {
        type: 'EXPENSE' as const,
        amount: 50,
        description: 'Office supplies',
        category: 'Supplies',
      };
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(mockBusinessId, dto);

      expect(result).toBeDefined();
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
    });

    it('should deduct stock for INCOME transaction with items', async () => {
      const dto = {
        type: 'INCOME' as const,
        amount: 200,
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100 }],
      };
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Widget',
        stock: 10,
        businessId: mockBusinessId,
      });
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100, total: 200 }],
      });

      await service.createTransaction(mockBusinessId, dto);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { stock: { decrement: 2 } },
        }),
      );
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const dto = {
        type: 'INCOME' as const,
        amount: 200,
        items: [{ productId: 'prod-1', quantity: 5, unitPrice: 100 }],
      };
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Widget',
        stock: 2,
        businessId: mockBusinessId,
      });

      await expect(
        service.createTransaction(mockBusinessId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for unknown product', async () => {
      const dto = {
        type: 'INCOME' as const,
        amount: 100,
        items: [{ productId: 'prod-unknown', quantity: 1, unitPrice: 100 }],
      };
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.createTransaction(mockBusinessId, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTransaction', () => {
    it('should restore stock when deleting INCOME transaction with items', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        items: [{ id: 'item-1', productId: 'prod-1', quantity: 2 }],
      });
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.transaction.delete.mockResolvedValue(mockTransaction);

      await service.deleteTransaction(mockBusinessId, 'tx-1');

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { stock: { increment: 2 } },
        }),
      );
    });
  });

  describe('getSummary', () => {
    it('should return aggregated summary', async () => {
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: 5 })
        .mockResolvedValueOnce({ _sum: { amount: 400 }, _count: 3 });
      mockPrisma.transaction.groupBy.mockResolvedValue([]);

      const result = await service.getSummary(mockBusinessId);

      expect(result.total.income).toBe(1000);
      expect(result.total.expense).toBe(400);
      expect(result.total.profit).toBe(600);
    });
  });

  describe('getReceipt', () => {
    it('should return formatted receipt', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        items: [
          {
            product: { name: 'Widget' },
            quantity: 2,
            unitPrice: 100,
            total: 200,
          },
        ],
      });
      mockPrisma.business.findUnique.mockResolvedValue({
        name: 'Test Biz',
        currency: 'USD',
      });

      const result = await service.getReceipt(mockBusinessId, 'tx-1');

      expect(result.receipt.number).toBe('RCP-001');
      expect(result.business!.name).toBe('Test Biz');
      expect(result.items).toHaveLength(1);
    });
  });
});
