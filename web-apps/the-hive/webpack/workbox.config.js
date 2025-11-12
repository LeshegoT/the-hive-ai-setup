const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = {
  plugins: [
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: './src/sw.js',
      swDest: 'sw.js',
      include: ['index.html', 'manifest.json', /\.js$/],
      maximumFileSizeToCacheInBytes: 5*1024*1024,
      exclude: [
        /\/@webcomponents\/webcomponentsjs\//,
        /\/prismjs\//,
        /\/register-sw.js/,
        /\/refresh.js/,
        /\/admin\//
      ]
    })
  ]
};
