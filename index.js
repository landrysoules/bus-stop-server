var dataBuilder = require('./lib/DataBuilder');
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
        dataBuilder.fetchStations(lines, function(err, lines) {
          if (err) {
            log.error('Error while fetching stations', err)
          } else {
            log.info('LINES:', lines)
            var async = require('async')
            var bulkDocs = []
            async.eachSeries(lines, function(line, callback) {
                dataBuilder.compare(line, bulkDocs, callback)
              }, function(err) {
                log.warn('BULK DOCS:', bulkDocs)
                dataBuilder.save(bulkDocs, function(err,success){
                  if(err){
                    log.error(err)
                  }else{
                    log.info('SUCCESS !')
                  }
                })
              })
              // TODO: fetch every line, generate hash, check if present in database, if not, write record and its hashcode.
              // If present, compare existing hash with new one, if different, update record
          }
        })
      }
    });
  }
});
