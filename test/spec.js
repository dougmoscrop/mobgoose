'use strict';

var assert = require('assert'),
    mongoose = require('mongoose'),
    mobgoose = require('../')(mongoose);

var Foo = mongoose.model('Foo', new mongoose.Schema({}), 'foo_collection_name');

it('accepts configuration without url', function() {
  return mobgoose({ host: 'localhost', database: 'test123' })
    .then(function(connection) {
      var model = connection.model('Foo');

      assert(model.db.name === 'test123');
    });
});

it('supports a simple conection string', function() {
  return mobgoose('mongodb://localhost:27017/test')
    .then(function(connection) {
      var model = connection.model('Foo');

      assert(model.db.name === 'test');
    });
});

it('keeps the model collection name', function() {
  return mobgoose('mongodb://localhost:27017/test')
    .then(function(connection) {
      var model = connection.model('Foo');

      assert(model.collection.name === 'foo_collection_name');
    });
});

describe('different databases on the same server', function(done) {
  var connection1, connection2;

  before(function() {
    return mobgoose({
      host: 'localhost',
      database: 'test1'
    })
    .then(function(connection) {
      connection1 = connection;
    });
  });

  before(function() {
    return mobgoose({
      host: 'localhost',
      database: 'test2'
    })
    .then(function(connection) {
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
    return Promise.all(['localhost', '127.0.0.1'].map((host) => {
      return Promise.all(['foo', 'bar', 'baz'].map((database) => {
        return mobgoose({
          host: host,
          database: database
        });
      }));
    }))
    .then(function() {
      assert(Object.keys(mobgoose.connections).length == 2);
    });
  });
});
