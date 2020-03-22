import commonjs from '@rollup/plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json'

export default {
    input: 'src/main.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            exports: 'named',
            sourcemap: true
        },
        {
            file: pkg.module,
            format: 'es',
            exports: 'named',
            sourcemap: true
        }
    ],
    plugins: [
        external(),
        typescript({
            rollupCommonJSResolveHack: true,
            exclude: '**/__tests__/**',
            clean: true,
        }),
        commonjs({
            include: ['node_modules/**'],
            namedExports: {
                // left-hand side can be an absolute path, a path
                // relative to the current directory, or the name
                // of a module in node_modules
                'jwt-simple': ['encode'],
            }
        }),
        json(),
    ]
}
