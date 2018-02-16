const {asyncMap, callAsync, callAsyncForOneOrEach} = require('./async');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/async.js', function() {
  describe('asyncMap()', function() {
    var f = (x, cb) => x == 0 ? cb('err') : cb(null, x * 10); // Error for x==0.

    it('calls back with two arrays: null/error-values, and results-values, ' +
      'as received back from each of the function calls', function(cb) {
      asyncMap([0, 1, 2], f, (err, res) => {
        err.should.deep.equal(['err', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        cb();
      });
    });
    it('calls back with one `null` as \'err\' ' +
      'if none of the calls reported an error', function(cb) {
      asyncMap([1, 2], f, (err, res) => {
        expect(err).to.deep.equal(null);
        res.should.deep.equal([10, 20]);
        cb();
      });
    });
  });


  describe('testAsync()', function() {
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


  describe('testCallAsyncForOneOrEach()', function() {
    var f = (x, cb) => x==0 ? cb('e') : cb(null, x * 10);
    var count;

    beforeEach(function() {
      count = 0;
    });

    it('calls `f` on a single value, without error; ' +
      'and calls back on the next event-loop', function(cb) {
      callAsyncForOneOrEach(1, f, (err, res) => {
        expect(err).to.equal(null);
        res.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('on single value, and reports error', function(cb) {
      callAsyncForOneOrEach(0, f, (err, res) => {
        err.should.equal('e');
        expect(res).to.equal(undefined);
        count.should.equal(1);  // Test each call's true asynchronicity as well.
        cb();
      });
      count = 1;
    });
    it('on multiple values in array, without errors', function(cb) {
      callAsyncForOneOrEach([1, 2], f, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('on multiple values in array, including an error', function(cb) {
      callAsyncForOneOrEach([0, 1, 2], f, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('calls the callback on the next event-loop, also for an empty array',
      function(cb) {
      callAsyncForOneOrEach([], f, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
  });
});
