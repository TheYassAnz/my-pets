import { HealthEventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateHealthEventDto {
  @IsEnum(HealthEventType)
  type: HealthEventType;

  @IsString()
  @MinLength(1)
  title: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  dosage?: string | null;

  @IsOptional()
  @IsString()
  vet?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string | null;
}
