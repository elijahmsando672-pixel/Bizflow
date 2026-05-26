import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@RequireBusiness('id') businessId: string) {
    return this.dashboardService.getOverview(businessId);
  }

  @Get('chart')
  @ApiQuery({ name: 'days', required: false, type: Number })
  getChartData(@RequireBusiness('id') businessId: string, @Query('days') days?: string) {
    return this.dashboardService.getChartData(businessId, days ? parseInt(days) : 30);
  }

  @Get('activity')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getActivityFeed(@RequireBusiness('id') businessId: string, @Query('limit') limit?: string) {
    return this.dashboardService.getActivityFeed(businessId, limit ? parseInt(limit) : 20);
  }

  @Get('stats')
  getStats(@RequireBusiness('id') businessId: string) {
    return this.dashboardService.getStats(businessId);
  }
}
