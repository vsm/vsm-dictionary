/*
Contains functionality that Dictionary and/or its subclasses get-functions
may share:
- standardizing the user-given `options` object;
- editing of the result array's items's `z`-object properties.
*/

module.exports = {prepGetOptions, zPropPrune};


const {undef, asArray} = require('./util');

const perPageDefault = 20;
const perPageMax = 100;


// - Makes `options` and `options.filter` not-undefined,
//   and makes each `options.filter.<filterKey>` an Array or `false`.
// - If the optional `sortKeys` argument is given, then does the
//   same for `options.sort.<sortKey>`.
function prepGetOptions(options, filterKeys = [], sortKeys) {
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


// For each `array`-item's `z`-property, keeps only the subproperties
// specified in list `zs`. Or keeps/deletes all if `zs` is true/false resp.
// If the `z`-property would be `{}`, then removes it completely.
function zPropPrune(array, zs = true) {
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
