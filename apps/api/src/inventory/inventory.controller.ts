import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessGuard } from '../common/guards/business.guard';
import { RequireBusiness } from '../common/decorators/user.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('products')
  getProducts(
    @RequireBusiness('id') businessId: string,
    @Query() filters: ProductFiltersDto,
  ) {
    return this.inventoryService.getProducts(businessId, filters);
  }

  @Get('products/low-stock')
  getLowStock(@RequireBusiness('id') businessId: string) {
    return this.inventoryService.getLowStock(businessId);
  }

  @Get('products/:id')
  getProduct(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.inventoryService.getProduct(businessId, id);
  }

  @Post('products')
  createProduct(@RequireBusiness('id') businessId: string, @Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(businessId, dto);
  }

  @Put('products/:id')
  updateProduct(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(businessId, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@RequireBusiness('id') businessId: string, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(businessId, id);
  }

  @Post('products/:id/adjust-stock')
  adjustStock(
    @RequireBusiness('id') businessId: string,
    @Param('id') id: string,
    @Body() body: { adjustment: number },
  ) {
    return this.inventoryService.adjustStock(businessId, id, body.adjustment);
  }

  @Get('categories')
  getCategories(@RequireBusiness('id') businessId: string) {
    return this.inventoryService.getCategories(businessId);
  }
}
