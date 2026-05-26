import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { CurrentUser, RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('business')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get()
  getBusiness(@RequireBusiness('id') businessId: string) {
    return this.businessService.getBusiness(businessId);
  }

  @Put()
  updateBusiness(
    @RequireBusiness('id') businessId: string,
    @Body() data: { name?: string; currency?: string; timezone?: string },
  ) {
    return this.businessService.updateBusiness(businessId, data);
  }

  @Get('members')
  getMembers(@RequireBusiness('id') businessId: string) {
    return this.businessService.getBusinessMembers(businessId);
  }

  @Post('members')
  inviteMember(
    @RequireBusiness('id') businessId: string,
    @Body() body: { email: string; role?: string },
  ) {
    return this.businessService.inviteMember(businessId, body.email, body.role);
  }

  @Delete('members/:userId')
  removeMember(
    @RequireBusiness('id') businessId: string,
    @Param('userId') userId: string,
  ) {
    return this.businessService.removeMember(businessId, userId);
  }
}
