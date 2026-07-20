import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../common/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockBusinessId = 'biz-1';

  const mockProduct = {
    id: 'prod-1',
    name: 'Widget',
    description: 'A widget',
    sku: 'WDG-001',
    price: 29.99,
    cost: 15.0,
    stock: 50,
    lowStockAlert: 10,
    category: 'Components',
    isActive: true,
    businessId: mockBusinessId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const filters = { page: 1, limit: 20 };
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.getProducts(mockBusinessId, filters);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter when provided', async () => {
      const filters = { search: 'widget', page: 1, limit: 20 };
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.getProducts(mockBusinessId, filters);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
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

  describe('getProduct', () => {
    it('should return a product when found', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.getProduct(mockBusinessId, 'prod-1');

      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.getProduct(mockBusinessId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProduct', () => {
    it('should create and return a product', async () => {
      const dto = {
        name: 'New Product',
        price: 49.99,
        sku: 'NEW-001',
        stock: 100,
        category: 'Electronics',
      };
      mockPrisma.product.create.mockResolvedValue({
        ...mockProduct,
        ...dto,
      });

      const result = await service.createProduct(mockBusinessId, dto);

      expect(result.name).toBe('New Product');
      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ businessId: mockBusinessId }),
        }),
      );
    });
  });

  describe('updateProduct', () => {
    it('should update and return a product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Widget',
      });

      const result = await service.updateProduct(mockBusinessId, 'prod-1', {
        name: 'Updated Widget',
      });

      expect(result.name).toBe('Updated Widget');
    });

    it('should throw NotFoundException for unknown product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProduct(mockBusinessId, 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      await service.deleteProduct(mockBusinessId, 'prod-1');

      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
    });
  });

  describe('getLowStock', () => {
    it('should return products below lowStockAlert', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { ...mockProduct, stock: 3, lowStockAlert: 10 },
        { ...mockProduct, id: 'prod-2', stock: 20, lowStockAlert: 10 },
      ]);

      const result = await service.getLowStock(mockBusinessId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prod-1');
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock by the given amount', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        ...mockProduct,
        stock: 50,
      });
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        stock: 45,
      });

      const result = await service.adjustStock(mockBusinessId, 'prod-1', -5);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { stock: 45 },
        }),
      );
    });

    it('should not go below zero stock', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        ...mockProduct,
        stock: 3,
      });
      mockPrisma.product.update.mockResolvedValue({
        ...mockProduct,
        stock: 0,
      });

      await service.adjustStock(mockBusinessId, 'prod-1', -10);

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: 0 },
        }),
      );
    });
  });
});
