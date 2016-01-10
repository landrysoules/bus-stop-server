var dataBuilder = require('lib/DataBuilder');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: 'index'
});

dataBuilder.initDB(function(err, success) {
  if (err) {
    log.error('Database could not be initialized. Program interrupted.', err);
  } else {
    dataBuilder.fetchLines(function(err, lines) {
      if (!err) {
        log.info(lines.length + ' lines fetched')
      }
    });
  }
});