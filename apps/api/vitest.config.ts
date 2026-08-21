import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // Run test files serially so at most one Testcontainers instance is up at a
    // time (avoids resource contention when the whole suite runs together).
    fileParallelism: false,
    // Integration tests (Testcontainers) can be slow to pull images on first run.
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
});
