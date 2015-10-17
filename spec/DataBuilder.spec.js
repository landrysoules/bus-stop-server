describe("DataBuilder", function(){
    var requestStub;
    var sinon = require('sinon');
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    //chai.use(chaiAsPromised);
    var request = require ('request');
    var fs = require('fs');
    var expect = chai.expect;
    var bunyan = require('bunyan');
    var log = bunyan.createLogger({name: 'mocha-test'});
    var dataBuilder;
    var nano;
    var DBUrl = process.env.DB_URL.slice(0);

    beforeEach(function(){
        dataBuilder = require('../lib/DataBuilder');
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
            expect(lines[0].stations[0].id).to.equals('206_216_217');
            expect(lines[0].stations[lines[0].stations.length-1].id).to.equals('206_303_304');
            expect(lines[1].stations[0].id).to.equals('220_44_64');
            expect(lines[1].stations[lines[1].stations.length-1].id).to.equals('220_16_91');
            done();
        });

    });

    describe("Database interaction", function(){
        it("create temp database", function(done){

            var rewire = require('rewire');
            dataBuilder = rewire('../lib/DataBuilder.js');
            nano = {db: {create: function(dbName, callback){
                callback(null, 'fake message');
            }}};
            dataBuilder.__set__('nano', nano);
            log.info(process.env.NODE_ENV);
            dataBuilder._private.initDB(function(callback){
                done();
                log.info('callback:', callback);
                expect(callback).to.equal('fake message');
            });
        });

        it("create design documents");

        it("save lines to database");

        it("remove database");

        it("rename temp database");
    });

    describe("Configuration", function(){

        beforeEach(function(){
            delete process.env.DB_URL;
        });

        afterEach(function(){
            process.env.DB_URL = DBUrl;
        });

        it("throws error if a config variable is missing", function(){
            expect(function(){
                dataBuilder._private.checkConfig();
            }).to.throw(Error);
        });
    });

    //it("keep running if a line is in error", function(){
    //fail('Not implemented yet.');
    //});
});
