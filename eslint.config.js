import js from '@eslint/js';
import globals from 'globals';

/**
 * Lint for the first-party Node code: the Express server, the Vercel entry
 * points in api/, and the root scripts.
 *
 * The client is deliberately absent. It is a Next.js app with its own
 * eslint.config.mjs and its own pinned eslint, linted by `npm run lint` in
 * client/ — folding it into this array would apply React rules to server code
 * and server globals to JSX.
 *
 * apps/api, standalone and migration are legacy trees, each with its own
 * package.json and no reference from any root script or deploy config, so
 * they are ignored rather than reported on.
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      // Agent scratch space; holds a full worktree copy of this repo.
      '.kilo/**',
      'client/**',
      'apps/**',
      'standalone/**',
      'migration/**',
      '**/.next/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Carried over from the previous root config, narrowed to the risk that
      // actually matters here. console.error and console.warn are this codebase's
      // deliberate failure-reporting channel, so allowing them leaves the rule
      // pointing at stray console.log debug leftovers rather than burying it
      // under the 200-odd error reports that are working as intended.
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Underscore-prefixed names are the convention for deliberately unused
      // Express handlers, which take (req, res, next) but rarely need all three.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
