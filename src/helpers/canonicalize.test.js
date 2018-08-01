const {canonicalizeEntry, canonicalizeTerms} = require('./canonicalize');
const {deepClone} = require('./util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/canonicalize.js', function() {
  describe('canonicalizeTerms()', function() {
    it('wraps a String into a term-object in an Array', function() {
      canonicalizeTerms( 'a' ).should.deep.equal( [{str: 'a'}] );
    });
    it('wraps a term-object into an Array', function() {
      canonicalizeTerms( {str: 'a'} ).should.deep.equal( [{str: 'a'}] );
    });
    it('returns an Array, and remove unsupported properties', function() {
      canonicalizeTerms( [{str: 'a', style: 'i', gone: 'xyz'}, 'b'] )
        .should.deep.equal( [{str: 'a', style: 'i'}, {str: 'b'}] );
    });
    it('returns [] for []', function() {
      canonicalizeTerms([]).should.deep.equal([]);
    });

    it('deduplicates terms, and make duplicates overwrite earlier ' +
      'occurrences', function() {
      canonicalizeTerms(['a', 'b', {str:'a', style:'i'}, 'c', 'c'])
        .should.deep.equal( [{str: 'a', style: 'i'}, {str: 'b'}, {str: 'c'}] );
    });

    describe('makes deep clones of term-objects', function() {
      var orig = [{str: 'a', style: 'i',}, 'b'];
      var targ = [{str: 'a', style: 'i'}, {str: 'b'}];
      var cano = canonicalizeTerms(orig);
      it('clones term-objects', function() {
        cano.should.deep.equal(targ);
      });
      it('ensures that changes on an original object do not affect the clone',
        function() {
        orig[0].style = 'u';
        cano.should.deep.equal(targ);
      });
    });
  });

  describe('canonicalizeEntry()', function() {
    it('removes unsupported properties from both entry and term-objects',
      function() {
      var orig = {id: 'A:01', dictID: 'A', descr: 'abc', f: 'invalid',
                  terms: ['a', {str: 'a', style: 'i', q: 'invalid'}, 'b'],
                  z: {b: {c: 5}} };
      var cano = {id: 'A:01', dictID: 'A', descr: 'abc',
                  terms: [ {str: 'a', style: 'i'}, {str: 'b'} ],
                  z: {b: {c: 5}} };
      canonicalizeEntry(orig).should.deep.equal(cano);
      });

    it('wraps a single term-string into a term-object in an Array', function() {
      var orig = {id: 'A:01', dictID: 'A', descr: '',
                  terms: 'a',            z: 0};
      var cano = {id: 'A:01', dictID: 'A', descr: '',
                  terms: [ {str: 'a'} ], z: 0};
      canonicalizeEntry(orig).should.deep.equal(cano);
    });

    it('makes a deep clone of the `z` property', function() {
      var orig = {id: 'A:01', dictID: 'A', terms: [ {str: 'a'} ], z: {k: 0}};
      var clon = deepClone(orig);  // An independent, deep clone of it.
      var cano = canonicalizeEntry(orig);
      cano.should.deep.equal(clon);
      orig.z.k = 1;
      cano.should.deep.equal(clon); // Change on `orig` shouldn't affect `cano`.
    });
  });
});
