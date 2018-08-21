module.exports = { deepClone, strcmp, callAsync };


/**
 * Returns a deep-clone of an object. (This excludes its functions).
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


/**
 * Compares two strings, and returns a number (-1/0/1) that can be used by
 * compare functions used for sorting.
 */
function strcmp(a, b, caseMatters = false) {
  if (!caseMatters) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  return a < b ?  -1 :  a > b ?  1 :  0;
}


/**
 * Makes a call to `f` with given arguments, in a truly asynchronous way,
 * i.e. on new event loop.
 */
function callAsync(f, ...args) {
  setTimeout(() => f(...args), 0);
}
