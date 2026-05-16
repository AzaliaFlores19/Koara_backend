import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CaiModule } from './cai/cai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
  PrismaModule, 
    CaiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
