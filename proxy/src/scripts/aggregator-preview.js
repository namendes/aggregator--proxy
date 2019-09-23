const proxy = require('http-proxy-middleware');
const express = require('express');
const morgan = require('morgan');
const cheerio = require('cheerio')
const mime = require('mime-types');
const helpers = require('../utils/helpers.js');
const cache = require('../utils/cache.js');
const textProcessor = require('../processors/text-processor.js');
var url = require('url');
// const NodeCache = require("node-cache");
// const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

const appConfig = require('../config.json');
const proxyConfig = appConfig.proxy.preview;
var commonProxyConfig = appConfig.proxy.common;
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
        // body = buffer;
        // const cacheObj = {
        //     binary: {
        //         data: body,
        //     },
        //     metadata: {
        //         contentType: contentType,
        //         contentEncoding: encoding
        //     }
        // };
        // cache.set(req.url, cacheObj);
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
        //to check
        if (result.encoding) {
            res.setHeader('content-encoding', result.encoding);
        } else {
            res.removeHeader('content-encoding');
        }
        end.apply(res, [result.data]);
    }
};

var onProxyReqWs = function (proxyReq, req, socket, options, head) {
    // add custom header
    // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
};

var options = {
    target: fullConfig.target_url,
    // router: {
    //     '/site': 'http://localhost:8080', // path only
    // },
    // pathRewrite: {
    //         '^/site/_cmsinternal/external': '', // rewrite path
    //         //'^/site/_cmsinternal/external/': '' // rewrite path
    //         },
    pathRewrite: function (path, req) {
        var result = path;
        var url_parts = url.parse(req.url, true);

        //if (url_parts.search === null) {
        path = path.replace(fullConfig.br_rel_url, '')
        //}
        if (path.endsWith("?org.hippoecm.hst.container.render_host=" + fullConfig.host)) {
            path = path.replace("?org.hippoecm.hst.container.render_host=" + fullConfig.host, '/');
        }

        console.log("old path: " + path);
        if (fullConfig.slash_ending_urls && !path.endsWith('/') && !path.endsWith('.html')) {
            path = path + "/";
        } else if (!fullConfig.slash_ending_urls && path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        // console.log("search: " + url_parts.search);
        console.log("new path: " + path);
        return path;
    },
    // router: function(req) {
    //     console.log("router: " + req.url)
    //     return 'http://localhost:8080';
    // },
    onProxyReqWs: onProxyReqWs,
    onProxyRes: onProxyRes,
    // secure: false,
    changeOrigin: true,
    //followRedirects: true,
    logLevel: fullConfig.log_level
};

var siteFilter = function (pathname, req) {
    var url_parts = url.parse(req.url, true);
    var result = pathname.match('^/site/_cmsinternal/external') !== null
        && (url_parts.search === null || url_parts.search.match("^\\?_hn") === null)
    //console.log("pathname: " + pathname + " = "+ result)
    return result;
    //return !pathname.match('^/site/_cmsinternal/webfiles') && req.method === 'GET';
};
var live_app = express();
//app.use(morgan('tiny'));
//app.use(morgan('combined'));
var siteProxy = proxy(siteFilter, options);
var cacheMW = cache.cacheMiddleware();

// var redirect = function (req, res, next) {
//     // Don't allow user to hit Heroku now that we have a domain

//     var host = req.get('Host');
//     var url = req.url;
//     var originalUrl = req.originalUrl;

//     //console.log("hosts " + host + " url: "+ url + "originalUrl: " + originalUrl);
//     if (url.startsWith("/site/external")) {
//         const newUrl = 'http://localhost:' + fullConfig.node_port + url.split("/site/external")[1];
//         console.log("reditrect to: " + newUrl);
//         return res.redirect(301, newUrl);
//     } else if (url.startsWith("/site/_cmsinternal/external")) {
//         const newUrl = 'http://localhost:' + fullConfig.node_port + url.split("/site/_cmsinternal/external")[1];
//         console.log("reditrect to: " + newUrl);
//         res.header('foo', 'bar')
//         return res.redirect(301, newUrl);
//     }
//     return next();
// }

var cmsFilter = function (pathname, req) {
    var url_parts = url.parse(req.url, true);
    var result =
        (url_parts.search !== null && url_parts.search.match("^\\?_hn") !== null)
        || pathname.match('^/site/_cmsinternal/external') === null
        || pathname.match('^/cms') !== null;
    console.log("CMS filter pathname: " + pathname + " = " + result)
    return result;
};

var cmsProxy = proxy(cmsFilter,
    {
        target: fullConfig.br_base_url,
        router: {
            // '^/site/external': 'http://me:3000', // path only
            //'^/on': 'http://me:3000', // path only
        },
        logLevel: fullConfig.log_level
    });

live_app.use('/cms', cmsProxy);// add the proxy to express
live_app.use('/site/_cmsinternal', cmsProxy);// add the proxy to express
live_app.use('/site/_cmsinternal/webfiles', cmsProxy);
live_app.use('/site/images', cmsProxy);
live_app.use('/site/_cmssessioncontext', cmsProxy);


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
live_app.use(cacheMW, siteProxy); // add the proxy to express  //
live_app.listen(fullConfig.node_port, () => {
    console.log("Started server on " + fullConfig.node_port);
});
