module.exports = {canonicalizeEntry, canonicalizeTerms};


const {deepClone, undef} = require('./util');


/*
Converts a given entry so that it returns:
- a deep-cloned version of the entry,
- that only kept accepted properties for an 'entry'-type object, and
- that got its `terms` converted to a standardized array.
Also adds the object's keys in id-dictID-descr-terms-z order, for keeping nice console-output.
*/
function canonicalizeEntry(entry) {
  var e = {  // First copy the valid, required properties.
    id:     entry.id,
    dictID: entry.dictID,
    terms:  canonicalizeTerms(entry.terms)
  };
  if (!undef(entry.descr))  e.descr = entry.descr;  // Optional String prop.
  if (!undef(entry.z    ))  e.z     = deepClone(entry.z);  // Opt. Object prop.
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
    (tType == 'string') ?  [ {str: t} ] :  // Wrap String in Object in Array.
    (tType == 'object' && undef(t.length)) ? [ canoTermObj(t) ] : // Obj in Arr.
    t.map( t => (typeof t == 'string') ?  {str: t} :  canoTermObj(t) )
  );

  return arr.reduce((arr2, term) => {  // Deduplicate terms, as explained above.
    for (var j = 0;  j < arr2.length;  j++) {
      if (arr2[j].str === term.str)  { arr2[j] = term;  break; }
    }
    if (j == arr2.length)  arr2.push(term);
    return arr2;
  }, []);
}



// Converts a single term-object to the canonicalized form
// `{str:, [style:], [descr:]}`, and hereby clones it too.
function canoTermObj(obj) {
  var o = {str: obj.str};  // Required property.
  if (!undef(obj.style))  o.style = obj.style;  // Optional property.
  if (!undef(obj.descr))  o.descr = obj.descr;
  return o;
}
