describe("DataBuilder", function(){
    var requestStub;
    var sinon = require('sinon');
    var chai = require('chai');
    var request = require ('request');
    var fs = require('fs');
    var expect = chai.expect;
    chai.should();
    chai.use(require('chai-things'));
    var bunyan = require('bunyan');
    var log = bunyan.createLogger({name: 'mocha-test'});
    var dataBuilder;
    var nano;
    var rewire = require('rewire');
    var DBUrl = process.env.DB_URL.slice(0);
    var revertRequest;

    beforeEach(function(){
        dataBuilder = rewire('../lib/DataBuilder');
        requestStub = sinon.stub(request, 'get');
        requestStubPost = sinon.stub(request, 'post');
    });

    afterEach(function(){
        requestStub.restore();
        requestStubPost.restore();
    });

    it("get bus lines from page", function(done){
        var fakeHTMLContent = fs.readFileSync('./spec/input/lines_input.html', 'utf-8');
        requestStub.yields(null, null, fakeHTMLContent);
        log.info('request: ', request);
        dataBuilder.fetchLines(function(err, lines){
        done();
            log.warn('MENDOZA!!!!', lines);
            lines.should.include.something.that.deep.equals({id: 'B206', name:'206'});
            lines.should.include.something.that.deep.equals({id: 'B220', name:'220'});
        });
    });

    it("get stations for given lines", function(done){
        var fakeHTML206 = fs.readFileSync('./spec/input/stations_206.html', 'utf-8');
        var fakeHTML220 = fs.readFileSync('./spec/input/stations_220.html', 'utf-8');
        var lines = sinon.spy();
        requestStubPost.onFirstCall().yields(null, null, fakeHTML206);
        requestStubPost.onSecondCall().yields(null, null, fakeHTML220);
        dataBuilder.fetchStations([{id: 'B206', name: '206'}, {id: 'B220', name: '220'}], function(err, lines){

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
        var spyCreate = sinon.spy();
        var spyUse = sinon.spy();
        //var rewire = require('rewire');
            var nanodb = {insert: function(doc, options, callback){
                callback(null, 'fake body');
            }};
        beforeEach(function(){
            //dataBuilder = rewire('../lib/DataBuilder.js');
            nano = {
                db: {
                    create: function(dbName, callback){
                        callback(null, 'fake body');
                    },
                    use: function(){
                        return nanodb;
                    }
                }
            };

            dataBuilder.__set__('nano', nano);
            dataBuilder.__set__('nanodb', nanodb);
        });
        it("create temp database and use it", function(done){
            log.info(process.env.NODE_ENV);
            dataBuilder.initDB(function(err, callback){
                log.info('callback:', callback);
                //expect(callback).to.equal('fake message');
                expect(callback).to.equal('fake body');
                done();
            });
        });

        it("create design documents", function(done){
            dataBuilder._private.createDesignDocument(function(err, callback2){
                //expect(spyUse.called).to.be.true;
                expect(callback2).to.equal('fake body');
                log.info('CALLBACK:', callback2);
                done();
            });
        });

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
