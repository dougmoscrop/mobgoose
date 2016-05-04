# mobgoose

[![Circle CI](https://circleci.com/gh/dougmoscrop/mobgoose.svg?style=svg)](https://circleci.com/gh/dougmoscrop/mobgoose)

mobgoose will reuse connections to the same *url* and `useDb(database)` for you.
If you are using database-per-tenant multi-tenancy this saves on open connections to the server.

## Usage

You need to have `mongoose` as a dependency.

```javascript
var mongoose = require('mongoose'),
var mobgoose = require('mobgoose')(mongoose);

// connect via string
mobgoose('mongodb://localhost:27017/my_db');

// connect via options
mobgoose({
  host: 'localhost',
  database: 'my_other_db'
});
```

These two calls result in a single actual connection to *localhost:27017* and each call returns a promise, which is resolved with a 'virtual' connection to *my_db* and *my_other_db* respectively.

So you can `.then(function(connection) { /* .. */ })` and don't forget, you need to use `connection.model(modelName)` to get a model that makes use of said connection, you can't just use a model via `require` -- that uses the global connection (never established here).
