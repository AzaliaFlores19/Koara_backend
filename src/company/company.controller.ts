import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './create-company.dto';
import { UpdateCompanyDto } from './update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Datos de la Empresa') 
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Registrar la información legal y comercial de la empresa por primera vez' })
  @ApiResponse({ status: 201, description: 'Datos de la empresa registrados con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o empresa ya registrada.' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.createCompany(createCompanyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la información general de la empresa (Nombre, RTN, etc.)' })
  @ApiResponse({ status: 200, description: 'Retorna los datos de la configuración global de la empresa.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'No se encontró información de la empresa.' })
  getCompany() {
    return this.companyService.getCompany();
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar los datos legales, teléfono o dirección de la empresa' })
  @ApiParam({ name: 'id', description: 'ID único (UUID) del registro de la empresa', example: 'f8c38124-78fb-4cb7-bc22-a729e2f411aa' })
  @ApiResponse({ status: 200, description: 'Información de la empresa actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o conflicto de correo electrónico.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.updateCompany(id, updateCompanyDto, userId);
  }
}