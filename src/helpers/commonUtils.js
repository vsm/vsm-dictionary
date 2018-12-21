/*
Contains functionality that Dictionary and/or its subclasses may share.
*/

module.exports = { prepTerms, prepEntry, zPropPrune };



/**
 * Takes a single term-object, and removes any invalid properties so it has the
 * form `{str:, [style:], [descr:]}`. It hereby clones it too.
 */
function _prepTermObj(obj) {
  var o = {str: obj.str};  // Required property.
  if (obj.style !== undefined)  o.style = obj.style;  // Optional property.
  if (obj.descr !== undefined)  o.descr = obj.descr;  // " .
  return o;
}


/**
 * Takes entry's terms-list Array, and de-duplicates it: if a duplicate
 * term-object (compared based on having the same term-string)coccurs further
 * in the array, that one is moved into original term's place in the array,
 * iteratively. It hereby deep-clones the Array too.
 */
function prepTerms(arr) {
  arr = arr.map(t => _prepTermObj(t));

  return arr.reduce((arr2, term) => {  // Deduplicate terms, as explained above.
    for (var j = 0;  j < arr2.length;  j++) {
      if (arr2[j].str === term.str)  { arr2[j] = term;  break }
    }
    if (j == arr2.length)  arr2.push(term);
    return arr2;
  }, []);
}


/**
 * Purpose: basic cleanup of third-party-provided entry-objects and
 *          their term-objects.
 *
 * Converts a given entry so that it returns:
 * - a deep-cloned version of the entry,
 * - that only kept accepted properties for an 'entry'-type object, and
 * - that got its `terms` processed by `prepTerms()`.
 * Note: during cloning, it adds the object's keys in id-dictID-terms-descr-z
 * order, which may keep, or result in, nice output when using `console.log()`.
 */
function prepEntry(entry) {
  var e = {  // First copy the valid, required properties.
    id:     entry.id,
    dictID: entry.dictID,
    terms:  prepTerms(entry.terms)
  };
  if (entry.descr !== undefined)  e.descr = entry.descr;  // Opt. String prop.
  if (entry.z !== undefined)  e.z = entry.z;  // Opt. Obj. prop: shallow-clone.
  return e;
}


/**
 * Purpose: keep only a selection of the `z`-obj. properties in a query-result.
 *
 * - If `zPropStrs` is an array:
 *   processes each each `entries`-item's `z`-property, and:
 *   - keeps only the subproperties specified by the Strings in `zPropStrs`;
 *   - if this makes `z` an empty Object, then removes the entry's `z` entirely.
 * - If `zPropStrs` is true or undefined, returns `entries` unchanged.
 */
function zPropPrune(entries, zPropStrs = true) {
  return zPropStrs === true ? entries :
    entries.map(e => {
      if (e.z === undefined)  return e;  // Continue if `z` is empty already.
      var c = Object.assign({}, e, {z: {}}); // Clone entry; make its `z` empty.
      zPropStrs.forEach(p => {
        if (e.z[p] !== undefined)  c.z[p] = e.z[p];  // Copy requested z-props.
      });
      if (!Object.keys(c.z).length)  delete c.z;  // Delete `z` if it is `{}`.
      return c;
    });
}
