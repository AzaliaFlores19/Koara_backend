import { Controller, Get, Post, Put, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { CaiService } from './cai.service';
import { CreateCaiDto } from './create-cai-dto';
import { UpdateCaiDto } from './update-cai-dto';
@Controller('cai')
export class CaiController {
  constructor(private readonly caiService: CaiService) {}

}