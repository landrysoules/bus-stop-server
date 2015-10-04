describe("Parsing functionnality", function(){
    var requestStub;
    var sinon = require('sinon');
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    //chai.use(chaiAsPromised);
    var request = require ('request');
    var fs = require('fs');
    var expect = chai.expect;
    var dataBuilder = require('../lib/DataBuilder');
    var bunyan = require('bunyan');
    var log = bunyan.createLogger({name: 'mocha-test'});

    beforeEach(function(){
        requestStub = sinon.stub(request, 'get');
        requestStubPost = sinon.stub(request, 'post');
    });

    afterEach(function(){
        requestStub.restore();
        requestStubPost.restore();
    });

    it("get bus lines from page", function(){
        var fakeHTMLContent = fs.readFileSync('./spec/input/lines_input.html', 'utf-8');
        requestStub.yields(null, null, fakeHTMLContent);
        dataBuilder.fetchLines().then(function(lines){
            expect(lines).to.have.property('name','206');
            expect(lines).to.have.property('id','B206');
            expect(lines).to.have.property('name', '220');
            expect(lines).to.have.property('name', 'Montbus');
        });
    });

    it("get stations for given lines", function(done){
        var fakeHTML206 = fs.readFileSync('./spec/input/stations_206.html', 'utf-8');
        var fakeHTML220 = fs.readFileSync('./spec/input/stations_220.html', 'utf-8');
        var lines = sinon.spy();
        requestStubPost.onFirstCall().yields(null, null, fakeHTML206);
        requestStubPost.onSecondCall().yields(null, null, fakeHTML220);
        dataBuilder.fetchStations([{id: 'B206', name: '206'}, {id: 'B220', name: '220'}], function(lines){

            lines.forEach(function(line){

                log.info('-------------- LINE +++++++++++++++++++++', line);
            });
            log.info(lines[0].stations[0]);
            expect(lines.length).to.equals(2);
            done();
        });

    });

    //it("keep running if a line is in error", function(){
    //fail('Not implemented yet.');
    //});
});
