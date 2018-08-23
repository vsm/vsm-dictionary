const { prepTerms, prepEntry, zPropPrune } = require('./commonUtils');
const chai = require('chai');  chai.should();
///const expect = chai.expect;


describe('helpers/commonUtils.js', () => {

  describe('prepTerms()', () => {
    it('removes unsupported properties from a list of term-objects', () => {
      prepTerms( [{str: 'a', style: 'i', gone: 'xyz'}, {str: 'b'}] )
        .should.deep.equal( [{str: 'a', style: 'i'}, {str: 'b'}] );
    });
    it('returns [] for []', () => {
      prepTerms([]).should.deep.equal([]);
    });

    it('deduplicates terms, and make duplicates overwrite ' +
       'earlier occurrences', () => {
      prepTerms(
        [{str:'a'}, {str:'b'}, {str:'a', style:'i'}, {str: 'c'}, {str: 'c'}]
      ).should.deep.equal(
        [{str: 'a', style: 'i'}, {str: 'b'}, {str: 'c'}]
      );
    });

    describe('makes clones of term-objects, whereby changes on an ' +
       'original object do not affect the clone', () => {
      var orig = [{str: 'a', style: 'i', q: 1}, {str: 'b'}];
      var targ = [{str: 'a', style: 'i'      }, {str: 'b'}];
      var newr = prepTerms(orig);
      newr.should.deep.equal(targ);
      orig[0].q.should.equal(1);

      orig[0].style = 'u';
      newr.should.deep.equal(targ);
    });
  });


  describe('prepEntry()', () => {
    it('removes unsupported properties from both entry and term-objects', () => {
      var orig = {
        id: 'A:01', dictID: 'A', descr: 'abc', f: 'invalid',
        terms: [ {str: 'a'}, {str: 'a', style: 'i', q: 1}, {str: 'b'} ],
        z: {b: {c: 5}} };
      var newr = {
        id: 'A:01', dictID: 'A', descr: 'abc',
        terms: [ {str: 'a', style: 'i'}, {str: 'b'} ],
        z: {b: {c: 5}} };
      prepEntry(orig).should.deep.equal(newr);
    });
  });


  describe('zPropPrune()', () => {
    it('leaves an Object\'s z-property unchanged if arg. 2 is `true`', () => {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], true).should.deep.equal(
        [ {z: {a: 1, b: 2, c: 3}, X: 9} ] );
    });
    it('removes the z-property if arg. 2 is `[]`', () => {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], []).should.deep.equal(
        [ {X: 9} ] );
    });
    it('removes the z-property if arg. 2 only holds a key not in `z`', () => {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['N']).should.deep.equal(
        [ {X: 9} ] );
    });
    it('keeps only the one z-prop. corresponding to the key in arg. 2', () => {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['b']).should.deep.equal(
        [ {z: {b: 2}, X: 9} ] );
    });
    it('keeps only the z-properties given in argument 2', () => {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['x', 'b'])
        .should.deep.equal( [ {z: {b: 2}, X: 9} ] );
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['c', 'a'])
        .should.deep.equal( [ {z: {a: 1, c: 3}, X: 9} ] );
    });
  });

});
