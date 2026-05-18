import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: { id: string; email: string; role: string }) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
