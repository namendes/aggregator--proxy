var express = require('express');
var proxy = require('http-proxy-middleware');

var proxyTable = {
  //'localhost:3000': 'http://localhost:8080/cms', // host only
  //'staging.localhost:3000': 'http://localhost:8002', // host only
  //'localhost:3000/api': 'http://localhost:8003', // host + path
  '^/cms': 'http://localhost:8080', // path only
  '^w.': 'https://www.google.com' // path only
};

var options = {
  target: 'http://localhost:8080',
  router: proxyTable,
  logLevel: 'debug'
};

var myProxy = proxy(options);

var app = express();
app.use(myProxy); // add the proxy to express

app.listen(3000);
