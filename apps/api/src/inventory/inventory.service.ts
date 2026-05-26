import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getProducts(businessId: string, filters: ProductFiltersDto) {
    const { search, category, inStock, page = 1, limit = 20 } = filters;

    const where: any = { businessId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProduct(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(businessId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        businessId,
      },
    });
  }

  async updateProduct(businessId: string, id: string, dto: UpdateProductDto) {
    await this.getProduct(businessId, id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProduct(businessId: string, id: string) {
    await this.getProduct(businessId, id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getLowStock(businessId: string) {
    const allProducts = await this.prisma.product.findMany({
      where: { businessId },
      orderBy: { stock: 'asc' },
    });

    return allProducts.filter(p => p.stock <= (p.lowStockAlert ?? 10));
  }

  async adjustStock(businessId: string, id: string, adjustment: number) {
    const product = await this.getProduct(businessId, id);
    const newStock = Math.max(0, product.stock + adjustment);

    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  async getCategories(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return products.map((p) => p.category).filter(Boolean);
  }
}
