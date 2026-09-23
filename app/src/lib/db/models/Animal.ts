import { Model } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';

export class Animal extends Model {
  static table = 'animals';
  static associations = {
    health_events: { type: 'has_many' as const, foreignKey: 'animal_id' },
    weight_records: { type: 'has_many' as const, foreignKey: 'animal_id' },
    routines: { type: 'has_many' as const, foreignKey: 'animal_id' },
    documents: { type: 'has_many' as const, foreignKey: 'animal_id' },
  };

  @field('name') name?: string;
  @field('species') species?: string;
  @field('breed') breed?: string;
  @field('gender') gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  @field('is_sterilized') isSterilized?: boolean;
  @field('daily_ration') dailyRation?: string;
  @field('food_brand') foodBrand?: string;
  @field('food_stock_kg') foodStockKg?: number;
  @field('food_total_kg') foodTotalKg?: number;
  @date('food_opened_at') foodOpenedAt?: Date;
  @field('birth_date') birthDate?: string;
  @field('photo_url') photoUrl?: string;
  @field('owner_id') ownerId?: string;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @children('health_events') healthEvents?: any;
  @children('weight_records') weightRecords?: any;
  @children('routines') routines?: any;
  @children('documents') documents?: any;
}
