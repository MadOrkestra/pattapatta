import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'svg/index': 'src/svg/index.ts',
      'shapeBoolean/index': 'src/shapeBoolean/index.ts',
      'predicates/index': 'src/predicates/index.ts',
      'segmentSet/index': 'src/segmentSet/index.ts',
      'hatch/index': 'src/hatch/index.ts',
      'circlePacking/index': 'src/circlePacking/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: 'es2022',
  },
  {
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['esm'],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    target: 'es2022',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
