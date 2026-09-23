import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

export class HealthEvent extends Model {
  static table = 'health_events';
  static associations = {
    animals: { type: 'belongs_to' as const, key: 'animal_id' },
  };

  @field('animal_id') animalId?: string;
  @field('type') type?: 'VACCINE' | 'TREATMENT' | 'VISIT';
  @field('title') title?: string;
  @date('date') date?: Date;
  @field('dosage') dosage?: string;
  @field('vet') vet?: string;
  @field('notes') notes?: string;
  @date('next_due_date') nextDueDate?: Date;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @relation('animals', 'animal_id') animal?: any;
}
