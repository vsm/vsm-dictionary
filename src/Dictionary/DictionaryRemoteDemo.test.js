const DictionaryRemoteDemo = require('./DictionaryRemoteDemo');
const {callAsync} = require('./helpers/async');
const chai = require('chai');  chai.should();
const expect = chai.expect;
const nock = require('nock');

var testLive = false;  // Activate the test with a live server (which may fail)?


describe('DictionaryRemoteDemo.js', function() {

  var lastUrl = '';
  var dict;

  before(function() {
    var urlBase = 'http://test';
    dict = new DictionaryRemoteDemo({base: urlBase});

    // Use 'nock' to override Node.js's `http.request()` for testing.
    // (Note: the 'sinon' package would override XMLHttpRequest in _browser_).
    nock(urlBase)
      .persist()  // Respond in this same way to all requests.
      .get(/.+/)
      .reply(200, function(url) {
        lastUrl = url;
        return JSON.stringify(['test']);
      });
  });

  after(function() {
    nock.cleanAll();  // Important, prevents weird errors.
  });


  describe('getDictInfos()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {id: ['A', 'B'], name: 'Ab C'}, sort: 'id',
        page: 2,  perPage: 5
      };
      dict.getDictInfos(opt, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('/dic?i=A,B&n=Ab%20C&s=id&p=2&c=5');
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL correctly, also with no options given', function(cb) {
      dict.getDictInfos(0, (err, res) => {
        lastUrl.should.equal('/dic?i=&n=&s=&p=&c=');
        cb();
      });
    });
  });


  describe('getEntries()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {i: 'A:01', d: 'A'}, sort: 'd',
        z: true,  page: 2,  perPage: 5
      };
      dict.getEntries(opt, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('/ent?i=A%3A01&d=A&z=true&s=d&p=2&c=5');
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL correctly, also with no options given', function(cb) {
      dict.getEntries(0, (err, res) => {
        lastUrl.should.equal('/ent?i=&d=&z=true&s=&p=&c=');
        cb();
      });
    });

    it('calls its URL correctly, also for no z-object', function(cb) {
      dict.getEntries({z: false}, (err, res) => {
        lastUrl.should.equal('/ent?i=&d=&z=false&s=&p=&c=');
        cb();
      });
    });

    it('calls its URL correctly, also with z-pruning', function(cb) {
      dict.getEntries({z: ['x', 'y', 'z']}, (err, res) => {
        lastUrl.should.equal('/ent?i=&d=&z=x,y,z&s=&p=&c=');
        cb();
      });
    });
  });


  describe('getRefTerms()', function() {
    it('calls its URL with given options filled in; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {filter: {s: ['a', 'b']}, page: 2, perPage: 5};
      dict.getRefTerms(opt, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('/ref?f=a,b&p=2&c=5');
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL correctly, also with no options given', function(cb) {
      dict.getRefTerms(0, (err, res) => {
        lastUrl.should.equal('/ref?f=&p=&c=');
        cb();
      });
    });
  });


  describe('getMatchesForString()', function() {
    it('calls its URL with given options filled in, URL-encoded; ' +
      'and returns the data it got back, JSON-parsed', function(cb) {
      var opt = {
        filter: {d: ['A', 'B', 'C']}, sort: {d: ['A', 'B']},
        z: 'x',  page: 2,  perPage: 5
      };
      dict.getMatchesForString('ab c', opt, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('/mat?s=ab%20c&d=A,B,C&s=A,B&p=2&c=5');
        res.should.deep.equal({items: ['test']});
        cb();
      });
    });

    it('calls its URL correctly, also with no options given', function(cb) {
      dict.getMatchesForString('x', 0, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('/mat?s=x&d=&s=&p=&c=');
        cb();
      });
    });

    it('for an empty string, makes no server-request and ' +
        'returns an empty list', function(cb) {
      lastUrl = 'abcd'
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        lastUrl.should.equal('abcd');  // Test that no request was made.
        res.should.deep.equal({items: []});
        cb();
      });
    });

    it('lets the parent class add a number-string match', function(cb) {
      dict.getMatchesForString('5', 0, (err, res) => {
        lastUrl.should.equal('/mat?s=5&d=&s=&p=&c=');
        res.should.deep.equal({items: [
          { i: '00:5e+0', d: '00', s : '5', x: '[number]', w: 'N' },
          'test',
        ]});
        cb();
      });
    });

    it('reports JSON.parse() errors', function(cb) {
      var bk = dict._getReqObj;
      dict._getReqObj = function() {
        return {
          status: 200,
          readyState: 4,
          responseText: 'not a JSON string',  // <--- Make it send invalid data.
          open: () => {},
          send: function () { callAsync(this.onreadystatechange); }
        }
      }
      dict.getMatchesForString('5', 0, (err, res) => {
        err.should.not.equal(null);  // <--- It should forward an error.
        dict._getReqObj = bk;  // Restore the original dummy request-object.
        dict.getMatchesForString('5', 0, (err, res) => {
          expect(err).to.equal(null);  // Checks: no error anymore now.
          cb();
        });
      });
    });
  });


  // Live test/demo with PubDictionaries.org.
  // NOTE: This test must not stay active, because it depends on a
  //       breakable/changeable network, remote server, API, and dictionary.
  describe('Simple demo-subclass that fetches & parses string-matches ' +
    'from pubdictionaries.org (using 1 subdictionary only)', function() {
    if (!testLive)  return;

    // Make a subclass of DictionaryRemoteDemo, that adds a layer of code
    // that parses the specific data that pubdictionaries.org returns.
    class DictionaryPubDictionaries extends DictionaryRemoteDemo {
      constructor(options) {
        super(options);
      }
      getMatchesForString(str, options, cb) {
        super.getMatchesForString(str, options, (err, res) => {
          if (err)  return cb(err);
          var arr = res.items.map(e =>
            e.w ? e :  // Don't convert match-objects generated by parent-class.
            ({
              i: e.identifier,
              d: options.filter.d,
              s: e.label,
              w: e.label.startsWith(str) ? 'S' : 'T',
              z: {
                dictionary_id: e.dictionary_id,
                id: e.id,
                label_length: e.label_length,
                mode: e.mode,
                norm1: e.norm1,
                norm2: e.norm2,
                created_at: e.created_at,
                updated_at: e.updated_at
              }
            })
          );
          cb(err, {items: arr});
        });
      }
    }

    var dict = new DictionaryPubDictionaries({
      urlGetMatches: `http://pubdictionaries.org/dictionaries/$filterD/` +
                     `prefix_completion?term=$str`
    });

    it('returns match-objects for entries that match a string', function(cb) {
      var str = 'cell bud';
      var dictID = 'GO-BP';
      dict.getMatchesForString(str, {filter: {d: dictID}}, (err, res) => {
        expect(err).to.equal(null);
        var x = res.items[0];
        delete x.z;  // Ignore the z-object for the comparison.
        x.should.deep.equal({
          i: 'http://purl.obolibrary.org/obo/GO_0007114',
          d: dictID,
          s: 'cell budding',
          w: 'S'
        });
        cb();
      });
    });
  });
});
