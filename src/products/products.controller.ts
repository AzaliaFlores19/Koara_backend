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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product-dto';
import { UpdateProductDto } from './update-product-dto';
import { ProductFilterDto } from './product-filter-dto';
import { StockDto } from './stock-dto';
import { StockThresholdDto } from './stock-threshold-dto';
import { TopSellingProductDto } from './top-selling-product-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Productos')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.create(createProductDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de productos con filtros' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Resultados por página (default: 10)',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por ID de categoría',
  })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  findAll(@Query() filter: ProductFilterDto) {
    return this.productsService.findAll(filter);
  }

  @Get('/top-selling')
  @ApiOperation({ summary: 'Obtener los productos más vendidos' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de productos a retornar (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos más vendidos',
    type: [TopSellingProductDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getTopSelling(@Query('limit') limit?: string) {
    return this.productsService.getTopSelling(limit ? +limit : 10);
  }

  @Get('/low-stock')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos con stock bajo',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  findLowStockProducts() {
    return this.productsService.findLowStockProducts();
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Datos del producto' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch('/stock-threshold/global')
  @ApiOperation({ summary: 'Actualizar umbral de stock mínimo global' })
  @ApiResponse({ status: 200, description: 'Umbral actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
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
  @ApiOperation({ summary: 'Actualizar datos de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.update(id, updateProductDto, userId);
  }

  @Patch('/:id/deactivate')
  @ApiOperation({ summary: 'Desactivar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto desactivado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.productsService.deactivate(id, userId);
  }

  @Patch('/:id/stock-threshold')
  @ApiOperation({ summary: 'Actualizar umbral de stock mínimo de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Umbral actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
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
  @ApiOperation({ summary: 'Disminuir stock de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Stock disminuido exitosamente' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  decreaseStock(
    @Param('id') id: string,
    @Body() stockDto: StockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.decreaseStock(id, stockDto.quantity, userId);
  }

  @Patch('/:id/increase-stock')
  @ApiOperation({ summary: 'Aumentar stock de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Stock aumentado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  increaseStock(
    @Param('id') id: string,
    @Body() stockDto: StockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.increaseStock(id, stockDto.quantity, userId);
  }
}
