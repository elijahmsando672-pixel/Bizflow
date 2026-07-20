import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('transactions')
  getTransactions(
    @RequireBusiness('id') businessId: string,
    @Query() filters: TransactionFiltersDto,
  ) {
    return this.financeService.getTransactions(businessId, filters);
  }

  @Get('transactions/:id')
  getTransaction(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.getTransaction(businessId, id);
  }

  @Post('transactions')
  createTransaction(
    @RequireBusiness('id') businessId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(businessId, dto);
  }

  @Put('transactions/:id')
  updateTransaction(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(businessId, id, dto);
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteTransaction(businessId, id);
  }

  @Get('summary')
  getSummary(@RequireBusiness('id') businessId: string) {
    return this.financeService.getSummary(businessId);
  }

  @Get('categories')
  getCategories(@RequireBusiness('id') businessId: string) {
    return this.financeService.getCategories(businessId);
  }

  @Get('transactions/:id/receipt')
  getReceipt(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.getReceipt(businessId, id);
  }
}
