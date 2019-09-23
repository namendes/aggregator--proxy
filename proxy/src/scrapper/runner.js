
//const puppeteer = require('puppeteer'); // v 1.1.0
const { URL } = require('url');
const fse = require('fs-extra'); // v 5.0.0
const fs = require('fs'); // v 5.0.0
const path = require('path');
const puppeteer = require("puppeteer-extra")
const logger = require('../utils/logger.js');
const fileProcessor = require('../processors/file-processor.js');

const log = logger.getLogger("runner");
var config;

async function start(urlToFetch, directory, level) {
    const baseUrl = new URL(urlToFetch);
    const browser = await puppeteer.launch({timeout: 120000, headless: config.site_origin.scrapper_options.headless })
    const page = await browser.newPage();

    page.on('response', async (response) => {

        const url = new URL(response.url());
        const status = response.status()
        const contentType = response.headers()['content-type'];
        const nextLinkDomain = url.hostname;

        if (nextLinkDomain === baseUrl.hostname) {
            // console.log(status)
            if (status < 300) {
                let filePath = path.resolve(`./${directory}${url.pathname}`);
                //console.log(url.href);
                var validContentType = contentType != null ? contentType.includes('text/html') : false;
                const buffer = Buffer.from(await response.buffer(), 'utf8');

                if (path.extname(url.pathname).trim() === '' && validContentType) {
                    filePath = `${filePath}/index.html`;
                    //console.log("****" + filePath);
                    log.log({
                        level: 'info',
                        message: 'Saving index file: ',
                        file: filePath
                    });
                } else {
                    //console.log("####" + url.pathname);
                    log.log({
                        level: 'debug',
                        message: 'Saving asset: ',
                        urlPath: url.pathname
                    });
                }
                var file = path.basename(filePath);
                var dir = path.dirname(filePath);
                var decodedFilePath = dir + "/" + decodeURIComponent(file)

                //await fse.outputFile(dir +"/"+file, await response.buffer(), null, callback);
                //fse.writeFileSync(filePath, buffer).catch((err) => console.log('caught it'));;  
                var exists = await fs.existsSync(decodedFilePath);
                if (!exists) {
                    log.log({
                        level: 'debug',
                        message: 'Saving new file',
                        decodedFilePath: decodedFilePath
                    });
                    fse.outputFileSync(decodedFilePath, buffer, { flag: "w+" }, callback);
                    fileProcessor.transform(config, url, contentType, decodedFilePath);
                } else {
                    var stats = fs.statSync(decodedFilePath);
                    if (stats.size === 0) {
                        log.log({
                            level: 'warn',
                            message: 'Overwrites file because previous was empty:',
                            decodedFilePath: decodedFilePath
                        });

                        fse.outputFileSync(decodedFilePath, buffer, { flag: "w+" }, callback);
                        fileProcessor.transform(config, url, contentType, decodedFilePath);
                    } else {
                        log.log({
                            level: 'debug',
                            message: 'File already exists, not overwriting:',
                            decodedFilePath: decodedFilePath
                        });
                    }
                }
            }
        }
    });

    function callback(err) {
        if (err) {
            console.error("error : " + err);
        }
    }

    try {
        await page.goto(urlToFetch, {
            waitUntil: 'networkidle2'
        });
    } catch (error) {
        log.log({
            level: 'error',
            message: 'Unable to load Page: ',
            urlToFetch: urlToFetch,
            error: error
        });
    }
    

    setTimeout(async () => {
        await browser.close();
    }, 10000 * (Math.floor(Math.random() * 6) + 1));

    const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
            .map(link => (link.getAttribute('href')))
        // .map((link,level) => ({
        //     level: level ,
        //     link: link.getAttribute('href')
        // }))
    )
    return {
        level: level + 1,
        url: urlToFetch,
        links: links
    };
}

process.on('message', async message => {
    config = message.config;
    var job = message.job;
    var links = await start(job.baseUrl, job.dir, job.level).then((result) => {
        return result;
    })
    process.send(links);
});

