import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthEventDto } from './create-health-event.dto';

export class UpdateHealthEventDto extends PartialType(CreateHealthEventDto) {}
