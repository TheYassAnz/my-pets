import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

export class Routine extends Model {
  static table = 'routines';
  static associations = {
    animals: { type: 'belongs_to' as const, key: 'animal_id' },
    task_logs: { type: 'has_many' as const, foreignKey: 'routine_id' },
  };

  @field('animal_id') animalId?: string;
  @field('title') title?: string;
  @field('description') description?: string;
  @field('frequency') frequency?: string;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @relation('animals', 'animal_id') animal?: any;
  @children('task_logs') taskLogs?: any;
}
