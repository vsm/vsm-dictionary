/*
Webpack is only used for creating an interactive demo in the browser.

It bundles all modules (in-memory),
starts the webpack development server with live-reload, and
serves a demo webpage that loads both the bundled vsm-dictionary and demo-code.

See also 'demoInBrowser.js'.
*/


const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const src  = path.resolve(__dirname, './_src');


module.exports = (env = {}) => {
  return {
    devServer: {
      port: 3000,
      open: true
    },

    entry: src + '/vsm-dictionary.js',

    devtool: 'inline-source-map',

    module: {
      rules: [
        {
          test: /\.js$/,
          include: src,
          exclude: /(node_modules|demo.*\.js)/,
          use: [{
              loader: 'babel-loader',
              options: { presets: ['@babel/preset-env'] }
            }, {
              loader: 'text-transform-loader',
              options: {
                transformText: s =>  // Exclude this package, for the browser.
                  s.replace(/require\('xmlhttprequest'\)/g, '{}')
              }
            }]
        }
      ]
    },

    node: {
      fs: 'empty',
      child_process: 'empty'  // Extra safety against 'xmlhttprequest'-error.
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: src + '/demo.html',
        inject: false
      }),
      new CopyWebpackPlugin([
        { from: src + '/demoData.js' },
        { from: src + '/demoInBrowser.js' },
        { from: src + '/demoInNode.js' },
      ])
    ],

    output: {
      filename: 'bundle.js' ,  // Used by HtmlWebpackPlugin.
      library: 'VsmDictionary',  // } Expose as a global variable for browsers.
      libraryTarget: 'window'    // }  " .
    }
  }
}
