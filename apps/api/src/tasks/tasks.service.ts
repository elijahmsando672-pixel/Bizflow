import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getTasks(businessId: string, status?: string, assigneeId?: string, page?: number, limit?: number) {
    const where: any = { businessId };

    if (status) {
      where.status = status.toUpperCase().replace('-', '_');
    }

    if (assigneeId) {
      where.assignedToId = assigneeId;
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.task.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getTask(businessId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, businessId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async createTask(businessId: string, data: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: Date;
    assignedToId?: string;
  }) {
    return this.prisma.task.create({
      data: { ...data, businessId },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async updateTask(businessId: string, id: string, data: Partial<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: Date;
    assignedToId: string;
  }>) {
    await this.getTask(businessId, id);

    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async updateTaskStatus(businessId: string, id: string, status: string) {
    const task = await this.getTask(businessId, id);
    const normalizedStatus = status.toUpperCase().replace('-', '_') as 'TODO' | 'IN_PROGRESS' | 'DONE';

    return this.prisma.task.update({
      where: { id },
      data: {
        status: normalizedStatus,
        completedAt: normalizedStatus === 'DONE' ? new Date() : null,
      },
    });
  }

  async deleteTask(businessId: string, id: string) {
    await this.getTask(businessId, id);
    return this.prisma.task.delete({ where: { id } });
  }

  async getTaskStats(businessId: string) {
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      this.prisma.task.count({ where: { businessId } }),
      this.prisma.task.count({ where: { businessId, status: 'TODO' } }),
      this.prisma.task.count({ where: { businessId, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { businessId, status: 'DONE' } }),
      this.prisma.task.count({
        where: {
          businessId,
          status: { not: 'DONE' },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      todo,
      inProgress,
      done,
      overdue,
      completionRate: total > 0 ? (done / total) * 100 : 0,
    };
  }
}
