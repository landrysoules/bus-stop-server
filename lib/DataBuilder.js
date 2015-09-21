var dbConnection = process.env.BUSSTOP_DB_CONN;

exports.fetchLines = function(){
    var request = require('request');
    var cheerio = require('cheerio');
    var lines = {};
    request.get('http://www.ratp.fr/horaires/fr/ratp/bus', function(error, response, body){
        if(error){
            throw error;
        }
        var $ = cheerio.load(body);
        var content = $('#busLigneServiceForm_line').find('option').each(function(index,element){
            if(index>0){
                lines[$(this).val()] = $(this).text();
            }
        });
    });
    return lines;
};

exports.fetchStations = function(lines){

};
