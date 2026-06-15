import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CaiRangeService } from './cai_range.service';
import { CreateCaiRangeDto } from './create-cai-range.dto';
import { UpdateCaiRangeDto } from './update-cai-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'; 

@Controller('cai-ranges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Rangos de CAI') 
@ApiBearerAuth()
export class CaiRangeController {
  constructor(private readonly caiRangeService: CaiRangeService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo rango de facturación (CAI)' })
  @ApiResponse({ status: 201, description: 'Rango creado exitosamente y activado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rango en conflicto.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'CAI maestro asociado no encontrado.' })
  create(
    @Body() createCaiRangeDto: CreateCaiRangeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiRangeService.createCaiRange(createCaiRangeDto, userId);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener el historial de todos los rangos registrados' })
  @ApiResponse({ status: 200, description: 'Lista de rangos obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'No se encontraron rangos registrados.' })
  findAll() {
    return this.caiRangeService.findAll();
  }

  @Get('/active')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Obtener la lista de rangos activos por punto de emisión' })
  @ApiResponse({ status: 200, description: 'Lista de rangos activos obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'No se encontraron rangos activos.' })
  findActive() {
    return this.caiRangeService.findActive();
  }


  @Get('unique-codes')
  async getUniqueCodes() {
    return this.caiRangeService.getUniqueBaseCodes();
  }

  @Get('/:id')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Buscar un rango de CAI específico por su ID' })
  @ApiResponse({ status: 200, description: 'Rango encontrado exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Rango no encontrado.' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del rango de CAI', example: 'd3b07384-d113-49cd-a5d6-8ee4134449bb' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.caiRangeService.findById(id);
  }

  @Patch('/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Modificar los datos de un rango de CAI existente' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del rango a modificar' })
  @ApiResponse({ status: 200, description: 'Rango actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Rango no encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaiRangeDto: UpdateCaiRangeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiRangeService.updateCaiRange(id, updateCaiRangeDto, userId);
  }

  @Patch('/:id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar un rango de CAI de forma lógica' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del rango a apagar' })
  @ApiResponse({ status: 200, description: 'Rango desactivado correctamente ' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Rango no encontrado.' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.caiRangeService.deactivateCaiRange(id, userId);
  }
}