const { prepTerms, prepEntry, zPropPrune } = require('./commonUtils');
const {deepClone} = require('./util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/commonUtils.js', function() {

  describe('prepTerms()', function() {
    it('removes unsupported properties from a list of term-objects', function() {
      prepTerms( [{str: 'a', style: 'i', gone: 'xyz'}, {str: 'b'}] )
        .should.deep.equal( [{str: 'a', style: 'i'}, {str: 'b'}] );
    });
    it('returns [] for []', function() {
      prepTerms([]).should.deep.equal([]);
    });

    it('deduplicates terms, and make duplicates overwrite ' +
      'earlier occurrences', function() {
      prepTerms(
        [{str:'a'}, {str:'b'}, {str:'a', style:'i'}, {str: 'c'}, {str: 'c'}]
      ).should.deep.equal(
        [{str: 'a', style: 'i'}, {str: 'b'}, {str: 'c'}]
      );
    });

    describe('makes clones of term-objects, whereby changes on an ' +
      'original object do not affect the clone', function() {
      var orig = [{str: 'a', style: 'i', q: 1}, {str: 'b'}];
      var targ = [{str: 'a', style: 'i'      }, {str: 'b'}];
      var newr = prepTerms(orig);
      newr.should.deep.equal(targ);
      orig[0].q.should.equal(1);

      orig[0].style = 'u';
      newr.should.deep.equal(targ);
    });
  });


  describe('prepEntry()', function() {
    it('removes unsupported properties from both entry and term-objects',
      function() {
      var orig = {id: 'A:01', dictID: 'A', descr: 'abc', f: 'invalid',
                  terms: [ {str: 'a'}, {str: 'a', style: 'i', q: 1}, {str: 'b'} ],
                  z: {b: {c: 5}} };
      var newr = {id: 'A:01', dictID: 'A', descr: 'abc',
                  terms: [ {str: 'a', style: 'i'}, {str: 'b'} ],
                  z: {b: {c: 5}} };
      prepEntry(orig).should.deep.equal(newr);
    });
  });


  describe('zPropPrune()', function() {
    it('leaves an Object\'s z-property unchanged if argument 2 is `true`',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], true).should.deep.equal(
        [ {z: {a: 1, b: 2, c: 3}, X: 9} ] );
    });
    it('removes the z-property if arg. 2 is `[]`', function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], []).should.deep.equal(
        [ {X: 9} ] );
    });
    it('removes the z-property if arg. 2 only holds a key not in `z`',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['N']).should.deep.equal(
        [ {X: 9} ] );
    });
    it('keeps only the one z-property corresponding to the key in ' +
      'argument 2', function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['b']).should.deep.equal(
        [ {z: {b: 2}, X: 9} ] );
    });
    it('keeps only the z-properties given in argument 2',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['x', 'b'])
        .should.deep.equal( [ {z: {b: 2}, X: 9} ] );
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['c', 'a'])
        .should.deep.equal( [ {z: {a: 1, c: 3}, X: 9} ] );
    });
  });

});
