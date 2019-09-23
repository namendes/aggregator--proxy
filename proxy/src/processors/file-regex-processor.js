const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const utils = require('../utils/helpers.js');

exports.transform = async function (generalConfig, processorConfig, url, contentType, filePath) {
    //var extension = path.extname(url.href);
    var extension = mime.extension(contentType);

    // console.log("content type:" +contentType +  "to match: " + processorConfig.included_content_types +"  - "+utils.contentTypeMatches(processorConfig.included_content_types,contentType))
    //accepted content type
    if (utils.contentTypeMatches(processorConfig.included_content_types, contentType)) {
        //accepted extension
        if (!processorConfig.excluded_extensions_files.includes(extension)) {
            //console.log(url.href)
            try {
                var output = fs.readFileSync(filePath, 'utf8');
                output = utils.regexReplacement(processorConfig, generalConfig, output);
                fs.writeFileSync(filePath, output, 'utf8')
                console.log("writing back: " + processorConfig.name + " - " + filePath)
                return filePath;

            } catch (err) {
                if (err) throw err;
                // Here you get the error when the file was not found,
                // but you also get any other error
            }

        }
    }
    return false;
}