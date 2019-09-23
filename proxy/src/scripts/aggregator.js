const proxy = require('http-proxy-middleware');
const express = require('express');
const morgan = require('morgan');
const cheerio = require('cheerio')
const mime = require('mime-types');
const helpers = require('../utils/helpers.js');
const cache = require('../utils/cache.js');
const textProcessor = require('../processors/text-processor.js');
var url = require('url');
// var https = require('https')
// var fs = require('fs')

// httpsOpts = {
//     key: fs.readFileSync('key.pem_', 'utf8'),
//     cert: fs.readFileSync('cert.pem_', 'utf8')
// };

const appConfig = require('../config.json');

var live_app = express();

appConfig.proxy.forEach(proxySite => {
    const proxyConfig = proxySite.live;
    var commonProxyConfig = proxySite.common;
    var fullConfig = { ...commonProxyConfig, ...proxyConfig };


const onProxyRes = function (proxyRes, req, res) {

    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    // proxyRes.headers['x-added'] = 'foobar';
    var end = res.end;
    var body;
    var buffer = new Buffer('');

    proxyRes.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
    }).on('end', () => {
        body = buffer;

    });

    // Defer write and writeHead
    res.write = () => { };
    //res.writeHead = (...args) => { writeHeadArgs = args; };

    res.end = getResponse;
    async function getResponse() {
        result = await textProcessor.transform(appConfig, fullConfig, body, proxyRes, req, res);

        //console.log( "transformed body" + await textProcessor.transform(appConfig, config, body, proxyRes, req, res));
        //console.log(body)
        res.setHeader('content-length', result.data.length);
        console.log("location: " + res.getHeader('location'));
        res.removeHeader('location');
        res.removeHeader('Access-Control-Allow-Origin');
        res.removeHeader('x-frame-options');

        //to check
        if (result.encoding) {
            res.setHeader('content-encoding', result.encoding);
        } else {
            res.removeHeader('content-encoding');
        }
        //  console.log("other"  + body)
        end.apply(res, [result.data]);
    }
};

var onProxyReqWs = function (proxyReq, req, socket, options, head) {
    // add custom header
    // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
};

    var options = {
        target: fullConfig.target_url,

        pathRewrite: function (path, req) {
            //var result = path;
            var url_parts = url.parse(req.url, true);

            
            if (url_parts.search === null) {
                path = path.replace(fullConfig.br_rel_url, '')
            }

            console.log("old path: " + path);

           // if(path.startsWith(fullConfig.br_mount_path))

            if (fullConfig.slash_ending_urls && !path.endsWith('/') && !path.endsWith('.html')) {
                path = path + "/";
            } else if (!fullConfig.slash_ending_urls && path.endsWith('/')) {
                path = path.substring(0, path.length - 1);
            }

            //console.log("search: " + url_parts.search);
            console.log("new path: " + path);
            return path;
        },
        onProxyReqWs: onProxyReqWs,
        onProxyRes: onProxyRes,
        // secure: false,
        changeOrigin: true,
        //followRedirects: true,
        logLevel: fullConfig.log_level
    };

    var siteFilter = function (pathname, req) {
        return !pathname.endsWith("autoreload");
    };

    var myProxy = proxy(siteFilter, options);

    var cacheMW = cache.cacheMiddleware();

    var cmsProxy = proxy(
        {
            target: fullConfig.br_base_url,
            logLevel: fullConfig.log_level
        });

    live_app.use('/site/binaries', cmsProxy);// add the proxy to express
    live_app.use('/site/webfiles', cmsProxy);// add the proxy to express

    var rootProxy = proxy(
        {
            target: fullConfig.target_url,
            // secure: false,
            changeOrigin: true,
            logLevel: fullConfig.log_level
        });

    fullConfig.root_urls.forEach(url => {
        live_app.use(url, rootProxy);
    });

    // the context defines the inital part, so nothing before this context can be fetched
    live_app.use(fullConfig.br_rel_url, cacheMW, myProxy); // add the proxy to express  //

    //https.createServer(httpsOpts, live_app).listen(444);

   
});
live_app.listen(3000, () => {
    console.log("Started server on " + 3000);
});