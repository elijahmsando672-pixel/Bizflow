import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSourceMetadata } from '../lib/tsql.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(DIR, 'fixtures', 'legacy-schema.tsql.js');
const TARGET = path.join(DIR, 'fixtures', 'legacy-source-metadata.json');

const sql = fs.readFileSync(SOURCE, 'utf8');
const metadata = buildSourceMetadata(sql);
fs.writeFileSync(TARGET, `${JSON.stringify(metadata, null, 2)}\n`);

const columns = metadata.tables.reduce((total, table) => total + table.columns.length, 0);
console.log(`Wrote ${path.relative(DIR, TARGET)}: ${metadata.tables.length} tables, ${columns} columns`);
