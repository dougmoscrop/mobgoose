var assert = require('assert'),
    mongoose = require('mongoose'),
    mobgoose = require('./');

var model = mongoose.model('Foo', new mongoose.Schema({}));

it('can works via callback', function(done) {
    mobgoose({
        url: 'mongodb://localhost:27017',
        database: 'test'
    }, done);
});

it('works via promise', function() {
    return mobgoose({
        url: 'mongodb://localhost:27017',
        database: 'test'
    });
});

it('supports a direct conection string', function() {
    return mobgoose('mongodb://localhost:27017/test')
        .then(function(connection) {
            var model = connection.model('Foo');
        
            assert(model.db.name === 'test');
        });
});

describe('connecting to two different databases on the same server', function(done) {
    var connection1, connection2;
    
    before(function(done) {
        mobgoose({
            url: 'mongodb://localhost:27017',
            database: 'test1'
        }, function(err, connection) {
            if (err) {
                done(err);
            } else {
                connection1 = connection;
                done();
            }
        });
    });
    
    before(function(done) {
        mobgoose({
            url: 'mongodb://localhost:27017',
            database: 'test2'
        }, function(err, connection) {
            if (err) {
                done(err);
            } else {
                connection2 = connection;
                done();
            }
        });
    });
    
    it('produces a connection in the correct readyState', function() {
        assert(connection1.readyState === mongoose.STATES.connected);
        assert(connection2.readyState === mongoose.STATES.connected);
    });
    
    it('registers a model defined before the connection was created (globally)', function() {
        assert(connection1.model('Foo') !== undefined);
        assert(connection1.model('Foo').modelName === 'Foo');
        assert(connection1.model('Foo').db.name === 'test1');

        assert(connection2.model('Foo') !== undefined);
        assert(connection2.model('Foo').modelName === 'Foo');
        assert(connection2.model('Foo').db.name === 'test2');
    });
});
