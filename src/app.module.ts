import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CaiModule } from './cai/cai.module';
import { UsersModule } from './users/users.module'; 
import { AuthModule } from './auth/auth.module';
import { CaiRangeModule } from './cai_range/cai_range.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  PrismaModule,
    CaiModule,
    UsersModule,
    AuthModule,
    CaiRangeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
