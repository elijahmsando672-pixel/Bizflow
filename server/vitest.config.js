import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    testTimeout: 30000,
    hookTimeout: 30000,

    // Every suite shares one Postgres database, and tests/api.test.js tears whole
    // tables down in its afterAll with unscoped DELETEs (`DELETE FROM products`,
    // `DELETE FROM cashflow_entries`, ...). Running files in parallel therefore
    // deletes rows out from under whatever suite is mid-flight, which showed up as
    // intermittent failures elsewhere rather than as an error in api.test.js.
    //
    // Sequential execution is the honest fix: the suites were never isolated from
    // each other, only apparently so by luck of scheduling. Isolating them properly
    // means scoping every teardown to the rows a suite created, or giving each file
    // its own database, and that is worth doing but is a larger change than
    // pretending the ordering does not matter.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
