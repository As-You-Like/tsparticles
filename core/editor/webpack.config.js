const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const version = require("./package.json").version;
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const banner = `Author : Matteo Bruni - https://www.matteobruni.it
MIT license: https://opensource.org/licenses/MIT
Demo / Generator : https://particles.matteobruni.it/
GitHub : https://www.github.com/matteobruni/tsparticles
How to use? : Check the GitHub README
v${version}`;

const minBanner = `tsParticles Editor v${version} by Matteo Bruni`;

const getJsConfig = (entry) => {
    const reportFileName = "report";

    return {
        entry: entry,
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            libraryTarget: "umd",
            globalObject: "this"
        },
        resolve: {
            extensions: [ ".js", ".json" ]
        },
        module: {
            rules: [
                {
                    // Include ts, tsx, js, and jsx files.
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: "babel-loader"
                }
            ]
        },
        externals: [
            {
                "tsparticles-core": {
                    commonjs: "tsparticles",
                    commonjs2: "tsparticles",
                    amd: "tsparticles",
                    root: "window"
                },
                "tsparticles-plugins-absorbers": {
                    commonjs: "tsparticles-plugins-absorbers",
                    commonjs2: "tsparticles-plugins-absorbers",
                    amd: "tsparticles-plugins-absorbers",
                    root: "window"
                },
                "tsparticles-plugins-emitters": {
                    commonjs: "tsparticles-plugins-emitters",
                    commonjs2: "tsparticles-plugins-emitters",
                    amd: "tsparticles-plugins-emitters",
                    root: "window"
                },
                "tsparticles-plugins-polygon-mask": {
                    commonjs: "tsparticles-plugins-polygon-mask",
                    commonjs2: "tsparticles-plugins-polygon-mask",
                    amd: "tsparticles-plugins-polygon-mask",
                    root: "window"
                },
                "object-gui": {
                    commonjs: "object-gui",
                    commonjs2: "object-gui",
                    amd: "object-gui",
                    root: "window"
                }
            }
        ],
        plugins: [
            new webpack.BannerPlugin({
                banner,
                exclude: /\.min\.js$/
            }),
            new webpack.BannerPlugin({
                banner: minBanner,
                include: /\.min\.js$/
            }),
            new BundleAnalyzerPlugin({
                openAnalyzer: false,
                analyzerMode: "static",
                exclude: /\.min\.js$/,
                reportFilename: `${reportFileName}.html`
            })
        ],
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    include: /\.min\.js$/,
                    terserOptions: {
                        output: {
                            comments: minBanner
                        }
                    },
                    extractComments: false
                })
            ]
        }
    };
};

module.exports = [
    getJsConfig({
        "tsparticles.editor": "./dist/index.js",
        "tsparticles.editor.min": "./dist/index.js"
    })
];
