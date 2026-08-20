import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // Integration tests (Testcontainers) can be slow to pull images on first run.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
