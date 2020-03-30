import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.browser.ts',
    output: {
        file: 'browser/grip.js',
        format: 'iife',
        name: 'Grip',
    },
    plugins: [
        replace({
            include: ['node_modules/jwt-simple/**'],
            delimiters: ['', ''],
            values: {
                'crypto.createHmac': "require('create-hmac')",
            },
        }),
        commonjs({
            namedExports: {
                // left-hand side can be an absolute path, a path
                // relative to the current directory, or the name
                // of a module in node_modules
                'jwt-simple': ['encode', 'decode'],
            }
        }),
        nodeGlobals(),
        nodeBuiltins(),
        nodeResolve({
            browser: true,
        }),
        json(),
        typescript({
            declaration: false,
            esModuleInterop: false,
        }),
    ],
};
