import {undef, deepClone, strcmp, asArray, limitBetween} from './util';


export default function test(cb, expect, T,L,D) {

  T('undef()');
  expect(undef(undefined)).to.equal(true);
  expect(undef(0)).to.equal(false);

  T('deepClone()');
  var x = { a: 1,  b: {c: 1} };
  var y = deepClone(x);
  y.b.c = 2;
  x.should.deep.equal({ a: 1,  b: {c: 1} });
  y.should.deep.equal({ a: 1,  b: {c: 2} });

  T('strcmp()');
  expect(strcmp('a', 'b')).to.equal(-1);
  expect(strcmp('a', 'a')).to.equal(0);
  expect(strcmp('b', 'a')).to.equal(1);
  expect(strcmp('B', 'a')).to.equal(1);
  expect(strcmp('B', 'a', true)).to.equal(-1);
  ['c','B','a'].sort((a, b) => strcmp(a, b)).should.deep.equal(['a','B','c']);

  T('asArray()');
  asArray([1, 2]).should.deep.equal([1, 2]);
  asArray(1).should.deep.equal([1]);
  asArray(null).should.deep.equal([null]);
  asArray().should.deep.equal([]);

  T('limitBetween()');
  limitBetween(2, 1, 3).should.equal(2);
  limitBetween(0, 1, 3).should.equal(1);
  limitBetween(4, 1, 3).should.equal(3);
  limitBetween(0, null, 3).should.equal(0);
  limitBetween(4, null, 3).should.equal(3);
  limitBetween(0, 1, null).should.equal(1);
  limitBetween(4, 1, null).should.equal(4);

  cb();
}

//test.act = 2;
