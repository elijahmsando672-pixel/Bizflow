import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

export const BUSINESS_KEY = 'business';

@Injectable()
export class BusinessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) return false;

    const businessId = request.params.businessId || request.query.businessId;

    if (!businessId) {
      const userWithBusiness = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { business: true },
      });

      if (userWithBusiness?.business) {
        request.business = userWithBusiness.business;
        return true;
      }
      return false;
    }

    if (!businessId) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { business: true },
      });
      if (userRecord?.business) {
        request.business = userRecord.business;
        return true;
      }
      return false;
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!userRecord) return false;

    if (userRecord.businessId !== businessId && userRecord.role !== 'OWNER') {
      return false;
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (business) {
      request.business = business;
      return true;
    }

    return false;
  }
}
