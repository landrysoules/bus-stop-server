'use strict'

var cheerio = require('cheerio')
var request = require('request')
var bunyan = require('bunyan')
var log = bunyan.createLogger({
  src: true,
  name: 'busstop',
  level: process.env.LOG_LEVEL
})
var MongoClient = require('mongodb').MongoClient
var dbURL = process.env.DB_URL
var db, coll
var Q = require('q')

exports.initDB = function(callback) {
  MongoClient.connect(dbURL, function(err, database) {
    if (err) {
      callback(err)
    } else {
      log.debug('Connected correctly to server')
      db = database
      coll = db.collection('lines')
      callback()
    }
  })
}

exports.fetchLines = function(callback) {
  var lines = []
  request.get('http://www.ratp.fr/horaires/fr/ratp/bus', function(error, response, body) {
    if (error) {
      callback(error)
    } else {
      var $ = cheerio.load(body)
      var content = $('#busLigneServiceForm_line').find('option').each(function(index, element) {
        if (index > 0) {
          lines.push({
            _id: $(this).val(),
            name: $(this).text()
          })
        }
      })
      log.info(lines)
      callback(null, lines)
    }
  })
}

exports.fetchStations = function(lines, callback) {
  var async = require('async')
  var sent = 1
  var linesLength = lines.length
  async.each(lines, function(line, done) {
    log.debug('line', line)
    request
      .post({
          url: 'http://www.ratp.fr/horaires/fr/ratp/bus',
          form: {
            'busLigneServiceForm[line]': line._id,
            'busLigneServiceForm[service]': 'PP',
            'autocomplete_busLigneServiceForm[line]': line.name
          }
        },
        function(err, response, body) {

          if (err) {
            log.error(err)
            callback(err)
            return
          }
          var $ = cheerio.load(body)
          line.stations = []
          $('#busArretDirectionForm_station')
            .find('option')
            .each(function(index, element) {
              line.stations.push({
                id: $(this).val(),
                name: $(this).text()
              })
            })
            // For every line, define A & R stations
          $('#busArretDirectionForm_direction')
            .find('option')
            .each(function(index, element) {
              if ($(this).attr('value') === 'A') {
                line.A = $(this).text()
              } else {
                if ($(this).attr('value') === 'R') {
                  line.R = $(this).text()
                }
              }
            })

          log.debug(line)
          if (sent === linesLength) {
            callback(null, lines)
          }
          sent++
          done()
        }
      )
  })
}

exports.compare = function(line, newDocs, updateDocs, callback) {
  var hash = require('object-hash')
  line.code = hash(line)
  log.debug('Generated hash code for line ', line.name, line.code)
  coll
    .find({
      _id: line._id
    })
    .limit(1)
    .next(function(err, doc) {
      if (err) {
        log.error('Error during doc request', err)
        callback(err)
      } else {
        if (!doc) {
          log.debug('No document yet for line', line.name)
          newDocs.push(line)
        } else {
          var existingLine = doc
          if (existingLine.code !== line.code) {
            log.info('line ', line.name, 'updated !')
            line._id = existingLine._id
            updateDocs.push(line)
          } else {
            log.info('No change for line', line.name)
          }
        }
        callback()
      }
    })
}

exports.save = function(docs) {
  return coll.insertMany(docs)
}

exports.update = function(docs) {
  var promises = []
  docs.forEach(function(doc) {
    promises.push(coll.save(doc))
  })
  return Q.all(promises)
}
