const utils = require('../utils/helpers.js');
const mime = require('mime-types');

exports.transform = async function (config, processorConfig, input, proxyRes, req, res) {
    var contentType = proxyRes.headers['content-type']
    var extension = mime.extension(contentType);

    if (utils.contentTypeMatches(processorConfig.included_content_types, contentType)) {
        //accepted extension
        if (!processorConfig.excluded_extensions_files.includes(extension)) {
            input.data = utils.uncompress(input.data, input.encoding); // some function to manipulate body
            input.encoding = null;
            
            try {
                if (processorConfig.regex_replacement !== undefined) {
                    input = utils.regexReplacement(config, processorConfig, input);
                }
                if (processorConfig.regex_remove !== undefined) {
                    
                    input = utils.regexRemove(config, processorConfig, input);
                }
                return input;
            } catch (err) {
                if (err) throw err;
                // Here you get the error when the file was not found,
                // but you also get any other error
            }
        }
    }
    return input;
}