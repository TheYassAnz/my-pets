import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

export class Document extends Model {
  static table = 'documents';
  static associations = {
    animals: { type: 'belongs_to' as const, key: 'animal_id' },
  };

  @field('animal_id') animalId?: string;
  @field('title') title?: string;
  @field('category') category?: string;
  @field('file_url') fileUrl?: string;
  @field('file_size') fileSize?: string;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @relation('animals', 'animal_id') animal?: any;
}
