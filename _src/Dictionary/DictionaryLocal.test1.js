const DictionaryLocal = require('./DictionaryLocal');
const {deepClone} = require('./helpers/util');
const asyncWaterfall = require('async-waterfall');


var dict;

// Test data for 'dictInfo'-adding.
var di1x = {id: 'A', name: 'Name 1', xx: 1};
var di1 = {id: 'A', name: 'Name 1'};
var di2 = {id: 'B', name: 'Name 2'};
var di3 = {id: 'C', name: 'Name 3'};
var di4 = {id: 'D', name: 'Name 4'};
var di2u = {id: 'B', name: 'Name 2b'};
var di5p = {id: '' , name: 'Name 5'};
var di6p = {id: 'F', name: ''      };
var di7s = {id: 'G', name: 'Name 6',
        f_id : 'function (d, e) { return d.id + \':\' + e.i; }', // Functions..
        f_aci: 'function (x) { return x * 10; }' };  // ..given as Strings.
var di7f = {id: 'G', name: 'Name 6',
        f_id : function (d, e) { return `${d.id}:${e.i}` },
        f_aci: function (x) { return x * 10; } };
var di1Err = 'dictInfo for \'A\' already exists';
var dipErr = 'dictInfo misses a required property: id or name';

// Test data for 'dictInfo'-updating, and -deleting.
var di4u = {id: 'D', name: 'Name 4b'};
var di5u = {id: 'E', name: 'Name 5'};
var di5uErr = 'dictInfo for \'E\' does not exist';
var di5pErr = 'dictInfo for \'\' does not exist';
var di2dErr = 'dictInfo for \'B\' still has associated entries';
var di5 = {id: 'C2', name: 'Name 0'};

// Test data for 'entry'-adding.
var e1s = {i:'A:01', d:'A', t: 'in' };
var e1 = {i:'A:01', d:'A', t: [ {s:'in'} ] };
var e2 = {i:'A:02', d:'A', t: [ {s:'inn', y:'i'} ] };
var e3 = {i:'B:01', d:'B', t: [ {s:'Ca2+',   y:'u2-3'} ] };
var e4 = {i:'B:02', d:'B', t: [ {s:'Na+Cl-', y:'u2u5'} ] };
var e5p = {i:''    , d:'A', t: 'in' };
var e6p = {i:'A:06', d:'' , t: 'in' };
var e7p = {i:'A:07', d:'A', t: ''   };
var e7p2= {i:'A:07', d:'A', t: [''] };
var e8 = {i:'X:01', d:'X', t: 'in' };
var e9i  = {i:999,      d:'B', t: [ {s:'in'} ] };
var e9   = {i:'B:0999', d:'B', t: [ {s:'in'} ] };
var e10i = {i:99,       d:'G', t: [ {s:'in'} ] };
var e10  = {i:'G:99',   d:'G', t: [ {s:'in'} ] };
var e11  = {i:'A:00',   d:'B', t: [ {s:'in'} ] };
var e12 = {i:'B:00', d:'C', t: [{s:'in'},{s:'Iz'},{s:'hi'}],z: {a:1, b:2, c:3}};
var e1Err = 'entry for \'A:01\' already exists';
var etErr = 'invalid term';
var e8Err = 'entry is linked to non-existent dictID \'X\'';
var epErr = 'entry misses a required property: i, d, or t';
var edErr = 'an entry tries to override dictID \'C\'';

// Test data for 'entry'-updates: entry update objects, and entry result objs.
var e1uObj1 = {i:'A:01', d:'B',             zdel: true, z: {a: 1, b: 2} };
var e1uRes1 = {i:'A:01', d:'B', t: [ {s:'in'} ],        z: {a: 1, b: 2} };
var e1uObj2 = {i:'A:01', d:'A', tdel: 'q', t: 'q',      z: {b: 5, c: 3, d: 4} };
var e1uRes2 = {i:'A:01', d:'A', t: [{s:'in'}, {s:'q'}], z: {a:1,b:5,c:3,d:4}};
var e1uObj3 = {i:'A:01', tdel: 'q',
                    t: [{s:'in', y:'i'}, 'v', {s:'v', y:'i'}], zdel: 'b' };
var e1uRes3 = {i:'A:01', d:'A',
                    t: [{s:'in', y:'i'}, {s:'v', y:'i'}], z: {a:1, c:3, d:4}};
