const mime = require('mime-types');
const zlib = require('zlib');
const decompressSync = require('iltorb').decompressSync;
const set_cookie_parser = require('set-cookie-parser');
const cookieHelper = require('cookie')

exports.contentTypeMatches = function (contentTypes, item) {
    var result = false;
    for (var i = 0; i < contentTypes.length; i++) {
        const ct = contentTypes[i];
        const currentCT = mime.contentType(ct);

        if (item !== null && item !== undefined) {
            if ((currentCT !== null && currentCT.toLowerCase().replace(/\s/g, '') === item.toLowerCase().replace(/\s/g, ''))
                || (ct !== null && ct.toLowerCase().replace(/\s/g, '') === item.toLowerCase().replace(/\s/g, ''))) {
                result = true;
                break;
            }
        }
    }
    return result;
}

exports.getRelativeUrl = function (config, pageUrl) {

    if (!pageUrl) {
        pageUrl = "/";
    }
    var urlArr = pageUrl.split("/");

    var cleanArr = urlArr.filter(function (value, index, arr) {
        return value !== "";
    });

    //TODO remove mount from the URL -- might not be needed
    if (cleanArr.length > 0 && cleanArr[0] === config.br_mount_alias) {
        cleanArr = cleanArr.slice(1);
    }

    var rootArr = config.site_root_path.split("/");
    var cleanRootArr = rootArr.filter(function (value, index, arr) {
        return value !== "";
    });


    while (cleanRootArr.length > 0 && cleanArr.length > 0
        && cleanRootArr[0] === cleanArr[0]) {
        cleanRootArr = cleanRootArr.slice(1);
        cleanArr = cleanArr.slice(1);
    }

    return "/" + cleanArr.join("/");
}

exports.asyncForEach = async function (array, callback) {
    if (array != null) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}

exports.getPrependUrl = function (config, processorConfig) {
    var propertyName = "prepend";
    return this.getConfiguration(config, processorConfig, propertyName) + '/' + this.getConfiguration(config, processorConfig, "br_mount_alias")
}

exports.getConfiguration = function (general, specific, property) {
    if (property in specific) {
        return specific[property];
    } else {
        return general[property]
    }
}

exports.checkHeaderConditions = function (headers, conditions) {
    let result = true;
    conditions.forEach(header => {
        const value = headers[header.name] !== undefined ? headers[header.name] : "";

        var regex = RegExp(header.regex);

        result = result & regex.test(value) === true ? true : false;

        //console.log(header.name + " value: " + headers[header.name] + " regex:" + regex.test(value) + " CURRENT RESULT:" + result)

    });
    return result
}

exports.regexReplacement = function (config, processorConfig, input) {
    const prependUrl = this.getPrependUrl(config, processorConfig)
    console.log(prependUrl)
    processorConfig.regex_replacement.forEach(lookup => {
        input.data = input.data.replace(new RegExp(lookup.regex, 'gi'), function () {
            if (arguments.length > lookup.group) {
                var result = prependUrl + arguments[lookup.group];
                return arguments[0].replace(arguments[lookup.group], result);
            }
            else {
                return arguments[0];
            }
        });
    });
    return input;
}

exports.regexRemove = function (config, processorConfig, input) {
    processorConfig.regex_remove.forEach(lookup => {
        if (typeof input.data === 'string' || input.data instanceof String) {
            input.data = input.data.replace(new RegExp(lookup.regex, 'gim'), "");
        }
    });
    return input;
}

exports.uncompress = function (body, encoding) {
    if (encoding == 'gzip') {
        body = zlib.gunzipSync(body).toString('utf8');
    } else if (encoding == 'br') {
        try {
            body = decompressSync(body);
        } catch (err) {
            console.log("error unblortli");
        }
    }

    return body;
}

exports.mergeNewCookies = function (res, setCookie, cookies) {
    if (cookies === undefined && setCookie !== null) {
        cookies = "";

        var splitCookieHeaders = set_cookie_parser.splitCookiesString(setCookie)
        var newCookies = set_cookie_parser.parse(splitCookieHeaders, {
            decodeValues: true,  // default: true
            map: false
        });

        newCookies.forEach(cookie => {
            //console.log(cookie)
            if (cookies !== "") {
                cookies += ";" + cookie["name"] + "=" + cookie["value"]
            } else {
                cookies += cookie["name"] + "=" + cookie["value"]
            }
        });
        //cookieHelper.parse(cookies)
        res.header('set-cookie', setCookie)
    }
    return cookies;
}

// exports.replaceAll = function(target, search, replacement) {
//     return target.replace(new RegExp(search, 'g'), replacement);
// };