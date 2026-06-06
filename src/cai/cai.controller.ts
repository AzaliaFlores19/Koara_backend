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

import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('cai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Códigos CAI ') 
@ApiBearerAuth()
export class CaiController {
  constructor(private readonly caiService: CaiService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Registrar un nuevo código CAI autorizado por la SAR' })
  @ApiResponse({ status: 201, description: 'Código CAI registrado con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o formato de CAI incorrecto.' })
  create(
    @Body() createCaiDto: CreateCaiDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.create(createCaiDto, userId);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener la lista de todos los códigos CAI registrados' })
  @ApiResponse({ status: 200, description: 'Lista de códigos CAI obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'No se encontraron códigos CAI registrados.' })
  findAll() {
    return this.caiService.findAll();
  }

  @Get('/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Buscar un código CAI específico por su ID' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del registro CAI', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @ApiResponse({ status: 200, description: 'Código CAI encontrado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Código CAI no encontrado.' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.caiService.findById(id);
  }

  @Patch('/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Modificar la información de un código CAI existente' })
  @ApiResponse({ status: 200, description: 'Código CAI actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o formato de CAI incorrecto.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Código CAI no encontrado.' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del CAI a modificar' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaiDto: UpdateCaiDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.updateCai(id, updateCaiDto, userId);
  }

  @Patch('/:id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar o vencer un código CAI de forma lógica' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del CAI a desactivar' })
  @ApiResponse({ status: 200, description: 'Código CAI desactivado correctamente (is_active: false).' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Código CAI no encontrado.' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.deactivateCai(id, userId);
  }
}