import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from '@/db/schema';

const sqlite = openDatabaseSync('lockin.db');

export const db = drizzle(sqlite, { schema });
