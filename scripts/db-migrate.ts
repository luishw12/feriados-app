import { migrate } from 'drizzle-orm/libsql/migrator';
import { connect } from './db.ts';

const { db, client, url } = connect();
await migrate(db, { migrationsFolder: 'drizzle' });
console.log(`✓ migrações aplicadas em ${url.startsWith('file:') ? url : 'Turso'}`);
client.close();
