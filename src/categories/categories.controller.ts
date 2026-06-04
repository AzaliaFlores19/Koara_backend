import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { CategoryResponseDto } from './category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoria' })
  @ApiResponse({
    status: 201,
    description: 'Categoria creada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 409, description: 'Nombre de categoria duplicado' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser('id') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener lista paginada de categorias activas' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numero de pagina',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de resultados por pagina',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de categorias activas',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.categoriesService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @ApiOperation({ summary: 'Obtener categoria por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({
    status: 200,
    description: 'Datos de la categoria',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'ID invalido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiOperation({ summary: 'Reemplazar los datos de una categoria' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria reemplazada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos o ID invalidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  @ApiResponse({ status: 409, description: 'Nombre de categoria duplicado' })
  replace(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar parcialmente una categoria' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria actualizada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos o ID invalidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  @ApiResponse({ status: 409, description: 'Nombre de categoria duplicado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id/deactivate')
  @ApiOperation({ summary: 'Desactivar una categoria' })
  @ApiParam({ name: 'id', description: 'ID de la categoria' })
  @ApiResponse({
    status: 200,
    description: 'Categoria desactivada exitosamente',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'ID invalido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Categoria no encontrada' })
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.categoriesService.deactivate(id, userId);
  }
}
