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

// Collect backend routes with full paths
function collectBackendRoutes() {
  const routesDir = path.join(ROOT, 'server', 'routes');
  const indexFile = path.join(ROOT, 'server', 'index.js');
  const mounts = [];
  
  const indexSrc = fs.readFileSync(indexFile, 'utf-8');
  const mountRegex = /app\.use\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = mountRegex.exec(indexSrc)) !== null) {
    const mp = m[1];
    if (mp.startsWith('/api/')) mounts.push(mp.replace('/api', ''));
  }
  
  const allRoutes = [];
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
    
    // Find mount point by matching file name convention
    const fileBase = path.basename(file, '.js');
    const mount = mounts.find(mp => mp.endsWith(fileBase) || mp.endsWith(fileBase.replace(/ies$/, 'y')));
    
    // Resolve full paths
    for (const r of routes) {
      const fullPath = mount ? mount + r.path : r.path;
      const resolved = fullPath.replace(/\/\//g, '/');
      const normalized = resolved.replace(/:id/g, '{id}').replace(/:saleId/g, '{saleId}').replace(/:productId/g, '{productId}').replace(/:taskId/g, '{taskId}').replace(/:invoiceId/g, '{invoiceId}').replace(/:[a-zA-Z]+/g, '{param}');
      allRoutes.push({ ...r, fullPath: resolved, normalized, file });
    }
  }
  
  return allRoutes;
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
        const relPath = path.relative(srcDir, full);
        
        // Match fetchApi calls with plain strings (no template)
        const fetchRe = /fetchApi\(\s*(['"])([^'"]+)\1/g;
        let m;
        while ((m = fetchRe.exec(src)) !== null) {
          calls.push({ endpoint: m[2], template: false, file: relPath });
        }
        
        // Match api.something calls with plain strings
        const apiRe = /api\.[a-zA-Z]+\.\w+\((['"])([^'"]+)\1/g;
        while ((m = apiRe.exec(src)) !== null) {
          calls.push({ endpoint: m[2], template: false, file: relPath });
        }
        
        // Match fetchApi calls with template literals (extract base path before ${}
        const tmplRe = /fetchApi\(`([^`]*?\$?\{)/g;
        while ((m = tmplRe.exec(src)) !== null) {
          let base = m[1].replace(/\$\{.*/g, '').replace(/\/+$/, '');
          if (base && !calls.some(c => c.endpoint === base && c.file === relPath)) {
            calls.push({ endpoint: base, template: true, file: relPath });
          }
        }
        
        // Also match fetchApi with template that has no $ (pure backtick strings)
        const tmplPlainRe = /fetchApi\(`([^`$]+)`/g;
        while ((m = tmplPlainRe.exec(src)) !== null) {
          const ep = m[1].replace(/\/+$/, '');
          if (ep && !calls.some(c => c.endpoint === ep && c.file === relPath)) {
            calls.push({ endpoint: ep, template: false, file: relPath });
          }
        }
        
        // Same for api.something with template
        const apiTmplRe = /api\.[a-zA-Z]+\.\w+\(`([^`]*?\$?\{)/g;
        while ((m = apiTmplRe.exec(src)) !== null) {
          let base = m[1].replace(/\$\{.*/g, '').replace(/\/+$/, '');
          if (base && !calls.some(c => c.endpoint === base && c.file === relPath)) {
            calls.push({ endpoint: base, template: true, file: relPath });
          }
        }
        const apiTmplPlainRe = /api\.[a-zA-Z]+\.\w+\(`([^`$]+)`/g;
        while ((m = apiTmplPlainRe.exec(src)) !== null) {
          const ep = m[1].replace(/\/+$/, '');
          if (ep && !calls.some(c => c.endpoint === ep && c.file === relPath)) {
            calls.push({ endpoint: ep, template: false, file: relPath });
          }
        }
      }
    }
  }
  
  walk(srcDir);
  return calls;
}

// Check if a frontend endpoint matches a backend route
function endpointMatches(frontendEndpoint, backendRoute) {
  const fe = frontendEndpoint.replace(/\/+$/, '');
  const be = backendRoute.normalized.replace(/\/+$/, '');
  
  // Exact match
  if (fe === be) return true;

  // Backend param route like /customers/{id} matches /customers/abc123
  const feParts = fe.split('/');
  const beParts = be.split('/');
  if (feParts.length !== beParts.length) return false;
  
  for (let i = 0; i < feParts.length; i++) {
    if (beParts[i] === '{id}' || beParts[i] === '{saleId}' || beParts[i] === '{productId}' || beParts[i] === '{taskId}' || beParts[i] === '{invoiceId}' || beParts[i] === '{param}') {
      continue; // param matches anything
    }
    if (feParts[i] !== beParts[i]) return false;
  }
  return true;
}

console.log('\n🔍 API Endpoint Validation\n');

// Collect
const backendRoutes = collectBackendRoutes();
const frontendCalls = collectFrontendCalls();

// Check 1: Frontend calls that don't exist on backend
console.log('Checking frontend API calls against backend routes...');
for (const call of frontendCalls) {
  // Skip non-endpoint-looking patterns
  if (!call.endpoint.startsWith('/')) continue;
  
  // Infer HTTP method
  let method = 'GET';
  if (call.endpoint.match(/create|add|invite|register|login|clock-in|clock-out|mark-|send-|read-all/)) method = 'POST';
  if (call.endpoint.match(/delete|remove|revoke/)) method = 'DELETE';
  if (call.endpoint.match(/update|edit/)) method = 'PUT';

  const matches = backendRoutes.filter(r => {
    if (r.method !== method) return false;
    return endpointMatches(call.endpoint, r);
  });

  if (matches.length === 0) {
    // Check if it matches any method
    const anyMethodMatches = backendRoutes.filter(r => endpointMatches(call.endpoint, r));
    if (anyMethodMatches.length === 0) {
      logWarn(`No matching backend route: ${method} ${call.endpoint} (called in ${call.file})`);
    }
  }
}

// Check 2: Backend routes that the frontend might be missing
console.log('\nChecking backend routes for frontend coverage...');
const skippedPrefixes = ['/mark-', '/send-', '/low-stock-', '/csrf-', '/health', '/logout', '/forgot-', '/reset-', '/refresh-', '/check-usage'];

for (const route of backendRoutes) {
  if (skippedPrefixes.some(p => route.fullPath.startsWith(p) || route.path.startsWith(p))) continue;
  if (route.path === '/') continue; // root GET is always implied
  
  const matches = frontendCalls.some(call => endpointMatches(call.endpoint, route));
  if (!matches) {
    logWarn(`Possibly unused backend route: ${route.method} ${route.fullPath} (in ${route.file})`);
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
