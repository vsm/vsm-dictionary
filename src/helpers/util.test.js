const {undef, deepClone, strcmp, callAsync} = require('./util');
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

  describe('callAsync()', function() {
    var f = (a, b, cb) => cb(null, a * b);
    var count = 0;

    it('calls a function on the next event loop', function(cb) {
      callAsync(f, 2, 5, (err, ans) => {
        ans.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;  // `f` will only be called after this assignment.
    });
  });
});
