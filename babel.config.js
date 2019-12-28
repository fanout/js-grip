module.exports = {
    presets: [
        [ "@babel/preset-env", {
            useBuiltIns: "entry",
            corejs: 3,
        } ],
    ],
    plugins: [
        '@babel/plugin-proposal-class-properties',
        ["@babel/plugin-transform-runtime", {
            corejs: 3,
        }],
        [ 'babel-plugin-module-extension', {
            'mjs': '',
        }]
    ],
};