var dbConnection = process.env.BUSSTOP_DB_CONN;

var cheerio = require('cheerio');
var request = require('request');
//require('request-debug')(request);
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'busstop'});
var Q = require('q');
exports.fetchLines = function(){
    var lines = [];
    var deferred = Q.defer();
    //FIXME: Find a solution to be able to both declare request outside of functions and be able to stub it in specs.
    request.get('http://www.ratp.fr/horaires/fr/ratp/bus', function(error, response, body){
        if(error){
            throw error;
        }
        var $ = cheerio.load(body);
        var content = $('#busLigneServiceForm_line').find('option').each(function(index,element){
            if(index>0){
                lines.push( {id: $(this).val(), name: $(this).text()});
            }
        });
    });
    log.info(lines);
    deferred.resolve(lines);
    return deferred.promise;
};




exports.fetchStations = function(lines, callback){
    var async = require('async');
    var sent = 1;
    var linesLength = lines.length;
    async.each(lines, function(line, done){
        request.post(
            {url: 'http://www.ratp.fr/horaires/fr/ratp/bus',
                form:{'busLigneServiceForm[line]': line.id,
                    'busLigneServiceForm[service]': 'PP',
                    'autocomplete_busLigneServiceForm[line]': line.name}},
                function(err,response,body){

                    if(err){
                        log.error(err);
                        callback(err);
                        return;
                    }
                    var $ = cheerio.load(body);
                    line.stations = [];
                    var select = $('#busArretDirectionForm_station').find('option').each(function(index,element){
                        line.stations.push({id: $(this).val(), name: $(this).text()});
                    });
                    console.log(line);
                    if(sent === linesLength)
                        callback(lines);
                    sent++;
                    done();
                })}
              );}







              exports.fetchStationsORG = function(lines, callback){
                  var async = require('async');
                  var http = require('http-request');
                  var FormData = require('form-data');
                  var sent = 1;
                  var linesLength = lines.length;
                  async.each(lines, function(line, done){
                      var form = new FormData();
                      form.append('busLigneServiceForm[line]', line.id );
                      form.append('busLigneServiceForm[service]', 'PP');
                      form.append('autocomplete_busLigneServiceForm[line]', line.name);
                      http.post({
                          url: 'http://www.ratp.fr/horaires/fr/ratp/bus',
                          reqBody: form
                      },( function(err, res){
                          if(err){
                              log.error(err);
                              callback(err);
                              return;
                          }
                          var $ = cheerio.load(res.buffer.toString());
                          line.stations = [];
                          var select = $('#busArretDirectionForm_station').find('option').each(function(index,element){
                              line.stations.push({id: $(this).val(), name: $(this).text()});
                          });
                          console.log(line);
                          if(sent === linesLength)
                              callback(lines);
                          sent++;
                          done();
                      })
                               );
                  });
              };



