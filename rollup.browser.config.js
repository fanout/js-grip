import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

export default {
    input: 'src/main.browser.mjs',
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
        commonjs(),
        nodeGlobals(),
        nodeBuiltins(),
        nodeResolve({
            browser: true,
        }),
        json(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',　// only transpile our source code
            runtimeHelpers: true,
            presets: [
                ['@babel/preset-env', {
                    useBuiltIns: 'entry',
                    corejs: 3,
                    modules: false,
                    targets: {
                        ie: '11',
                    },
                }],
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties',
                ["@babel/plugin-transform-runtime", {
                    corejs: 3,
                }],
            ],
        }),
    ],
};
