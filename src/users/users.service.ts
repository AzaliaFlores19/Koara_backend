import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { audit_action, entities, Prisma, roles } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './create-user-dto';
import { UpdateUserDto } from './update-user-dto';
import { UpdateProfileDto } from './update-profile.dto';
import { ChangePasswordDto } from './change-password-profile.dto';
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
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese correo');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        base_code: createUserDto.base_code,
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

  async findAll(search?: string): Promise<UserResponseDto[]> {
    const where: Prisma.UsersWhereInput = { is_active: true };
    const searchTerm = search?.trim();

    if (searchTerm) {
      const upperSearch = searchTerm.toUpperCase();
      const matchingRoles = Object.values(roles).filter((role) =>
        role.includes(upperSearch),
      );

      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { base_code: { contains: searchTerm, mode: 'insensitive' } },
        ...(matchingRoles.length > 0 ? [{ role: { in: matchingRoles } }] : []),
      ];
    }

    return this.prisma.users.findMany({
      where,
      select: this.userSelectWithoutPassword(),
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id },
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
    try {
      const data: Prisma.UsersUpdateInput = {};

      if (updateUserDto.name) data.name = updateUserDto.name;
      if (updateUserDto.email) data.email = updateUserDto.email;
      if (updateUserDto.base_code) data.base_code = updateUserDto.base_code;
      if (updateUserDto.phone !== undefined) data.phone = updateUserDto.phone;
      if (updateUserDto.role) data.role = updateUserDto.role;
      if (updateUserDto.is_active !== undefined)
        data.is_active = updateUserDto.is_active;

      if (updateUserDto.password) {
        data.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.users.update({
        where: { id },
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuario no encontrado para actualizar');
      }
      throw error;
    }
  }

  async deactivate(id: string, userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.users.update({
        where: { id },
        data: { is_active: false },
        select: this.userSelectWithoutPassword(),
      });

      await this.auditService.createLog(
        userId,
        entities.USERS,
        id,
        audit_action.DEACTIVATE,
      );

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuario no encontrado para desactivar');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  private userSelectWithoutPassword() {
    return {
      id: true,
      name: true,
      email: true,
      base_code: true,
      phone: true,
      role: true,
      is_active: true,
    };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    return this.findById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    try {
      const data: Prisma.UsersUpdateInput = {};

      if (dto.name) data.name = dto.name;
      if (dto.email) data.email = dto.email;
      if (dto.phone !== undefined) data.phone = dto.phone; // Ahora procesa el teléfono mapeado del DTO correctamente

      const updatedUser = await this.prisma.users.update({
        where: { id: userId },
        data,
        select: this.userSelectWithoutPassword(),
      });

      await this.auditService.createLog(
        userId,
        entities.USERS,
        userId,
        audit_action.UPDATE,
      );

      return updatedUser;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Perfil de usuario no encontrado');
      }
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashed },
    });

    await this.auditService.createLog(
      userId,
      entities.USERS,
      userId,
      audit_action.UPDATE,
    );

    return { message: 'Contraseña actualizada correctamente' };
  }
}
