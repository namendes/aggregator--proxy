const env = require('dotenv').config({ path: './development.env'})
const scrapperApp = require('./scripts/scrapper.js');
const logger = require('./utils/logger.js');
const config = require('./config.json');

const json_indentation = 4;

// global.site_source = site_source;
// global.processors = processors;
// global.general = general;

// const log = logger.getLogger("loader");

// log.log({
//     level: 'debug',
//     message: 'Config loaded: ',
//     general:general,
//     site_source: site_source,
//     processors:processors,
// });

// const general = config.general;
// const site_source = config.site_source;
// const processors = config.processors;
// log global.gConfig
// console.log(`global.general: ${JSON.stringify(global.general, undefined, json_indentation)}`);
// console.log(`global.site_source: ${JSON.stringify(global.site_source, undefined, json_indentation)}`);
// console.log(`global.processors: ${JSON.stringify(global.processors, undefined, json_indentation)}`);

scrapperApp.run(config);
