module.exports = function(api) {
    const plugins = [
        '@babel/plugin-proposal-class-properties',
        ["@babel/plugin-transform-runtime", {
            corejs: 3,
        }],
        ['babel-plugin-module-extension', {
            'mjs': '',
        }],
    ];
    if (api.env("commonjs")) {
        plugins.push(
            ['babel-plugin-module-resolver', {
                alias: {
                    '@fanoutio/pubcontrol': '@fanoutio/pubcontrol/commonjs',
                }
            }]
        );
    }
    return {
        presets: [
            [ "@babel/preset-env", {
                useBuiltIns: "entry",
                corejs: 3,
            } ],
        ],
        plugins,
    };
};