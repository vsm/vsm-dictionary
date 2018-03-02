/*
Design specification: see Dictionary.spec.md.
*/
const toExponential = require('to-exponential');
const canonicalize = require('./helpers/canonicalize');
const queryUtils = require('./helpers/queryUtils');
const {undef, deepClone, strcmp, asArray, callAsync} = require('./helpers/util');

const todoStr = 'to implement by a subclass';


module.exports = class Dictionary {

  constructor(options) {
    var opt = options || {};
    this.numberMatchConfig = !undef(opt.numberMatchConfig) ?  // false==deactiv.
      opt.numberMatchConfig :
      { dictID         : '00',
        conceptIDPrefix: '00:',
      };

    this.fixedTermsCache = {};
  }


  // Fetches and stores (pre-loads) match-objects for a number of fixedTerms.
  // - The fixedTerms are represented by `idts`, which stands for (a list of):
  //   "ID plus optional Term-string"s. So each 'idts' item uniquely identifies
  //   a fixedTerm.
  // - For each fixedTerm, `loadFixedTerms()` uses `getEntries()` (implemented
  //   by some subclass) to get full information about the entry it represents,
  //   and builds a match-object for them.
  // - Each of these match-objects is stored in `this.fixedTermsCache`, based on
  //   on a lookup key, which is calculated from the ID+optional-term-string.
  // - Later, when a call is made to `_getFixedMatchesForString()`, with as
  //   `options.idts` a subset of the `idts` preloaded here, that function will
  //   be able to get the relevant match-objects from the cache, without having
  //   to launch an extra query on the data storage.
  // Always calls `cb` on the next event-loop, as long as getEntries() does too.
  loadFixedTerms(idts, options, cb) {
    idts = this._prepIdts(idts);

    // Prevent unfiltered query; (`opt.filter.id=[]` would request all entries).
    // Also. call back on next event-loop, as `getEntries()` can't do that now.
    if (!idts.length)  return callAsync(cb, null);

    var opt = options ? deepClone(options) : {};
    if (!opt.filter)  opt.filter = {};
    opt.filter.id = idts.map(x => x.id); // Query `getEntries()` for idts's IDs.
    opt.page      = 1;
    opt.perPage   = idts.length;  // Ensure the response isn't paginated.

    this.getEntries(opt, (err, res) => {
      if (err)  return cb(err);

      // For each given id(+str), find the matching entry in the returned `res`.
      idts.forEach(idt => {
        var entry = res.items.find(e => e.id == idt.id);
        if (!entry)  return;  // Abort if no entry was found for this idts's ID.

        // Find the position of this idts's term-string, among the entry's terms,
        // or just use term 1 if the entry doesn't have that given term.
        var pos = entry.terms.findIndex(term => term.str == idt.str);
        if (pos == -1)  pos = 0;

        var k = this._idtToFTCacheKey(idt.id, idt.str || '');
        this.fixedTermsCache[k] = this._entryToMatch(entry, pos, 'F');
      });

      cb(null);
    });
  }


  // Brings a conceptID-and-optional-termStrings array into canonical form, e.g.
  // `['id', {id:'id2', str:..}, ..]` --> `[{id:'id'}, {id:'id2', str:..}, ..]`.
  _prepIdts(idts) {
    return asArray(idts).map(x => !x.id ? {id: x} : x);
  }


  // Given a fixedTerm's conceptID plus (optionally) a term-string, calculates
  // the key in `fixedTermsCache` that a match-object for that pair should get.
  _idtToFTCacheKey(conceptID, termStr = '') {
    return `${conceptID}\n${termStr}`;
  }


  // Builds a match-object, based on an entry and one of its terms.
  _entryToMatch(entry, termPos, matchType) {
    return Object.assign({}, entry, entry.terms[termPos], {type: matchType});
  }


  // Gets possible fixedTerm- and numberString match-objects for `str`, and
  // merges them into an array of normal matches, which come from a subclass's
  // `getMatchesForString()` (which must make the call to this function).
  // Only has an effect for result-page 1.
  // Always calls `cb` on the next event-loop.
  addExtraMatchesForString(str, arr, options, cb) {
    // If the requested page > 1, add no matches.
    if (options && (options.page || 1) > 1)  return callAsync(cb, null, arr);
    arr = arr.slice(0);  // Duplicate before editing.

    var res = this._getFixedMatchesForString(str, options);

    if (res.length) {
      // Merge after one possible 'R'-type match, and before all others.
      var match = (arr[0]  &&  arr[0].type == 'R') ? arr.shift() : false;
      arr = res.concat(arr);
      if (match)  arr.unshift(match);

      // De-duplicate.
      arr = arr.reduce((a, m1, i1) => {
        var i2 = arr.findIndex(m2 => m1.id == m2.id  &&  m1.str == m2.str);
        if (i1 == i2)  a.push(m1);
        return a;
      }, []);
    }

    var match = this._getNumberMatchForString(str);
    if (match) {
      // De-duplicate, then add.  I.e., if the number-match was already among
      // the normal matches, then move that normal match to the top. Because the
      // match from a dictionary may have more info than a generated nr-match.
      var j = arr.findIndex(m2 => m2.id == match.id);
      if (j >= 0)  match = arr.splice(j, 1)[0];
      arr.unshift(match);
      match.type = 'N';
    }
    callAsync(cb, null, arr);
  }


  // Searches `str` in `options.idts`'s linked fixedTerms's strings,
  // and (synchronously) returns newly constructed match-objects,
  // sorted and z-pruned (once more, on top of what `loadFixedTerms()` pruned).
  _getFixedMatchesForString(str, options) {
    // If no FT-lookup is requested, return no matches.
    if (!options || !options.idts)  return [];

    var arr = [];
    var str = str.toLowerCase();
    var idts = this._prepIdts(options.idts);

    // Here we could first `.map()` the given `idts` onto match-objects from
    // `fixedTermsCache`, and then filter out those that didn't have a match.
    // But we can combine these two operations with a single `.reduce()`.
    arr = idts
      .reduce((arr, idt) => {
        var key = this._idtToFTCacheKey(idt.id, idt.str || '');
        var match = this.fixedTermsCache[key];
        if (!match)  return arr;  // Drop id+strs without match in the cache.

        var type = match.str.toLowerCase().startsWith(str) ? 'F' :
                   match.str.toLowerCase().includes  (str) ? 'G' : 0;

        if (type)  arr.push( Object.assign( deepClone(match), {type} ) );
        return arr;
      }, arr);

    arr = arr.sort((a, b) =>
      strcmp(a.type, b.type) || strcmp(a.str, b.str) ||
      strcmp(a.dictID, b.dictID) || a.id - b.id
    );

    return queryUtils.zPropPrune(arr, options.z);
  }


  // If `str` represents a number, then creates a 'number-matchObject',
  // with as conceptID a canonicalized ID based on the number's value.
  _getNumberMatchForString(str) {
    if (!this.numberMatchConfig || !str)  return false;

    var id = toExponential(str);
    if (id === false)  return false;

    return {
      id:     this.numberMatchConfig.conceptIDPrefix + id,
      dictID: this.numberMatchConfig.dictID,
      str:    str,
      descr:  '[number]',
      type:   'N'
    };
  }


  static canonicalizeEntry(...args) {
    return canonicalize.canonicalizeEntry(...args);
  }


  static canonicalizeTerms(...args) {
    return canonicalize.canonicalizeTerms(...args);
  }


  static prepGetOptions(...args) {
    return queryUtils.prepGetOptions(...args);
  }


  static zPropPrune(...args) {
    return queryUtils.zPropPrune(...args);
  }


  addDictInfos(dictInfos, cb) { cb(todoStr); }

  addEntries(entries, cb) { cb(todoStr); }

  addRefTerms(refTerms, cb) { cb(todoStr); }


  updateDictInfos(dictInfos, cb) { cb(todoStr); }

  updateEntries(entries, cb) { cb(todoStr); }


  deleteDictInfos(dictIDs, cb) { cb(todoStr); }

  deleteEntries(conceptIDs, cb) { cb(todoStr); }

  deleteRefTerms(refTerms, cb) { cb(todoStr); }


  getDictInfos(options, cb) { cb(todoStr); }

  getEntries(options, cb) { cb(todoStr); }

  getRefTerms(cb) { cb(todoStr); }


  getMatchesForString(str, options, cb) { cb(todoStr); }

}
