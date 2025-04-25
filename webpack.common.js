'use strict';

const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    content: './src/content.js',
    pageWorld: '@inboxsdk/core/pageWorld.js',
    background: '@inboxsdk/core/background.js',
  },
 optimization: {
    usedExports: true,  // Removes unused code
    minimize: true,     // Minifies the final bundle
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "static" },
      ],
    }),
  ],
resolve: {
    alias: {
      'mathjax': require.resolve('mathjax-full/js/mathjax.js'),
      'mathjax/input/tex': require.resolve('mathjax-full/js/input/tex.js'),
      'mathjax/output/svg': require.resolve('mathjax-full/js/output/svg.js'),
      'mathjax/adaptors/liteAdaptor': require.resolve('mathjax-full/js/adaptors/liteAdaptor.js'),
      'mathjax/handlers/html': require.resolve('mathjax-full/js/handlers/html.js')
    }
  },
};
