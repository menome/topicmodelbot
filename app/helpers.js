const fs = require('fs');

module.exports = {};

let fppConfig;
module.exports.getNextRoutingKey = function(status, bot) {
  if(!fppConfig) {
    try {
      fppConfig = JSON.parse(fs.readFileSync('./config/fpp-config.json', 'utf8'));
    }
    catch(err) {
      console.log("Could not find central FPP config file. Defaulting.")
    }
  }

  if(fppConfig && fppConfig[process.env.npm_package_name] && fppConfig[process.env.npm_package_name][status]) {
    return fppConfig[process.env.npm_package_name][status];
  }

  var downstream_actions = bot.config.get('downstream_actions');
  var newRoute = downstream_actions[status];

  return newRoute;
}