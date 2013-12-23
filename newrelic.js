var config = require('./config');

exports.config = {
  app_name : ['cloudbucket'],
  license_key : config.newrelic.key,
  logging : {
    level : 'info'
  }
};
