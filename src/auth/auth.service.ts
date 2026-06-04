import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { audit_action, entities } from '@prisma/client';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetMailService } from './password-reset-mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly passwordResetMailService: PasswordResetMailService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      creation_date: user.creation_date,
    };
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    await this.auditService.createLog(
      user.id,
      entities.USERS,
      user.id,
      audit_action.LOGIN,
    );

    return {
      access_token,
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya esta registrado');
    }
    const hashedPassword = await this.hashPassword(registerDto.password);
    const newUser = await this.prisma.users.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        phone: registerDto.phone,
        role: registerDto.role,
      },
    });

    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      is_active: newUser.is_active,
      creation_date: newUser.creation_date,
    };

    const payload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const access_token = this.jwtService.sign(payload);

    await this.auditService.createLog(
      newUser.id,
      entities.USERS,
      newUser.id,
      audit_action.CREATE,
    );

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    const response = {
      message:
        'Si el correo existe, se enviaran instrucciones para restablecer la contrasena.',
    };

    if (!user) {
      return response;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // @ts-expect-error: passwordResetToken model pending migration
    await this.prisma.passwordResetToken.updateMany({
      where: {
        user_id: user.id,
        used_at: null,
      },
      data: {
        used_at: new Date(),
      },
    });

    // @ts-expect-error: passwordResetToken model pending migration
    await this.prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const resetLink = this.buildResetLink(token);
    await this.passwordResetMailService.sendPasswordResetEmail(
      user.email,
      resetLink,
    );

    return response;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(resetPasswordDto.token);

    // @ts-expect-error: passwordResetToken model pending migration
    const passwordResetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordResetToken) {
      throw new BadRequestException('El token no es valido o ha expirado.');
    }

    const hashedPassword = await this.hashPassword(resetPasswordDto.password);

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: passwordResetToken.user_id },
        data: { password: hashedPassword },
      }),
      // @ts-expect-error: passwordResetToken model pending migration
      this.prisma.passwordResetToken.update({
        where: { id: passwordResetToken.id },
        data: { used_at: new Date() },
      }),
    ]);

    await this.auditService.createLog(
      passwordResetToken.user_id,
      entities.USERS,
      passwordResetToken.user_id,
      audit_action.UPDATE,
    );

    return {
      message: 'La contrasena fue actualizada correctamente.',
    };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildResetLink(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return `${frontendUrl}/reset-password?token=${token}`;
  }
}
