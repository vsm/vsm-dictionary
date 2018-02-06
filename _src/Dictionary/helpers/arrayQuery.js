/*
Contains shared functionality for DictionaryLocal's get-functions:
- standardizing the user-given `options` object;
- querying on an array, with filtering, sorting, and pagination;
- editing of the result array's items's `z`-object properties.
*/

import {undef, asArray, limitBetween} from './util';

const perPageDefault = 20;
const perPageMax = 100;


// Makes `options` and `options.filter` not-undefined,
// and makes each `options.filter.<filterKey>` an Array or `false`,
// and the same for `options.sort.<sortKey>` if given (only for match-search).
export function prepGetOptions(options, filterKeys = [], sortKeys) {
  var o    = Object.assign({}, options  || {});  // Clone as well, ..
  o.filter = Object.assign({}, o.filter || {});  // .. to avoid side-effects.
  filterKeys.forEach(k => o.filter[k] = asArrayOrFalse(o.filter[k]));

  if (sortKeys) {
    o.sort = Object.assign({}, o.sort || {});
    sortKeys.forEach(k => o.sort[k] = asArrayOrFalse(o.sort[k]));
  }
  return o;

  function asArrayOrFalse(x) {
    return x ? asArray(x) : false;
  }
}


export function arrayQuery(array, filter, sort, page, perPage) {
  page    = limitBetween(page   || 1             , 1, null);
  perPage = limitBetween(perPage|| perPageDefault, 1, perPageMax);
  var skip = (page - 1) * perPage;
  return array
    .filter(filter)
    .sort  (sort)
    .slice (skip, skip + perPage);
}


// For each `array`-item's `z`-property, keeps only the subproperties
// specified in list `zs`. Or keeps/deletes all if `zs` is true/false resp.
export function zPropPrune(array, zs = true) {
  if (zs !== true) {
    zs = zs === false ? [] : asArray(zs);
    array = array.map(e => {
      if (undef(e.z))  return e;  // Continue if `z` is empty already.
      var c = Object.assign({}, e, {z: {}});  // Clear `z`'s properties.
      zs.forEach(s => { if (!undef(e.z[s]))  c.z[s] = e.z[s]; }); // Copy over.
      if (!Object.keys(c.z).length)  delete c.z;  // Delete `z` if it is `{}`.
      return c;
    });
  }
  return array;
}
