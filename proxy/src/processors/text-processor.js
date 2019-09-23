const utils = require('../utils/helpers.js');

var config;
exports.transform = async function (appConfig, config, body, proxyRes, req, res) {

    var generalconfig = appConfig;
     // configuration from common can be overriden by one more specific
    const processors = config.processors;
    var encoding = proxyRes.headers['content-encoding']
    


    let data = {
        data: body,
        encoding:encoding
    };

    await utils.asyncForEach( processors, async (p) => {
        var processorConfig;
  
        if (typeof p === 'string') {
            var standardProcessor = generalconfig.processors.filter(processor => (processor.name === p));
            if (standardProcessor !== null) {
                processorConfig = standardProcessor[0];
            }
        } else if (typeof p === 'object') {
            processorConfig = p;
        }
        
        if(processorConfig !== null){
            const processor = require('../processors/' + processorConfig.script);
            if(processor !== null){
                //console.log("start processing")
                data = await processor.transform(config, processorConfig, data, proxyRes, req, res);
            }else{
                console.log("can't find processor: " + processorConfig.name);
            }
        }
    });
    return data;
}