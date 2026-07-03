import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAnimalDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  species: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
