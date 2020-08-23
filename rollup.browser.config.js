import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.browser.ts',
    output: {
        file: 'browser/grip.js',
        format: 'iife',
        name: 'Grip',
    },
    plugins: [
        commonjs(),
        nodePolyfills(),
        nodeResolve({
            browser: true,
        }),
        json(),
        typescript({
            module: "es2015",
            moduleResolution: "node",
            sourceMap: false,
            declaration: false,
        }),
    ],
};
