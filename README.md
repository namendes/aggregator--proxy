To start everything from site-proxy dir
npm run --prefix proxy dev

To start everything from site-proxy/proxy dir
npm run dev

To start LODAER and AGGREGATOR from site-proxy dir
npm run --prefix proxy dev-proxy

To start ngApp from site-proxy dir
npm run --prefix ng-app start

To start LOADER from site-proxy dir
npm run --prefix proxy loader

To start EXPRESS server on static files from site-proxy dir
npm run --prefix proxy express

To start AGGREGATOR from site-proxy dir
npm run --prefix proxy aggregator


For continous development start with file watcher
npm install supervisor -g
Sintax: supervisor app.js