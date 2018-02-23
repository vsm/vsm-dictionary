module.exports = {asyncMap, callAsync, callAsyncForOneOrEach};


/*
The function `asyncMap(elems, func, cb)` executes, in parallel, a call
to `func(item, callback(error, result))` for every item of the `elems` array,
and calls `cb(errors, results)` when all of their callbacks have been called.

In contrast to npm's "async"'s `map` function, this function does not stop
if any of the `func`-calls reports an error (via its callback). It returns
an array of null/error for each of the calls, or simply `null` if no errors.

- `results` is an array of the `results` returned via each `callback`;
- `errors`:
  - if any of the `callback`s returned a non-null `error`,
    then `errors` is an array of all the reported `error` values,
    in the order corresponding to the given `elems`.
  - if all of them were `null`, then `errors` is conveniently `null` (no array).

*/
function asyncMap(elems, func, cb) {
  var results = [];
  var errors = [];
  var count = elems.length;

  if (!count)  return cb(null, results);

  elems.forEach((e, i) =>
    func(e, (error, result) => {
      errors[i] = error;
      results[i] = result;
      if (!--count)  cb(
        errors.every(err => err === null) ? null : errors,
        results
      );
    })
  );
}


/*
  Makes a call to `f` with given arguments, in a truly asynchronous way,
  i.e. on new event loop.
*/
function callAsync(f, ...args) {
  setTimeout(() => f(...args), 0);
}


/*
  + If `elems` is a single value, then calls `func(value, cb)` on it.
    If `elems` is an array, then
    - calls `func(item, tmpCb)` for all items,
    - it collects both all errors, and the results that `func` returns via its
      calls to `tmpCb(error, result)`, into two arrays: `errors` and `results`;
    - and finally, calls `cb` with `(errors, results)`,
      after making `errors` simply `null` if all errors were `null`.
  + Moreover, it makes this happen in a in a guaranteed truly asynchronous way:
    it calls `func` on the next event-loop, or if `func` is never called (when
    elems is an empty array), then calls `cb` on the next event-loop instead.
*/
function callAsyncForOneOrEach(elems, func, cb) {
  if (!Array.isArray(elems))  makeAsync(func)(elems, makeAsync(cb));
  else if (!elems.length)  makeAsync(cb)(null, []);
  else  asyncMap(elems, (e, cbf) => makeAsync(func)(e, cbf), cb);

  function makeAsync(cb) {
    return (...args) => callAsync(cb, ...args);
  }
}
