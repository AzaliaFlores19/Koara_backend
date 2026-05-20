import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user-dto';
import { UpdateUserDto } from './update-user-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.create(createUserDto, userId);
  }

  @Get('/:id')
  @Roles('ADMIN')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Patch('/:id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, updateUserDto, userId);
  }

  @Patch('/:id/deactivate')
  @Roles('ADMIN')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.deactivate(id, userId);
  }
}
