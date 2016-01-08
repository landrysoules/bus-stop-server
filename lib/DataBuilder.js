var self = this
var mandatoryVars = ['DB_URL', 'NODE_ENV']

var checkConfig = function() {
  mandatoryVars.forEach(function(variable) {
    if (!process.env[variable])
      throw new Error(variable + ' not present!')
  })
}


var cheerio = require('cheerio')
var request = require('request')
  //require('request-debug')(request)
var bunyan = require('bunyan')
var log = bunyan.createLogger({
  name: 'busstop',
  level: 'debug'
})
var Q = require('q')
var nano = require('nano')(process.env.DB_URL)
var nanodb
var tmpDB = 'bus_stop_tmp'

exports.initDB = function(callback) {
  log.info('DB init...')
  log.warn('nano', nano)
  nano.db.get(tmpDB, function(err, data) {
    if (data) {
      log.debug('tmp database already exists: we have to delete it before create it again')
      nano.db.destroy(tmpDB, function(err) {
        if (err) {
          log.error(err)
        } else {
          self.initDB(callback)
        }
      })
    }
    log.info('data', data)
    if (err) {
      // tmp database doesn't exist, we have to create it:
      nano.db.create(tmpDB, function(err, body) {
        log.info('db.create callback !!')
        if (!err) {
          log.info('database created')
          callback(null, body)
        } else {
          log.info(err)
          callback(err, body)
        }
      })
    }
  })
}

exports.fetchLines = function(callback) {
  var lines = []
    //var deferred = Q.defer()
  request.get('http://www.ratp.fr/horaires/fr/ratp/bus', function(error, response, body) {
    if (error) {
      callback(error)
    } else {
      var $ = cheerio.load(body)
      var content = $('#busLigneServiceForm_line').find('option').each(function(index, element) {
        if (index > 0) {
          lines.push({
            id: $(this).val(),
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
    request.post({
        url: 'http://www.ratp.fr/horaires/fr/ratp/bus',
        form: {
          'busLigneServiceForm[line]': line.id,
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
        var select = $('#busArretDirectionForm_station').find('option').each(function(index, element) {
          line.stations.push({
            id: $(this).val(),
            name: $(this).text()
          })
        })
        console.log(line)
        if (sent === linesLength)
          callback(null, lines)
        sent++
        done()
      }
    )
  })
}

var createDesignDocument = function(callback) {
  nanodb = nano.db.use(tmpDB)
  nanodb.insert({
    docName: 'pop',
    docContent: 'content'
  }, null, function(err, body) {
    if (!err) {
      log.info('Design doc created')
      log.info('doc body', body)
      callback(null, body)
    } else {
      log.info(err)
      callback(err, body)
    }
  })
}

if (process.env.NODE_ENV === 'test') {
  module.exports._private = {
    checkConfig: checkConfig,
    createDesignDocument: createDesignDocument
  }
}

checkConfig()
