const DictionaryRemoteDemo = require('./DictionaryRemoteDemo');
const {callAsync} = require('./helpers/async');
const chai = require('chai');  chai.should();
const expect = chai.expect;
const nock = require('nock');


describe('DictionaryRemoteDemo.js', function() {

  var urlBase = 'http://test';
  var dict = new DictionaryRemoteDemo({base: urlBase});


  // We use the 'nock' package for testing HTTP requests. 'Nock' acts like
  // a fake server, by overriding Node.js's `http.request()`, and it responds to
  // specified URLs.
  // (Note: 'nock' works with Node.js, while the 'sinon' package would override
  //  the XMLHttpRequest object that is only available in browser-environments).
  before(function() {
    // [Disabled this line until nock's `enableNetConnect()` works again...]:
    // nock.disableNetConnect();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  after(function() {
    nock.enableNetConnect();
  });


  // Make a shorthand function, for making HTTP-replies with a stringified array,
  // so instead of:     `nock.reply(200, () => JSON.stringify(['a', 'b']));`,
  // we can just write: `nock.reply(...R('a', 'b'));`.
  var R = (...args) => [200, () => JSON.stringify([...args])];


  describe('getDictInfos()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {id: ['A', 'B'], name: 'Ab C'}, sort: 'id',
        page: 2,  perPage: 5
      };
      // - A test only succeeds if 'dict' actually requests the specified URL.
      // - We only test that DictionaryRemoteDemo will pass through any array
      //   it is given by a server, so we do not need to bother with real
      //   dictInfo/entry/etc-objects.
      nock(urlBase)
        .get('/dic?id=A,B&name=Ab%20C&sort=id&page=2&perPage=5')
        .reply(...R('test'));  // See explanation above.
      dict.getDictInfos(opt, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also with no options given', function(cb) {
      nock(urlBase)
        .get('/dic?id=&name=&sort=&page=&perPage=')
        .reply(...R('test'));
      dict.getDictInfos(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });
  });


  describe('getEntries()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {id: 'A:01', dictID: 'A'}, sort: 'dictID',
        z: true,  page: 2,  perPage: 5
      };
      nock(urlBase)
        .get('/ent?id=A%3A01&dictID=A&z=true&sort=dictID&page=2&perPage=5')
        .reply(...R('test'));
      dict.getEntries(opt, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also with no options given', function(cb) {
      nock(urlBase)
        .get('/ent?id=&dictID=&z=true&sort=&page=&perPage=')
        .reply(...R('test'));
      dict.getEntries(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also for no z-object', function(cb) {
      nock(urlBase)
        .get('/ent?id=&dictID=&z=false&sort=&page=&perPage=')
        .reply(...R('test'));
      dict.getEntries({z: false}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also with z-pruning', function(cb) {
      nock(urlBase)
        .get('/ent?id=&dictID=&z=x,y,z&sort=&page=&perPage=')
        .reply(...R('test'));
      dict.getEntries({z: ['x', 'y', 'z']}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });
  });


  describe('getRefTerms()', function() {
    it('calls its URL with given options filled in; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {filter: {str: ['a', 'b']}, page: 2, perPage: 5};
      nock(urlBase)
        .get('/ref?str=a,b&page=2&perPage=5')
        .reply(...R('test'));
      dict.getRefTerms(opt, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also with no options given', function(cb) {
      nock(urlBase)
        .get('/ref?str=&page=&perPage=')
        .reply(...R('test'));
      dict.getRefTerms(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });
  });


  describe('getMatchesForString()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {dictID: ['A', 'B', 'C']}, sort: {dictID: ['A', 'B']},
        z: 'x',  page: 2,  perPage: 5
      };
      nock(urlBase)
        .get('/mat?q=ab%20c&dictID=A,B,C&sort=A,B&page=2&perPage=5')
        .reply(...R('test'));
      dict.getMatchesForString('ab c', opt, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL, also with no options given', function(cb) {
      var called = false;
      nock(urlBase)
        .get('/mat?q=x&dictID=&sort=&page=&perPage=')
        .reply(...R('test'))
        .on('replied', () => { called = true; });
      dict.getMatchesForString('x', 0, (err, res) => {
        expect(err).to.equal(null);
        called.should.equal(true);  // Test that this works, for the next test.
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('for an empty string, makes no server-request and ' +
        'returns an empty list', function(cb) {
      var called = false;
      nock(urlBase)
        .on('replied', () => { called = true; });
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        called.should.equal(false);  // Test that no request was made.
        res.should.deep.equal({items: []});
        cb();
      });
    });

    it('lets the parent class add a number-string match', function(cb) {
      nock(urlBase)
        .get('/mat?q=5&dictID=&sort=&page=&perPage=')
        .reply(...R('test'));
      dict.getMatchesForString('5', 0, (err, res) => {
        res.should.deep.equal({items: [
          { id:'00:5e+0', dictID:'00', str :'5', descr:'[number]', type:'N' },
          'test',
        ]});
        cb();
      });
    });

    it('reports JSON.parse() errors', function(cb) {
      nock(urlBase)
        .get('/mat?q=5&dictID=&sort=&page=&perPage=')
        .reply(200, () => 'not a JSON string');  // Make it send invalid data.
      dict.getMatchesForString('5', 0, (err, res) => {
        // It should forward a JSON-parsing error, which we receive here:
        err.toString().startsWith('SyntaxError').should.equal(true);
        cb();
      });
    });

    it('reports error when the server does not reply with a JSON array',
      function(cb) {
      nock(urlBase)
        .get('/mat?q=5&dictID=&sort=&page=&perPage=')
        .reply(200, () => '"not an Array"');
      dict.getMatchesForString('5', 0, (err, res) => {
        err.should.equal('The server did not send an Array');
        cb();
      });
    });
  });


  describe('Simple demo-subclass that fetches & parses string-matches ' +
    'from (fake-served) pubdictionaries.org (using 1 subdictionary only)',
    function() {

    // 1.) Make a subclass of DictionaryRemoteDemo, that adds a layer of code
    // that parses the specific data that pubdictionaries.org returns.
    class DictionaryPubDictionaries extends DictionaryRemoteDemo {
      constructor(options) {
        super(options);
        this.urlGetMatches = 'http://pubdictionaries.org' +
          '/dictionaries/$filterDictID/prefix_completion?term=$str';
      }
      getMatchesForString(str, options, cb) {
        super.getMatchesForString(str, options, (err, res) => {
          if (err)  return cb(err);
          var arr = res.items.map(e =>
            e.type ? e :  // Don't convert match-objects generated by parent-class.
            ({
              id:     e.identifier,
              dictID: options.filter.dictID,
              str:    e.label,
              type:   e.label.startsWith(str) ? 'S' : 'T',
              z: {
                dictionary_id: e.dictionary_id,
                id: e.id
              }
            })
          );
          cb(err, {items: arr});
        });
      }
    }

    it('returns match-objects for entries that match a string', function(cb) {
      // 2.) Set up 'nock' so it replies to the URL that is supposed to
      // be requested.
      var str = 'cell b';
      var dictID = 'GO-BP';

      nock('http://pubdictionaries.org')
        .get(`/dictionaries/${encodeURIComponent(dictID)}` +
             `/prefix_completion?term=${encodeURIComponent(str)}`)
        .reply(...R( // This is a copy of data once returned by the real server:
          {
            created_at: '2016-10-23T18:19:08Z',
            dictionary_id: 2,
            id: 28316,
            identifier: 'http://purl.obolibrary.org/obo/GO_0007114',
            label: 'cell budding',
            label_length: 12,
            mode: 0,
            norm1: 'cellbudding',
            norm2: 'cellbud',
            updated_at: '2016-10-23T18:19:08Z'
          },
          {
            created_at: '2016-10-23T18:19:50Z',
            dictionary_id: 2,
            id: 48701,
            identifier: 'http://purl.obolibrary.org/obo/GO_0032060',
            label: 'cell blebbing',
            label_length: 13,
            mode: 0,
            norm1: 'cellblebbing',
            norm2: 'cellbleb',
            updated_at: '2016-10-23T18:19:50Z'
          }
        ));

      // 3.) Run the actual test.
      var dict = new DictionaryPubDictionaries();
      dict.getMatchesForString(str, {filter: {dictID: dictID}}, (err, res) => {
        expect(err).to.equal(null);
        res.items.should.deep.equal([
          {
            id:     'http://purl.obolibrary.org/obo/GO_0007114',
            dictID: dictID,
            str:    'cell budding',
            type:   'S',
            z: {
              dictionary_id: 2,
              id: 28316,
            }
          },
          {
            id:     'http://purl.obolibrary.org/obo/GO_0032060',
            dictID: dictID,
            str:    'cell blebbing',
            type:   'S',
            z: {
              dictionary_id: 2,
              id: 48701,
            }
          }
        ]);
        cb();
      });
    });
  });
});
