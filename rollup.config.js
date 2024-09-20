// import typescript from 'rollup-plugin-typescript2'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import { babel } from '@rollup/plugin-babel'
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const externalDependencies = [
  '@paraspell/sdk',
  '@mangata-finance/sdk',
  '@polkadot/api',
  '@polkadot/types',
  '@polkadot/util',
  '@polkadot/keyring',
  '@polkadot/util-crypto',
  '@zenlink-dex/sdk-core',
  '@zenlink-dex/sdk-api',
  "ethereum-multicall",
  'fs',
  'path',
];

export default [
  {
    input: './src/index.ts',
    // external: ['ms'],
    output: [
      { file: './dist/index.cjs', format: 'cjs' },
      { file: './dist/index.mjs', format: 'es' }
    ],  
    external: externalDependencies,
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }), // Ensure tsconfig is specified
      resolve(),
      commonjs(),
      json(),
      // globals(),
      // builtins(),
      babel({
        extensions: ['.ts'],
        plugins: ['@babel/plugin-syntax-import-assertions'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      })
    ]
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
]



// export default [
//   // ES Module build
//   {
//     input: './src/index.ts',
//     output: {
//       dir: './dist/esm',
//       format: 'es',
//       sourcemap: true,
//       preserveModules: true,
//       preserveModulesRoot: 'src',
//     },
//     external: externalDependencies,
//     plugins: [
//       typescript({
//         tsconfig: './tsconfig.json',
//         declaration: false,
//         declarationDir: './dist/esm/types',
//         rootDir: './src',
//       }),
//       resolve(),
//       commonjs(),
//       json(),
//     ],
//   },
//   // CommonJS build
//   {
//     input: './src/index.ts',
//     output: {
//       dir: './dist/cjs',
//       format: 'cjs',
//       sourcemap: true,
//       preserveModules: true,
//       preserveModulesRoot: 'src',
//     },
//     external: externalDependencies,
//     plugins: [
//       typescript({
//         tsconfig: './tsconfig.json',
//         declaration: false, // Only generate declarations once
//         rootDir: './src',
//       }),
//       resolve(),
//       commonjs(),
//       json(),
//     ],
//   },
//   // TypeScript declarations
//   {
//     input: './src/index.ts',
//     output: {
//       dir: './dist/types',
//       format: 'es',
//       preserveModules: true,
//       preserveModulesRoot: 'src',
//     },
//     plugins: [dts()],
//   },
// ];
