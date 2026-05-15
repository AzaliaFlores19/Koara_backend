import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Conexión exitosa con PostgreSQL');
    } catch (error) {
      console.error(' Error al conectar a la DB:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}