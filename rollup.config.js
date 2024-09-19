import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import { babel } from '@rollup/plugin-babel'
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: './src/index.ts',
    // external: ['ms'],
    output: [
      { file: './dist/index.cjs', format: 'cjs' },
      { file: './dist/index.mjs', format: 'es' }
    ],  
    external: [
      '@paraspell/sdk',
      '@polkadot/api',
      '@polkadot/types',
      '@polkadot/util',
      '@polkadot/keyring',
      '@polkadot/util-crypto',
      '@zenlink-dex/sdk-core',
      '@zenlink-dex/sdk-api',
      'fs',
      'path',
    ],
    plugins: [
      typescript(),
      resolve(),
      json(),

      globals(),
      builtins(),
    ]
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
]
