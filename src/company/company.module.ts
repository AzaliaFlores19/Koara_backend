import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CaiModule } from '../cai/cai.module'; 

@Module({
  imports: [PrismaModule, CaiModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}