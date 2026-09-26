import handler from '../server/vercel-handler.js';
import { configuration } from '../server/app.js';

const { missing, warnings } = configuration();
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (missing.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables: ${missing.join(', ')}`);
}

export const config = { maxDuration: 30 };

export default handler;
