import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CaiRangeService } from './cai_range.service';
import { CreateCaiRangeDto } from './create-cai-range.dto';
import { UpdateCaiRangeDto } from './update-cai-range.dto'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cai-ranges')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class CaiRangeController {
  constructor(private readonly caiRangeService: CaiRangeService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createCaiRangeDto: CreateCaiRangeDto) {
    return this.caiRangeService.createCaiRange(createCaiRangeDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.caiRangeService.findAll();
  }

  @Get('active')
  @Roles('ADMIN')
  findActive() {
    return this.caiRangeService.findActive();
  }

  @Get(':id')
  @Roles('ADMIN')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.caiRangeService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCaiRangeDto: UpdateCaiRangeDto,
  ) {
    return this.caiRangeService.updateCaiRange(id, updateCaiRangeDto);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.caiRangeService.deactivateCaiRange(id);
  }
}