module.exports = {canonicalizeEntry, canonicalizeTerms};


const {deepClone, undef} = require('./util');


/*
Converts a given entry so that it returns:
- a deep-cloned version of the entry,
- that only kept accepted properties for an 'entry'-type object, and
- that got its `t` converted to a standardized array.
Also adds the object's keys in i-d-x-tz order, for keeping nice console-output.
*/
function canonicalizeEntry(entry) {
  var e = {i: entry.i,  d: entry.d};    // Required properties.
  if (!undef(entry.x))  e.x = entry.x;  // Optional String prop.
  e.t = canonicalizeTerms(entry.t);     // Required array prop.
  if (!undef(entry.z))  e.z = deepClone(entry.z);  // Optional object prop.
  return e;
}


/*
Converts a possibly simplified form of an entry's terms-list, i.e.
<String|Object|Array(String|Object)>, to the standardized form:
<Array(Object)>, while also deep-cloning it.

Also de-duplicates the terms-list.  If a duplicate term occurs further
in the array, that one is moved into original term's place in the array.
*/
function canonicalizeTerms(t) {
  var tType = typeof t;
  var arr = (
    (tType == 'string') ?  [ {s: t} ] :  // Wrap string in object in array.
    (tType == 'object' && undef(t.length)) ? [ canoTermObj(t) ] : // Obj in arr.
    t.map( t => (typeof t == 'string') ?  {s: t} :  canoTermObj(t) )
  );

  return arr.reduce((arr2, term) => {  // Deduplicate like explained above.
    for (var j = 0;  j < arr2.length;  j++) {
      if (arr2[j].s === term.s)  { arr2[j] = term;  break; }
    }
    if (j == arr2.length)  arr2.push(term);
    return arr2;
  }, []);
}



// Converts a single term-object to canonicalized form `{s:, [y:], [x:]}`,
// and hereby clones it.
function canoTermObj(obj) {
  var o = {s: obj.s};  // Required property.
  if (!undef(obj.y))  o.y = obj.y;  // Optional property.
  if (!undef(obj.x))  o.x = obj.x;
  return o;
}
