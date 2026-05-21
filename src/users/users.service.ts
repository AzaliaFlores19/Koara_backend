import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { audit_action, entities, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './create-user-dto';
import { UpdateUserDto } from './update-user-dto';
import { UserResponseDto } from './user-response-dto';
import type { Users } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    userId?: string,
  ): Promise<UserResponseDto> {
    const existingUser = await this.prisma.users.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese correo');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        password: hashedPassword,
        role: createUserDto.role,
      },
      select: this.userSelectWithoutPassword(),
    });

    await this.auditService.createLog(
      userId ?? user.id,
      entities.USERS,
      user.id,
      audit_action.CREATE,
    );

    return user;
  }

  async findAll(): Promise<UserResponseDto[]> {
    return this.prisma.users.findMany({
      where: {
        is_active: true,
      },
      select: this.userSelectWithoutPassword(),
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: {
        id,
      },
      select: this.userSelectWithoutPassword(),
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    userId: string,
  ): Promise<UserResponseDto> {
    await this.findById(id);

    const data: Prisma.UsersUpdateInput = {
      ...updateUserDto,
    };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.users.update({
      where: {
        id,
      },
      data,
      select: this.userSelectWithoutPassword(),
    });

    await this.auditService.createLog(
      userId,
      entities.USERS,
      id,
      audit_action.UPDATE,
    );

    return updatedUser;
  }

  async deactivate(id: string, userId: string): Promise<UserResponseDto> {
    await this.findById(id);

    const user = await this.prisma.users.update({
      where: {
        id,
      },
      data: {
        is_active: false,
      },
      select: this.userSelectWithoutPassword(),
    });

    await this.auditService.createLog(
      userId,
      entities.USERS,
      id,
      audit_action.DEACTIVATE,
    );

    return user;
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.prisma.users.findUnique({
      where: {
        email,
      },
    });
  }

  private userSelectWithoutPassword() {
    return {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      is_active: true,
      creation_date: true,
    };
  }
}
