import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Bundle the workspace contracts package so the runtime image doesn't need it linked.
  noExternal: ['@sbs/contracts'],
});
