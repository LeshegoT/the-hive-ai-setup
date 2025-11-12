const { merge } = require('webpack-merge');
const path = require('path');

const devServer = require('./webpack/dev-server.config');
const babel = require('./webpack/babel.config');
const css_loader = require('./webpack/css-loader.config');
const entry_points = require('./webpack/entry-points.config');
const copy = require('./webpack/copy.config');
const workbox = require('./webpack/workbox.config');
const { DefinePlugin } = require('webpack');

const base = {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../../dist/web-apps/the-hive')
  },
  module: {
    rules: []
  },
  plugins: [new DefinePlugin({
    BUILD_TIME: DefinePlugin.runtimeValue(Date.now)
  })],
  performance: {
    hints: false
  },
  /*
  RE - Turn the `ignoreWarnings` below on when you are running the service worker locally and you get
  an error about `--watch` and manifest injection
  */
  ignoreWarnings: [/InjectManifest/],
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      '@the-hive/lib-skills': path.resolve(__dirname, '../../dist/libs/web-apps/skills'), // Path to the built library
      '@the-hive/lib-skills-shared': path.resolve(__dirname, '../../dist/libs/shared-libs/lib-skills-shared'), // Path to the built library
      '@the-hive/lib-skills-web': path.resolve(__dirname, '../../dist/libs/web-app-libs/lib-skills-web'), // Path to the built library
      '@the-hive/lib-shared': path.resolve(__dirname, '../../dist/libs/shared-libs/lib-shared'), // Path to the built library
    },
  },
};

let config = merge(
  base,
  devServer,
  babel,
  css_loader,
  entry_points,
  copy,
  workbox
);

module.exports = config;
