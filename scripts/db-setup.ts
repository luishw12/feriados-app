/**
 * Prepara o banco: aplica migrações e faz o seed se estiver vazio.
 * Com `--local`, força o SQLite em arquivo (.data/feriados.db) mesmo com Turso configurado.
 */
import { execFileSync } from 'node:child_process';

const extra = process.argv.slice(2);
const run = (script: string) =>
  execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', `scripts/${script}`, ...extra], { stdio: 'inherit' });

run('db-migrate.ts');
run('db-seed.ts');
