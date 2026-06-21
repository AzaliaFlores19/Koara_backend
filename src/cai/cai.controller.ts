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
import { CreateCaiWithRangeDto } from './create-cai-dto';
import { UpdateCaiWithRangeDto } from './update-cai-dto';
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

  @Post('with-range')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Registrar un nuevo bloque de facturación completo (CAI + Rango) y activarlo de inmediato' })
  @ApiResponse({ status: 201, description: 'Bloque unificado registrado y activado con éxito (Relevo automático completado).' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o inconsistencias matemáticas en el rango/fechas.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 409, description: 'El código CAI ya existe en el historial del sistema.' })
  createUnified(
    @Body() dto: CreateCaiWithRangeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.createWithRange(dto, userId);
  }

  @Patch('with-range/:caiId/:rangeId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Modificar los datos de un bloque de facturación existente (Solo si no cuenta con facturas emitidas)' })
  @ApiParam({ name: 'caiId', description: 'ID único (UUID) del registro CAI maestro' })
  @ApiParam({ name: 'rangeId', description: 'ID único (UUID) del rango de facturación asociado' })
  @ApiResponse({ status: 200, description: 'Bloque de facturación modificado correctamente.' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida o el bloque ya cuenta con transacciones comerciales asociadas.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'El registro del CAI o del Rango no fue localizado.' })
  updateUnified(
    @Param('caiId', ParseUUIDPipe) caiId: string,
    @Param('rangeId', ParseUUIDPipe) rangeId: string,
    @Body() dto: UpdateCaiWithRangeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiService.updateWithRange(caiId, rangeId, dto, userId);
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
}