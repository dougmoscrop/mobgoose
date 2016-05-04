'use strict';

const configure = require('./configure');

const connections = {};
const dbs = {};

process.on('exit', function() {
  Object.keys(connections).forEach((key) => connections[key].close());
});

module.exports = function(mongoose) {

  function ensureConnected(connection) {
    if (connection.readyState === mongoose.STATES.connected) {
      return Promise.resolve(connection);
    } else {
      return new Promise((resolve, reject) => {
        let called = false;

        connection.once('open', () => {
          if (called) {
            return;
          }

          called = true;
          resolve(connection);
        })

        connection.once('error', (err) => {
          if (called) {
            return;
          }

          called = true;
          reject(err);
        });
      });
    }
  }

  function loadModels(connection) {
    Object.keys(mongoose.models).forEach((modelKey) => {
      const model = mongoose.models[modelKey];

      connection.model(model.modelName, model.schema, model.collection.name);
    });
  }

  function useDb(key, database, connection) {
    let db = dbs[key];

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

  function mobgoose(opts) {
    var config = configure(opts);

    return Promise.race([
      connect(config.key, config.url, config.options)
        .then((connection) => {
          if (connection.db.databaseName === config.database) {
            return connection;
          }

          return useDb(config.url, config.database, connection);
        }),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`connecting to mongodb took too long`));
          }, config.timeout);
        })
      ]);
  }

  Object.defineProperty(mobgoose, 'connections', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: connections
  });

  return mobgoose;
};
