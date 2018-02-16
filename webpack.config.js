/*
npm i -D
  webpack  clean-webpack-plugin  html-webpack-plugin  text-transform-loader
  webpack-dev-server  uglifyjs-webpack-plugin  copy-webpack-plugin
  babel-loader@8.0.0-beta.0  @babel/core  @babel/preset-env
  async-waterfall  chai
*/


const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// SETTINGS
const srcFoldN = '_src';
const src  = path.resolve(__dirname, './' + srcFoldN);
const dist = path.resolve(__dirname, './dist');
const ifAddTestsRegex = /\/\*\-\-\[IF_ADDTESTS\]\-\-/g;
const sourceMapInProd    = false;


module.exports = (env = {}) => {

  var DEV      = (env.NODE_ENV == 'development');
  var PROD     = (env.NODE_ENV == 'production') || !DEV;
  var ADDTESTS = !!env.ADDTESTS;  // So, if not set, excludes tests by default.

  const UglifyJSPlugin = !PROD ? 0 : require('uglifyjs-webpack-plugin');


  return Object.assign(

    (!PROD ? {
      devServer: {
        port: 3000,
        open: true,
        contentBase: [src, dist],  // Include `src` and do `watchContentBase`..
        watchContentBase: true  // ..for live-reload on `src/demo*.js` changes.
      }
    } : {}),


    {
      entry: src + '/vsm-dictionary.js',


      devtool: !PROD ? 'inline-source-map' :
               (sourceMapInProd ? 'hidden-source-map' : false),


      module: {
        rules: [
          {
            test: /\.js$/,
            include: src,
            exclude: /(node_modules|bower_components|demo.*\.js)/,
            use: [{
                loader: 'babel-loader',
                options: { presets: ['@babel/preset-env'] }
              }, {
                loader: 'text-transform-loader',
                options: {
                  transformText: s =>
                    s.replace(/require\('xmlhttprequest'\)/g, '{}')
                }
              }]
          },
          {
            test: /vsm-dictionary\.js$/,
            include: src,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'text-transform-loader',
              options: {
                transformText: s => ADDTESTS ? s.replace(ifAddTestsRegex,'') : s
              }
            }
          }
        ]
      },


      node: {
        fs: 'empty',
        child_process: 'empty'  // Extra safety against xmlhttprequest-error.
      },


      plugins: [  // -- DEV+PROD COMMON PLUGINS --
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
        }),
        new CleanWebpackPlugin([ dist ]),
        new HtmlWebpackPlugin({
          template: src + '/index.html',
          inject: false
        }),
        new CopyWebpackPlugin([
          { from: src + '/demoData.js' },
          { from: src + '/demoInBrowser.js' },
          { from: src + '/demoInNode.js' },
        ])
      ] .concat( !PROD ?

        [ // -- DEV PLUGINS --
        ] :

        [ // -- PROD PLUGINS --
          new UglifyJSPlugin( Object.assign( {},
            (sourceMapInProd ? { sourceMap: true } : {})
          ))
        ]
      ),


      output: {
        path: dist,
        filename: 'vsm-dictionary.js' ,
        library: {
          root: 'VsmDictionary',  // Expose as global variable for browsers.
          amd: 'vsm-dictionary',
          commonjs: 'vsm-dictionary'  // Expose as a module.exports for Node.js.
        },
        libraryTarget: 'umd'
      }

    }
  );
}
