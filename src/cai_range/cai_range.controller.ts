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


}