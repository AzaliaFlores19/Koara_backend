import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly defaultTaxRate = 0.15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async getCart(userId: string, taxRate = this.defaultTaxRate) {
    const appliedTaxRate = this.parseTaxRate(taxRate);
    const cart = await this.getOrCreateCart(userId);
    const staleItems = cart.items.filter((item) => !item.product.is_active);

    if (staleItems.length > 0) {
      await this.prisma.cart_Item.deleteMany({
        where: {
          id: { in: staleItems.map((item) => item.id) },
        },
      });
    }

    const items = cart.items
      .filter((item) => item.product.is_active)
      .map((item) => {
        const product = item.product;
        const unitPrice = product.price.toNumber();
        const itemSubtotal = unitPrice * item.quantity;

        return {
          productId: product.id,
          quantity: item.quantity,
          unit_price: Number(unitPrice.toFixed(2)),
          item_subtotal: Number(itemSubtotal.toFixed(2)),
          available_stock: product.stock,
          has_stock: product.stock >= item.quantity,
          product: {
            id: product.id,
            name: product.name,
            code_bar: product.code_bar,
            description: product.description,
            image: product.image,
            stock: product.stock,
            price: product.price,
            category: product.category,
          },
        };
      });

    const subtotal = items.reduce((sum, item) => sum + item.item_subtotal, 0);
    const taxes = subtotal * appliedTaxRate;
    const total = subtotal + taxes;

    return {
      user_id: userId,
      items,
      summary: {
        total_items: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Number(subtotal.toFixed(2)),
        tax_rate: appliedTaxRate,
        taxes: Number(taxes.toFixed(2)),
        total: Number(total.toFixed(2)),
      },
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.findActiveProduct(dto.productId);
    const currentItem = cart.items.find(
      (item) => item.product_id === dto.productId,
    );
    const currentQuantity = currentItem?.quantity ?? 0;
    const nextQuantity = currentQuantity + dto.quantity;

    this.ensureStock(product, nextQuantity);

    await this.prisma.cart_Item.upsert({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: dto.productId,
        },
      },
      create: {
        cart_id: cart.id,
        product_id: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: nextQuantity,
      },
    });
    await this.touchCart(cart.id);

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    this.validateProductId(productId);

    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.product_id === productId);
    if (!cartItem) {
      throw new NotFoundException('El producto no esta en el carrito.');
    }

    const product = await this.findActiveProduct(productId);
    this.ensureStock(product, dto.quantity);

    await this.prisma.cart_Item.update({
      where: { id: cartItem.id },
      data: { quantity: dto.quantity },
    });
    await this.touchCart(cart.id);

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    this.validateProductId(productId);

    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.product_id === productId);
    if (!cartItem) {
      throw new NotFoundException('El producto no esta en el carrito.');
    }

    await this.prisma.cart_Item.delete({
      where: { id: cartItem.id },
    });
    await this.touchCart(cart.id);

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cart_Item.deleteMany({
      where: { cart_id: cart.id },
    });
    await this.touchCart(cart.id);

    return this.getCart(userId);
  }

  async checkout(userId: string, dto: CheckoutCartDto) {
    const cart = await this.getOrCreateCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito esta vacio.');
    }

    const cartResponse = await this.getCart(
      userId,
      dto.taxRate ?? this.defaultTaxRate,
    );
    if (cartResponse.items.length === 0) {
      throw new BadRequestException('El carrito esta vacio.');
    }

    const withoutStock = cartResponse.items.find((item) => !item.has_stock);
    if (withoutStock) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${withoutStock.product.name}.`,
      );
    }

    const invoice = await this.invoicesService.createInvoice(
      {
        customerId: dto.customerId,
        userId,
        payment_method: dto.payment_method,
        taxRate: dto.taxRate,
        items: cartResponse.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
      userId,
    );

    await this.prisma.cart_Item.deleteMany({
      where: { cart_id: cart.id },
    });
    await this.touchCart(cart.id);

    return invoice;
  }

  private async getOrCreateCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: this.cartInclude(),
    });

    if (cart) {
      return cart;
    }

    return this.prisma.cart.create({
      data: {
        user_id: userId,
      },
      include: this.cartInclude(),
    });
  }

  private async touchCart(cartId: string) {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { updated_at: new Date() },
    });
  }

  private async findActiveProduct(productId: string) {
    this.validateProductId(productId);

    const product = await this.prisma.products.findFirst({
      where: {
        id: productId,
        is_active: true,
      },
      select: this.productSelect(),
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return product;
  }

  private validateProductId(productId: string) {
    if (!isUUID(productId)) {
      throw new BadRequestException('ID de producto no valido.');
    }
  }

  private ensureStock(
    product: { name: string; stock: number },
    quantity: number,
  ) {
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${product.name}. Stock disponible: ${product.stock}.`,
      );
    }
  }

  private parseTaxRate(taxRate: number) {
    if (Number.isNaN(taxRate) || taxRate < 0) {
      throw new BadRequestException('La tasa de impuesto no es valida.');
    }

    return taxRate;
  }

  private productSelect() {
    return {
      id: true,
      name: true,
      code_bar: true,
      description: true,
      stock: true,
      price: true,
      image: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    };
  }

  private cartInclude() {
    return {
      items: {
        orderBy: { created_at: 'asc' as const },
        include: {
          product: {
            select: {
              ...this.productSelect(),
              is_active: true,
            },
          },
        },
      },
    };
  }
}
