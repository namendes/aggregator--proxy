var config;
exports.transform = async function (appConfig, url, contentType, filePath) {

    config = appConfig;
    var generalconfig = appConfig.general;
    const processors = config.site_origin.processors;

    processors.forEach(p => {
        var processorConfig;
        
        if (typeof p === 'string') {
            var standardProcessor = config.processors.filter(processor => (processor.name === p));
            if (standardProcessor !== null) {
                processorConfig = standardProcessor[0];
            }
        } else if (typeof p === 'object') {
            processorConfig = p;
        }
        if(processorConfig !== null){
            const processor = require('../processors/' + processorConfig.script);
            if(processor !== null){
                processor.transform(generalconfig, processorConfig,url, contentType, filePath);
            }else{
                console.log("can't find processor: " + processorConfig.name);
            }
        }
    });
}
