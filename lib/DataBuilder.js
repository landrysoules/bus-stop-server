var self = this
var mandatoryVars = ['COUCH_URL', 'DB_NAME', 'NODE_ENV']

var checkConfig = function() {
  mandatoryVars.forEach(function(variable) {
    if (!process.env[variable])
      throw new Error(variable + ' not present!')
  })
}

var designDoc = {
  'views': {
    'lines': {
      'map': 'function(doc) {emit([doc.line.name], doc.line.name);}'
    }
  }
}


var cheerio = require('cheerio')
var request = require('request')
  //require('request-debug')(request)
var bunyan = require('bunyan')
var log = bunyan.createLogger({
  src: true,
  name: 'busstop',
  level: 'debug'
})
var Q = require('q')
var nano = require('nano')(process.env.COUCH_URL)
var nanodb
var DB = process.env.DB_NAME

exports.initDB = function(callback) {
  log.info('DB init...')
  nano.db.get(DB, function(err, data) {
    if (err) {
      log.error('DB unknown: have to create it', err)
      nano.db.create(DB, function(err, body) {
        if (!err) {
          log.info('database created')
          createDesignDocument(function(err) {
            callback(err)
          })

        } else {
          log.info('Error while creating database', err)
          callback(err, body)
        }
      })
    } else {
      log.debug('database already present, we\'ll use it')
      callback(err, data)
    }
  })
}

exports.fetchLines = function(callback) {
  var lines = []
    //var deferred = Q.defer()
  request.get('http://www.ratp.fr/horaires/fr/ratp/bus', function(error, response, body) {
    // FIXME: For every line, define A & R stations
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
    log.debug('line', line)
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

exports.compare = function(line, bulkDocs, callback) {
  var hash = require('object-hash')
  line.code = hash(line)
  log.debug('Generated hash code for line ', line.name, line.code)
  nano
    .request({
      db: DB,
      path: '_design/main/_view/lines',
      qs: {
        key: line.name,
        include_docs: true
      }
    }, function(err, body) {
      if (err) {
        log.error('Error during doc request', err)
          // save(line, function(err, line) {
          //   if (err) {
          //     log.error('Error during doc save', err)
          //     callback(err)
          //   } else {
          //     log.debug('Doc successfully saved', body)
          //
          //   }
          // })
        callback(err)
      } else {
        if (body.rows.length === 0) {
          log.debug('No document yet for line', line.name)
          bulkDocs.push(line)
        } else {
          var existingLine = body.rows[0].value
          if (existingLine.code !== line.code) {
            bulkDocs.push(existingLine)
          }
        }
        callback()
      }

    })
}

exports.save = function(docs, callback) {
  nanodb = nano.db.use(DB)
  nanodb.bulk({
    docs: docs
  }, function(err, body) {
    callback(err, body)
  })
}

var createDesignDocument = function(callback) {
  nanodb = nano.db.use(DB)
  nanodb.insert(designDoc, '_design/main', function(err, body) {
    callback(err, body)
  })
}

if (process.env.NODE_ENV === 'test') {
  module.exports._private = {
    checkConfig: checkConfig,
    createDesignDocument: createDesignDocument
  }
}

checkConfig()
