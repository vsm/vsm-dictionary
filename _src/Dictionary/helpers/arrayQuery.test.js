import {prepGetOptions, arrayQuery, zPropPrune} from './arrayQuery';


export default function test(cb, expect, T,L,D) {

  T('prepGetOptions() with filterKeys');
  prepGetOptions({}, []).should.deep.equal({filter: {}});
  prepGetOptions({}, ['a', 'b']).should.deep.equal(
    {filter: {a: false, b: false}} );
  prepGetOptions({filter: {b: 'x'}}, ['a', 'b']).should.deep.equal(
    {filter: {a: false, b: ['x']}} );

  T('prepGetOptions() with filterKeys and sortKeys');
  prepGetOptions({}, [], ['a', 'b']).should.deep.equal(
    {filter: {}, sort: {a: false, b: false}} );
  prepGetOptions({sort: {b: 'x'}}, [], ['a', 'b']).should.deep.equal(
    {filter: {}, sort: {a: false, b: ['x']}} );


  T('arrayQuery()');
  var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var filter = e => e < 7;
  var sort = (a, b) => a%2 - b%2 || a - b;  // Sort by: even vs odd, then value.
  arrayQuery(arr, filter, sort).should.deep.equal([2, 4, 6, 1, 3, 5]);
  arrayQuery(arr, filter, sort, 1, 3).should.deep.equal([2, 4, 6]);
  arrayQuery(arr, filter, sort, 2, 3).should.deep.equal([1, 3, 5]);
  arrayQuery(arr, filter, sort, -1, -1).should.deep.equal([2]);


  T('zPropPrune()');
  zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], true).should.deep.equal(
    [ {z: {a: 1, b: 2, c: 3}, X: 9} ] );
  zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], false).should.deep.equal(
    [ {X: 9} ] );
  zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], 'b').should.deep.equal(
    [ {z: {b: 2}, X: 9} ] );
  zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['x', 'b']).should.deep.equal(
    [ {z: {b: 2}, X: 9} ] );
  zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['c', 'a']).should.deep.equal(
    [ {z: {a: 1, c: 3}, X: 9} ] );

  cb();
}

//test.act = 2;
