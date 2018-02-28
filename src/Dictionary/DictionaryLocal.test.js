const DictionaryLocal = require('./DictionaryLocal');
const {deepClone} = require('./helpers/util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('DictionaryLocal.js', function() {
  var dict;

  // These dictInfos will be used in most of the tests.
  var di1 = {id: 'A', name: 'Name 1'};
  var di2 = {id: 'B', name: 'Name 2'};
  var di3 = {id: 'C', name: 'Name 3'};
  var di4 = {id: 'D', name: 'Name 4'};

  // These entries will be used in many of the tests.
  var e1 = {id:'A:01', dictID:'A', terms: [ {str:'in'} ] };
  var e2 = {id:'A:02', dictID:'A', terms: [ {str:'inn',    style:'i'} ] };
  var e3 = {id:'B:01', dictID:'B', terms: [ {str:'Ca2+',   style:'u2-3'} ] };
  var e4 = {id:'B:02', dictID:'B', terms: [ {str:'Na+Cl-', style:'u2u5'} ] };

  // These refTerms will be used in several of the tests.
  var r1 = 'it';
  var r2 = 'that';
  var r3 = 'this';

  var cnt; // Helper for testing callback asynchronicity.

  var D = function(obj) { console.dir(obj, {depth: 4}); }  // Easy log-function.

  beforeEach(function() {
    cnt = 0;
  });


  describe('dictInfos: addDictInfos()', function() {
    var di1x = {id: 'A', name: 'Name 1', xx: 1};
    var di2u = {id: 'B', name: 'Name 2b'};
    var di5p = {id: '' , name: 'Name 5'};
    var di6p = {id: 'F', name: ''      };
    var di7s = {id: 'G', name: 'Name 6',  // DictInfo with functions, given..
          f_id : 'function (di, e) { return di.id + \':\' + e.id; }', // as..
          f_aci: 'function (x) { return x * 10; }' };             // Strings.
    var di7f = {id: 'G', name: 'Name 6',  // Same one, but how it looks after..
          f_id : function (di, e) { return `${di.id}:${e.id}` },  // adding it.
          f_aci: function (x) { return x * 10; } };

    var di1Err = 'dictInfo for \'A\' already exists';
    var dipErr = 'dictInfo misses a required property: id or name';

    before(function() {
      dict = new DictionaryLocal();
    });

    it('adds a single dictInfo, prunes an invalid property, ' +
      'and calls back on the next event-loop', function(cb) {
      dict.addDictInfos(di1x, err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di1]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds multiple dictInfos, and sorts them in internal storage',
      function(cb) {
      dict.addDictInfos([di3, di2], err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di1, di2, di3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('gives one error, for adding a single, duplicate (same `id`) dictInfo',
      function(cb) {
      dict.addDictInfos(di1, err => {
        err.should.deep.equal(di1Err);
        dict.dictInfos.should.deep.equal([di1, di2, di3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('gives an array of errors for multiple adds, with an error for adding ' +
      'a duplicate, and one for missing `id` or `name`, ' +
      'and a `null` for one successful add', function(cb) {
      dict.addDictInfos([di1, di4, di5p, di6p], err => {
        err.should.deep.equal([di1Err, null, dipErr, dipErr]);
        dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds a dictInfo with a custom `f_id` and `f_aci`, represented as ' +
      'Strings, and converts them to real Functions', function(cb) {
      dict.addDictInfos(di7s, err => {
        // Note: `dict.dictInfos.should.deep.equal(...)` can not be used here,
        // because functions-properties (f_*) are never seen as deep-equal.
        // So here, we test their equality more manually, and by their behavior.
        // + And we remove this dictInfo afterwards, so that any subsequent
        //   `dictInfos`-test can avoid this difficulty.
        var N = 4;
        var G = di7f.id;
        dict.dictInfos.should.have.length(5);
        Object.keys(dict.dictInfos[N]).should.have.length(4);
        dict.dictInfos[N].id.should.equal(G);
        dict.dictInfos[N].name.should.equal(di7f.name);
        dict.dictInfos[N]    .f_id( {id:'S'}, {id:3} )
          .should.equal( di7f.f_id( {id:'S'}, {id:3} ) );
        dict.dictInfos[N]    .f_aci(1)
          .should.equal( di7f.f_aci(1) );
        cnt.should.equal(1);
        dict.deleteDictInfos(G, err => {
          expect(err).to.equal(null);
          dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
          cb();
        });
      });
      cnt = 1;
    });

    it('makes a truly async callback, also for an empty array', function(cb) {
      dict.addDictInfos([], err => {
        expect(err).to.equal(null);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('dictInfos: updateDictInfos()', function() {
    var di4u = {id: 'D', name: 'Name 4b'};
    var di5u = {id: 'E', name: 'Name 5'};
    var di5p = {id: '' , name: 'Name 5'};

    var di5uErr = 'dictInfo for \'E\' does not exist';
    var di5pErr = 'dictInfo for \'\' does not exist';

    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addDictInfos([di1, di4], cb);
    });

    it('updates a single dictInfo', function(cb) {
      dict.updateDictInfos(di4u, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(di4u);
        dict.dictInfos.should.deep.equal([di1, di4u]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('updates multiple dictInfos, and reports errors: ' +
        'one\'s ID does not exist, one\'s `id` property is missing, ' +
        'and one succeeds', function(cb) {
      dict.updateDictInfos([di5u, di5p, di4], (err, res) => {
        err.should.deep.equal([di5uErr, di5pErr, null]);
        res.should.deep.equal([null, null, di4]);
        dict.dictInfos.should.deep.equal([di1, di4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('dictInfos: deleteDictInfos()', function() {
    var di2  = {id: 'B', name: 'Name 2'};
    var di3  = {id: 'C', name: 'Name 3'};
    var di4  = {id: 'D', name: 'Name 4'};
    var di5u = {id: 'E', name: 'Name 5'};
    var e    = {id:'B:01', dictID:'B', terms: [ {str:'Ca2+'} ] };

    var di2dErr = 'dictInfo for \'B\' still has associated entries';
    var di5uErr = 'dictInfo for \'E\' does not exist';

    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addDictInfos([di2, di3, di4], (err) => {
        if (err)  return cb(err);
        dict.addEntries([e], cb);
      });
    });

    it('deletes a single dictInfo', function(cb) {
      dict.deleteDictInfos(di3.id, err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di2, di4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('deletes multiple dictInfos: one succeeds, one errors as it still has' +
      'associated entries, one errors as it does not exist', function(cb) {
      dict.deleteDictInfos([di4.id, di2.id, di5u.id], err => {
        err.should.deep.equal([null, di2dErr, di5uErr]);
        dict.dictInfos.should.deep.equal([di2]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('entries: addEntries()', function() {
    var e1s = {id:'A:01', dictID:'A', terms: 'in' };  // With short-form 'terms'.
    var e5p = {id:''    , dictID:'A', terms: 'in' };  // Property-error.
    var e6p = {id:'A:06', dictID:'' , terms: 'in' };  //  "
    var e7p1= {id:'A:07', dictID:'A', terms: ''   };  //  "
    var e7p2= {id:'A:07', dictID:'A', terms: []   };  //  "
    var e7p3= {id:'A:07', dictID:'A', terms: [''] };  //  "
    var e8  = {id:'X:01', dictID:'X', terms: 'in' };  // Non-existent dictID.
    var e11 = {id:'A:00', dictID:'B', terms: [ {str:'in'} ] }; // Sorts weirdly.

    var e1Err = 'entry for \'A:01\' already exists';
    var epErr = 'entry misses a required property: id, dictID, or terms';
    var etErr = 'invalid term';
    var e8Err = 'entry is linked to non-existent dictID \'X\'';

    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addDictInfos([di1, di2, di3, di4], cb);
    });

    it('adds a single, simplified entry', function(cb) {
      dict.addEntries(e1s, err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds multiple entries, and sorts them in internal storage',
      function(cb) {
      dict.addEntries([e3, e2], err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1, e2, e3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add entry if one with same ID already exists', function(cb) {
      dict.addEntries(e1, err => {
        err.should.deep.equal(e1Err);
        dict.entries.should.deep.equal([e1, e2, e3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('accepts multiple additions, and reports error for duplicate addition ' +
      'via an error-msg/`null` array', function(cb) {
      dict.addEntries([e1, e4], err => {
        err.should.deep.equal([e1Err, null]);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('reports errors for missing `id`, `dictID`, or `terms`', function(cb) {
      dict.addEntries([e5p, e6p, e7p1], err => {
        err.should.deep.equal([epErr, epErr, epErr]);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('reports error for empty `terms` array', function(cb) {
      dict.addEntries([e7p2], err => {
        err.should.deep.equal([epErr]);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('reports error for invalid term', function(cb) {
      dict.addEntries(e7p3, err => {
        err.should.deep.equal(etErr);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('reports error for nonexistent linked dictID', function(cb) {
      dict.addEntries(e8, err => {
        err.should.deep.equal(e8Err);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('internally sorts on dictID first and then on conceptID', function(cb) {
      dict.addEntries([e11], err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1, e2, e11, e3, e4]);
        cnt.should.equal(1);
        dict.deleteEntries(e11.id, cb);  // Clean up.
      });
      cnt = 1;
    });

    var e9i  = {id:999,      dictID:'B', terms: [ {str:'in'} ] }; // Integer ID.
    var e9   = {id:'B:0999', dictID:'B', terms: [ {str:'in'} ] };
    var e9Err = 'entry for \'B:0999\' already exists';

    it('converts an Integer concept-ID to String, using the default ' +
      'conversion function', function(cb) {
      dict.addEntries([e9i], err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1, e2, e3, e4, e9]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('converts an Integer concept-ID to String, and reports error ' +
      'if the string-ID for the given int-ID already exists', function(cb) {
      dict.addEntries([e9i], err => {
        err.should.deep.equal([e9Err]);
        dict.entries.should.deep.equal([e1, e2, e3, e4, e9]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var di7 = {id: 'G', name: 'Name 6',
               f_id : 'function (di, e) { return di.id + \':\' + e.id; }' };
    var e10i = {id:99,     dictID:'G', terms: [ {str:'in'} ] };
    var e10  = {id:'G:99', dictID:'G', terms: [ {str:'in'} ] };

    it('converts an Integer concept-ID to String, using a custom function',
      function(cb) {
      dict.addDictInfos(di7, err => {  // Add dictInfo that has an `f_id()`.
        dict.addEntries([e10i], err => {
          expect(err).to.equal(null);
          dict.entries.should.deep.equal([e1, e2, e3, e4, e9, e10]);
          cnt.should.equal(1);
          cb();
        });
        cnt = 1;
      });
    });
  });


  describe('entries: updateEntries()', function() {
    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addDictInfos([di1, di2, di3, di4], err => {
        if (err)  return cb(err);
        dict.addEntries([e1, e2, e3, e4], cb);
      });
    });

    var e5u = {id:'E:01', z: 'x'};
    var e5p = {id:''    , dictID:'A', terms: 'in' };
    var e8u = {id:'A:01', dictID: 'X' };
    var e5uErr = 'entry for \'E:01\' does not exist';
    var e5pErr = 'entry for \'\' does not exist';
    var e8Err  = 'entry is linked to non-existent dictID \'X\'';

    it('reports errors for: non-existent ID; ' +
      'missing `id` property; non-existent linked dictID', function(cb) {
      dict.updateEntries([e5u, e5p, e8u], (err, res) => {
        err.should.deep.equal([e5uErr, e5pErr, e8Err]);
        res.should.deep.equal([null, null, null]);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    // Initial entry: e1.  Update-object: e1uObj1.  Resulting entry: e1uRes1.
    //       e1 = {id:'A:01', dictID:'A', terms: [ {str:'in'} ] };
    var e1uObj1 = {id:'A:01', dictID:'B',         zDel: true, z: {a: 1, b: 2}};
    var e1uRes1 = {id:'A:01', dictID:'B', terms:[{str:'in'}], z: {a: 1, b: 2}};

    it('can in a single update: update `dictID`, and apply `zDel` before `z`; '+
      'and updates internal `entries`-sorting based on new `dictID`',
      function(cb) {
      dict.updateEntries(e1uObj1, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes1);
        dict.entries.should.deep.equal([e2, e1uRes1, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
     });

    // Note: the initial entry == result of the above operation, i.e. e1uRes1.
    var e1uObj2 = {id:'A:01', dictID:'A', termsDel:'q', terms:'q',
      z:{    b:5,c:3,d:4}};
    var e1uRes2 = {id:'A:01', dictID:'A', terms:[{str:'in'}, {str:'q'}],
      z:{a:1,b:5,c:3,d:4}};

    it('can in a single-item array-update: apply `termsDel` before `terms`, ' +
      'add a single term via the `terms`-prop, and merge properties into `z`',
      function(cb) {
      dict.updateEntries([e1uObj2], (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([e1uRes2]);
        dict.entries.should.deep.equal([e1uRes2, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var e1uObj3 = {id:'A:01', termsDel: 'q',
                   terms: [{str:'in', style:'i'}, 'v', {str:'v', style:'i'}],
                   zDel: 'b'};
    var e1uRes3 = {id:'A:01', dictID:'A',
                   terms: [{str:'in', style:'i'}, {str:'v', style:'i'}],
                   z: {a:1, c:3, d:4}};

    it('can in a single update: delete a single term, ' +
      'add/update multiple terms (including a duplicate one), and ' +
      'delete a single `z`-property', function(cb) {
      dict.updateEntries(e1uObj3, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes3);
        dict.entries.should.deep.equal([e1uRes3, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var e1uObj4 = {id:'A:01', termsDel: ['X', 'v'], terms: 'in',
                   zDel: ['c', 'd', 'X']};
    var e1uRes4 = {id:'A:01', dictID:'A', terms: [ {str:'in'} ],
                   z: {a: 1}};

    it('can in a single update: delete multiple terms (ignoring absent one), ' +
      'update one, and delete multiple `z`-properties (ignoring absent one)',
      function(cb) {
      dict.updateEntries(e1uObj4, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes4);
        dict.entries.should.deep.equal([e1uRes4, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var e1uObj5 = {id:'A:01', termsDel: 'in', zDel: true, z: {xx:'xx'} };
    var e1u5Err = 'entry would have no terms left';

    it('errors when trying to delete last term, ' +
      'and applies none of the other changes', function(cb) {
      dict.updateEntries(e1uObj5, (err, res) => {
        expect(err).to.equal(e1u5Err);
        expect(res).to.equal(null);
        dict.entries.should.deep.equal([e1uRes4, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var e1uObj6 = {id:'A:01', zDel: true };
    var e1uRes6 = e1;

    it('can delete `z` fully', function(cb) {
      dict.updateEntries(e1uObj6, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes6);
        dict.entries.should.deep.equal([e1uRes6, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    var e1uObj7 = {id:'A:01', zDel: ['xy'] };
    var e1uRes7 = e1;

    it('works with a `zDel` array, on entries without `z`-prop', function(cb) {
      dict.updateEntries(e1uObj7, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes7);
        dict.entries.should.deep.equal([e1uRes7, e2, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('entries: deleteEntries()', function() {
    var e5u = {id:'E:01', z: 'x'};
    var e5uErr = 'entry for \'E:01\' does not exist';

    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addDictInfos([di1, di2, di3, di4], err => {
        if (err)  return cb(err);
        dict.addEntries([e2, e3, e4], cb);
      });
    });

    it('deletes a single entry', function(cb) {
      dict.deleteEntries(e3.id, err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e2, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('deletes multiple entries; with one succeeding, and one errors ' +
      'because its ID does not exist in the storage', function(cb) {
      dict.deleteEntries([e4.id, e5u.id], err => {
        err.should.deep.equal([null, e5uErr]);
        dict.entries.should.deep.equal([e2]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('refTerms: addRefterms()', function() {
    var r4Err    = 'refTerm \'xx\' does not exist';
    var emptyErr = 'empty refTerm';

    before(function() {
      dict = new DictionaryLocal();
    });

    it('adds a single refTerm', function(cb) {
      dict.addRefTerms(r2, err => {
        expect(err).to.equal(null);
        dict.refTerms.should.deep.equal([r2]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('adds multiple refTerms, deduplicates them, ' +
      'and sorts them in internal storage', function(cb) {
      dict.addRefTerms([r3, r2, r1], err => {
        expect(err).to.equal(null);
        dict.refTerms.should.deep.equal([r1, r2, r3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('does not add the empty string', function(cb) {
      dict.addRefTerms([''], err => {
        err.should.deep.equal([emptyErr]);
        dict.refTerms.should.deep.equal([r1, r2, r3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('refTerms: deleteRefTerms()', function() {
    var r4 = 'xx';
    var r4Err = 'refTerm \'xx\' does not exist';

    before(function(cb) {
      dict = new DictionaryLocal();
      dict.addRefTerms([r1, r2, r3], cb);
    });

    it('deletes a single refTerm', function(cb) {
      dict.deleteRefTerms(r2, err => {
        expect(err).to.equal(null);
        dict.refTerms.should.deep.equal([r1, r3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('deletes multiple refTerms, ' +
      'and reports an error for a non-existent one', function(cb) {
      dict.deleteRefTerms([r4, r3], err => {
        err.should.deep.equal([r4Err, null]);
        dict.refTerms.should.deep.equal([r1]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
  });


  describe('-> addDictionaryData()', function() {
    var di2u, data1, data2;
    var edErr = 'an entry tries to override dictID \'C\'';

    before(function() {
      var augment = (...args) => Object.assign({}, ...args);
      var withoutDictID = e => { e = deepClone(e);  delete e.dictID;  return e;};

      data1 = [
        augment(di1, { entries: [e1, e2] }),
        di2
      ];

      di2u = {id: 'B', name: 'Name 2b'};
      data2 = [
        augment(di3, { entries: [  // Add dictInfo. Entries: 1 adds, two update.
          {id:3, terms:'cd', z: {a:1}},  // Use Integer conceptID, omit dictID.
          {id:3, terms:'ab', z: {b:2}, dictID:'C'}, // +terms,z; explicit dictID.
          {id:3, dictID:'A'},  // Try(+fail) to override with different dictID.
        ]}),
        augment(di2u, { entries: [  // Update dictInfo name.
          withoutDictID(e4),  // Omit dictID.
          e3,  // Add in unsorted order.
        ]}),
      ];

      dict = new DictionaryLocal();
    });

    it('can in one synchronous call: add dictInfos, entries, and refTerms',
      function() {
      expect(dict.addDictionaryData(data1, [r1])).to.equal(null);
      dict.dictInfos.should.deep.equal([di1, di2]);
      dict.entries.should.deep.equal([e1, e2]);
      dict.refTerms.should.deep.equal([r1]);
    });

    // --- Test addDictionaryData().
    it('can add or update dictInfos and add refTerms, with the same features ' +
      'as the asynchronous calls, plus some convenience features',
      // The features tested here in the combined test, are:
      // - it sorts (in internal storage) entries by dictID, then conceptID;
      // - it accepts entries with an integer conceptID;
      // - it accepts entries with omitted dictID, or overriding dictID;
      // - it updates entries by adding/updating term-items;
      // - it merges z-properties during entry-updates;
      // - it collects errors in an array, and does not collect `null`s.
      function() {
      dict.addDictionaryData(data2, [r3, r2, r2]).should.deep.equal([edErr]);
      dict.dictInfos.should.deep.equal([di1, di2u, di3]);
      dict.entries.should.deep.equal([e1, e2, e3, e4,
        {dictID:'C', id:'C:0003', terms:[{str:'cd'}, {str:'ab'}], z:{a:1, b:2}}
      ]);
      dict.refTerms.should.deep.equal([r1, r2, r3]);
    });

    it('accepts undefined, returns `null` on no errors', function() {
      expect(dict.addDictionaryData()).to.equal(null);
    });

    it('accepts dictInfos without an `entries` property', function() {
      expect(dict.addDictionaryData([di4, di2])).to.equal(null);
      dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
    });
  });


  // An extra dictInfo and entry, used in many get-type tests:
  var di5 = {id: 'C2', name: 'Name 0'};
  var e12 = {id:'B:00', dictID:'C', terms: [{str:'in'}, {str:'Iz'}, {str:'hi'}],
             z: {a:1, b:2, c:3}}; // Trick entry: dictID 'C' but dict-B-like ID.

  function loadDataForGet() {
    // `augEntr` = augment dictInfo object with entries array, and clone it too.
    var augEntr = (dictInfo, entries) => Object.assign({}, dictInfo, {entries});

    dict = new DictionaryLocal();
    dict.addDictionaryData([
      augEntr(di1, [
          e1, e2
        ]),
      augEntr(di2, [
          e3, e4
        ]),
      augEntr(di3, [
          e12
        ]),
      di4,
      di5
    ],
    [ r1, r2, r3 ] );

    dict.dictInfos.should.deep.equal([di1, di2, di3, di4, di5]);
    dict.entries.should.deep.equal([e1, e2, e3, e4, e12]);
    dict.refTerms.should.deep.equal([r1, r2, r3]);
    ///console.dir(dict, {depth: 4});
  }


  describe('get: getDictInfos()', function() {
    before(function() {
      loadDataForGet();
    });

    it('gets all, by default sorted by id', function(cb) {
      dict.getDictInfos(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di1,di2,di3, di5, di4]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('gets for one dictID', function(cb) {
      dict.getDictInfos({filter: {id: 'B'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di2]});
        cb();
      });
    });
    it('gets for multiple dictIDs, leaving out invalid ones, ' +
      'and sorts by `id`', function(cb) {
      dict.getDictInfos({filter: {id: ['D', 'B', 'xx']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di2, di4]});
        cb();
      });
    });
    it('gets a `page` 1, with a `perPage` of 1', function(cb) {
      dict.getDictInfos({page: 1, perPage: 1}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di1]});
        cb();
      });
    });
    it('gets a `page` 2, with a `perPage` of 3', function(cb) {
      dict.getDictInfos({page: 2, perPage: 3}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di5, di4]});
        cb();
      });
    });
    it('filters for several ids, sorts by name, and maps ' +
      'an invalid `page` number onto 1, using a `perPage` of 2', function(cb) {
      dict.getDictInfos(
        {filter: {id: ['D', 'C', 'C2']}, sort: 'name', page: -2, perPage: 2},
        (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [di5, di3]});
          cb();
        });
    });
    it('filters for a dictInfo-name, and maps an invalid `perPage` onto 1',
      function(cb) {
      dict.getDictInfos(
        {filter: {name: ['Name 2']}, perPage: 0},
        (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [di2]});
          cb();
        });
    });
  });


  describe('get: getEntries()', function() {
    before(function() {
      loadDataForGet();
    });

    it('gets all, and sorts by default by `dictID`, then `id`', function(cb) {
      dict.getEntries(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e3, e4, e12]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('gets all, sorting by entries\' first term\'s string', function(cb) {
      dict.getEntries({sort: 'str'}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e1, e12, e2, e4]});
        cb();
      });
    });
    it('gets all, sorted by their `id`', function(cb) {
      dict.getEntries({sort: 'id'}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e12, e3, e4]});
        cb();
      });
    });
    it('gets for one `id`', function(cb) {
      dict.getEntries({filter: {id: 'B:01'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3]});
        cb();
      });
    });
    it('gets for multiple IDs, leaving out invalid ones, ' +
      'and sorts by default by `dictID` first', function(cb) {
      dict.getEntries({filter: {id: ['B:00', 'B:01', 'XX']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e12]});
        cb();
      });
    });
    it('does not error for all absent ids, just returns `[]`', function(cb) {
      dict.getEntries({filter: {id: ['XX', 'YY']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    });
    it('gets for one `dictID`, and `id`', function(cb) {
      dict.getEntries({filter: {dictID: 'C', id: 'B:00'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e12]});
        cb();
      });
    });
    it('gets for multiple dictIDs', function(cb) {
      dict.getEntries({filter: {dictID: ['C', 'A']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e12]});
        cb();
      });
    });
    it('gets all, using pagination settings', function(cb) {
      dict.getEntries({page: 2, perPage: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e4]});
        cb();
      });
    });
    it('gets for one ID, with all `z`-props', function(cb) {
      dict.getEntries({filter: {id: 'B:00'}, z: true}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e12]});
        res.items[0].z.should.deep.equal({a: 1, b: 2, c: 3});
        cb();
      });
    });
    it('gets for on ID, with deleted `z`-props', function(cb) {
      dict.getEntries({filter: {id: 'B:00'}, z: false}, (err, res) => {
        expect(err).to.equal(null);
        expect(res.items[0].z).to.equal(undefined);
        cb();
      });
    });
    it('gets for one ID, and deletes `z` if requested to keep only ' +
      'a non-existent `z`-prop', function(cb) {
      dict.getEntries({filter: {id: 'B:00'}, z: 'x'}, (err, res) => {
        expect(err).to.equal(null);
        expect(res.items[0].z).to.equal(undefined);  // Note: undefined, not {}.
        cb();
      });
    });
    it('gets for one ID, and keeps only one requested `z`-prop',
      function(cb) {
      dict.getEntries({filter: {id: 'B:00'}, z: 'b'}, (err, res) => {
        expect(err).to.equal(null);
        expect(res.items[0].z).to.deep.equal({b: 2});
        cb();
      });
    });
    it('gets for one ID, keeps only requested `z`-props, ' +
      'and ignores a non-existent `z`-prop', function(cb) {
      dict.getEntries({filter: {id: 'B:00'}, z: ['c','a','x']}, (err, res) => {
        expect(err).to.equal(null);
        expect(res.items[0].z).to.deep.equal({a: 1, c: 3});
        cb();
      });
    });
  });


  describe('get: getRefTerms()', function() {
    before(function() {
      loadDataForGet();
    });

    it('gets all', function(cb) {
      dict.getRefTerms(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r1, r2, r3]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('gets for one String', function(cb) {
      dict.getRefTerms({filter: {str: 'that'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r2]});
        cb();
      });
    });
    it('gets for several Strings, and sorts', function(cb) {
      dict.getRefTerms({filter: {str: ['this', 'it']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r1, r3]});
        cb();
      });
    });
  });


  // Before testing `getMatchesForString()`:
  // prepare all possible match-objects, using a function that
  // can make match-objects for an:  entry + term-object + match-type.
  function s(e, pos = 0, type = 'S') {
    return Object.assign({},  e,  e.terms[pos],  {type: type});
  }
  var s1 = s(e1);  var t1 = s(e1, 0, 'T');
  var s2 = s(e2);  var t2 = s(e2, 0, 'T');
  var s3 = s(e3);  var t3 = s(e3, 0, 'T');
  var s4 = s(e4);  var t4 = s(e4, 0, 'T');  var f4 = s(e4, 0, 'F');
  var s12 = s(e12);  var t12 = s(e12, 0, 'T');  // e12 terms: in, Iz, hi.
  var s12b = s(e12, 1);  var t12b = s(e12, 1, 'T');  var f12b = s(e12, 1, 'F');
  var s12c = s(e12, 2);  var t12c = s(e12, 2, 'T');

  // Make a match-objects for some refTerms.
  var rm1 = {id:'', dictID:'', str:'it', descr:'[referring term]', type:'R'};
  var r9 = 'i';  // A one-letter refTerm.
  var rm9 = Object.assign({}, rm1, {str: r9});


  describe('get matches: getMatchesForString()', function() {
    before(function() {
      loadDataForGet();
    });

    // The tests cover:
    // - normal string-search: - with as prefix, - and infix, - with no match.
    // - filter for one/more dictIDs.
    // - sort by one/more dictID, then S/T, case-insens. term-str, own-dictID.
    // - combination of filter+sort.
    // - pagination.
    // - z-prop pruning (i.e.: 'z-object subproperty pruning').
    it('can match multiple terms per entry; sorts by ' +
      'S/T-type match first, then case-insensitively by string-term, ' +
      'and then by its own dictID', function(cb) {
      dict.getMatchesForString('i', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
                      s1, s12,       s2,  s12b,      t12c
          // entry:   e1  e12        e2   e12        e12
          // type:    S   S          S    S          T
          // string:  in  *in|Iz|hi  inn  in|*Iz|hi  in|Iz|*hi
          // dictID:  A   C          A    C          C
        ]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;  // Test for true-asynchronicity at least one, for this function.
    });
    it('sorts by given dictIDs first, then S/T, ' +
      'and then case-insensitively by term-string', function(cb) {
      dict.getMatchesForString('i', {sort: {dictID: ['C']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
                      s12,       s12b,      t12c,      s1, s2,
          // entry:   e12        e12        e12        e1  e2
          // type:    S          S          T          S   S
          // string:  *in|Iz|hi  in|*Iz|hi  in|Iz|*hi  in  inn
          // dictID:  C          C          C          A   A
        ]});
        cb();
      });
    });
    it('matches case-insensitively, ' +
      'and sorts S(prefix)-matches before T(infix)-matches', function(cb) {
      dict.getMatchesForString('N', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
                      s4,     t1, t12,       t2
          // entry:   e4      e1  e12        e2
          // type:    S       T   T          T
          // string:  Na+Cl-  in  *in|Iz|hi  inn
          // dictID:  B       A   C          A
        ]});
        cb();
      });
    });
    it('filters by a given dictID', function(cb) {
      dict.getMatchesForString('n', {filter: {dictID: 'B'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s4]});
        cb();
      });
    });
    it('sorts first by given dictID first, then by S/T-type', function(cb) {
      dict.getMatchesForString('n', {sort: {dictID: 'C'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
                      t12,       s4,     t1, t2
          // entry:   e12        e4      e1  e2
          // type:    T          S       T   T
          // string:  *in|Iz|hi  Na+Cl-  in  inn
          // dictID:  C          B       A   A
        ]});
        cb();
      });
    });
    it('sorts-by-dictID, only by dividing matches in two groups: ' +
      'those with a dictID in the list, and those not; so it does not follow ' +
      'any order in `options.sort.dictID`', function(cb) {
      dict.getMatchesForString('n', {sort: {dictID: ['C','A']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
                      t1, t12,       t2,  s4,
          // entry:   e1  e12        e2   e4
          // type:    T   T          T    S
          // string:  in  *in|Iz|hi  inn  Na+Cl-
          // dictID:  A   C          A    B
        ]});
        cb();
      });
    });
    it('can combine a filter for dictIDs, with a narrower sort, ' +
      'which puts matches with one of those dictIDs first', function(cb) {
      dict.getMatchesForString('n',
        { filter: {dictID: ['B', 'C']}, sort: {dictID: ['C']} }, (err, res) =>
      {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [t12, s4]});  // dictIDs: C, B.
        cb();
      });
    });
    it('can return zero matches', function(cb) {
      dict.getMatchesForString('xx', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    });
    it('returns no matches for an empty string', function(cb) {
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    });
    it('sorts by term-string, then dictID, and then by term-position ' +
      'in its entry\'s term-list, and then by conceptID', function(cb) {
      var e91 = {id:'A:00a', dictID:'A', terms: [ {str: 'in'} ] };
      var e92 = {id:'A:00b', dictID:'A', terms: [ {str: 'xx'}, {str: 'in'} ] };
      var s91  = s(e91);
      var s92b = s(e92, 1);
      dict.addEntries([e91, e92], (err, res) => {  // Temp. add two new entries.
        dict.entries.should.deep.equal([e91, e92, e1, e2, e3, e4, e12]);

        dict.getMatchesForString('in', 0, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [
                           s91,   s1,   s92b,   s12,        s2
            // entry:      e91    e1    e92     e12         e2
            // type:       S      S     S       S           S
            // string:     in     in    xx|*in  *in|Iz|hi   inn
            // dictID:     A      A     A       C    (sic)  A
            // term-pos:   0      0     1       0           0
            // conceptID:  A:00a  A:01  A:00b   B:00 (sic)  A:02
          ]});

          dict.deleteEntries([e91.id, e92.id], (err, res) => { // Clean up again.
            dict.entries.should.deep.equal([e1, e2, e3, e4, e12]);
            cb();
          });
        });
      })
    });
    it('supports pagination', function(cb) {
      dict.getMatchesForString('in', {page: 1, perPage: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s1, s12]});  // [in, *in|Iz|hi], --inn--
        cb();
      });
    });
    it('supports pagination, page 2', function(cb) {
      dict.getMatchesForString('in', {page: 2, perPage: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s2]});  // --in, *in|Iz|hi--, [inn]
        cb();
      });
    });
    it('z-prop pruning: deletes `z` completely', function(cb) {
      dict.getMatchesForString('hi', {z: false}, (err, res) => {
        expect(err).to.equal(null);
        var m = Object.assign({}, s12c);  // (Shallow-)clone before modifying.
        delete m.z;
        res.should.deep.equal({items: [m]});
        cb();
      });
    });
    it('z-prop pruning: deletes `z` completely when asked to keep only ' +
      'a non-existent sub-property', function(cb) {
      dict.getMatchesForString('hi', {z: 'xx'}, (err, res) => {
        expect(err).to.equal(null);
        var m = Object.assign({}, s12c);
        delete m.z;
        res.should.deep.equal({items: [m]});
        cb();
      });
    });
    it('z-prop pruning: keeps all', function(cb) {
      dict.getMatchesForString('hi', {z: true}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s12c]});
        cb();
      });
    });
    it('z-prop pruning: keeps one', function(cb) {
      dict.getMatchesForString('hi', {z: 'b'}, (err, res) => {
        expect(err).to.equal(null);
        var m = Object.assign({}, s12c, {z: {b: 2}});
        res.should.deep.equal({items: [m]});
        cb();
      });
    });
    it('z-prop pruning: keeps some, ignoring nonexistent one', function(cb) {
      dict.getMatchesForString('hi', {z: ['c', 'xx', 'a']}, (err, res) => {
        expect(err).to.equal(null);
        var m = Object.assign({}, s12c, {z: {a: 1, c: 3}});
        res.should.deep.equal({items: [m]});
        cb();
      });
    });

    it('returns a refTerm match', function(cb) {
      dict.getMatchesForString('it', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [rm1]});
        cb();
      });
    });
    it('returns a refTerm match, sorted before other matches, no matter what ' +
      'the other matches should be sorted like', function(cb) {
      dict.addDictionaryData([], [r9]);  // Temporarily add an extra refTerm.
      dict.refTerms.should.deep.equal([r9, r1, r2, r3]);

      dict.getMatchesForString('i', {sort: {dictID: 'C'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [rm9, s12, s12b, t12c, s1, s2]});

        dict.deleteRefTerms(r9, err => {  // Clean up again.
          dict.refTerms.should.deep.equal([r1, r2, r3]);
          cb();
        });
      });
    });
  });


  describe('get matches: getMatchesForString() + fixedTerms', function() {
    var idts;  // Some fixedTerms (= id + term-string pairs).

    before(function(cb) {
      loadDataForGet();

      // Load some items into the parent class's `fixedTermsCache`.
      idts = [
        'B:02',      // => match-object for entry e4's 1st term.
        {id: e12.id, str: e12.terms[1].str}, // => for entry e12's term 2: 'Iz'.
        {id: 'xx'},  // => no match-object.
        'yy',        // => no match-object.
        ];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        Object.keys(dict.fixedTermsCache).length.should.equal(2);
        cb();
      });
    });

    it('prepends a fixedTerm match, and deduplicates ' +
      'between fixedTerms matches and normal matches', function(cb) {
      dict.getMatchesForString('i', {idts: idts}, (err, res) => {
        expect(err).to.equal(null);
        // Explanation for the first three tests:
        // + without idts:                        [s1, s12, s2, s12b, t12c]
        // + with idts:                     [f12b, s1, s12, s2, ----  t12c]
        // + with idts, pageSize 3, page 1: [f12b, s1, s12, s2]
        // + with idts, pageSize 3, page 2:                    [s12b, t12c]
        //
        // So here in the first test, `s12b` gets removed as last but one item,
        // as a duplicate of fixed-term match `f12b`, which is placed in front.
        res.should.deep.equal({items: [f12b, s1, s12, s2, /*no s12b,*/ t12c]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('on a page 1, adds fixedTerm-matches, ' +
      'in addition to the requested number of normal matches', function(cb) {
      dict.getMatchesForString('i', {idts, perPage: 3, page: 1}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [f12b, s1, s12, s2]}); // See expl. above.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('on a page 2, adds no fixedTerm-matches, ' +
      'and does not deduplicate with fixedTerms', function(cb) {
      dict.getMatchesForString('i', {idts, perPage: 3, page: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s12b, t12c]}); // See expl. above.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('prepends a fixedTerm match, and deduplicates; and does this ' +
      'no matter what the normal matches are sorted like', function(cb) {
      dict.getMatchesForString('n',
        {idts: idts, sort: {dictID:'C'}}, (err, res) =>
      {
        expect(err).to.equal(null);
        // + without idts:     [t12, s4, t1, t2]  (see earlier test)
        // + with idts:    [f4, t12, --  t1, t2]
        // So `s4` gets removed (as 2nd item), as a duplicate of `f4` in front.
        res.should.deep.equal({items: [f4, t12, t1, t2]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns only normal matches if no fixedTerms are requested, ' +
      'even when `fixedTermsCache` is non-empty', function(cb) {
      dict.getMatchesForString('n', {sort: {dictID:'C'}}, (err, res) => {
        expect(err).to.equal(null);
        // Same as above, but without fixedTerm-adding and -deduplication.
        res.should.deep.equal({items: [t12, s4, t1, t2]});  // See earlier test.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns matches for all fixedTerms from `options.idts`, when given ' +
      'an empty search-string, and sorts them alphabetically', function(cb) {
      dict.getMatchesForString('', {idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [f12b, f4]});  // : in|*Iz|hi, Na+Cl-.
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns no matches at all for an empty string, if no fixedTerms are ' +
      'requested, also when `fixedTermsCache` is non-empty', function(cb) {
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        // Same as above, but without fixedTerm-adding.
        res.should.deep.equal({items: []});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns a G(infix)-type fixedTerm-match', function(cb) {
      dict.getMatchesForString('z', {idts: idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s(e12, 1, 'G')]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns fixedTerms, and sorts them by F(prefix)/G(infix)-type, ' +
      'before any alphabetic sorting', function(cb) {
      var g12a = s(e12, 0, 'G');
      var idts2 = idts.concat(e12.id);
      dict.loadFixedTerms(e12.id, 0, err => {  // Temp. add new fixedT. to cache.
        expect(err).to.equal(null);
        Object.keys(dict.fixedTermsCache).length.should.equal(3);

        dict.getMatchesForString('n', {idts: idts2}, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [
            // + without idts:           [t12, s4, t1, t2]  (see earlier test)
            // + with idts2:   [f4, g12a, ---  --  t1, t2]
                           f4,     g12a,      t1, t2
            // entry:      e4      e12        e1  e2
            // type:       F       G          T   T
            // string:     Na+Cl-  *in|Iz|hi  in  inn
            // dictID:     (A)     (C)        A   A   // '()' means: irrelevant.
          ]});
          cnt.should.equal(1);

          delete dict.fixedTermsCache[dict._idtToFTCacheKey(e12.id)];  // Clean.
          Object.keys(dict.fixedTermsCache).length.should.equal(2);
          cb();
        });
        cnt = 1;
      });
    });
    it('returns a refTerm match, then fixedTerm matches, then normal matches',
      function(cb) {
      dict.addDictionaryData([], [r9]);
      dict.refTerms.should.deep.equal([r9, r1, r2, r3]);

      dict.getMatchesForString('i', {idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          rm9,                     // The refTerm-match is placed first.
          f12b, s1, s12, s2, t12c  // See earlier test with fixedTerms.
        ]});
        cnt.should.equal(1);

        dict.deleteRefTerms(r9, err => {
          dict.refTerms.should.deep.equal([r1, r2, r3]);
          cb();
        });
      });
      cnt = 1;
    });
  });


  describe('get matches: getMatchesForString() + number-strings', function() {
    before(function() {
      loadDataForGet();
    });

    it('returns a match-object for a number-string', function(cb) {
      dict.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        // We don't test the exact value of the conceptID and dictID, because
        // here we use the defaults set in the parent class. So _NOT_ like this:
        // // res.should.deep.equal({items: [
        // //   {id: '00:5e+0', dictID: '00', str: '5', descr: '[number]',
        // //    type: 'N'} ]});
        res.items.length.should.equal(1);
        var m = res.items[0];  // We'll test properties of the only match-obj.
        m.id.endsWith('5e+0').should.equal(true);
        delete m.id;
        delete m.dictID;
        m.should.deep.equal({str: '5', descr: '[number]', type: 'N'});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('returns no match for a number-string, when that is deactivated',
      function(cb) {
      var dict2 = new DictionaryLocal({numberMatchConfig: false});
      dict2.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });
    it('uses custom settings for building a match-object for a number-string',
      function(cb) {
      var dict2 = new DictionaryLocal(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict2.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          {id:'XX:5e+0', dictID:'XX', str:'5', descr:'[number]', type:'N'} ]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    });

    it('sorts match-types in this order:  N, R,  F, G,  S, T', function(cb) {
      // This test generates match-objects for all possible types.
      // We'll use the search-string '5', which already gives a number-match.
      var dict2 = new DictionaryLocal(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict2.addDictionaryData(
        [ {id: 'Z', name: 'zz', entries: [
            {id: 'Z:04', terms: '75'}, // Generates normal match, infix-match.
            {id: 'Z:03', terms: '55'}, // Generates normal match, prefix-match.
            {id: 'Z:02', terms: '15'}, // Will be loaded as fixed-term, infix-m.
            {id: 'Z:01', terms: '5'}   // Will be loaded as fixed-term, prefix-m.
          ]} ],
        ['5']  // This refTerm exactly matches '5' too.
      );
      dict2.loadFixedTerms(['Z:01', 'Z:02'], 0, err => {
        dict2.getMatchesForString('5', {idts: ['Z:01', 'Z:02']}, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [
      {id:'XX:5e+0', dictID:'XX', str:'5',  descr:'[number]',         type:'N'},
      {id:'',        dictID:'',   str:'5',  descr:'[referring term]', type:'R'},
      {id:'Z:01',    dictID:'Z',  str:'5',  terms:[ {str: '5'} ],     type:'F'},
      {id:'Z:02',    dictID:'Z',  str:'15', terms:[ {str: '15'} ],    type:'G'},
      {id:'Z:03',    dictID:'Z',  str:'55', terms:[ {str: '55'} ],    type:'S'},
      {id:'Z:04',    dictID:'Z',  str:'75', terms:[ {str: '75'} ],    type:'T'},
          ]});
          cnt.should.equal(1);
          cb();
        });
        cnt = 1;
      });
    });
  });


  describe('options perPageDefault / perPageMax', function() {
    it('uses the constructor option `perPageDefault`', function(cb) {
      var dict = new DictionaryLocal({perPageDefault: 3});
      dict.addDictInfos([di1, di2], err => {
        dict.addEntries([e1, e2, e3, e4], err => {
          dict.getEntries(0, (err, res) => {
            res.should.deep.equal({items: [e1, e2, e3]});
            cb();
          });
        })
      })
    });
    it('uses the constructor option `perPageMax`', function(cb) {
      var dict = new DictionaryLocal({perPageMax: 2});
      dict.addDictInfos([di1, di2], err => {
        dict.addEntries([e1, e2, e3, e4], err => {
          dict.getEntries({perPage: 20}, (err, res) => {  // Ask for more.
            res.should.deep.equal({items: [e1, e2]});  // But gets only the max.
            cb();
          });
        })
      })
    });
  });
});
