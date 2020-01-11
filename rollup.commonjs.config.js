import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import builtins from 'builtin-modules';
import replace from "@rollup/plugin-replace";

export default {
    input: 'esm/main.commonjs.mjs',
    output: {
        file: 'commonjs/index.js',
        format: 'cjs'
    },
    plugins: [
        replace({
            include: ['esm/**'],
            delimiters: ['', ''],
            values: {
                "'@fanoutio/pubcontrol'": "'@fanoutio/pubcontrol/commonjs'",
            },
        }),
        commonjs(),
        json(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',　// only transpile our source code
            plugins: [
                '@babel/plugin-proposal-class-properties',
            ],
        }),
    ],
    external: [
        ...builtins,
        '@fanoutio/pubcontrol/commonjs',
        'jspack',
        'jwt-simple',
    ],
};
