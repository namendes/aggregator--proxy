var express = require('express');
const config = require('../config.json');

var destinationDir =  destinationDir = config.site_origin.scrapper_options.directory;//__dirname+"/public";

var app = express();
app.use( express.static(destinationDir)); //Serves resources from public folder
var server = app.listen(5000);
console.log("Server started in port 5000");