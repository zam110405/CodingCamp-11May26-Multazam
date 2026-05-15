import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom so tests can access DOM APIs (document, localStorage, etc.)
    environment: 'jsdom',

    // Glob patterns for test files
    include: [
      'tests/unit/**/*.test.js',
      'tests/property/**/*.property.test.js',
    ],

    // Minimum 100 iterations for property-based tests (enforced per test via fast-check)
    globals: false,

    // Reporter
    reporter: 'verbose',
  },
});
