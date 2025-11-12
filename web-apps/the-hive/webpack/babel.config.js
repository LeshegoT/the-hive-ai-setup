module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { chrome: 73, firefox: 65, edge: 79, safari: 14,} }]],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      }
    ]
  }
};
