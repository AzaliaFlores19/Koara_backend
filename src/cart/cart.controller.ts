import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Carrito')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el carrito activo del usuario' })
  @ApiQuery({
    name: 'taxRate',
    required: false,
    description: 'Tasa de impuesto para calcular totales. Default: 0.15',
  })
  @ApiResponse({ status: 200, description: 'Carrito obtenido exitosamente' })
  getCart(
    @CurrentUser('id') userId: string,
    @Query('taxRate') taxRate?: string,
  ) {
    return this.cartService.getCart(
      userId,
      taxRate !== undefined ? Number(taxRate) : undefined,
    );
  }

  @Post('/items')
  @ApiOperation({ summary: 'Agregar un producto al carrito' })
  @ApiResponse({ status: 201, description: 'Producto agregado al carrito' })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos o stock insuficiente',
  })
  addItem(@CurrentUser('id') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('/items/:productId')
  @ApiOperation({
    summary: 'Actualizar la cantidad de un producto del carrito',
  })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado en el carrito',
  })
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, productId, dto);
  }

  @Delete('/items/:productId')
  @ApiOperation({ summary: 'Eliminar un producto del carrito' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado del carrito' })
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar el carrito activo del usuario' })
  @ApiResponse({ status: 200, description: 'Carrito vaciado exitosamente' })
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('/checkout')
  @ApiOperation({ summary: 'Crear una factura con los productos del carrito' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Carrito vacio o stock insuficiente',
  })
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutCartDto) {
    return this.cartService.checkout(userId, dto);
  }
}
