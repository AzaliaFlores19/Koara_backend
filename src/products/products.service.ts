import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { audit_action, entities, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './create-product-dto';
import { UpdateProductDto } from './update-product-dto';
import { ProductFilterDto } from './product-filter-dto';
import { ProductResponseDto } from './product-response-dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private categoriesService: CategoriesService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<ProductResponseDto> {
    await this.validateUniqueName(createProductDto.name);
    await this.validateUniqueCodeBar(createProductDto.code_bar);
    await this.validateCategoryExists(createProductDto.category_id);

    const product = await this.prisma.products.create({
      data: {
        name: createProductDto.name,
        code_bar: createProductDto.code_bar,
        description: createProductDto.description,
        category_id: createProductDto.category_id,
        stock: createProductDto.stock,
        min_stock: createProductDto.min_stock ?? 5,
        price: new Prisma.Decimal(createProductDto.price),
        image: createProductDto.image,
      },
      select: this.productSelect(),
    });

    await this.createAuditLog(userId, product.id, audit_action.CREATE);

    return product;
  }

  async findAll(filter: ProductFilterDto) {
    const page = this.parsePositiveInteger(
      filter.page,
      1,
      'La página no es válida.',
    );
    const limit = this.parsePositiveInteger(
      filter.limit,
      10,
      'El límite no es válido.',
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProductsWhereInput = {
      is_active: true,
    };

    if (filter.category_id) {
      await this.validateCategoryExists(filter.category_id);
      where.category_id = filter.category_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: this.productSelect(),
      }),
      this.prisma.products.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ProductResponseDto> {
    this.validateProductId(id);

    const product = await this.prisma.products.findUnique({
      where: { id },
      select: this.productSelect(),
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<ProductResponseDto> {
    await this.findById(id);

    if (updateProductDto.name) {
      await this.validateUniqueName(updateProductDto.name, id);
    }

    if (updateProductDto.code_bar) {
      await this.validateUniqueCodeBar(updateProductDto.code_bar, id);
    }

    if (updateProductDto.category_id) {
      await this.validateCategoryExists(updateProductDto.category_id);
    }

    const data: Prisma.ProductsUpdateInput = {
      name: updateProductDto.name,
      code_bar: updateProductDto.code_bar,
      description: updateProductDto.description,
      stock: updateProductDto.stock,
      min_stock: updateProductDto.min_stock,
      price:
        updateProductDto.price !== undefined
          ? new Prisma.Decimal(updateProductDto.price)
          : undefined,
      image: updateProductDto.image,
    };

    if (updateProductDto.category_id) {
      data.category = {
        connect: { id: updateProductDto.category_id },
      };
    }

    const product = await this.prisma.products.update({
      where: { id },
      data,
      select: this.productSelect(),
    });

    await this.createAuditLog(userId, id, audit_action.UPDATE);

    return product;
  }

  async deactivate(id: string, userId: string): Promise<ProductResponseDto> {
    await this.findById(id);

    const product = await this.prisma.products.update({
      where: { id },
      data: { is_active: false },
      select: this.productSelect(),
    });

    await this.createAuditLog(userId, id, audit_action.DEACTIVATE);

    return product;
  }

  async decreaseStock(
    id: string,
    quantity: number,
    userId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.findById(id);

    if (product.stock - quantity < 0) {
      throw new BadRequestException('El stock no puede quedar en negativo.');
    }

    const updatedProduct = await this.prisma.products.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
      select: this.productSelect(),
    });

    await this.createAuditLog(userId, id, audit_action.UPDATE);

    return updatedProduct;
  }

  async increaseStock(
    id: string,
    quantity: number,
    userId: string,
  ): Promise<ProductResponseDto> {
    await this.findById(id);

    const updatedProduct = await this.prisma.products.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
      select: this.productSelect(),
    });

    await this.createAuditLog(userId, id, audit_action.UPDATE);

    return updatedProduct;
  }

  private async validateUniqueName(name: string, currentId?: string) {
    const duplicate = await this.prisma.products.findFirst({
      where: {
        name,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
    });

    if (duplicate) {
      throw new ConflictException('El nombre del producto ya existe.');
    }
  }

  private async validateUniqueCodeBar(codeBar: string, currentId?: string) {
    const duplicate = await this.prisma.products.findFirst({
      where: {
        code_bar: codeBar,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
    });

    if (duplicate) {
      throw new ConflictException('El código de barra ya está registrado.');
    }
  }

  private async validateCategoryExists(categoryId: string) {
    if (!isUUID(categoryId)) {
      throw new BadRequestException('El ID de la categoría no es válido.');
    }

    await this.categoriesService.findOne(categoryId);
  }

  private validateProductId(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('ID no válido.');
    }
  }

  private parsePositiveInteger(
    value: string | undefined,
    defaultValue: number,
    errorMessage: string,
  ) {
    if (!value) {
      return defaultValue;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 1) {
      throw new BadRequestException(errorMessage);
    }

    return numberValue;
  }

  private async createAuditLog(
    userId: string,
    entityId: string,
    action: audit_action,
  ) {
    await this.auditService.createLog(
      userId,
      entities.PRODUCTS,
      entityId,
      action,
    );
  }

  private productSelect() {
    return {
      id: true,
      name: true,
      code_bar: true,
      description: true,
      category_id: true,
      stock: true,
      min_stock: true,
      price: true,
      image: true,
      created_at: true,
      is_active: true,
      category: {
        select: {
          id: true,
          name: true,
          is_active: true,
        },
      },
    };
  }

  async findLowStockProducts() {
    const products = await this.prisma.products.findMany({
      where: { is_active: true },
      orderBy: { stock: 'asc' },
      select: {
        id: true,
        name: true,
        stock: true,
        min_stock: true,
      },
    });
    return products.filter((p) => p.stock <= p.min_stock);
  }
  
}

