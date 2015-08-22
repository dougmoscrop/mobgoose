var Bluebird = require('bluebird'),
    bluebirdEvents = require('bluebird-events'),
    mongoose = require('mongoose'),
    mongodbUri = require('mongodb-uri');

var connections = {};

function isConnected(connection) {
  return connection.readyState === mongoose.STATES.connected;
}

function connect(url, options) {
  var connection = connections[url];

  if (!connection) {
    connection = connections[url] = mongoose.createConnection(url, options);

    connection.on('close', function() {
      delete connections[url];
    });

    process.on('exit', function() {
      if (isConnected(connection)) {
        connection.close();
      }
    });
  }

  if (isConnected(connection)) {
    return Bluebird.resolve(connection);
  } else {
    return bluebirdEvents(connection, {
      resolve: 'open',
      reject: 'error'
    }).then(function() {
      return connection;
    });
  }
}

function configure(opts) {
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

  delete uri.database;

  config.url = mongodbUri.format(uri);

  return config;
}

module.exports = function(opts, done) {
  var config = configure(opts);

  return connect(config.url, config.options)
        .then(function(connection) {
          var db = connection.useDb(config.database);

          Object.keys(mongoose.models).forEach(function(key) {
            var model = mongoose.models[key];

            db.model(model.modelName, model.schema);
          });

          return db;
        })
        .timeout(config.timeout);
};

Object.defineProperty(module.exports, 'connections', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: connections
});
