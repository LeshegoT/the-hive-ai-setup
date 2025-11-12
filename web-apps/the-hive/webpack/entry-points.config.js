const HtmlWebpackPlugin = require('html-webpack-plugin');

let info = {
  buildTimeString: new Date().toLocaleString(),
  buildTime: new Date().getTime()
};

module.exports = {
  entry: {
    app: './src/the-hive.js',
    'public-leaderboard': './src/public-leaderboard.js',
    'refresh': './force-periodic-reload.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      path: '',
      chunksSortMode: 'none',
      filename: 'index.html',
      template: 'index.html',
      chunksSortMode: 'manual',
      chunks: ['refresh','app'],
      info,
    }),
    new HtmlWebpackPlugin({
      path: 'public-leaderboard',
      chunksSortMode: 'none',
      filename: 'public-leaderboard.html',
      template: 'public-leaderboard.html',
      chunks: ['public-leaderboard'],
    }), new HtmlWebpackPlugin({
      path: 'resfresh',
      chunksSortMode: 'none',
      filename: 'refresh.html',
      template: 'refresh.html',
      chunks: ['refresh'],
      info
    })
  ]
};
