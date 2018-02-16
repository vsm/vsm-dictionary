const {prepGetOptions, arrayQuery, zPropPrune} = require('./arrayQuery');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/arrayQuery.js', function() {
  describe('prepGetOptions() with filterKeys', function() {
    it('returns an Object and adds a `filter` property if absent', function() {
      prepGetOptions(0,      []).should.deep.equal({filter: {}});
      prepGetOptions({},     []).should.deep.equal({filter: {}});
      prepGetOptions({x: 1}, []).should.deep.equal({filter: {}, x: 1});
    });

    it('also adds a `sort` property if a 3rd argument is given ', function() {
      prepGetOptions({}, [], []).should.deep.equal({filter: {}, sort: {}});
    });

    describe('makes that the given subproperties are present on the ' +
      '`filter`-property', function() {
      it('makes keys with value `false` for absent subproperties',
      function() {
        prepGetOptions({}, ['a', 'b'])
          .should.deep.equal( {filter: {a: false, b: false}} );
      });
      it('wraps values of existing given `filter`-keys into an Array if needed',
        function() {
        prepGetOptions({filter: {b: 'x'}}, ['a', 'b'])
          .should.deep.equal( {filter: {a: false, b: ['x']}} );
      });
    });

    describe('makes that the given subproperties are present on a ' +
      '`sort`-property', function() {
      it('makes keys with value `false` for absent subproperties',
      function() {
        prepGetOptions({}, [], ['a', 'b'])
          .should.deep.equal( {filter: {}, sort: {a: false, b: false}} );
      });
      it('wraps values of existing given `sort`-keys into an Array if needed',
        function() {
        prepGetOptions({sort: {b: 'x'}}, [], ['a', 'b'])
          .should.deep.equal( {filter: {}, sort: {a: false, b: ['x']}} );
      });
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
    it('applies a filter (1st) and sort function (2nd), ' +
      'and paginates, page 1', function() {
      arrayQuery(arr, filter , sort, 1, 3).should.deep.equal([2, 4, 6]);
      arrayQuery(arr, filter2, sort, 1, 3).should.deep.equal([4, 6, 8]);
    });
    it('applies a filter and sort function, and paginates, page 2', function() {
      arrayQuery(arr, filter , sort, 2, 3).should.deep.equal([1, 3, 5]);
      arrayQuery(arr, filter2, sort, 2, 3).should.deep.equal([5, 7, 9]);
    });
    it('rounds up invalid pagination arguments to `1`', function() {
      arrayQuery(arr, filter, sort, -1, -1).should.deep.equal([2]);
    });
  });

  describe('zPropPrune()', function() {
    it('leaves an Object\'s z-property unchanged if argument 2 is `true`',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], true).should.deep.equal(
        [ {z: {a: 1, b: 2, c: 3}, X: 9} ] );
    });
    it('removes the z-property if arg. 2 is `false`', function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], false).should.deep.equal(
        [ {X: 9} ] );
    });
    it('removes the z-property if arg. 2 is a String and not a key in `z`',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], 'N').should.deep.equal(
        [ {X: 9} ] );
    });
    it('keeps only the one z-property corresp. to the key being String-type ' +
      'arg. 2', function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], 'b').should.deep.equal(
        [ {z: {b: 2}, X: 9} ] );
    });
    it('keeps only the z-properties given in an Array(String)-type arg. 2',
      function() {
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['x', 'b'])
        .should.deep.equal( [ {z: {b: 2}, X: 9} ] );
      zPropPrune([ {z: {a: 1, b: 2, c: 3}, X: 9} ], ['c', 'a'])
        .should.deep.equal( [ {z: {a: 1, c: 3}, X: 9} ] );
    });
  });
});
