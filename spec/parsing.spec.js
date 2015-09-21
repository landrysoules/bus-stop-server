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
    beforeEach(function(){
        requestStub = sinon.stub(request, 'get');
    });
    afterEach(function(){
        requestStub.restore();
    });
    it("get bus lines from page", function(){
        var fakeHTMLContent = fs.readFileSync('./spec/input/lines_input.html', 'utf-8');
        requestStub.yields(null, null, fakeHTMLContent);
        var lines = dataBuilder.fetchLines();
        expect(lines).to.contain.all.keys(['B206', 'B220', '178807']);
    });

    it("get stations for given lines", function(){
        var stations = dataBuilder.fetchStations(['B206', 'B220']);
        expect(stations).to.contain.all.keys(['206_216_217', '206_224_225', '220_44_64', '220_43_66']);
    });

    it("keep running if a line is in error", function(){
        fail('Not implemented yet.');
    });
});
