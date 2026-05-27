import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product-dto';
import { UpdateProductDto } from './update-product-dto';
import { ProductFilterDto } from './product-filter-dto';
import { StockDto } from './stock-dto';
import { StockThresholdDto } from './stock-threshold-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get('/low-stock')
  findLowStockProducts() {
    return this.productsService.findLowStockProducts();
  }

  @Get('/:id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch('/stock-threshold/global')
  updateGlobalStockThreshold(
    @Body() stockThresholdDto: StockThresholdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.updateGlobalStockThreshold(
      stockThresholdDto.min_stock,
      userId,
    );
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId);
  }

  @Patch('/:id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.deactivate(id, userId);
  }

  @Patch('/:id/stock-threshold')
  updateProductStockThreshold(
    @Param('id') id: string,
    @Body() stockThresholdDto: StockThresholdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.updateProductStockThreshold(
      id,
      stockThresholdDto.min_stock,
      userId,
    );
  }

  @Patch('/:id/decrease-stock')
  decreaseStock(
    @Param('id') id: string,
    @Body() stockDto: StockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.decreaseStock(id, stockDto.quantity, userId);
  }

  @Patch('/:id/increase-stock')
  increaseStock(
    @Param('id') id: string,
    @Body() stockDto: StockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.increaseStock(id, stockDto.quantity, userId);
  }
}
