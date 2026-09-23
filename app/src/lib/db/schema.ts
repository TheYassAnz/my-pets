import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'animals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'species', type: 'string' },
        { name: 'breed', type: 'string', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'is_sterilized', type: 'boolean' },
        { name: 'daily_ration', type: 'string', isOptional: true },
        { name: 'food_brand', type: 'string', isOptional: true },
        { name: 'food_stock_kg', type: 'number', isOptional: true },
        { name: 'food_total_kg', type: 'number', isOptional: true },
        { name: 'food_opened_at', type: 'number', isOptional: true },
        { name: 'birth_date', type: 'string', isOptional: true },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'owner_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'health_events',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'date', type: 'number' },
        { name: 'dosage', type: 'string', isOptional: true },
        { name: 'vet', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'next_due_date', type: 'number', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'weight_records',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'weight_kg', type: 'number' },
        { name: 'date', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'routines',
      columns: [
        { name: 'animal_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'frequency', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'task_logs',
      columns: [
        { name: 'routine_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'string' },
        { name: 'is_done', type: 'boolean' },
        { name: 'done_by', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'documents',
      columns: [
        { name: 'animal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'file_url', type: 'string', isOptional: true },
        { name: 'file_size', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
