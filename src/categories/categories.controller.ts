import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentUser('id') userId: string) {
    return this.categoriesService.create(dto, userId);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.categoriesService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
    );
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.update(id, dto, userId);
  }

  @Patch('/:id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.categoriesService.deactivate(id, userId);
  }
}
