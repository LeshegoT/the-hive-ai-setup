module.exports = {
  devServer: {
    historyApiFallback: true,
    port: 3000,
    setupMiddlewares: function (middlewareArray, devServer) {
      devServer.app.get('/admin/*', function (req, res) {
        res.status(200).send('Request for admin site path: ' + req.path);
      });
      devServer.app.get('/gitversion.json', (req,res)=>{
        res.status(200).send(JSON.stringify({
          "build-date": new Date().toLocaleDateString(),
          "branch": "development-server (no branch info available)",
          "commits": "-1",
          "hash": "(not-applicable)",
          "dev-server": true
        }));
      });

      return middlewareArray;
    },
    proxy:[{
        context: ['/api/config/config.json','/static-content','/courses'],
        target: 'http://localhost:3001',
    }]
  },
  devtool: 'source-map'
};
