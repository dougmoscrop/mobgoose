var Bluebird = require('bluebird'),
    bluebirdEvents = require('bluebird-events'),
    configure = require('./configure');

var connections = {};
var dbs = {};

process.on('exit', function() {
  Object.keys(connections).forEach(function(key) {
    connections[key].close();
  });
});

module.exports = function(mongoose) {

  function ensureConnected(connection) {
    if (connection.readyState === mongoose.STATES.connected) {
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

  function loadModels(connection) {
    Object.keys(mongoose.models).forEach(function(modelKey) {
      var model = mongoose.models[modelKey];

      connection.model(model.modelName, model.schema);
    });
  }

  function useDb(key, database, connection) {
    var db = dbs[key];

    if (!db) {
      db = dbs[key] = connection.useDb(database);
      loadModels(db);
    }

    return ensureConnected(db);
  }

  function connect(key, url, options) {
    var connection = connections[key];

    if (!connection) {
      connection = connections[key] = mongoose.createConnection(url, options);
      loadModels(connection);
    }

    return ensureConnected(connection);
  }

  function mobgoose(opts, done) {
    var config = configure(opts);

    return connect(config.key, config.url, config.options)
          .then(function(connection) {
            if (connection.db.databaseName === config.database) {
              return connection;
            }

            return useDb(config.url, config.database, connection);
          })
          .timeout(config.timeout);
  }

  Object.defineProperty(mobgoose, 'connections', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: connections
  });

  return mobgoose;
};
