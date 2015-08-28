var mongodbUri = require('mongodb-uri');

module.exports = function configure(opts) {
  var config = opts || {};

  if (typeof config === 'string') {
    config = {
      url: config
    };
  }

  config.options = config.options || {db: {w: 'majority'}};
  config.timeout = config.timeout || 5000;

  var uri = mongodbUri.parse(config.url);

  config.database = config.database || uri.database;

  uri.database = config.database;
  uri.username = config.username || uri.username;
  uri.password = config.password || uri.password;

  config.url = mongodbUri.format(uri);

  delete uri.database;

  config.key = mongodbUri.format(uri);

  return config;
};
