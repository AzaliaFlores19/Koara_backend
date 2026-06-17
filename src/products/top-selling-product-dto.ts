import { ApiProperty } from '@nestjs/swagger';

export class TopSellingProductDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'Sérum de Vitamina C' })
  name: string;

  @ApiProperty({ example: '7421000000000' })
  code_bar: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  image: string | null;

  @ApiProperty({ example: 150 })
  total_quantity_sold: number;

  @ApiProperty({
    example: { id: 'uuid-cat', name: 'Cuidado Facial' },
    nullable: true,
  })
  category: { id: string; name: string } | null;
}
