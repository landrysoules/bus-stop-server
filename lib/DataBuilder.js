var mandatoryVars = ['DB_URL', 'NODE_ENV'];

var checkConfig = function(){
    mandatoryVars.forEach(function(variable){
        if(!process.env[variable])
            throw new Error(variable + ' not present!');
    });
};

checkConfig();

var cheerio = require('cheerio');
var request = require('request');
//require('request-debug')(request);
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'busstop'});
var Q = require('q');
var nano = require('nano')(process.env.DB_URL);

exports.fetchLines = function(){
    var lines = [];
    var deferred = Q.defer();
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
                    }
        );
    });
};

var initDB = function(callback){
    log.info("DB init...");
    nano.db.create('bus_stop_dev', function(err, body){
        log.info('db.create callback !!');
        if(!err){
        log.info('database created');
        callback(body);
        }else{
        log.info(err);
        callback(err);
        }
    });
};

if (process.env.NODE_ENV === 'test') {
    module.exports._private = { initDB: initDB, checkConfig: checkConfig };
}

