import { createBackup } from '../utils/backup.js';

const label = process.argv[2] || 'manual';
const result = await createBackup(label);
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
