import Dictionary from './Dictionary';
import asyncWaterfall from 'async-waterfall';


export default function test(CB, expect, T,L,D) {

  var dict = new Dictionary();
  var cnt;


  T('_idtToFTCacheKey(): returns a fixedTermsCache-key, for a given ' +
    'conceptID and optional term-string');
  dict._idtToFTCacheKey('CW:0115').should.equal('CW:0115\n');
  dict._idtToFTCacheKey('CW:0115', 'in').should.equal('CW:0115\nin');


  T('_entryToMatch(): returns a match-object for a given entry, ' +
    'term-position, and match-type');
  var t = [ {s:'a'}, {s:'b', y:'i', x:'bb'} ];
  var e = {i:'A:01', d:'A', x:'xx', t: t};
  dict._entryToMatch(e, 0, 'S').should.deep.equal(
    {i:'A:01', d:'A', x:'xx', s:'a', t:t, w:'S'});
  dict._entryToMatch(e, 1, 'T').should.deep.equal(
    {i:'A:01', d:'A', x:'bb', s:'b', y:'i', t:t, w:'T'});


  // First, add a mock function that would be implemented by a subclass.
  var z  = {a:1, b:2};
  var z2 = {b:2};
  var geCallCount = 0;
  dict.getEntries = (options, cb) => {
    geCallCount++;
    cb(null, { items: options.filter.i
        .map(id =>
          !id || id == 'x' ? null :
          {
            i: id,
            d: 'X',
            t: [ {s: `${id}1`}, {s: `${id}2`} ],
            z: options.z && options.z[0] == 'b' ? z2 : z
          } )
        .filter(e => e)
    });
  }


  asyncWaterfall([

    // --- Test loadFixedTerms().
    cb => {
      T('loadFixedTerms(): adds to `fixedTermsCache` for one ID, ' +
        'and can pass on any z-object-pruning options');
      cnt = 0;
      dict.fixedTermsCache.should.deep.equal({});
      dict.loadFixedTerms('a', {z: ['b']}, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'a\n': { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
        });
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },

    cb => {
      T('loadFixedTerms(): adds to `fixedTermsCache` for multiple ID/terms: ' +
        'an ID without term; a normal ID+term couple; 2x absent ID; ' +
        'and absent term, which gets mapped onto the entry\'s first-term');
      var idts = ['b', {i:'c', s:'c2'}, '', {i:'x', s:'xx'}, {i:'d', s:'d9'}];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        dict.fixedTermsCache.should.deep.equal({
          'a\n'  : { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
          'b\n'  : { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'F', z },
          'c\nc2': { i:'c', d:'X', t:[{s:'c1'}, {s:'c2'}], s:'c2', w:'F', z },
          'd\nd9': { i:'d', d:'X', t:[{s:'d1'}, {s:'d2'}], s:'d1', w:'F', z },
        });
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },

    cb => {
      var gecc = 2;
      geCallCount.should.equal(gecc);
      T('loadFixedTerms(): works with an empty array, ' +
        'should not call getEntries(), and ' +
        'still calls back truly asynchronously (i.e. on the next event-loop).');
      dict.loadFixedTerms([], 0, err => {
        expect(err).to.equal(null);
        Object.keys(dict.fixedTermsCache).length.should.equal(4);
        geCallCount.should.equal(gecc);
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },

    cb => {
      T('loadFixedTerms(): forwards getEntries() error');
      var bk = dict.getEntries;
      dict.getEntries = (options, cb) => { cb('err1'); }

      dict.loadFixedTerms([''], 0, err => {
        err.should.equal('err1');
        dict.getEntries = bk;
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },


    // --- Test _getFTMatchesForString().
    cb => {
      T('_getFTMatchesForString(): empty string returns all valid matches ' +
        'that have an exact match for their fixedTermsCache-key, sorted');
      var idts = [
        {i:'c', s:'c2'}, 'a',  // These match a fixedTermsCache key exactly, ..
        {i:'c', s:'c1'}, 'c', {i:'d', s:'xx'}, {i:'xx'}  // .. and these don't.
      ];
      dict._getFTMatchesForString('', {idts}).should.deep.equal([
        { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F', z:z2},
        { i:'c', d:'X', t:[{s:'c1'}, {s:'c2'}], s:'c2', w:'F', z },
      ]);
      cb();
    },

    cb => {
      T('_getFTMatchesForString(): searches for string, and prunes z-prop');
      var idts = [ 'a', {i:'c', s:'c2'} ];
      dict._getFTMatchesForString('a', {idts, z: false}).should.deep.equal([
        { i:'a', d:'X', t:[{s:'a1'}, {s:'a2'}], s:'a1', w:'F'},
      ]);
      cb();
    },

    cb => {
      T('_getFTMatchesForString(): searches for infix, and prunes z-prop');
      var idts = [ 'b', {i:'c', s:'c2'} ];
      dict._getFTMatchesForString('1', {idts, z: 'b'}).should.deep.equal([
        { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'G', z:z2},
      ]);
      cb();
    },

    cb => {
      T('_getFTMatchesForString(): only returns fixedTermsCache items ' +
        'that were made choosable by being in the given `options.idts`');
      dict._getFTMatchesForString('b', {idts: ['a']}).should.deep.equal([]);

      dict._getFTMatchesForString('b', {idts: ['b']}).should.deep.equal([
        { i:'b', d:'X', t:[{s:'b1'}, {s:'b2'}], s:'b1', w:'F', z},
      ]);
      cb();
    },


    // --- Test addExtraMatchesForString().
    cb => {
      T('addExtraMatchesForString(): adds \'extra\' matches into the given ' +
        'array (after the one refTerm, and before normal matches), ' +
        'and deduplicates (i.e. removes matches from the given array, that ' +
        'are also in the extra matches, based on equal `i` and `s`)');
      cnt = 0;
      var ms = [  // = Matches that would be returned by a subclass.
        { i:'',  d:'',  s:'rt', w:'R' },
        { i:'x', d:'X', s:'x9', w:'S' },
        { i:'c', d:'X', s:'c2', w:'S' },
        { i:'y', d:'X', s:'y9', w:'T' },
      ];
      var idts = [ {i:'c', s:'c2'}, 'a' ];
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
    },
    cb => {
      T('addExtraMatchesForString(): does not add matches, nor deduplicates, ' +
        'for a result-page nr. 2');
      var ms = [
        { i:'c', d:'X', s:'c2', w:'S' },
      ];
      var options = { idts: [{i:'c', s:'c2'}, 'a'], perPage: 1, page: 2 };
      dict.addExtraMatchesForString('', ms, options, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { i:'c', d:'X', s:'c2', w:'S' },
        ]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },
    cb => {
      T('addExtraMatchesForString(): can add a number-matchObject, in front');
      var ms = [
        { i:'c', d:'X', s:'c2', w:'S' },
      ];
      dict.addExtraMatchesForString('10.5', ms, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          { i:'00:1.05e+1', d:'00', s: '10.5', x: '[number]', w:'N' },
          { i:'c', d:'X', s:'c2', w:'S' },
        ]);
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },
    cb => {
      T('addExtraMatchesForString(): does not add a number-matchObject ' +
        'if the subclass already returned a (usually more informative) match ' +
        ' for it; and moves that match to the top');
      var ms = [
        { i: 'c', d: 'X', s: 'c2', w: 'S' },
        { i: '00:1.2e+1', d: '00', s: '12', x: 'the amount of twelve',
          t: [ {s: '12'}, {s: 'twelve'}, {s: 'dozen'} ],  w:'S'
        }
      ];
      dict.addExtraMatchesForString('12', ms, 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([
          Object.assign({}, ms[1], {w: 'N'}),
          ms[0]
        ]);
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },

    // --- Test number-match making().
    cb => {
      T('_getNumberMatchForString() with custom `number-string settings`');
      dict._getNumberMatchForString('5').should.deep.equal(
        {i: '00:5e+0', d: '00', s: '5', x: '[number]', w: 'N'});

      var dict2 = new Dictionary({numberMatchConfig: false});
      dict2._getNumberMatchForString('5').should.equal(false);

      dict2 = new Dictionary(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict2._getNumberMatchForString('5')  .should.deep.equal(
        {i: 'XX:5e+0', d: 'XX', s: '5', x: '[number]', w: 'N'});

      dict._getNumberMatchForString('5').should.deep.equal(
        {i: '00:5e+0', d: '00', s: '5', x: '[number]', w: 'N'});
      cb();
    },

  ], CB);
}

//test.act = 2;
