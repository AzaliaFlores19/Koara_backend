import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './create-company.dto';
import { UpdateCompanyDto } from './update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async createCompany(dto: CreateCompanyDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.company.findFirst({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Ya existe una empresa registrada con este correo electrónico. Por favor, utilice otro correo o actualice el registro existente.');
      }
    }

    const existingCompany = await this.prisma.company.findFirst();
    if (existingCompany) {
      throw new ConflictException('Ya existe un perfil de empresa registrado. Por favor, actualice el registro existente.');
    }

    return this.prisma.company.create({ data: dto });
  }

  async getCompany() {
    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('No se ha configurado ningún perfil de empresa aún.');
    }
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const currentCompany = await this.prisma.company.findUnique({ where: { id } });
    if (!currentCompany) {
      throw new NotFoundException('No se encontró ningún perfil de empresa que coincida con este ID.');
    }

    if (dto.email && dto.email !== currentCompany.email) {
      const emailConflict = await this.prisma.company.findFirst({ where: { email: dto.email } });
      if (emailConflict) {
        throw new ConflictException('El correo electrónico ya está siendo utilizado por otra empresa. Por favor, utilice otro correo o actualice el registro existente.');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }
}