var e1uObj4 = {i:'A:01', tdel: ['X', 'v'], t:'in', zdel: ['c', 'd', 'ABC'] };
var e1uRes4 = {i:'A:01', d:'A', t: [ {s:'in'} ], z: {a: 1}};
var e1uObj5 = {i:'A:01', tdel: 'in', zdel: true, z: {xx:'xx'} };
var e1uObj6 = {i:'A:01', zdel: true };
var e1uRes6 = e1;
var e5u = {i:'E:01', z: 'x'};
var e8u = {i:'A:01', d: 'X' };
var e5uErr = 'entry for \'E:01\' does not exist';
var e5pErr = 'entry for \'\' does not exist';

// Test data for 'refTerm'-adding and -deleting.
var r1 = 'it';
var r2 = 'that';
var r3 = 'this';
var r4 = 'xx';
var r9 = 'i';
var rm1 = { i: '', d: '', s: 'it', x: '[referring term]', w: 'R' };
var rm9 = Object.assign({}, rm1, {s: r9});
var r4Err = 'refTerm \'xx\' does not exist';

// Helper for testing callback asynchronicity.
var cnt;



export default function test(CB, expect, T,L,D) {

  asyncWaterfall([
    cb => testAddUpdateDeleteDictInfos(cb, expect, T,L,D),
    cb => testAddUpdateDeleteEntries(cb, expect, T,L,D),
    cb => testAddUpdateDeleteRefTerms(cb, expect, T,L,D),

    cb => testAddDictionaryData(cb, expect, T,L,D),

    cb => loadDataForGet(cb, expect, T,L,D),
    ///cb => { D(dict.dictInfos); D(dict.entries, 4); D(dict.refTerms); cb(); },
    cb => testGetBasics(cb, expect, T,L,D),
    cb => testGetMatches(cb, expect, T,L,D),
  ], CB);

}



