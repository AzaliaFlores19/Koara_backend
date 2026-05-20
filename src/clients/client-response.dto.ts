import { Expose } from 'class-transformer';

export class ClientResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() rtn?: string;
  @Expose() phone?: string;
  @Expose() email?: string;
  @Expose() is_active: boolean;
  @Expose() created_at: Date;
}
