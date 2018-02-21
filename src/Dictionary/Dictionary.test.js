const Dictionary = require('./Dictionary');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('Dictionary.js', function() {
  var dict, cnt, geCallCount;
  var z  = {a: 1, b: 2};
  var z2 = {      b: 2}; // Pruned version of `z`, having only the `b`-property.


  describe('_idtToFTCacheKey()', function() {
    var dict = new Dictionary();
    it('returns a fixedTermsCache-key for a given conceptID', function() {
      dict._idtToFTCacheKey('CW:0115').should.equal('CW:0115\n');
    });
    it('returns a fixedTermsCache-key for a given conceptID ' +
      'and optional term-string', function() {
      dict._idtToFTCacheKey('CW:0115', 'in').should.equal('CW:0115\nin');
    });
  });


  describe('_entryToMatch()', function() {
    var dict = new Dictionary();
    var t = [ {s:'a'}, {s:'b', y:'i', x:'bb'} ];
    var e = {i:'A:01', d:'A', x:'xx', t: t};

    it('returns a match-object for a given entry, term-position, ' +
      'and match-type', function() {
      dict._entryToMatch(e, 0, 'S').should.deep.equal(
        {i:'A:01', d:'A', x:'xx', s:'a',        t:t, w:'S'});
      dict._entryToMatch(e, 1, 'T').should.deep.equal(
        {i:'A:01', d:'A', x:'bb', s:'b', y:'i', t:t, w:'T'});
    });
  });


  // Adds a mock getEntries() to `dict` that would be implemented by a subclass.
  function addMockGetEntries(dict) {
    geCallCount = 0;
    dict.getEntries = (options, cb) => setTimeout(() => { // Truly-async callbk.
      geCallCount++;
      cb(null,
        { items: options.filter.i  // Returns items based on given ID-filter.
          .map(id => !id || id == 'x' ? null :  // Makes no entry for 'x', ..
            {
              i: id,  // .., but makes an entry for each other requested ID, ..
              d: 'X',
              t: [{s: `${id}1`}, {s: `${id}2`}],  // with terms like: ID1, ID2.
              z: options.z && options.z[0] == 'b' ? z2 : z  // Can prune for b.
            } )
          .filter(e => e)
      });
    }, 0);
  }


  describe('loadFixedTerms()', function() {
    beforeEach(function() {
      dict = new Dictionary();
      addMockGetEntries(dict);
      cnt = 0;  // We will test all calls for true asynchronicity as well.
    });

    it('has an empty `fixedTermsCache` at start', function() {
      dict.fixedTermsCache.should.deep.equal({});
    });

    it('works with an empty array; it does not call getEntries() then, but ' +
      'still calls back on the next event-loop', function(cb) {
      var len = Object.keys(dict.fixedTermsCache).length;
      dict.loadFixedTerms([], 0, err => {
        expect(err).to.equal(null);
        Object.keys(dict.fixedTermsCache).length.should.equal(0); // Unchanged.
        geCallCount.should.equal(0);  // Test that `getEntries()` wasn't called.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds no matches to `fixedTermsCache` for absent IDs', function(cb) {
      var idts = ['', {i:'x', s:'xx'}];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds match-objects to `fixedTermsCache` for one ID, and passes on ' +
      'z-object-pruning options', function(cb) {
      var idts = 'a';
      dict.loadFixedTerms(idts, {z: ['b']}, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'a\n': { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
        });
        geCallCount.should.equal(1);  // Test that our `geCallCount` works.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds match-objects to `fixedTermsCache` for multiple ID/terms: ' +
      'an ID without term, and a normal ID+term couple', function(cb) {
      var idts = ['b', {i:'c', s:'c2'}];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'b\n'  : { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'F', z },
          'c\nc2': { i:'c', d:'X', t:[{s:'c1'}, {s:'c2'}], s:'c2', w:'F', z },
        });
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds a match-object to `fixedTermsCache` for an ID + an absent term, ' +
      'which gets mapped onto the entry\'s first term', function(cb) {
      var idts = {i:'d', s:'d9'};
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'd\nd9': { i:'d', d:'X', t:[{s:'d1'}, {s:'d2'}], s:'d1', w:'F', z },
        });
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('can forward an error from getEntries()', function(cb) {
      var bk = dict.getEntries;
      dict.getEntries = (options, cb) => setTimeout(() => cb('err1'), 0);

      dict.loadFixedTerms([''], 0, err => {
        err.should.equal('err1');
        dict.getEntries = bk;
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('_getFixedMatchesForString()', function() {
    before(function(cb) {
      dict = new Dictionary();
      addMockGetEntries(dict);
      // Fill the cache like in the loadFixedTerms() test-suite.
      dict.loadFixedTerms(['a'], {z: ['b']}, () => {
        dict.loadFixedTerms(['b', {i:'c', s:'c2'}, {i:'d', s:'d1'}], {}, cb);
      });
      cnt = 0;
    });

    it('for an empty string, returns all match-objects whose ' +
      'fixedTermsCache-key corresponds to an item in `idts` ID(+term)s, ' +
      'sorted', function() {
      var idts = [
        {i:'c', s:'c2'}, 'a',  // These match a fixedTermsCache key exactly, ..
        {i:'c', s:'c1'}, 'c', {i:'d', s:'xx'}, {i:'xx'}  // .. and these don't.
      ];
      dict._getFixedMatchesForString('', {idts}).should.deep.equal([
        { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
        { i:'c', d:'X', t:[{s:'c1'}, {s:'c2'}], s:'c2', w:'F', z },
      ]);
    });

    it('returns match for string as prefix, and prunes z-property', function() {
      var idts = [ 'a', {i:'c', s:'c2'} ];
      dict._getFixedMatchesForString('a', {idts, z: false}).should.deep.equal([
        { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F'},
      ]);
    });

    it('returns match for string as infix, and prunes z-property', function() {
      var idts = [ 'b', {i:'c', s:'c2'} ];
      dict._getFixedMatchesForString('1', {idts, z: 'b'}).should.deep.equal([
        { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'G', z:z2},
      ]);
    });

    it('for a string, doesn\'t return a cache-item that has a matching string' +
      ', but that does not match an item in `options.idts`', function() {
      dict._getFixedMatchesForString('b', {idts: ['a']}).should.deep.equal([]);
    });

    it('for a string, will return a cache-item that has a matching string '+
      ', and that also matches an item in `options.idts`', function() {
      dict._getFixedMatchesForString('b', {idts: ['b']}).should.deep.equal([
        { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'F', z},
      ]);
    });
  });


  describe('_getNumberMatchForString()', function() {
    it('returns a match for a number, ' +
      'under the default number-match config', function() {
      dict._getNumberMatchForString('5').should.deep.equal(
        {i: '00:5e+0', d: '00', s: '5', x: '[number]', w: 'N'});
    });
    it('returns a match for a number, ' +
      'using custom \'number-string\' settings', function() {
      var dict = new Dictionary(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict._getNumberMatchForString('5')  .should.deep.equal(
        {i: 'XX:5e+0', d: 'XX', s: '5', x: '[number]', w: 'N'});
    });
    it('does not return a match for a number, ' +
      'only if configured not to do so', function() {
      var dict = new Dictionary({numberMatchConfig: false});
      dict._getNumberMatchForString('5').should.equal(false);
    });
  });


  describe('addExtraMatchesForString()', function() {
    before(function(cb) {
      dict = new Dictionary();
      addMockGetEntries(dict);
      // Fill the cache like in the loadFixedTerms() test-suite.
      dict.loadFixedTerms(['a'], {z: ['b']}, () => {
        dict.loadFixedTerms(['b', {i:'c', s:'c2'}, {i:'d', s:'d1'}], {}, cb);
      });
      cnt = 0;
    });

    it('adds fixedTerm-matches into a given array, ' +
      'after one refTerm and before normal matches, and deduplicates based ' +
      'on equal `i` and `s` (keeping the fixedTerm-match)', function(cb) {
      var ms = [  // = Matches that would be returned by a subclass.
        { i:'',  d:'',  s:'rt', w:'R' },
        { i:'x', d:'X', s:'x9', w:'S' },
        { i:'c', d:'X', s:'c2', w:'S' },  // <-- will be a fixedTerm-match too.
        { i:'y', d:'X', s:'y9', w:'T' },
      ];
      var idts = [
        {i:'c', s:'c2'},
        'a'
        ];
      dict.addExtraMatchesForString('', ms, {idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { i:'',  d:'',  s:'rt', w:'R' },
          { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
          { i:'c', d:'X', t:[{s:'c1'}, {s:'c2'}], s:'c2', w:'F', z },
          { i:'x', d:'X', s:'x9', w:'S' },
          { i:'y', d:'X', s:'y9', w:'T' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add matches, nor deduplicates, ' +
      'for a result-page 2', function(cb) {
      var ms = [
        { i:'c', d:'X', s:'c2', w:'S' },
      ];
      var options = { idts: [{i:'c', s:'c2'}, 'a'], perPage: 1, page: 2 };
      dict.addExtraMatchesForString('', ms, options, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { i:'c', d:'X', s:'c2', w:'S' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds a number-string match-object in front', function(cb) {
      var ms = [
        { i:'c', d:'X', s:'c2', w:'S' },
      ];
      dict.addExtraMatchesForString('10.5', ms, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { i:'00:1.05e+1', d:'00', s: '10.5', x: '[number]', w:'N' },
          { i:'c', d:'X', s:'c2', w:'S' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add a number-match if the subclass already returned a ' +
      '(typically more informative) match for it; ' +
      'and moves that match to the top', function(cb) {
      var ms = [
        { i: 'c', d: 'X', s: 'c2', w: 'S' },
        { i: '00:1.2e+1', d: '00', s: '12', x: 'the amount of twelve',
          t: [ {s: '12'}, {s: 'twelve'}, {s: 'dozen'} ],  w:'S'
        }
      ];
      dict.addExtraMatchesForString('12', ms, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          Object.assign({}, ms[1], {w: 'N'}), // I.e. changes match-type to 'N'.
          ms[0]
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });
});
