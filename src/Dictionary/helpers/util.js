module.exports = {undef, deepClone, strcmp, asArray, limitBetween, arrayQuery};


function undef(x) {
  return typeof x == 'undefined';
}


// Returns a deep-clone of an object. (This excludes its functions).
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


// Compares strings, and returns a number (-1/0/1) that can be used by
// compare functions used for sorting.
function strcmp(a, b, caseMatters = false) {
  if (!caseMatters) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  return a < b ?  -1 :  a > b ?  1 :  0;
}


// If given an array, returns it;
// if given a single value, returns it wrapped into a one-element array;
// if given `undefined`, returns an empty array.
function asArray(x) {
  return undef(x) ? [] : [].concat(x);
}


// If x is outside the interval [min, max], returns the border it's closest to.
// If either min or max is null, it will be ignored.
function limitBetween(x, min, max) {
  return (min != null && x < min) ? min : (max != null && x > max) ? max : x;
}


function arrayQuery(
    array, filter, sort, page, perPage, perPageDefault = 20, perPageMax = 100) {
  page    = limitBetween(page   || 1             , 1, null);
  perPage = limitBetween(perPage|| perPageDefault, 1, perPageMax);
  var skip = (page - 1) * perPage;
  return array
    .filter(filter)
    .sort  (sort)
    .slice (skip, skip + perPage);
}
