import { PartialType } from '@nestjs/swagger';
import { CreateCaiWithRangeDto } from './create-cai-dto';

export class UpdateCaiWithRangeDto extends PartialType(CreateCaiWithRangeDto) {}