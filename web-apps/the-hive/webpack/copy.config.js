const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyWebpackPlugin({ patterns: [
      'images/**',
      '../../node_modules/@webcomponents/webcomponentsjs/**',
      '../../node_modules/showdown/dist/**/*.min.js',
      '../../node_modules/prismjs/**/*.js',
      '../../node_modules/workbox-window/build/**/*.mjs',
      'src/register-sw.js',
      'manifest.json',
      '404.html',
    ]})
  ]
};
