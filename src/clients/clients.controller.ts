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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './create-client.dto';
import { UpdateClientDto } from './update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser('id') userId: string) {
    return this.clientsService.create(dto, userId);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.clientsService.findAll(page ? +page : 1, limit ? +limit : 10);
  }

  @Get('/:id')
  findById(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.clientsService.update(id, dto, userId);
  }

  @Patch('/:id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.clientsService.deactivate(id, userId);
  }

  @Get('/:id/top-products')
  topProducts(@Param('id') id: string) {
    return this.clientsService.topProducts(id);
  }

  @Get('/:id/history')
  history(@Param('id') id: string) {
    return this.clientsService.history(id);
  }
}
