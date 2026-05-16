import { Module } from '@nestjs/common';
import { CaiService } from './cai.service';
import { CaiController } from './cai.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CaiController],
  providers: [CaiService],
  exports: [CaiService],
})
export class CaiModule {}