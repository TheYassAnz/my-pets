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
  dosage?: string;

  @IsOptional()
  @IsString()
  vet?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
}
