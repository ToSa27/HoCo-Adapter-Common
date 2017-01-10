var fs = require('fs');
var merge = require('merge');

const commonConfigFile = __dirname + "/config.json";
const configFile = process.cwd() + "/config.json";
module.exports = merge(JSON.parse(fs.readFileSync(commonConfigFile)), JSON.parse(fs.readFileSync(configFile)));
