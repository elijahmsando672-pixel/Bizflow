import { authenticate } from './auth.js';
import { validateCsrf } from './csrf.js';

// Combined middleware: Authenticate first, then validate CSRF for state-changing requests
export const protect = [authenticate, validateCsrf];
