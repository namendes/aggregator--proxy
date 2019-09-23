var cheerio = require('cheerio')
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const utils = require('../utils/helpers.js');

exports.transform = function (generalConfig, processorConfig, url, contentType, filePath) {

    //var extension = path.extname(url.href);
    //console.log(url.href)
    var extension = mime.extension(contentType);

    //console.log("content type:" +contentType +  "to match: " + processorConfig.included_content_types +"  - "+utils.contentTypeMatches(processorConfig.included_content_types,contentType))
    //accepted content type
    if (utils.contentTypeMatches(processorConfig.included_content_types, contentType)) {

        //accepted extension
        if (!processorConfig.excluded_extensions_files.includes(extension)) {
            //console.log("accepted: " + filePath)   
            try {
                var data = fs.readFileSync(filePath, 'utf8');

                console.log("READS: " + processorConfig.name + " - " + filePath)
                var $ = cheerio.load(data, { decodeEntities: false })

                processorConfig.tags.forEach(tag => {
                    $(tag.name).each(function () {
                        tag.attributes.forEach(attribute => {
                            var currentLink = $(this).attr(attribute);
                            var excludeRegex = RegExp(tag.exclude_expression);
                            if (currentLink != null && !excludeRegex.test(currentLink)) {
                                var newLink = utils.getConfiguration(generalConfig,processorConfig, 'prepend') + currentLink;
                                // console.log(filePath + " - tag: " + tag.name +" - attribute:" + attribute + " link: " + currentLink + " new: " + newLink)
                                $(this).attr(attribute, newLink);
                            }
                        });
                    });
                });

                fs.writeFileSync(filePath, $.html(), 'utf8', function (err) {
                    if (err) throw err;
                    console.log("writing back: " + processorConfig.name + " - " + filePath)
                });
            } catch (err) {
                if (err) throw err;
                // Here you get the error when the file was not found,
                // but you also get any other error
            }
        }
    }
    return false;
}