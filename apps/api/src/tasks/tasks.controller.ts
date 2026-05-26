import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getTasks(
    @RequireBusiness('id') businessId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.getTasks(businessId, status, assigneeId, page, limit);
  }

  @Get('stats')
  getTaskStats(@RequireBusiness('id') businessId: string) {
    return this.tasksService.getTaskStats(businessId);
  }

  @Get(':id')
  getTask(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.tasksService.getTask(businessId, id);
  }

  @Post()
  createTask(
    @RequireBusiness('id') businessId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(businessId, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
    });
  }

  @Put(':id')
  updateTask(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(businessId, id, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
    });
  }

  @Put(':id/status')
  updateTaskStatus(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(businessId, id, body.status);
  }

  @Delete(':id')
  deleteTask(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.tasksService.deleteTask(businessId, id);
  }
}
