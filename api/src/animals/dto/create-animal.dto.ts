import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateAnimalDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  species: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @IsOptional()
  @IsString()
  dailyRation?: string;

  @IsOptional()
  @IsString()
  foodBrand?: string;

  @IsOptional()
  @IsNumber()
  foodStockKg?: number;

  @IsOptional()
  @IsNumber()
  foodTotalKg?: number;

  @IsOptional()
  @IsDateString()
  foodOpenedAt?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
