'use strict'

require('dotenv-safe').load();
var dataBuilder = require('./lib/DataBuilder');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: 'index',
  level: process.env.LOG_LEVEL,
  src: true
});
var Q = require('q')

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
            var newDocs = []
            var updateDocs = []
            async.eachSeries(lines, function(line, callback) {
              return dataBuilder.compare(line, newDocs, updateDocs, callback)
            }, function(err) {
              if (err) {
                log.error('Error during compare', err)
              } else {
                log.warn('NEW DOCS:', newDocs.length)
                log.warn('UPDATE DOCS:', updateDocs.length)
                var promises = []
                if (newDocs.length > 0) {
                  promises.push(dataBuilder.save(newDocs))
                }
                if (updateDocs.length > 0) {
                  promises.push(dataBuilder.update(updateDocs))
                  log.warn('Updated docs', updateDocs)
                  log.warn(JSON.stringify(updateDocs))
                }
                if (promises.length === 0) {
                  log.info('Nothing to insert nor update')
                  process.exit(0)
                } else {
                  Q.allSettled(promises)
                    .then(function(rs) {
                      log.warn(rs)
                      rs.forEach(function(result) {
                          if (result.insertedCount) {
                            log.info(result.insertedCount + ' docs inserted !')
                          } else {
                            if (result.updatedCount) {
                              log.info(result.updatedCount + ' docs updated !')
                            }
                          }

                        })
                    })
                    .catch(function(err) {
                      log.error(err)
                    })
                    .finally(function() {
                      process.exit(0)
                    })
                }
              }
            })
          }
        })
      }
    });
  }
});
