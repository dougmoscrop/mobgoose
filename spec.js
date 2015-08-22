var assert = require('assert'),
    Bluebird = require('bluebird'),
    mongoose = require('mongoose'),
    mobgoose = require('./');

var Foo = mongoose.model('Foo', new mongoose.Schema({}));

it('supports a simple conection string', function() {
  return mobgoose('mongodb://localhost:27017/test')
        .then(function(connection) {
          var model = connection.model('Foo');

          assert(model.db.name === 'test');
        });
});

it('can override database name of connection string', function() {
  return mobgoose({
    url: 'mongodb://localhost:27017/test',
    database: 'test2'
  }).then(function(connection) {
    var model = connection.model('Foo');

    assert(model.db.name === 'test2');
  });
});

describe('different databases on the same server', function(done) {
  var connection1, connection2;

  before(function() {
    return mobgoose({
      url: 'mongodb://localhost:27017',
      database: 'test1'
    }).then(function(connection) {
      connection1 = connection;
    });
  });

  before(function() {
    return mobgoose({
      url: 'mongodb://localhost:27017',
      database: 'test2'
    }).then(function(connection) {
      connection2 = connection;
    });
  });

  it('use one actual connection', function() {
    assert(Object.keys(mobgoose.connections).length === 1);
  });

  it('produce connections in the connected readyState', function() {
    assert(connection1.readyState === mongoose.STATES.connected);
    assert(connection2.readyState === mongoose.STATES.connected);
  });

  it('register their own models', function() {
    assert(connection1.model('Foo') !== undefined);
    assert(connection1.model('Foo').modelName === Foo.modelName);
    assert(connection1.model('Foo').db.name === 'test1');

    assert(connection2.model('Foo') !== undefined);
    assert(connection2.model('Foo').modelName === Foo.modelName);
    assert(connection2.model('Foo').db.name === 'test2');
  });
});

describe('multiple hosts', function() {
  it('work with a bunch of databases', function() {
    return Bluebird.map(['mongodb://localhost:27017', 'mongodb://127.0.0.1:27017'], function(url) {
      return Bluebird.map(['foo', 'bar', 'baz'], function(database) {
        return mobgoose({
          url: url,
          database: database
        });
      });
    }).then(function() {
      assert(Object.keys(mongoose.connections).length == 3); // 2 + global
    });
  });
});
