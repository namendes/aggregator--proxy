var cheerio = require('cheerio')
const mime = require('mime-types');
const utils = require('../utils/helpers.js');

exports.transform = async function (config, processorConfig, input, proxyRes, req, res) {
    //url, contentType, filePath

    //var extension = path.extname(url.href);
    //console.log(url.href)
    var contentType = proxyRes.headers['content-type']
    var extension = mime.extension(contentType);

    //    console.log("URL URL: " + req.url);
    //    console.log(res)

    //console.log("ujrl: " + req.url + "content type:" + contentType +  "to match: " + processorConfig.included_content_types +"  - "+utils.contentTypeMatches(processorConfig.included_content_types,contentType))
    //accepted content type
    if (utils.contentTypeMatches(processorConfig.included_content_types, contentType)) {

        //accepted extension
        if (!processorConfig.excluded_extensions_files.includes(extension)) {
            //console.log("accepted: " + req.url)   
            try {
                //var data = fs.readFileSync(filePath, 'utf8');

                //console.log("READS: " + processorConfig.name )
                var output = utils.uncompress(input.data, input.encoding); // some function to manipulate body
                var $ = cheerio.load(output, { decodeEntities: false })

                processorConfig.tags.forEach(tag => {
                    $(tag.name).each(function () {
                        tag.attributes.forEach(attribute => {
                            var currentLink = $(this).attr(attribute);
                            var excludeRegex = RegExp(tag.exclude_expression);
                            
                            if ((currentLink != null && !excludeRegex.test(currentLink)) || tag.exclude_expression === undefined) {
                                var newLink = currentLink;
                                //console.log(processorConfig);
                                if (processorConfig.type === "prepend") {
                                    const prependUrl = utils.getPrependUrl(config, processorConfig)
                                    if(tag.make_url_relative){
                                        //console.log("before: " + newLink)
                                        newLink = newLink.replace(config.target_url, "");
                                        //console.log("after: " + newLink)
                                    }
                                    newLink = prependUrl + newLink;
                                    // console.log(filePath + " - tag: " + tag.name +" - attribute:" + attribute + " link: " + currentLink + " new: " + newLink)
                                } else if (processorConfig.type === "remove") {
                                    var removeString = utils.getConfiguration(config, processorConfig, "remove");
                                    
                                    if(currentLink !== undefined){
                                        newLink = currentLink.replace(removeString, "");
                                    }
                                }
                                $(this).attr(attribute, newLink);
                            }
                        });
                    });
                });
                input.data = $.html();
                input.encoding = null;

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
