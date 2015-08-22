var Bluebird = require('bluebird'),
    bluebirdEvents = require('bluebird-events'),
    mongoose = require('mongoose');

var connections = {};

function isConnected(connection) {
    return connection.readyState === mongoose.STATES.connected;
}

function connect(url, connectionOptions) {
    var connection = connections[url];

    if (!connection) {
        connection = connections[url] = mongoose.createConnection(url, connectionOptions);

        connection.on('close', function() {
            delete connections[url];
        });

        process.on('exit', function() {
            if (isConnected(connection)) {
                connection.close();
            }
        });
    }
    
    return connection;
}

module.exports = function(config, done) {
    config = config || {};
    
    var connectionOptions = config.options || { db: { w: 'majority' } };
    var connectionTimeout = config.timeout || 5000;
    
    var connection = connect(config.url, connectionOptions);
    
    if (config.database) {
        connection = connection.useDb(config.database);
    }

    Object.keys(mongoose.models).forEach(function(key) {
        var model = mongoose.models[key];

        connection.model(model.modelName, model.schema);
    });

    var promise;
    
    if (isConnected(connection)) {
        promise = Bluebird.resolve(connection);
    } else {
        promise = bluebirdEvents(connection, {
            resolve: 'open',
            reject: 'error'
        })
        .then(function() {
            return connection;
        })
        .timeout(connectionTimeout);
    }
    
    if (typeof done === 'function') {
        promise.nodeify(done);
    } else {
        return promise;
    }
};
