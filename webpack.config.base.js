const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: ['./src/index.ts'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'docs')
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: 'static',
      to: path.resolve(__dirname, 'docs', 'static')
    }])
  ]
};