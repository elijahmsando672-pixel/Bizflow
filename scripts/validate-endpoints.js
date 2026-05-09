/**
 * API Endpoint Validator
 * 
 * Scans frontend API calls and backend route definitions,
 * reports any mismatches to prevent deployment conflicts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function logError(msg) {
  console.error(`  ❌ ${msg}`);
  errors++;
}

function logWarn(msg) {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

// Collect backend routes
function collectBackendRoutes() {
  const routesDir = path.join(ROOT, 'server', 'routes');
  const indexFile = path.join(ROOT, 'server', 'index.js');
  const mounts = [];
  const routeFiles = [];
  
  // Parse mount points from index.js
  const indexSrc = fs.readFileSync(indexFile, 'utf-8');
  const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = mountRegex.exec(indexSrc)) !== null) {
    const mount = m[1];
    if (!mount.startsWith('/api/')) continue;
    if (mount === '/api/health' || mount === '/api/version') continue;
    mounts.push(mount.replace('/api/', '/'));
  }
  
  // Collect all route files
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const src = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    const routes = [];
    for (const method of methods) {
      const re = new RegExp(`router\\.${method}\\(\\s*['"]([^'"]+)['"]`, 'g');
      let match;
      while ((match = re.exec(src)) !== null) {
        routes.push({ method: method.toUpperCase(), path: match[1] });
      }
    }
    routeFiles.push({ file, routes });
  }
  
  return { mounts, routeFiles };
}

// Collect frontend API calls
function collectFrontendCalls() {
  const srcDir = path.join(ROOT, 'client', 'src');
  const calls = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const src = fs.readFileSync(full, 'utf-8');
        // Match fetchApi calls
        const fetchRe = /fetchApi\(['"`]([^'"`]+)['"`]/g;
        let m;
        while ((m = fetchRe.exec(src)) !== null) {
          calls.push({ endpoint: m[1], file: path.relative(srcDir, full) });
        }
        // Match api.something calls that include an endpoint string
        const apiRe = /api\.[a-zA-Z]+\.\w+\(['"`]([^'"`]+)['"`]/g;
        while ((m = apiRe.exec(src)) !== null) {
          calls.push({ endpoint: m[1], file: path.relative(srcDir, full) });
        }
      }
    }
  }
  
  walk(srcDir);
  return calls;
}

// Normalize endpoint paths for comparison
function normalizePath(p) {
  return p.replace(/:id/g, '{id}').replace(/:saleId/g, '{saleId}').replace(/:productId/g, '{productId}');
}

console.log('\n🔍 API Endpoint Validation\n');

// Check 1: Frontend calls that don't exist on backend
console.log('Checking frontend API calls against backend routes...');
const { mounts, routeFiles } = collectBackendRoutes();
const frontendCalls = collectFrontendCalls();

const allBackendRoutes = new Set();
for (const { routes } of routeFiles) {
  for (const r of routes) {
    allBackendRoutes.add(`${r.method} ${normalizePath(r.path)}`);
  }
}
// Also add mount-level GET routes
for (const mount of mounts) {
  allBackendRoutes.add(`GET ${normalizePath(mount)}`);
  allBackendRoutes.add(`GET ${normalizePath(mount)}/{id}`);
}

for (const call of frontendCalls) {
  // Infer method from context
  let method = 'GET';
  if (call.endpoint.includes('/create') || call.endpoint.includes('/add') || call.endpoint.includes('/invite')) method = 'POST';
  if (call.endpoint.includes('/delete') || call.endpoint.includes('/remove')) method = 'DELETE';
  if (call.endpoint.includes('/update') || call.endpoint.includes('/edit')) method = 'PUT';
  
  const normalized = normalizePath(call.endpoint);
  const exists = allBackendRoutes.has(`${method} ${normalized}`) ||
    Array.from(allBackendRoutes).some(r => r.endsWith(normalized) || normalized.endsWith(r.split(' ')[1]));
  
  if (!exists) {
    logWarn(`Potential missing backend route: ${method} ${normalized} (called in ${call.file})`);
  }
}

// Check 2: Backend routes that might be called by frontend (by pattern)
console.log('\nChecking backend routes for frontend coverage...');
for (const { file, routes } of routeFiles) {
  for (const r of routes) {
    const normalized = normalizePath(r.path);
    const frontendMatch = frontendCalls.some(c => {
      const cn = normalizePath(c.endpoint);
      return cn.includes(normalized) || normalized.includes(cn);
    });
    if (!frontendMatch && !r.path.startsWith('/mark-') && !r.path.startsWith('/send-') && !r.path.startsWith('/low-stock-')) {
      logWarn(`Potentially unused backend route: ${r.method} ${r.path} (in ${file})`);
    }
  }
}

// Check 3: Package version alignment
console.log('\nChecking version alignment...');
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const clientPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'client', 'package.json'), 'utf-8'));
if (rootPkg.version !== clientPkg.version) {
  logWarn(`Version mismatch: root=${rootPkg.version} client=${clientPkg.version}`);
}

console.log(`\n${errors > 0 ? `❌ ${errors} errors` : '✅ No errors'}${warnings > 0 ? `, ${warnings} warnings` : ''}`);
process.exit(errors > 0 ? 1 : 0);
