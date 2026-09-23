import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { Platform } from 'react-native';

import { Animal } from './models/Animal';
import { Document } from './models/Document';
import { HealthEvent } from './models/HealthEvent';
import { Routine } from './models/Routine';
import { TaskLog } from './models/TaskLog';
import { WeightRecord } from './models/WeightRecord';
import { schema } from './schema';

let adapter: any;

try {
  if (Platform.OS === 'web') {
    adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
    adapter = new SQLiteAdapter({
      schema,
      jsi: false,
      onSetUpError: (error: any) => {
        console.error('WatermelonDB setup error:', error);
      },
    });
  }
} catch {
  adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
}

export const database = new Database({
  adapter,
  modelClasses: [Animal, HealthEvent, WeightRecord, Routine, TaskLog, Document],
});

export const animalsCollection = database.get<Animal>('animals');
export const healthEventsCollection = database.get<HealthEvent>('health_events');
export const weightRecordsCollection = database.get<WeightRecord>('weight_records');
export const routinesCollection = database.get<Routine>('routines');
export const taskLogsCollection = database.get<TaskLog>('task_logs');
export const documentsCollection = database.get<Document>('documents');

export { Animal, Document, HealthEvent, Routine, TaskLog, WeightRecord };
