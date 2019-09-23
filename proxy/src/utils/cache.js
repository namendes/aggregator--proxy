var cacheManager = require('cache-manager');
var fsStore = require('cache-manager-fs-binary');
//var Stream = require('stream').Stream

var diskCache = cacheManager.caching({
    store: fsStore,
    options: {
        reviveBuffers: true,
        binaryAsStream: true,
        ttl: 60 * 60 /* seconds */,
        maxsize: 1000 * 1000 * 1000 /* max size in bytes on disk */,
        path: 'diskcache',
        preventfill: true
    }
});

exports.set = function (key, obj) {
    diskCache.set(key, obj);
}

exports.cacheMiddleware = function (options) {
    return function (req, res, next) {
        if (req.method !== "GET" || !req.originalUrl.startsWith('/us/shop/_common')) {
            // console.log("bypass cache: " + req.originalUrl)
            return next();
        } else {
            diskCache.get(req.originalUrl, function (err, result) {
                
                if (result != null) {
                    console.log("returns from change: " + req.originalUrl)   
                    if (result.metadata.contentType != null) {
                        res.setHeader("Content-type", result.metadata.contentType);
                    }
                    if (result.metadata.contentEncoding != null) {
                        res.setHeader("Content-encoding", result.metadata.contentEncoding);
                    }
                    result.binary.data.pipe(res);
                    
                    //var usedStreams = ['image'];
                    // you have to do the work to close the unused files
                    // to prevent file descriptors leak
                    // for (var key in result.binary) {
                    //     if (!result.binary.hasOwnProperty(key))continue;
                    //     if (usedStreams.indexOf(key) < 0
                    //         && result.binary[key] instanceof Stream.Readable) {
                    //         if(typeof result.binary[key].close === 'function') {
                    //             result.binary[key].close(); // close the stream (fs has it)
                    //         }else{
                    //             result.binary[key].resume(); // resume to the end and close
                    //         }
                    //     }
                    // }
                } else {
                    next();
                }
            });
        }
    }
}