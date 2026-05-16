import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida en el entorno.');
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
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