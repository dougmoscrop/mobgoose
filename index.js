var Bluebird = require('bluebird'),
    bluebirdEvents = require('bluebird-events'),
    mongoose = require('mongoose'),
    mongodbUri = require('mongodb-uri');

var connections = {};
var dbs = {};

function isConnected(connection) {
  return connection.readyState === mongoose.STATES.connected;
}

process.on('exit', function() {
  Object.keys(connections).forEach(function(key) {
    var connection = connections[key];
    if (isConnected(connection)) {
      connection.close();
    }
  });
});

function useDb(key, database, connection) {
  var db = dbs[key];

  if (!db) {
    db = dbs[key] = connection.useDb(database);

    Object.keys(mongoose.models).forEach(function(modelKey) {
      var model = mongoose.models[modelKey];

      db.model(model.modelName, model.schema);
    });
  }

  if (isConnected(db)) {
    return Bluebird.resolve(db);
  } else {
    return bluebirdEvents(db, {
      resolve: 'open',
      reject: 'error'
    }).then(function() {
      return connection;
    });
  }
}

function connect(key, url, options) {
  var connection = connections[key];

  if (!connection) {
    connection = connections[key] = mongoose.createConnection(url, options);
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

  uri.database = config.database = config.database || uri.database;

  config.url = mongodbUri.format(uri);

  delete uri.database;

  config.key = mongodbUri.format(uri);

  return config;
}

module.exports = function(opts, done) {
  var config = configure(opts);

  return connect(config.key, config.url, config.options)
        .then(function(connection) {
          return useDb(config.url, config.database, connection);
        })
        .timeout(config.timeout);
};

Object.defineProperty(module.exports, 'connections', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: connections
});
