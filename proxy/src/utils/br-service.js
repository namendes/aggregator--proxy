const fetch = require("node-fetch");
const request = require('request');
const rp = require('request-promise');
const URL = require('url');

function replaceInHtml(target, search, replacement) {
    return target.replace(new RegExp(search, 'g'), replacement);
};

exports.getContainers = async function (config, relUrl) {
    var options = {
        method: 'POST',
        uri: config.service_url,
        timeout: 5000,
        form: {
            url: relUrl,
            mount: config.br_mount_alias
        },
        headers: {
            /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
        }
    };

    //console.log(options);
    var result = await rp(options)
        .then(function (body) {
            //console.log(body);
            return JSON.parse(body);
        }).catch(function (err) {
            console.log("Error loading containers: " + relUrl + " ERROR: " + err + " Fallback to BR landing page")
            return config.br_container_fallback;

        });
    return result;
}

exports.getContainerMarkup = async function (config, relPath, search, container, cookies) {
    //    var relPath = path != '/' ? path : '';
    var searchParams = search !== null ? search : "";
    //console.log(container);
    //remove trailing slash
    if (relPath.endsWith('/')) {
        relPath = relPath.substring(0, relPath.length - 1);
    }
    var containerURL = config.br_site_url + config.br_mount_path + relPath + "./" + container.name + searchParams;
    //console.log("container: " + containerURL)
    var result = await retrieveText(containerURL, cookies);
    return result;
}

async function retrieveText(url, cookies) {
    //console.log("retreive Text: " + url)
    //console.log("retreive Text URL: " + url + " cookies " + cookies)
    return await fetch(url, {
        method: "GET",
        headers: {
            //   'Accept': 'application/json', // This is set on request
            //   'Content-Type': 'application/json', // This is set on request
            //   'X-CSRF-Token': 'abcdefghijklmnop', // This is set on request
            //   'Cache': 'no-cache', // This is set on request
            //   credentials: 'same-origin', // This is set on request
            'Cookie': cookies// +"_visitor=b2fbf572-d6d4-48f5-857e-6b91845e6de4"//+ 'JSESSIONID=4AFA07AB3791BDEAFC4D897960B485AD'//'JSESSIONID=1E778E60F61BC3E6403F76390D3603F8;SESSION=MUU3NzhFNjBGNjFCQzNFNjQwM0Y3NjM5MEQzNjAzRjg=' // This is missing from request
        }
    }).then(
        (response) => {
            if (response.status !== 404) {
                //console.log("cookies:");
                //console.log();

                var result = {
                    text: response.text(),
                    setCookies: response.headers.get("set-cookie")
                }

                return result;
            }
            else {
                return null;
            }
        }
        //res => res.text()
    )
        .catch(function () {
            console.log("error");
        });
}

exports.retrievePageComment = async function (config, path, cookies) {

    var relPath = path != '/' ? path : '';
    var url = config.br_site_url + config.br_mount_path + relPath + './';
    console.log("PARTIAL: " + url);

    var result = await retrieveText(url, cookies);
    if (result !== null) {

        try {
            var markup = await result.text;

        if (markup !== null && markup !== undefined) {
            //console.log(markup)
            var headContributions = markup.substring(markup.indexOf("headincludes->") + 14, markup.indexOf("<-headincludes"));
            var pageComment = markup.substring(markup.indexOf("</html>") + 7);

            var result = {
                pageComment: pageComment,
                headContributions: headContributions
            }
            return result;
        }
        } catch (error) {
         console.log("unable to retrieve text from page markup");   
        }
    }
    return null;
}

async function retrieveJson(url) {
    return await fetch(url)
        .then(res => res.json())
}