function testAddUpdateDeleteDictInfos(CB, expect, T,L,D) {

  asyncWaterfall([

    // --- Test addDictInfos().
    cb => {
      dict = new DictionaryLocal();
      dict.dictInfos.should.deep.equal([]);

      cnt = 0;
      T('addDictInfos(): single add, and omits invalid property');
      dict.addDictInfos(di1x, err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di1]);

        T('addDictInfos() returns via truly asynchronous callback, ' +
          'i.e. on new event loop');
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('addDictInfos(): multiple adds, and sorting');
      dict.addDictInfos([di3, di2], err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di1, di2, di3]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },
    cb => {
      T('addDictInfos(): single add, with error for duplicate');
      dict.addDictInfos(di1, err => {
        err.should.deep.equal(di1Err);
        dict.dictInfos.should.deep.equal([di1, di2, di3]);
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },
    cb => {
      T('addDictInfos(): multiple adds, with errors for duplicate' +
        'and for missing `id` or `name');
      dict.addDictInfos([di1, di4, di5p, di6p], err => {
        err.should.deep.equal([di1Err, null, dipErr, dipErr]);
        dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },
    cb => {
      T('addDictInfos(): single add, with a custom `f_id` and `f_aci`');
      dict.addDictInfos(di7s, err => {
        // Note: `dict.dictInfos.should.deep.equal(...)` can not be used here,
        // because functions-properties (f_*) are never seen as deep-equal.
        // So for this one case, we test their equality more manually.
        // + And we remove this dictInfo afterwards, so that any subsequent
        //   `dictInfos`-test can avoid this difficulty.
        var N = 4;
        var G = di7f.id;
        dict.dictInfos.should.have.length(5);
        Object.keys(dict.dictInfos[N]).should.have.length(4);
        dict.dictInfos[N].id.should.equal(G);
        dict.dictInfos[N].name.should.equal(di7f.name);
        dict.dictInfos[N].f_id( {id:'S'}, {i:3} ).should.equal(
          di7f.f_id( {id:'S'}, {i:3} )
        );
        dict.dictInfos[N].f_aci(1).should.equal( di7f.f_aci(1) );
        cnt.should.equal(5);
        dict.deleteDictInfos(G, err => {
          expect(err).to.equal(null);
          dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
          cb();
        });
      });
      cnt = 5;
    },
    cb => {
      T('addDictInfos() returns via truly asynchronous callback, ' +
          'also for empty array');
      dict.addDictInfos([], err => {
        expect(err).to.equal(null);
        cnt.should.equal(6);
        cb();
      });
      cnt = 6;
    },


    // --- Test updateDictInfos().
    cb => {
      cnt = 0;
      T('updateDictInfos(): single update');
      dict.updateDictInfos(di4u, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(di4u);
        dict.dictInfos.should.deep.equal([di1, di2, di3, di4u]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('updateDictInfos(): multiple updates, with errors: ' +
        'one\'s ID does not exist; another one\'s `i` property is missing; ' +
        'and another one succeeds');
      dict.updateDictInfos([di5u, di5p, di4], (err, res) => {
        err.should.deep.equal([di5uErr, di5pErr, null]);
        res.should.deep.equal([null, null, di4]);
        dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },


    // --- Test deleteDictInfos().
    cb => {
      cnt = 0;
      T('deleteDictInfos(): single delete');
      dict.deleteDictInfos(di3.id, err => {
        expect(err).to.equal(null);
        dict.dictInfos.should.deep.equal([di1, di2, di4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      // First add an entry to dictionary 'B'.
      expect(dict.addDictionaryData([{id: 'B', entries: [e3]}])).to.equal(null);

      T('deleteDictInfos(): multiple deletes: one succeeds, one errors as ' +
        'it still has associated entries, one errors as it does not exist');
      dict.deleteDictInfos([di4.id, di2.id, di5u.id], err => {
        err.should.deep.equal([null, di2dErr, di5uErr]);
        dict.dictInfos.should.deep.equal([di1, di2]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },

  ], CB);

}



function testAddUpdateDeleteEntries(CB, expect, T,L,D) {

  asyncWaterfall([

    // --- Test addEntries().
    cb => {
      cnt = 0;
      dict = new DictionaryLocal();  // Prepare clean slate.
      dict.entries.should.deep.equal([]);
      // First add dictInfos that future entries can refer to.
      expect(dict.addDictionaryData([di1, di2, di3, di4])).to.equal(null);

      T('addEntries(): single add, simplified entry');
      dict.addEntries(e1s, err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('addEntries(): multiple adds, and sorting');
      dict.addEntries([e3, e2], err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1, e2, e3]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },
    cb => {
      T('addEntries(): single add, with error');
      dict.addEntries(e1, err => {
        err.should.deep.equal(e1Err);
        dict.entries.should.deep.equal([e1, e2, e3]);
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },
    cb => {
      T('addEntries(): multiple adds, with errors for duplicate; and ' +
        'for missing `i`, `d`, or `t`; and for invalid term; ' +
        'and for nonexistent linked dictID');
      dict.addEntries([e1, e4, e5p, e6p, e7p, e7p2, e8], err => {
        err.should.deep.equal([e1Err, null, epErr, epErr, epErr, etErr, e8Err]);
        dict.entries.should.deep.equal([e1, e2, e3, e4]);
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },
    cb => {
      T('addEntries(): adds: convert int concept-ID to string, with default '+
        'and custom function; error on existing string-ID for given int-ID; '+
        'and sort on dictID first and then on conceptID');
      dict.addDictInfos(di7s, err => {  // Add the function-having dictInfo.

        dict.addEntries([e9i, e10i, e11], err => {
          expect(err).to.equal(null);
          dict.entries.should.deep.equal([e1, e2, e11, e3, e4, e9, e10]);
          cnt.should.equal(5);

          dict.deleteEntries([e9.i, e10.i, e11.i], err => {  // Clean up.
            expect(err).to.equal(null);
            dict.entries.should.deep.equal([e1, e2, e3, e4]);

            dict.deleteDictInfos(di7f.id, err => {
              dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);
              cb();
            });
          });
        });
        cnt = 5;
      });
    },


    // --- Test updateEntries().
    cb => {
      cnt = 0;
      T('updateEntries(): single update: updates `d`, ' +
        'and applies `zdel` before `z`; ' +
        'and updates sorting based on new `d`');
      dict.updateEntries(e1uObj1, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes1);
        dict.entries.should.deep.equal([e2, e1uRes1, e3, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('updateEntries(): multiple updates, with errors: ' +
        'one\'s ID does not exist; one\'s `i` property is missing; ' +
        'one has nonexistent linked dictID; ' +
        'and one succeeds: it applies `tdel` before `t`, ' +
        'adds a single term with `t`, and merges properties into `z`');
      dict.updateEntries([e5u, e5p, e8u, e1uObj2], (err, res) => {
        err.should.deep.equal([e5uErr, e5pErr, e8Err, null]);
        res.should.deep.equal([null, null, null, e1uRes2]);
        dict.entries.should.deep.equal([e1uRes2, e2, e3, e4]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },
    cb => {
      T('updateEntries(): single update: delete single term, ' +
        'add/update multiple terms (including a duplicate one), ' +
        'delete a single `z`-property');
      dict.updateEntries(e1uObj3, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes3);
        dict.entries.should.deep.equal([e1uRes3, e2, e3, e4]);
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },
    cb => {
      T('updateEntries(): single update: delete multiple terms (incl absent '+
        'one), update one, delete multiple `z`-properties (incl absent one)');
      dict.updateEntries(e1uObj4, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes4);
        dict.entries.should.deep.equal([e1uRes4, e2, e3, e4]);
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },
    cb => {
      T('updateEntries(): error for deleting last term, no changes applied');
      dict.updateEntries(e1uObj5, (err, res) => {
        expect(err).to.equal('entry would have no terms left');
        expect(res).to.equal(null);
        dict.entries.should.deep.equal([e1uRes4, e2, e3, e4]);
        cnt.should.equal(5);
        cb();
      });
      cnt = 5;
    },
    cb => {
      T('updateEntries(): single update: delete `z` fully');
      dict.updateEntries(e1uObj6, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal(e1uRes6);
        dict.entries.should.deep.equal([e1uRes6, e2, e3, e4]);
        cnt.should.equal(6);
        cb();
      });
      cnt = 6;
    },


    // --- Test deleteEntries().
    cb => {
      cnt = 0;
      T('deleteEntries(): single delete');
      dict.deleteEntries(e3.i, err => {
        expect(err).to.equal(null);
        dict.entries.should.deep.equal([e1, e2, e4]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('deleteEntries(): multiple deletes: one succeeds, one errors as it ' +
        'does not exist');
      dict.deleteEntries([e4.i, e5u.i], err => {
        err.should.deep.equal([null, e5uErr]);
        dict.entries.should.deep.equal([e1, e2]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },

  ], CB);

}



function testAddUpdateDeleteRefTerms(CB, expect, T,L,D) {

  asyncWaterfall([

    // --- Test addRefterms().
    cb => {
      cnt = 0;
      dict = new DictionaryLocal();  // Prepare clean slate.
      dict.refTerms.should.deep.equal([]);

      T('addRefTerms(): single add');
      dict.addRefTerms(r2, err => {
        expect(err).to.equal(null);
        dict.refTerms.should.deep.equal([r2]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('addRefTerms(): multiple adds, and deduplication and sorting, ' +
        'and the empty string does not get added');
      dict.addRefTerms([r3, r2, '', r1], err => {
        err.should.deep.equal([null, null, 'empty refTerm', null]);
        dict.refTerms.should.deep.equal([r1, r2, r3]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },


    // --- Test deleteRefTerms().
    cb => {
      cnt = 0;
      T('deleteRefTerms(): single delete');
      dict.deleteRefTerms(r2, err => {
        expect(err).to.equal(null);
        dict.refTerms.should.deep.equal([r1, r3]);
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('deleteRefTerms(): multiple deletes: one succeeds, ' +
        'one errors as it does not exist');
      dict.deleteRefTerms([r3, r4], err => {
        err.should.deep.equal([null, r4Err]);
        dict.refTerms.should.deep.equal([r1]);
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },

  ], CB);

}



function testAddDictionaryData(CB, expect, T,L,D) {

  var augment = (...args) => Object.assign({}, ...args);
  var withoutDictID = e => { e = deepClone(e);  delete e.d;  return e; };

  var data1 = [ augment(di1, { entries: [e1, e2] }), di2 ];

  var data2 = [
    augment(di3, { entries: [  // Add dictInfo.
      { i: 3, t:'cd', z: {a:1} },  // Use int conceptID, omit dictID.
      { i: 3, t:'ab', z: {b:2}, d:'C' },  // Extra t and z, explicit dictID.
      { i: 3, d:'A' },  // Override with different dictID.
    ]}),
    augment(di2u, { entries: [  // Update dictInfo name.
      withoutDictID(e4),  // Omit dictID.
      e3,  // Add in unsorted order.
    ]}),
  ];

  dict = new DictionaryLocal();

  // Add some start data.
  T('addDictionaryData(): add some initial test data');
  expect(dict.addDictionaryData(data1, [r1])).to.equal(null);
  dict.dictInfos.should.deep.equal([di1, di2]);
  dict.entries.should.deep.equal([e1, e2]);
  dict.refTerms.should.deep.equal([r1]);

  // --- Test addDictionaryData().
  T('addDictionaryData(): can add and update dictInfos; sorts entries' +
    'by dictID/conceptID; accepts entries with an integer conceptID; ' +
    'accepts entries with omitted dictID, or overriding dictID, ' +
    'updates entries by adding/updating term-items, and merging z-props, ' +
    'collects non-null errors in an array');
  dict.addDictionaryData(data2, [r3, r2, r2]).should.deep.equal([edErr]);
  dict.dictInfos.should.deep.equal([di1, di2u, di3]);
  dict.entries.should.deep.equal([e1, e2, e3, e4,
    { d: 'C', i: 'C:0003', t: [{s: 'cd'}, {s: 'ab'}], z: {a: 1, b: 2} },
  ]);
  dict.refTerms.should.deep.equal([r1, r2, r3]);

  T('addDictionaryData(): accepts undefined, returns null on no errors');
  expect(dict.addDictionaryData()).to.equal(null);

  T('addDictionaryData(): accepts dictInfos without an `entries` property');
  expect(dict.addDictionaryData([
    augment(di4, {entries: []}), di2
  ])).to.equal(null);
  dict.dictInfos.should.deep.equal([di1, di2, di3, di4]);

  CB();

}



function loadDataForGet(cb) {
  var ae = (dictInfo, entries) => Object.assign({}, dictInfo, {entries});

  dict = new DictionaryLocal();
  dict.addDictionaryData([
    ae(di1, [
        e1, e2
      ]),
    ae(di2, [
        e3, e4
      ]),
    ae(di3, [
        e12
      ]),
    di4,
    di5
  ],
  [ r1, r2, r3 ] );

  dict.dictInfos.should.deep.equal([di1, di2, di3, di4, di5]);
  dict.entries.should.deep.equal([e1, e2, e3, e4, e12]);
  dict.refTerms.should.deep.equal([r1, r2, r3]);

  cb();
}



function testGetBasics(CB, expect, T,L,D) {

  asyncWaterfall([

    // --- Test getDictInfos().
    cb => {
      cnt = 0;
      dict.getDictInfos(0, (err, res) => {
        T('getDictInfos(): get all, by default sorted by id');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di1,di2,di3, di5, di4]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      dict.getDictInfos({filter: {id: 'B'}}, (err, res) => {
        T('getDictInfos(): get for one dictID');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di2]});
        cb();
      });
    },
    cb => {
      dict.getDictInfos({filter: {id: ['D', 'B', 'xx']}}, (err, res) => {
        T('getDictInfos(): get for two dictIDs and one invalid one');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di2, di4]});
        cb();
      });
    },
    cb => {
      dict.getDictInfos({page: 1, perPage: 1}, (err, res) => {
        T('getDictInfos(): page 1, perPage 1');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di1]});
        cb();
      });
    },
    cb => {
      dict.getDictInfos({page: 2, perPage: 3}, (err, res) => {
        T('getDictInfos(): page:2, perPage: 3');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [di5, di4]});
        cb();
      });
    },
    cb => {
      dict.getDictInfos(
        {filter: {id: ['D', 'C', 'C2']}, sort: 'name', page: -2, perPage: 2},
        (err, res) => {
          T('getDictInfos(): filter for ids, sort by name, ' +
            'page: invalid, perPage: 2');
          expect(err).to.equal(null);
          res.should.deep.equal({items: [di5, di3]});
          cb();
        });
    },
    cb => {
      dict.getDictInfos(
        {filter: {name: ['Name 2']}, perPage: 0},
        (err, res) => {
          T('getDictInfos(): filter for name, with invalid `perPage`');
          expect(err).to.equal(null);
          res.should.deep.equal({items: [di2]});
          cb();
        });
    },


    // --- Test getEntries().
    cb => {
      cnt = 0;
      dict.getEntries(0, (err, res) => {
        T('getEntries(): get all, by default sorted by `d`, then `i`');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e3, e4, e12]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      dict.getEntries({sort: 's'}, (err, res) => {
        T('getEntries(): get all, sorted by first term\'s string');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e1, e12, e2, e4]});
        cb();
      });
    },
    cb => {
      dict.getEntries({sort: 'i'}, (err, res) => {
        T('getEntries(): get all, sorted by `i`');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e12, e3, e4]});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:01'}}, (err, res) => {
        T('getEntries(): get for an id');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3]});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: ['B:00', 'B:01', 'XX']}}, (err, res) => {
        T('getEntries(): get for some ids, and absent one');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e12]});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: ['XX', 'YY']}}, (err, res) => {
        T('getEntries(): get for absent ids');
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {d: 'C', i: 'B:00'}}, (err, res) => {
        T('getEntries(): get for a dictID, (and an id)');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e12]});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {d: ['C', 'A']}}, (err, res) => {
        T('getEntries(): get for some dictIDs');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e1, e2, e12]});
        cb();
      });
    },
    cb => {
      dict.getEntries({page: 2, perPage: 2}, (err, res) => {
        T('getEntries(): get all, with explicit pagination');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e3, e4]});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:00'}, z: true}, (err, res) => {
        T('getEntries(): get for an id, with all z-props');
        expect(err).to.equal(null);
        res.should.deep.equal({items: [e12]});
        res.items[0].z.should.deep.equal({a: 1, b: 2, c: 3});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:00'}, z: false}, (err, res) => {
        T('getEntries(): get for an id, with deleted z-props');
        expect(err).to.equal(null);
        expect(res.items[0].z).to.equal(undefined);
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:00'}, z: 'x'}, (err, res) => {
        T('getEntries(): get for an id, request to keep non-existent z-prop');
        expect(err).to.equal(null);
        expect(res.items[0].z).to.equal(undefined);  // Note: undefined, not {}.
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:00'}, z: 'b'}, (err, res) => {
        T('getEntries(): get for an id, request to keep one z-prop');
        expect(err).to.equal(null);
        expect(res.items[0].z).to.deep.equal({b: 2});
        cb();
      });
    },
    cb => {
      dict.getEntries({filter: {i: 'B:00'}, z: ['c', 'a', 'x']}, (err, res) => {
        T('getEntries(): get for an id, request to keep some z-props, ' +
          'including a non-existent one');
        expect(err).to.equal(null);
        expect(res.items[0].z).to.deep.equal({a: 1, c: 3});
        cb();
      });
    },


    // --- Test getRefTerms().
    cb => {
      cnt = 0;
      T('getRefTerms(): gets all');
      dict.getRefTerms(0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r1, r2, r3]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('getRefTerms(): gets some by String');
      dict.getRefTerms({filter: {s: 'that'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r2]});
        cb();
      });
    },
    cb => {
      T('getRefTerms(): gets some by Array, and sorts');
      dict.getRefTerms({filter: {s: ['this', 'it']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [r1, r3]});
        cb();
      });
    },

  ], CB);

}



function testGetMatches(CB, expect, T,L,D) {

  // Functions to make a match-object for an (entry + term-object + match-type).
  function s(e, pos = 0, w = 'S') {
    return Object.assign({}, e, e.t[pos], {w});
  }
  function t(e, pos) {
    return s(e, pos, 'T');
  }

  // Prepare all possible match-objects.
  var s1 = s(e1);  var t1 = t(e1);
  var s2 = s(e2);  var t2 = t(e2);
  var s3 = s(e3);  var t3 = t(e3);
  var s4 = s(e4);  var t4 = t(e4);  var f4 = s(e4, 0, 'F');
  var s12 = s(e12);  var t12 = t(e12);
  var s12b = s(e12, 1);  var t12b = t(e12, 1);  var f12b = s(e12, 1, 'F');
  var s12c = s(e12, 2);  var t12c = t(e12, 2);

  var idts;  // Some fixedTerm-id&termStrings, added later on.


  asyncWaterfall([

    // --- Test getMatchesForString().
    /* Tests:
      + normal string-search: * with as prefix and as infix, * with no match.
      + filter for one/more dictIDs.
      + sort by one/more dictID-incl, then S/T, case-insens term-str, owndictID.
      + combination of filter+sort.
      + pagination.
      + z-prop pruning.
    */
    cb => {
      cnt = 0;
      T('getMatchesForString(): can match multiple terms per entry; sorts by ' +
        'S/T-type match first, then case-insensitively by string-term, ' +
        'and then by its own dictID');
      dict.getMatchesForString('i', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s1, s12, s2, s12b, t12c]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('getMatchesForString(): matches case-insensitively, ' +
        'and sorts S(prefix)-matches before T(infix)-matches');
      dict.getMatchesForString('N', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s4, t1, t12, t2]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): none match');
      dict.getMatchesForString('xx', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): filter by a given dictID');
      dict.getMatchesForString('n', {filter: {d: 'B'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s4]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): sorts first by given dictID, then S/T-type');
      dict.getMatchesForString('n', {sort: {d: 'C'}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [t12, s4, t1, t2]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): can combine a filter for dictIDs, with a ' +
        'narrower sort, which puts some of the dictIDs first');
      dict.getMatchesForString('n',
        { filter: {d: ['B', 'C']}, sort: {d: ['C']} }, (err, res) =>
      {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [t12, s4]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): sorts by S/T-type match, ' +
        'then case-insensitively by term-string, and then by its own dictID');
      dict.getMatchesForString('i', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s1, s12, s2, s12b, t12c]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): empty string returns no matches');
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): sorts by given dictIDs, then S/T, ' +
        'and then case-insensitively by term-string');
      dict.getMatchesForString('i', {sort: {d: ['C']}}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s12, s12b, t12c, s1, s2]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): sorts by term-string, then dictID, and then ' +
        'by term-position in its entry\'s term-list, and then by conceptID');
      var e91 = {i:'A:00a', d:'A', t: [ {s: 'in'} ] };
      var e92 = {i:'A:00b', d:'A', t: [ {s: 'xx'}, {s: 'in'} ] };
      var s91 = s(e91);
      var s92b = s(e92, 1);
      dict.addEntries([e91, e92], (err, res) => {
        dict.entries.should.deep.equal([e91, e92, e1, e2, e3, e4, e12]);

        dict.getMatchesForString('in', 0, (err, res) => {
          expect(err).to.equal(null);
          res.should.deep.equal({items: [s91, s1, s92b, s12, s2]});

          dict.deleteEntries([e91.i, e92.i], (err, res) => {
            dict.entries.should.deep.equal([e1, e2, e3, e4, e12]);
            cb();
          });
        });
      })
    },
    cb => {
      T('getMatchesForString(): pagination');
      dict.getMatchesForString('in', {page: 1, perPage: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s1, s12]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): pagination, page 2');
      dict.getMatchesForString('in', {page: 2, perPage: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s2]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): z-prop pruning: keep none deletes `z` '+
        'completely');
      dict.getMatchesForString('hi', {z: false}, (err, res) => {
        expect(err).to.equal(null);
        var e = Object.assign({}, s12c);
        delete e.z;
        res.should.deep.equal({items: [e]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): z-prop pruning: keep only non-existent one: ' +
        'deletes `z` completely');
      dict.getMatchesForString('hi', {z: 'xx'}, (err, res) => {
        expect(err).to.equal(null);
        var e = Object.assign({}, s12c);
        delete e.z;
        res.should.deep.equal({items: [e]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): z-prop pruning: keep all');
      dict.getMatchesForString('hi', {z: true}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s12c]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): z-prop pruning: keep one');
      dict.getMatchesForString('hi', {z: 'b'}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          Object.assign({}, s12c, {z: {b: 2}})
        ]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): z-prop pruning: keep some and nonexistent one');
      dict.getMatchesForString('hi', {z: ['c', 'xx', 'a']}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          Object.assign({}, s12c, {z: {a: 1, c: 3}})
        ]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): returns a refTerm match');
      dict.getMatchesForString('it', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [rm1]});
        cb();
      });
    },
    cb => {
      T('getMatchesForString(): returns a refTerm match before other matches');
      dict.addDictionaryData([], [r9]);
      dict.refTerms.should.deep.equal([r9, r1, r2, r3]);

      dict.getMatchesForString('i', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [rm9, s1, s12, s2, s12b, t12c]});

        dict.deleteRefTerms(r9, err => {
          dict.refTerms.should.deep.equal([r1, r2, r3]);
          cb();
        });
      });
    },


    // --- Test getMatchesForString(), with extra fixedTerm-matches;
    cb => {
      // Load some items in the fixedTermsCache.
      idts = [
        'B:02',
        {i: e12.i, s: e12.t[1].s},
        {i: 'xx'},
        'yy',
        ];
      dict.loadFixedTerms(idts, 0, err => {
        expect(err).to.equal(null);
        Object.keys(dict.fixedTermsCache).length.should.equal(2);
        cb();
      });
    },
    cb => {
      T('getMatchesForString() + fixedTerms: prepends a ' +
        'fixedTerm match, and deduplicates between fixedTerms matches ' +
        'and ordinary matches');
      cnt = 0;
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
        res.should.deep.equal({items: [f12b, s1, s12, s2, t12c]});
        cnt.should.equal(1);
        cb();
      });
      cnt = 1;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: on page 1, fixedTerm-matches ' +
        'get added, in addition to the requested number of normal matches');
      dict.getMatchesForString('i', {idts, perPage: 3, page: 1}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [f12b, s1, s12, s2]}); // See expl. above.
        cnt.should.equal(2);
        cb();
      });
      cnt = 2;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: on page 2, no fixedTerm-matches ' +
        'get added, and also no deduplication with fixedTerms happens now');
      dict.getMatchesForString('i', {idts, perPage: 3, page: 2}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s12b, t12c]}); // See expl. above.
        cnt.should.equal(3);
        cb();
      });
      cnt = 3;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: test 2');
      dict.getMatchesForString('n', {idts: idts, sort: {d:'C'}}, (err, res) => {
        expect(err).to.equal(null);
        // `s4` gets removed (as 2nd item), as a duplicate of `f4` in front.
        res.should.deep.equal({items: [f4, t12, t1, t2]});
        cnt.should.equal(4);
        cb();
      });
      cnt = 4;
    },
    cb => {
      T('getMatchesForString() + no fixedTerms, but with fixedTermsCache: ' +
        'returns no fixedTerms');
      dict.getMatchesForString('n', {sort: {d:'C'}}, (err, res) => {
        expect(err).to.equal(null);
        // Same as above, but without fixedTerm-adding and -deduplication.
        res.should.deep.equal({items: [t12, s4, t1, t2]});
        cnt.should.equal(5);
        cb();
      });
      cnt = 5;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: G-type match');
      dict.getMatchesForString('z', {idts: idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [s(e12, 1, 'G')]});
        cnt.should.equal(6);
        cb();
      });
      cnt = 6;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: for the empty string, ' +
        'returns all fixedTerms, sorted alphabetically');
      dict.getMatchesForString('', {idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [f12b, f4]});
        cnt.should.equal(7);
        cb();
      });
      cnt = 7;
    },
    cb => {
      T('getMatchesForString() + no fixedTerms, but with fixedTermsCache: ' +
        'returns no matches for the empty string');
      dict.getMatchesForString('', 0, (err, res) => {
        expect(err).to.equal(null);
        // Same as above, but without fixedTerm-adding.
        res.should.deep.equal({items: []});
        cnt.should.equal(8);
        cb();
      });
      cnt = 8;
    },
    cb => {
      T('getMatchesForString() + fixedTerms: returns refTerm match, then ' +
        'fixedTerm matches, then normal matches');
      dict.addDictionaryData([], [r9]);
      dict.refTerms.should.deep.equal([r9, r1, r2, r3]);

      dict.getMatchesForString('i', {idts}, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [rm9, f12b, s1, s12, s2, t12c]});
        cnt.should.equal(9);

        dict.deleteRefTerms(r9, err => {
          dict.refTerms.should.deep.equal([r1, r2, r3]);
          cb();
        });
      });
      cnt = 9;
    },
    cb => {
      T('getMatchesForString() + number-string');
      dict.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          {i: '00:5e+0', d: '00', s: '5', x: '[number]', w: 'N'} ]});
        cnt.should.equal(10);
        cb();
      });
      cnt = 10;
    },
    cb => {
      T('getMatchesForString() + number-string deactivated');
      var dict2 = new DictionaryLocal({numberMatchConfig: false});
      dict2.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: []});
        cnt.should.equal(11);
        cb();
      });
      cnt = 11;
    },
    cb => {
      T('getMatchesForString() + custom number-string settings');
      var dict2 = new DictionaryLocal(
        { numberMatchConfig: { dictID: 'XX', conceptIDPrefix: 'XX:' } }
      );
      dict2.getMatchesForString('5', 0, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal({items: [
          {i: 'XX:5e+0', d: 'XX', s: '5', x: '[number]', w: 'N'} ]});
        cnt.should.equal(12);
        cb();
      });
      cnt = 12;
    },

  ], CB);

}

//test.act = 2;
