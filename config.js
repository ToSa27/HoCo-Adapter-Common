var fs = require('fs');

const configFile = process.cwd() + "/config.json";
module.exports = JSON.parse(fs.readFileSync(configFile));
