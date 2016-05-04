'use strict';

const mongodbUri = require('mongodb-uri');

module.exports = function configure(opts) {
  opts = opts || {};

  const config = typeof opts === 'string' ? mongodbUri.parse(opts) : opts;

  if (config.host) {
    config.hosts = [{
      host: config.host,
      port: config.port || 27017
    }];
    delete config.host;
  }

  const timeout = config.timeout || 5000;
  const options = config.options || { db: { w: 'majority' } };

  const url = mongodbUri.format(config);
  const database = config.database;

  delete config.database;

  const key = mongodbUri.format(config);

  return { database, url, key, options, timeout };
};
