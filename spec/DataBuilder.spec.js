describe('DataBuilder', function() {
  var requestStub, requestStubPost
  var sinon = require('sinon')
  var chai = require('chai')
  var request = require('request')
  var fs = require('fs')
  var expect = chai.expect
  chai.should()
  chai.use(require('chai-things'))
  var bunyan = require('bunyan')
  var log = bunyan.createLogger({
    name: 'mocha-test',
    src: true,
    level: process.env.LOG_LEVEL
  });
  var rewire = require('rewire')
  var dataBuilder = rewire('../lib/DataBuilder')


  beforeEach(function() {
    // dataBuilder = rewire('../lib/DataBuilder')
    requestStub = sinon.stub(request, 'get')
    requestStubPost = sinon.stub(request, 'post')
  });

  afterEach(function() {
    requestStub.restore()
    requestStubPost.restore()
  });

  describe('DB initialization', function() {

  })

  it('get bus lines from page', function(done) {
    var fakeHTMLContent = fs.readFileSync('./spec/input/lines_input.html', 'utf-8');
    requestStub.yields(null, null, fakeHTMLContent);
    log.info('request: ', request);
    dataBuilder.fetchLines(function(err, lines) {
      done();
      log.warn('LINES!!!!', lines)
      lines.should.include.something.that.deep.equals({
        _id: 'B206',
        name: '206'
      });
      lines.should.include.something.that.deep.equals({
        _id: 'B220',
        name: '220'
      });
    });
  });

  it('get stations for given lines', function(done) {
    var fakeHTML206 = fs.readFileSync('./spec/input/stations_206.html', 'utf-8')
    var fakeHTML220 = fs.readFileSync('./spec/input/stations_220.html', 'utf-8')
    var lines = sinon.spy()
    requestStubPost.onFirstCall().yields(null, null, fakeHTML206)
    requestStubPost.onSecondCall().yields(null, null, fakeHTML220)
    dataBuilder.fetchStations([{
      id: 'B206',
      name: '206'
    }, {
      id: 'B220',
      name: '220'
    }], function(err, lines) {

      lines.forEach(function(line) {

        log.info('-------------- LINE +++++++++++++++++++++', line)
      })
      log.info(lines[0].stations[0])
      expect(lines.length).to.equals(2)
      expect(lines[0].stations[0].id).to.equals('206_216_217')
      expect(lines[0].stations[lines[0].stations.length - 1].id).to.equals('206_303_304')
      expect(lines[1].stations[0].id).to.equals('220_44_64')
      expect(lines[1].stations[lines[1].stations.length - 1].id).to.equals('220_16_91')
      done()
    })

  })

  describe('Process every line', function() {
    it.skip('Line isn\'t present in database', function(done) {
      var stub = sinon.stub(require('nano')('http://fake.db:5984'), 'request', function(callback) {
        return ('err')
      })

      dataBuilder.compare({
        line: {
          name: '220',
          stations: {
            '220_43': 'Jean Kiffer'
          }
        }
      }, function(err, body) {
        if (err) {
          log.error(err)
        } else {
          log.debug(body)
        }
      })
      done()
    })
    it('Line is already present and hashcode is the same')
    it('Line is already present and hashcode is different')
  })

  describe('Document comparison', function() {

    it('generate hashcode for a document')

    it('if hash temp different from hash regular, replace regular document')

    it('if hash temp eq regular, do nothing')
  })

})
