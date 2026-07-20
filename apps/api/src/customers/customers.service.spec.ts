import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../common/prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  const mockBusinessId = 'biz-1';

  const mockCustomer = {
    id: 'cust-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    whatsappId: null,
    notes: 'VIP customer',
    tags: ['vip'],
    metadata: {},
    businessId: mockBusinessId,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { transactions: 3 },
  };

  const mockPrisma = {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrisma.customer.count.mockResolvedValue(1);

      const result = await service.getCustomers(mockBusinessId);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.customer.count.mockResolvedValue(0);

      await service.getCustomers(mockBusinessId, 'john');

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
            ]),
          }),
        }),
      );
    });
  });

  describe('getCustomer', () => {
    it('should return a customer when found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.getCustomer(mockBusinessId, 'cust-1');

      expect(result.id).toBe('cust-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.getCustomer(mockBusinessId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCustomer', () => {
    it('should create and return a customer', async () => {
      const dto = { name: 'Jane Doe', email: 'jane@example.com' };
      mockPrisma.customer.create.mockResolvedValue({
        ...mockCustomer,
        ...dto,
      });

      const result = await service.createCustomer(mockBusinessId, dto);

      expect(result.name).toBe('Jane Doe');
      expect(mockPrisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ businessId: mockBusinessId }),
        }),
      );
    });
  });

  describe('updateCustomer', () => {
    it('should update and return a customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        name: 'John Updated',
      });

      const result = await service.updateCustomer(mockBusinessId, 'cust-1', {
        name: 'John Updated',
      });

      expect(result.name).toBe('John Updated');
    });

    it('should throw NotFoundException for unknown customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCustomer(mockBusinessId, 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.customer.delete.mockResolvedValue(mockCustomer);

      await service.deleteCustomer(mockBusinessId, 'cust-1');

      expect(mockPrisma.customer.delete).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
      });
    });
  });

  describe('getCustomerHistory', () => {
    it('should return transaction history and total spent', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.transaction.findMany.mockResolvedValue([
        { id: 'tx-1', amount: 100, type: 'INCOME' },
        { id: 'tx-2', amount: 200, type: 'INCOME' },
      ]);
      mockPrisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 300 },
      });

      const result = await service.getCustomerHistory(
        mockBusinessId,
        'cust-1',
      );

      expect(result.transactions).toHaveLength(2);
      expect(result.totalSpent).toBe(300);
    });

    it('should throw NotFoundException for unknown customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.getCustomerHistory(mockBusinessId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
