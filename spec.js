var assert = require('assert'),
    mongoose = require('mongoose'),
    mobgoose = require('./');

var model = mongoose.model('Foo', new mongoose.Schema({}));

describe('connecting to two different databases on the same server', function(done) {
    var connection1, connection2;
    
    before(function(done) {
        mobgoose({
            url: 'mongodb://localhost:27017',
            database: 'test'
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

        assert(connection2.model('Foo') !== undefined);
        assert(connection2.model('Foo').modelName === 'Foo');
    });
});
