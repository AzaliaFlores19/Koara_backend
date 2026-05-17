import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user-dto';
import { UpdateUserDto } from './update-user-dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
create(
  @Body() createUserDto: CreateUserDto,
  @Headers('x-user-id') userId?: string,
) {
  return this.usersService.create(createUserDto, userId);
}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.usersService.update(id, updateUserDto, userId);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.usersService.deactivate(id, userId);
  }
}