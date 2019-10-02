var cheerio = require('cheerio')
const mime = require('mime-types');
const service = require('../utils/br-service.js');
const utils = require('../utils/helpers.js');
const URL = require('url');
const path = require('path');

exports.transform = async function (config, processorConfig, input, proxyRes, req, res) {
    var encoding = proxyRes.headers['content-encoding']
    var contentType = proxyRes.headers['content-type']
    //console.log(proxyRes.headers)
    var statusCode = proxyRes.statusCode;  // status === 200
    var cookies = req.headers['cookie'];
    var setCookie = null;
    var allCookies = cookies;

    var extension = path.extname(req.url)
    if (extension === undefined || extension === null) {
        extension = mime.extension(contentType);
    } else {
        if (extension.startsWith(".")) {
            extension = extension.substring(1);
        }
    }
    var url_parts = URL.parse(req.url, true);
    var relUrl = utils.getRelativeUrl(config, url_parts.pathname);

    //console.log(" relurl: " + relUrl + " status code: " + statusCode);

    //console.log("content type:" +contentType +  "to match: " + processorConfig.included_content_types +"  - "+utils.contentTypeMatches(processorConfig.included_content_types,contentType))
    //accepted content type
    if (!relUrl.endsWith("..") && utils.contentTypeMatches(processorConfig.included_content_types, contentType)) {
        //accepted extension
        if (!processorConfig.excluded_extensions_files.includes(extension)) {
            if (utils.checkHeaderConditions(req.headers, processorConfig.header_conditions)) {
                // console.log(contentType + " - " + encoding + " extension " + extension + " url: " + req.url)
                var output = utils.uncompress(input.data, input.encoding); // some function to manipulate body
                //console.log(output.toString('utf8'))
                var $ = cheerio.load(output)

                var pageDefinition = await service.getContainers(config, relUrl);
                //console.log("pageDefinition: " )
                //console.log( pageDefinition)
                if (pageDefinition != null) {

                    //console.log(req.url +"  -- " + contentType)
                    // var page = JSON.parse(pageDefinition);

                    const start = async () => {
                        await utils.asyncForEach(pageDefinition.containers, async (container) => {
                            var markup = "";
                            // console.log(statusCode )
                            
                            if (container.type === "STATIC") {
                                container = config.br_static_container.containers[0];
                             }
                            // else if (container.type === "HYBRID") {
                            //     container = config.br_hybrid_container.containers[0];
                            // }
                            console.log(container)

                            //fallback for a srouce site 404 (might be a Bloomreach page only)
                            if (statusCode >= 400 && statusCode < 500) {
                                var result = await service.getContainerMarkup(config, relUrl, url_parts.search, container, allCookies);
                                if (result != null) {
                                    markup = await result.text;
                                    setCookie = result.setCookies;

                                    // console.log("statuscode: " + statusCode + "markup: " + markup)
                                    if (markup !== null) {
                                        res.status(200);
                                    }
                                }
                            } else {
                                var result = await service.getContainerMarkup(config, relUrl, url_parts.search, container, allCookies);
                                markup = await result.text;
                                setCookie = result.setCookies;
                            }

                            allCookies = utils.mergeNewCookies(res, setCookie, cookies);

                            //console.log("URL: " + relUrl +  " MARKUP: " + markup);
                            // TODO add alternative to replace inside
                            //markup = "<div>gello</div>";
                            //  console.log(container.selector + " - " + $(container.selector).attr('class'))

                            if (container.mode === 'replace') {
                                //console.log(container.selector);
                                //REPLACE eveything
                                $(container.selector).replaceWith(markup);
                            } else if (container.mode === 'bottom') {
                                //ADD AT THE END
                                $(container.selector).append(markup);
                            } else if (container.mode === 'top') {
                                //ADD AT THE BEGINNING
                                $(container.selector).prepend(markup);
                            } else if (container.mode === 'inside') {
                                //CLEAR ELEMENTS AND ADD INSIDE
                                $(container.selector).empty();
                                $(container.selector).append(markup);
                            }
                            // $(container.selector).remove();
                            //  await replaceContainer(container);
                            // console.log(container);
                        })
                    }
                    await start();
                }

                var pageInstructions = await service.retrievePageComment(config, relUrl, allCookies);
                //console.log(pageInstructions)
                if (pageInstructions != null && pageInstructions.headContributions != null) {
                    $('head').append(pageInstructions.headContributions);
                }
                output = $.html();

                if (pageInstructions != null && pageInstructions.pageComment != null) {
                    // console.log("pageInstructions.pageComment: "+ pageInstructions.pageComment)
                    // adding global page comment
                    input.data = output + pageInstructions.pageComment;
                }
                input.encoding = null;

                return input
            }
        }
    }
    return input;
}
