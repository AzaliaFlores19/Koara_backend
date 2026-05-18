import { roles } from '@prisma/client';

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  phone!: string | null;
  role!: roles;
  is_active!: boolean;
  creation_date!: Date;
}
