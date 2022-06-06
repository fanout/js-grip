const path = require("path");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.browser.ts'),
    bundles: path.resolve(__dirname, 'browser'),
}

const PROD = process.env.NODE_ENV === 'production';
const fileName = 'grip';
const libName = 'Grip';

const config = {
    mode: PROD ? 'production' : 'development',
    entry: PATHS.entryPoint,
    output: {
        path: PATHS.bundles,
        filename: fileName + (PROD ? '.min' : '') + '.js',
        libraryTarget: 'var',
        library: libName,
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    devtool: PROD ? 'source-map' : 'inline-source-map',
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
            options: {
                compilerOptions: {
                    composite: false,
                    declaration: false,
                    declarationMap: false,
                },
            },
        }],
    },
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'report' + (PROD ? '.prod' : '.dev') + '.html',
        }),
    ],
}

module.exports = config;
