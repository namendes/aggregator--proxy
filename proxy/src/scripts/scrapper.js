const { fork } = require('child_process');
const compute = fork('./scrapper/runner.js');
var express = require("express");
var fs = require('fs');
var URL = require('url');

var maxDepth;
var concurrency;
var destinationDir;

var baseUrl;
var domainWithProtocol;
var domain;

var options;
var waitList = [];
var currentQ;
var processedList;
var config;

exports.run = function (appConfig) {

    config = appConfig;
    maxDepth = config.site_origin.scrapper_options.max_hiperlink_depth;
    concurrency = config.site_origin.scrapper_options.concorrent_runners;
    destinationDir = config.site_origin.scrapper_options.directory;

    // the first url in the list will give the domain to the rest of the execution
    baseUrl = URL.parse(config.site_origin.scrapper_options.urls[0]);
    domainWithProtocol = baseUrl.protocol + "//" + baseUrl.hostname;
    domain = baseUrl.hostname;

    // add all the URLs to the waiting list
    config.site_origin.scrapper_options.urls.forEach(url => {
        job = {
            baseUrl: url,
            dir: destinationDir,
            level: 0
        }
        waitList.push(job);
    });

    currentQ = [];
    processedList = [];

    if (config.site_origin.scrapper_options.clean_destination_folder) {
        removeDir();
    }
    runNext();
}

function runNext() {
    //console.log(waitList);
    if (waitList.length > 0) {
        var nextPage = waitList.slice(0, 1)[0];
        //console.log("->" + nextPage.baseUrl)
        currentQ.push(nextPage);
        removeFromWaitingList(nextPage.baseUrl);

        var message = {
            job: nextPage,
            config: config
        }
        compute.send(message);

        // tries to get another runner working
        if (currentQ.length < concurrency && waitList.length > 0) {
            runNext();
        }
    } else if (currentQ.length == 0) {
        console.log("Done")

        var app = express();
        app.use( express.static(destinationDir)); //Serves resources from public folder
        var server = app.listen(5000);
        console.log("Server started in port 5000");
        //process.exit()
    }
}

compute.on('message', result => {
    //console.log(result);
    //console.log("<-" + result.url);

    var processed = removeFromQueue(result.url);
    processedList.push(processed);

    if (result.level < maxDepth) {
        result.links.forEach(link => {

            if (link != null) {
                var nextLink = "";
                try {
                    if (link.startsWith("http")) {
                        nextLink = link;
                    } else if (link.startsWith("/")) {
                        nextLink = domainWithProtocol + link;//.replace(/\/$/, "");
                    }
                    else {
                        nextLink = result.url + link.replace(/\/$/, "");
                    }
                } catch (error) {
                    console.log("URL: " + link + " -- " + error)
                    //console.log(result)
                }

                // only follows links within the same domain
                var nextLinkDomain = URL.parse(nextLink).hostname
                //   console.log(link + " ** " + nextLink + "___ " + nextLinkDomain + "=="+  domain)

                if (!checkProcessingStatus(nextLink) && nextLinkDomain == domain) {
                    waitList.push({
                        baseUrl: nextLink,
                        dir: destinationDir,
                        level: result.level
                    });
                }
            }
        });
    }
    runNext();
});

compute.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    process.exit()
});

function removeFromQueue(url) {
    for (var i = 0; i < currentQ.length; i++) {
        if (currentQ[i].baseUrl == url) {
            return currentQ.splice(i, 1)[0];
            //break;
        }
    }
}

function removeFromWaitingList(url) {
    for (var i = 0; i < waitList.length; i++) {
        if (waitList[i].baseUrl == url) {
            return waitList.splice(i, 1)[0];
            //break;
        }
    }
}

function checkProcessingStatus(url) {

    const processing = currentQ.find(task => task.baseUrl === url);
    const processed = processedList.find(task => task.baseUrl === url);

    if (processed != undefined || processing != undefined) {
        return true;
    } else {
        return false;
    }
}

async function removeDir() {
    var removedir = await deleteFolderRecursive(destinationDir);
    return removeDir;
}

async function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};