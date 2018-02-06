import {asyncMap, callAsync, callAsyncForOneOrEach} from './async';
import asyncWaterfall from 'async-waterfall';


export default function test(CB, expect, T,L,D) {

  asyncWaterfall([
    cb => testAsyncMap(cb, expect, T,L,D),
    cb => testAsync(cb, expect, T,L,D),
    cb => testCallAsyncForOneOrEach(cb, expect, T,L,D)
  ], CB);
}


function testAsyncMap(CB, expect, T,L,D) {

  var f = (x, cb) => x==0 ? cb('e') : cb(null, x * 10);

  asyncWaterfall([
    cb => {
      T('asyncMap(): calls back with two arrays: null/error-values, ' +
        'and results-values, as received back from each of the function calls');
      asyncMap([0, 1, 2], f, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        cb();
      });
    },
    cb => {
      T('asyncMap(): calls back with a plain `null` as `errors` ' +
        'if none of the calls reported an error');
      asyncMap([1, 2], f, (err, res) => {
        expect(err).to.deep.equal(null);
        res.should.deep.equal([10, 20]);
        cb();
      });
    },

  ], CB);

}


function testAsync(CB, expect, T,L,D) {

  var f = (a, b, cb) => cb(null, a * b);
  var count = 0;

  asyncWaterfall([
    cb => {
      T('callAsync(): calls a function on the next event loop');
      callAsync(f, 2, 5, (err, ans) => {
        ans.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;  // `f` will only be called after this.
    },
  ], CB);

}


function testCallAsyncForOneOrEach(CB, expect, T,L,D) {

  var f = (x, cb) => x==0 ? cb('e') : cb(null, x * 10);
  var count = 0;

  asyncWaterfall([
    cb => {
      count = 0;
      T('callAsyncForOneOrEach(): single value, no error');
      callAsyncForOneOrEach(1, f, (err, res) => {
        expect(err).to.equal(null);
        res.should.equal(10);
        T('callAsyncForOneOrEach(): should call callback in truly async way, ' +
          'i.e. on the next event loop');
        count.should.equal(1);
        cb();
      });
      count = 1;
    },
    cb => {
      T('callAsyncForOneOrEach(): single value, with error');
      callAsyncForOneOrEach(0, f, (err, res) => {
        err.should.equal('e');
        expect(res).to.equal(undefined);
        count.should.equal(2);
        cb();
      });
      count = 2;
    },
    cb => {
      T('callAsyncForOneOrEach(): multiple values in array, no error');
      callAsyncForOneOrEach([1, 2], f, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([10, 20]);
        count.should.equal(3);
        cb();
      });
      count = 3;
    },
    cb => {
      T('callAsyncForOneOrEach(): multiple values in array, with error');
      callAsyncForOneOrEach([0, 1, 2], f, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        count.should.equal(4);
        cb();
      });
      count = 4;
    },
    cb => {
      T('callAsyncForOneOrEach(): should call callback in truly async way, ' +
        'also for an empty array');
      callAsyncForOneOrEach([], f, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([]);
        count.should.equal(5);
        cb();
      });
      count = 5;
    },

  ], CB);

}


//test.act = 2;
