import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  getCustomers(
    @RequireBusiness('id') businessId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.getCustomers(
      businessId,
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  getCustomer(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.customersService.getCustomer(businessId, id);
  }

  @Post()
  createCustomer(
    @RequireBusiness('id') businessId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(businessId, dto);
  }

  @Put(':id')
  updateCustomer(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(businessId, id, dto);
  }

  @Delete(':id')
  deleteCustomer(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.customersService.deleteCustomer(businessId, id);
  }

  @Get(':id/history')
  getCustomerHistory(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.customersService.getCustomerHistory(businessId, id);
  }
}
