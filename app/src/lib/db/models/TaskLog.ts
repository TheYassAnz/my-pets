import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

export class TaskLog extends Model {
  static table = 'task_logs';
  static associations = {
    routines: { type: 'belongs_to' as const, key: 'routine_id' },
  };

  @field('routine_id') routineId?: string;
  @field('date') date?: string;
  @field('is_done') isDone?: boolean;
  @field('done_by') doneBy?: string;
  @readonly @date('created_at') createdAt?: Date;
  @readonly @date('updated_at') updatedAt?: Date;

  @relation('routines', 'routine_id') routine?: any;
}
