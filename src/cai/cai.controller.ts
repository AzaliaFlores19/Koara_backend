import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CaiService } from './cai.service';
import { CreateCaiDto } from './create-cai-dto';
import { UpdateCaiDto } from './update-cai-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@Controller('cai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('cai')
@ApiBearerAuth()
export class CaiController {
  constructor(private readonly caiService: CaiService) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body() createCaiDto: CreateCaiDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.create(createCaiDto, userId);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.caiService.findAll();
  }

  @Get('/:id')
  @Roles('ADMIN')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.caiService.findById(id);
  }

  @Patch('/:id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaiDto: UpdateCaiDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.updateCai(id, updateCaiDto, userId);
  }

  @Patch('/:id/deactivate')
  @Roles('ADMIN')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.deactivateCai(id, userId);
  }
}
