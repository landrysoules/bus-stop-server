describe("Parsing functionnality", function(){
    var requestStub;
    var sinon = require('sinon');
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
    var request = require ('request');
    var fs = require('fs');
    var expect = chai.expect
    beforeEach(function(){
        requestStub = sinon.stub(request, 'get');
    });
    it("get bus lines from page", function(done){
        var dataBuilder = require('../lib/DataBuilder');
        fs.readFile('./spec/input/lines_input.html', 'utf-8', function(error, data){
            if(error){
                console.log(error);
                throw error;
            }
            requestStub.yields(null, null, data);
            var lines = dataBuilder.fetchLines();
            console.log(lines);
            //expect(lines).to.have.all.keys(['B206', 'B220', '178807']);
            done();
            expect(lines).to.eventually.have.ownProperty('B206');
            //done();
        });
    });
});
