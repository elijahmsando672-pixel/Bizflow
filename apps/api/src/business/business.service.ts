import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async getBusiness(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            products: true,
            customers: true,
            transactions: true,
            tasks: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async updateBusiness(businessId: string, data: {
    name?: string;
    currency?: string;
    timezone?: string;
    logoUrl?: string;
  }) {
    return this.prisma.business.update({
      where: { id: businessId },
      data,
    });
  }

  async getBusinessMembers(businessId: string) {
    return this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async inviteMember(businessId: string, email: string, role: string = 'MEMBER') {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const normalizedRole = role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: { businessId, role: normalizedRole },
      });
    }

    const tempPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        businessId,
        role: normalizedRole,
      },
    });
  }

  async removeMember(businessId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { businessId: null, role: 'VIEWER' },
    });
  }
}
