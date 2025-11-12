module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'css-loader',
        options: {
          exportType: 'string'
        }
      }
    ]
  }
};
