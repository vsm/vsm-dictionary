const {undef, deepClone, strcmp, asArray, limitBetween, arrayQuery}
  = require('./util');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/util.js', function() {
  describe('undef()', function() {
    it('returns true for `undefined`', function() {
      expect(undef()).to.equal(true);
      expect(undef(undefined)).to.equal(true);
    });
    it('returns false for many other data types', function() {
      undef(null).should.equal(false);
      undef('').should.equal(false);
      undef(/a/).should.equal(false);
      undef(true).should.equal(false);
      undef(false).should.equal(false);
      undef(NaN).should.equal(false);
      undef(0).should.equal(false);
      undef(42).should.equal(false);
      undef(() => {}).should.equal(false);
    });
  });

  describe('deepClone()', function() {
    it('deep-clones, so changes on the original object ' +
      'do not affect the clone', function() {
      var x = { a: 1,  b: {c: 1} };
      var y = deepClone(x);
      y.b.c = 2;
      x.should.deep.equal({ a: 1,  b: {c: 1} });
      y.should.deep.equal({ a: 1,  b: {c: 2} });
    });
  });

  describe('strcmp()', function() {
    it('returns -1;0;1 after case-insensitively comparing <;==;> strings',
      function() {
      expect(strcmp('a', 'b')).to.equal(-1);
      expect(strcmp('a', 'a')).to.equal(0);
      expect(strcmp('b', 'a')).to.equal(1);
      expect(strcmp('B', 'a')).to.equal(1);
      expect(strcmp('B', 'a', true)).to.equal(-1);
    });
    it('is usable as a sort-function', function() {
      ['c','B','a'].sort((a, b) => strcmp(a, b))
        .should.deep.equal(['a','B','c']);
    });
  });

  describe('asArray()', function() {
    it('returns a passed Array without changes', function() {
      asArray([1, 2]).should.deep.equal([1, 2]);
    });
    it('wraps a single value into an Array', function() {
      asArray(1).should.deep.equal([1]);
    });
    it('wraps `null` into an Array', function() {
      asArray(null).should.deep.equal([null]);
    });
    it('returns an empty Array for `undefined`', function() {
      asArray().should.deep.equal([]);
      asArray(undefined).should.deep.equal([]);
    });
  });

  describe('limitBetween()', function() {
    it('limits the 1st argument to be >= the 2nd and <= 3rd', function() {
      limitBetween(2, 1, 3).should.equal(2);
      limitBetween(0, 1, 3).should.equal(1);
      limitBetween(4, 1, 3).should.equal(3);
    });
    it('only limits the 1st argument to be >= the 2nd, ' +
      'if the 3rd is `null`', function() {
      limitBetween(0, 1, null).should.equal(1);
      limitBetween(4, 1, null).should.equal(4);
    });
    it('only limits the 1st argument to be <= the 3nd, ' +
      'if the 2nd is `null`', function() {
      limitBetween(0, null, 3).should.equal(0);
      limitBetween(4, null, 3).should.equal(3);
    });
  });

  describe('arrayQuery()', function() {
    var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var filter  = e => e < 7;
    var filter2 = e => e > 3;
    var sort = (a, b) => a%2 - b%2 || a - b; // Sort by: even vs odd, then value.
    it('applies a given sort function', function() {
      arrayQuery(arr, filter , sort).should.deep.equal([2, 4, 6, 1, 3, 5]);
      arrayQuery(arr, filter2, sort).should.deep.equal([4, 6, 8, 5, 7, 9]);
    });
    it('applies a filter and sort function, and paginates, page 1', function() {
      arrayQuery(arr, filter , sort, 1, 3).should.deep.equal([2, 4, 6]);
      arrayQuery(arr, filter2, sort, 1, 3).should.deep.equal([4, 6, 8]);
    });
    it('applies a filter and sort function, and paginates, page 2', function() {
      arrayQuery(arr, filter , sort, 2, 3).should.deep.equal([1, 3, 5]);
      arrayQuery(arr, filter2, sort, 2, 3).should.deep.equal([5, 7, 9]);
    });
    it('rounds up invalid pagination arguments to 1', function() {
      arrayQuery(arr, filter, sort, -1, -1).should.deep.equal([2]);
    });
  });
});
