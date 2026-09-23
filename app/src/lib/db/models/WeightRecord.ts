import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

export class WeightRecord extends Model {
  static table = 'weight_records';
  static associations = {
    animals: { type: 'belongs_to' as const, key: 'animal_id' },
  };

  @field('animal_id') animalId?: string;
  @field('weight_kg') weightKg?: number;
  @date('date') date?: Date;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @relation('animals', 'animal_id') animal?: any;
}
