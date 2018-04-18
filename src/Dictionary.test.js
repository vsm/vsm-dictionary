const Dictionary = require('./Dictionary');
const { deepClone } = require('./helpers/util');
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
    var t = [
        {str:'a'},
        {str:'b', style:'i', descr:'bb'}
      ];
    var e = {id:'A:01', dictID:'A', descr:'xx', terms: t};

    it('returns a match-object for a given entry, term-position, ' +
      'and match-type', function() {
      dict._entryToMatch(e, 0, 'S').should.deep.equal(
        {id:'A:01', dictID:'A', descr:'xx', str:'a', terms:t, type:'S'});
      dict._entryToMatch(e, 1, 'T').should.deep.equal(
        {id:'A:01', dictID:'A', descr:'bb', str:'b', terms:t, type:'T',
        style:'i'});
    });
  });

  describe('_prepIdts()', function() {
    var dict = new Dictionary();
    it('returns an empty array when given an empty array', function() {
      dict._prepIdts([]).should.deep.equal([]);
    });
    it('when given an array with one string, returns an array with ' +
      'an object having as id property that string', function() {
      dict._prepIdts(['aa']).should.deep.equal([ { id: 'aa' } ]);
    });
    it('returns proper formatted id/+str objs with a varied element array input',
      function() {
      dict._prepIdts(['Astring', {id: 'SomeString'}, {id:'x', str:'xx'}])
        .should.deep.equal(
          [{id: 'Astring'}, {id: 'SomeString'}, {id:'x', str:'xx'}]
        );
    });
  });


  // Adds a mock getEntries() to `dict` that would be implemented by a subclass.
  function addMockGetEntries(dict) {
    geCallCount = 0;
    dict.getEntries = (options, cb) => setTimeout(() => { // Truly-async callbk.
      geCallCount++;
      cb(null,
        { items: options.filter.id  // Returns items based on given ID-filter.
          .map(id => !id || id == 'x' ? null :  // Makes no entry for 'x', ..
            {
              id:     id,   // but makes an entry for any other requested ID, ..
              dictID: 'X',                                 // with terms like ..
              terms:  [{str: `${id}1`}, {str: `${id}2`}],  // '<ID>1', '<ID>2'.
              z: options.z && options.z[0] == 'b' ? z2 : z  // Can prune for b.
            } )
          .filter(e => e)
      });
    }, 0);
  }


  describe('loadFixedTerms()', function() {
    beforeEach(function() {
      dict = new Dictionary();  // This clears the cache before each test.
      addMockGetEntries(dict);
      cnt = 0;  // We will test all calls for true asynchronicity as well.
    });

    it('has an empty `fixedTermsCache` at start', function() {
      dict.fixedTermsCache.should.deep.equal({});
    });

    it('works with an empty array; it does not call getEntries() then, but ' +
      'still calls back on the next event-loop', function(cb) {
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
      var idts = ['', {id:'x', str:'xx'}];
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
          'a\n': { id: 'a', dictID: 'X', terms: [{str: 'a1'}, {str: 'a2'}],
                   str: 'a1', z: z2, type: 'F' },
        });
        geCallCount.should.equal(1);  // Test that our `geCallCount` works.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds match-objects to `fixedTermsCache` for multiple ID/terms: ' +
      'an ID without term, and a normal ID+term couple', function(cb) {
      var idts = ['b', {id:'c', str:'c2'}];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'b\n'  : { id:'b', dictID:'X', terms:[{str:'b1'}, {str:'b2'}],
                     str:'b1', type:'F', z },
          'c\nc2': { id:'c', dictID:'X', terms:[{str:'c1'}, {str:'c2'}],
                     str:'c2', type:'F', z },
        });
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds a match-object to `fixedTermsCache` for an ID + an absent term, ' +
      'which gets mapped onto the entry\'s first term', function(cb) {
      var idts = {id:'d', str:'d9'};
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'd\nd9': { id:'d', dictID:'X', terms:[{str:'d1'}, {str:'d2'}],
                     str:'d1', type:'F', z },
        });
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('can forward an error from getEntries()', function(cb) {
      dict.getEntries = (options, cb) => setTimeout(() => cb('err1'), 0);

      dict.loadFixedTerms([''], 0, err => {
        err.should.equal('err1');
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
      // Fill the cache like in the loadFixedTerms() test-suite:
      //   'a\n'   -> { str: 'a1', ...}, // (z-pruned)
      //   'b\n'   -> { str: 'b1', ...},
      //   'c\nc2' -> { str: 'c2', ...},
      //   'd\nd1' -> { str: 'd1', ...},
      dict.loadFixedTerms(['a'], {z: ['b']}, () => {  // (this one is z-pruned).
        dict.loadFixedTerms(
          ['b', {id:'c', str:'c2'}, {id:'d', str:'d1'}], {}, cb);
      });
      cnt = 0;
    });

    it('for an empty string, returns all match-objects whose ' +
      'fixedTermsCache-key corresponds to an item in `idts` ID(+term)s, ' +
      'sorted', function() {
      var idts = [
        {id:'c', str:'c2'}, 'a',  // These match a fixedTermsCache key exactly;
        {id:'c', str:'c1'}, 'c', {id:'d', str:'xx'}, {id:'xx'}  // these don't.
      ];
      dict._getFixedMatchesForString('', {idts}).should.deep.equal([
        { id:'a', dictID:'X', terms:[{str:'a1'}, {str:'a2'}], str:'a1',
          type:'F', z:z2},
        { id:'c', dictID:'X', terms:[{str:'c1'}, {str:'c2'}], str:'c2',
          type:'F', z },
      ]);
    });

    it('returns match for string as prefix, and prunes z-property', function() {
      var idts = [ 'a', {id:'c', str:'c2'} ];
      dict._getFixedMatchesForString('a', {idts, z: false}).should.deep.equal([
        { id:'a', dictID:'X', terms:[{str:'a1'}, {str:'a2'}], str:'a1',
          type:'F' },
      ]);
    });

    it('returns match for string as infix, and prunes z-property', function() {
      var idts = [ 'b', {id:'c', str:'c2'} ]; // Only get matches for these idts.
      dict._getFixedMatchesForString('1', {idts, z: 'b'}).should.deep.equal([
        { id:'b', dictID:'X', terms:[{str:'b1'}, {str:'b2'}], str:'b1',
          type:'G', z:z2 },
      ]);
    });

    it('for a string, does not return a cache-item that has a matching string' +
      ', but that does not match an item in `options.idts`', function() {
      dict._getFixedMatchesForString('b', {idts: ['a']}).should.deep.equal([]);
    });

    it('for a string, will return a cache-item that has a matching string '+
      ', and that also matches an item in `options.idts`', function() {
      dict._getFixedMatchesForString('b', {idts: ['b']}).should.deep.equal([
        { id:'b', dictID:'X', terms:[{str:'b1'}, {str:'b2'}], str:'b1',
          type:'F', z},
      ]);
    });
  });


  describe('_getNumberMatchForString()', function() {
    it('returns a match for a number, ' +
      'under the default number-match configuration', function() {
      dict._getNumberMatchForString('5').should.deep.equal(
        {id: '00:5e+0', dictID: '00', str: '5', descr: '[number]', type: 'N'});
    });
    it('returns a match for a number, ' +
      'using custom \'number-string\' settings', function() {
      var dict = new Dictionary(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict._getNumberMatchForString('5').should.deep.equal(
        {id: 'XX:5e+0', dictID: 'XX', str: '5', descr: '[number]', type: 'N'});
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
      // Fill the cache like in the _getFixedMatchesForString() test-suite.
      dict.loadFixedTerms(['a'], {z: ['b']}, () => {
        dict.loadFixedTerms(
          ['b', {id:'c', str:'c2'}, {id:'d', str:'d1'}], {}, cb);
      });
      cnt = 0;
    });

    it('adds fixedTerm-matches into a given array, ' +
      'after one refTerm and before normal matches, and deduplicates based ' +
      'on equal `id` and `str` (keeping the fixedTerm-match)', function(cb) {
      var ms = [  // = Matches that would be returned by a subclass.
        { id:'',  dictID:'',  str:'rt', type:'R' },
        { id:'x', dictID:'X', str:'x9', type:'S' },
        { id:'c', dictID:'X', str:'c2', type:'S' }, // <-- this one will be a ..
        { id:'y', dictID:'X', str:'y9', type:'T' },      // fixedTerm-match too.
      ];
      var idts = [
        {id:'c', str:'c2'},
        'a'
        ];
      dict.addExtraMatchesForString('', ms, {idts}, (err, res) => {
        expect(err).to.equal(null);
        var termsA = [{str:'a1'}, {str:'a2'}];
        var termsC = [{str:'c1'}, {str:'c2'}];
        res.should.deep.equal([
          { id:'',  dictID:'',  str:'rt', type:'R' },
          { id:'a', dictID:'X', str:'a1', type:'F', terms:termsA, z:z2 },
          { id:'c', dictID:'X', str:'c2', type:'F', terms:termsC, z },
          { id:'x', dictID:'X', str:'x9', type:'S' },
          { id:'y', dictID:'X', str:'y9', type:'T' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add matches, nor deduplicates, ' +
      'for a result-page 2', function(cb) {
      var ms = [
        { id:'c', dictID:'X', str:'c2', type:'S' },  // == 3rd one in prev test.
      ];
      var options = {
        idts: [{id:'c', str:'c2'}, 'a'],  // Same as in previous test.
        perPage: 1, page: 2               // Different from previous test.
      };
      dict.addExtraMatchesForString('', ms, options, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { id:'c', dictID:'X', str:'c2', type:'S' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds a number-string match-object in front', function(cb) {
      var ms = [
        { id:'c', dictID:'X', str:'c2', type:'S' },
      ];
      dict.addExtraMatchesForString('10.5', ms, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { id:'00:1.05e+1', dictID:'00', str: '10.5', descr: '[number]',
            type:'N' },
          { id:'c', dictID:'X', str:'c2', type:'S' },
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add a number-match if the subclass already returned a ' +
      '(typically more informative) match for it;\n        ' +
      'but moves that match to the top, changes its `type` to \'N\', ' +
      'and adds surrounding brackets to its `descr`', function(cb) {
      var ms = [
        { id:'c', dictID:'X', str:'c2', type:'S' },
        { id:'00:1.2e+1', dictID:'00', str:'12', descr:'the amount of twelve',
          terms:[{str:'12'}, {str:'twelve'}, {str:'dozen'}], type:'S'
        }
      ];
      var msArg = deepClone(ms); // Because addExtra..() changes the given array.
      dict.addExtraMatchesForString('12', msArg, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          Object.assign({}, ms[1],
            { type: 'N',                        // == changes match-type to 'N'.
              descr: '[' + ms[1].descr + ']' }  // == adds surrounding brackets.
          ),
          ms[0]
        ]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('in the above case, it fills an empty `descr`', function(cb) {
      var ms = [
        { id:'00:1.2e+1', dictID:'00', str:'12', terms:[{str:'12'}], type:'S' }
      ];
      dict.addExtraMatchesForString('12', deepClone(ms), 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          Object.assign({}, ms[0],
            { type: 'N',
              descr: '[number]' }  // == adds a default `descr` for match-type N.
          ),
        ]);
        cb();
      });
    });
  });


  describe('static methods', function() {
    // Here we just test that these functions are hooked up as static methods.
    // Extended tests for them are defined in canonicalize.js and queryUtils.js.

    it('exposes canonicalizeEntry()', function() {
      Dictionary.canonicalizeEntry(
        { id:'A:01', dictID:'A', terms: 'abc', q: 1}
      ).should.deep.equal(
        { id:'A:01', dictID:'A', terms: [ {str: 'abc'} ]}
      );
    })
    it('exposes canonicalizeTerms()', function() {
      Dictionary.canonicalizeTerms('abc').should.deep.equal(
        [ {str: 'abc'} ]
      );
    })
    it('exposes prepGetOptions()', function() {
      Dictionary.prepGetOptions({sort: {b: 'x'}}, ['a'], ['b'])
        .should.deep.equal( {filter: {a: false}, sort: {b: ['x']}} );
    })
    it('exposes zPropPrune()', function() {
      Dictionary.zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['a'])
        .should.deep.equal( [ {z: {a: 1}, X: 9} ] );
    })
  });
});
