var dataBuilder = require('./DataBuilder');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'index'});
//var lines = dataBuilder.fetchStations([{id: 'B206', name: '206'}, {id: 'B220', name: '220'}]);
//var Q = require('q');
//Q.fcall(dataBuilder.fetchStations([{id: 'B206', name: '206'}, {id: 'B220', name: '220'}])).then(function(val){
dataBuilder.fetchStations([{id: 'B206', name: '206'}, {id: 'B220', name: '220'}, {id: 'B2453435420', name: '220'}], function(lines){
    lines.forEach(function(line){
        log.info("--line:", line);
    });
});

