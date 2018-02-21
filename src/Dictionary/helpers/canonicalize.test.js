const {canonicalizeEntry, canonicalizeTerms} = require('./canonicalize');
const {deepClone} = require('./util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/canonicalize.js', function() {
  describe('canonicalizeTerms()', function() {
    it('wraps a String into a term-object in an Array', function() {
      canonicalizeTerms( 'a' ).should.deep.equal( [{s: 'a'}] );
    });
    it('wraps a term-object into an Array', function() {
      canonicalizeTerms( {s: 'a'} ).should.deep.equal( [{s: 'a'}] );
    });
    it('returns an Array, and remove unsupported properties', function() {
      canonicalizeTerms( [{s: 'a', y: 'i', gone: 'xyz'}, 'b'] )
        .should.deep.equal( [{s: 'a', y: 'i'}, {s: 'b'}] );
    });
    it('returns [] for []', function() {
      canonicalizeTerms([]).should.deep.equal([]);
    });

    it('deduplicates terms, and make duplicates overwrite earlier ' +
      'occurrences', function() {
      canonicalizeTerms(['a', 'b', {s:'a', y:'i'}, 'c', 'c']).should.deep.equal(
        [{s: 'a', y: 'i'}, {s: 'b'}, {s: 'c'}]
      );
    });

    describe('makes deep clones of term-objects', function() {
      var orig = [{s: 'a', y: 'i',}, 'b'];
      var targ = [{s: 'a', y: 'i'}, {s: 'b'}];
      var cano = canonicalizeTerms(orig);
      it('clones term-objects', function() {
        cano.should.deep.equal(targ);
      });
      it('makes that changes on an original object do not affect the clone',
        function() {
        orig[0].y = 'u';
        cano.should.deep.equal(targ);
      });
    });
  });

  describe('canonicalizeEntry()', function() {
    it('removes unsupported properties from both entry and term-objests',
      function() {
      var orig = {i: 'A:01', d: 'A', x: 'abc', t: ['a', {s: 'a', y: 'i'}, 'b'],
                  z: {b: {c: 5}}, f: 'invalid' };
      var cano = {i: 'A:01', d: 'A', x: 'abc', t: [ {s: 'a', y: 'i'}, {s: 'b'} ],
                  z: {b: {c: 5}} };
      canonicalizeEntry(orig).should.deep.equal(cano);
      });

    it('wraps a single term-string into a term-object in an Array', function() {
      var orig = {i: 'A:01', d: 'A', x: '', t: 'a', gone: 'xyz', z: 0};
      var cano = {i: 'A:01', d: 'A', x: '', t: [ {s: 'a'} ], z: 0};
      canonicalizeEntry(orig).should.deep.equal(cano);
    });

    it('makes a deep clone of the `z` property', function() {
      var orig = {i: 'A:01', d: 'A', t: [ {s: 'a'} ], z: {k: 0}};
      var clon = deepClone(orig);  // An independent, deep clone of it.
      var cano = canonicalizeEntry(orig);
      cano.should.deep.equal(clon);
      orig.z.k = 1;
      cano.should.deep.equal(clon);
    });
  });
});
