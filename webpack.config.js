const path = require('path');

module.exports = {
    entry: './esm/main.browser.mjs',
    output: {
        filename: 'grip.js',
        path: path.resolve(__dirname, 'browser'),
        library: 'GripPubControl',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: {
                    include: /(node_modules|bower_components)/,
                    exclude: /node_modules\/@fanoutio\/pubcontrol\//,
                },
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
};
