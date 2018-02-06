import {canonicalizeTerms, canonicalizeEntry} from './canonicalize';
import {deepClone} from './util';


export default function test(cb, expect, T,L,D) {

  T('canonicalizeTerms()');
  canonicalizeTerms( 'a' ).should.deep.equal( [{s: 'a'}] );
  canonicalizeTerms( {s: 'a'} ).should.deep.equal( [{s: 'a'}] );
  canonicalizeTerms( [{s: 'a', y: 'i', gone: 'xyz'}, 'b'] ).should.deep.equal(
    [{s: 'a', y: 'i'}, {s: 'b'}]
  );
  canonicalizeTerms([]).should.deep.equal([]);

  T('canonicalizeTerms(): makes deep clones of term-objects');
  var a = [{s: 'a', y: 'i',}, 'b'];
  var b = [{s: 'a', y: 'i'}, {s: 'b'}];
  var aCano = canonicalizeTerms(a);
  aCano.should.deep.equal(b);
  a[0].y = 'u';
  aCano.should.deep.equal(b);

  T('canonicalizeTerms(): deduplicates, and hereby puts a duplicate term\'s ' +
    'last occurrence in its first occurrence\'s spot');
  canonicalizeTerms(['a', 'b', {s:'a', y:'i'}, 'c', 'c']).should.deep.equal(
    [{s: 'a', y: 'i'}, {s: 'b'}, {s: 'c'}]
  );


  T('canonicalizeEntry()');
  var eOrig1 = {i: 'A:01', d: 'A', x: 'abc', t: ['a', {s: 'a', y: 'i'}, 'b'],
                z: {b: {c: 5}}, f: 'invalid' };
  var eCano1 = {i: 'A:01', d: 'A', x: 'abc', t: [ {s: 'a', y: 'i'}, {s: 'b'} ],
                z: {b: {c: 5}} };
  var eOrig2 = {i: 'A:01', d: 'A', x: '', t: 'a', gone: 'xyz', z: 0};
  var eCano2 = {i: 'A:01', d: 'A', x: '', t: [ {s: 'a'} ], z: 0};
  canonicalizeEntry(eOrig1).should.deep.equal(eCano1);
  canonicalizeEntry(eOrig2).should.deep.equal(eCano2);

  T('canonicalizeEntry(): makes deep clones of `z` property');
  a = {i: 'A:01', d: 'A', t: [ {s: 'a'} ], z: {k: 0}};
  b = deepClone(a);  // Identical to `a`, but an independent, deep clone of it.
  aCano = canonicalizeEntry(a);
  aCano.should.deep.equal(b);
  a.z.k = 1;
  aCano.should.deep.equal(b);


  cb();
}

//test.act = 2;
