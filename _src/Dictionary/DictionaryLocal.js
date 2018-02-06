/*
Design specification: see DictionaryLocal.spec.md.
*/

import Dictionary from './Dictionary';
import {callAsync, callAsyncForOneOrEach as callAsyncOE} from './helpers/async';
import {canonicalizeTerms, canonicalizeEntry} from './helpers/canonicalize';
import {prepGetOptions, arrayQuery, zPropPrune} from './helpers/arrayQuery';
import {deepClone, strcmp, asArray} from './helpers/util';


const msgAbsentDictInfo = s => `dictInfo for '${s}' does not exist`;
const msgAbsentEntry    = s =>    `entry for '${s}' does not exist`;
const msgAbsentRefTerm  = s =>      `refTerm '${s}' does not exist`;
const msgNoSuchDictID   = s => `entry is linked to non-existent dictID '${s}'`;
const f_id_numLength = 4;


export default class DictionaryLocal extends Dictionary {

  constructor(options) {
    var opt = options || {};
    super(opt);

    this.dictInfos = [];
    this.entries = [];
    this.refTerms = [];

    if (opt.dictData || opt.refTerms) {
      var errs = this.addDictionaryData(opt.dictData || [], opt.refTerms);
      if(errs)  throw errs;
    }
  }


  addDictInfos(dictInfos, cb) {
    callAsyncOE(dictInfos, this._addDictInfo.bind(this), this._cbDict(cb));
  }

  updateDictInfos(dictInfos, cb) {
    callAsyncOE(dictInfos, this._updateDictInfo.bind(this), this._cbDict(cb));
  }

  deleteDictInfos(dictIDs, cb) {
    callAsyncOE(dictIDs, this._deleteDictInfo.bind(this), cb);
  }


  addEntries(entries, cb) {
    callAsyncOE(entries, this._addEntry.bind(this), this._cbEntr(cb));
  }

  updateEntries(entryLikes, cb) {
    callAsyncOE(entryLikes, this._updateEntry.bind(this), this._cbEntr(cb));
  }

  deleteEntries(conceptIDs, cb) {
    callAsyncOE(conceptIDs, this._deleteEntry.bind(this), cb);
  }


  addRefTerms(refTerms, cb) {
    callAsyncOE(refTerms, this._addRefTerm.bind(this), cb);
  }

  deleteRefTerms(refTerms, cb) {
    callAsyncOE(refTerms, this._deleteRefTerm.bind(this), cb);
  }


  addDictionaryData(dictData = [], refTerms = []) {
    /* Note: here we make *synchronous calls* to _add/update-DictInfo/etc().
      This is possible because: 1. they only mock async callbacks; 2. we give
      them a callback function that simply returns the first argument it gets
      (so only error, not result); 3. we made those 5 functions always exit
      via `*return* cb(err);` (not as just `cb(err);`). */
    var cb = err => err;
    var errs = [];
    var err;
    dictData.forEach(dict => {
      err = this._addDictInfo(dict, cb);
      if (err)  err = this._updateDictInfo(dict, cb);
      if (err)  errs.push(err);

      (dict.entries || []) .forEach(e => {
        if (!e.d)  e.d = dict.id;  // Fill in any entry's omitted dictID.
        else if (e.d !== dict.id) {
          return errs.push(`an entry tries to override dictID \'${dict.id}\'`);
        }
        e.i = this._makeStringConceptID(dict, e);
        err = this._addEntry(e, cb);
        if (err)  err = this._updateEntry(e, cb);
        if (err)  errs.push(err);
      });
    });
    this._sortEntries();
    refTerms.forEach(s => {
      err = this._addRefTerm(s, cb);
      if (err)  errs.push(err);
    });
    return !errs.length ? null : errs;
  }


  _cbDict(cb) {  // Gets called after every set of dictInfo-changing operations.
    return (...args) => { this._sortDictInfos();  cb(...args); }
  }


  _cbEntr(cb) {
    return (...args) => { this._sortEntries();  cb(...args); }
  }



  // --- ADD/UPDATE/DELETE SINGLE DICTINFO ---

  _addDictInfo(di, cb) {
    if (!di.id || !di.name) {
      return cb('dictInfo misses a required property: id or name');
    }
    if (this._indexOfDictInfo(di.id) >= 0) {
      return cb(`dictInfo for '${di.id}' already exists`);
    }
    var dictInfo = {id: di.id, name: di.name};  // Omit invalid props.
    if (di.f_aci)  eval('dictInfo.f_aci = ' + di.f_aci);  // Deserialize these..
    if (di.f_id )  eval('dictInfo.f_id  = ' + di.f_id);  // ..optional func.s.
    this.dictInfos.push(dictInfo);
    return cb(null);  // Must use `return` here, for sync-calling compatibility.
  }


  _updateDictInfo(di, cb) {
    var index = this._indexOfDictInfo(di.id);
    if (index < 0)  return cb(msgAbsentDictInfo(di.id), null);

    var di2 = Object.assign({}, this.dictInfos[index]);  // Clone it.
    if (di.name)  di2.name = di.name;

    return cb(null, this.dictInfos[index] = di2);
  }


  _deleteDictInfo(id, cb) {
    var index = this._indexOfDictInfo(id);
    if (index < 0)  return cb(msgAbsentDictInfo(id));

    if (this.entries.find(e => e.d == id)) {
      return cb(`dictInfo for '${id}' still has associated entries`);
    }
    this.dictInfos.splice(index, 1);
    cb(null);
  }


  _indexOfDictInfo(dictID) {  // Returns `-1` if not found.
    return this.dictInfos.findIndex(di => di.id == dictID);
  }


  _sortDictInfos() {
    this.dictInfos.sort((a, b) => strcmp(a.id, b.id));
  }



  // --- ADD/UPDATE/DELETE SINGLE ENTRY ---

  _addEntry(entry, cb) {
    if (!entry.i || !entry.d || !entry.t) {
      return cb('entry misses a required property: i, d, or t');
    }

    var di = this.dictInfos[ this._indexOfDictInfo(entry.d) ];
    if (!di)  return cb(msgNoSuchDictID(entry.d));

    entry.i = this._makeStringConceptID(di, entry);  // Convert any int to Str.

    if (this._indexOfEntry(entry.i) >= 0) {
      return cb(`entry for '${entry.i}' already exists`);
    }

    entry = canonicalizeEntry(entry);
    if (entry.t.filter(t => !t.s).length)  return cb('invalid term');

    this.entries.push(entry);
    return cb(null);
  }


  _updateEntry(entryLike, cb) {
    var index = this._indexOfEntry(entryLike.i);
    if (index < 0)  return cb(msgAbsentEntry(entryLike.i), null);

    if (entryLike.d  &&  this._indexOfDictInfo(entryLike.d) < 0) {
      return cb(msgNoSuchDictID(entryLike.d), null);
    }

    var entry = deepClone(this.entries[index]);
    if (entryLike.d)  entry.d = entryLike.d;
    if (entryLike.x)  entry.x = entryLike.x;

    // Delete as needed any items from `t`, and properties from `z`.
    var tdel = asArray(entryLike.tdel);
    entry.t = entry.t.filter( term => !tdel.includes(term.s) );

    if (entryLike.zdel === true)  delete entry.z;
    else  asArray(entryLike.zdel) .forEach(key => delete entry.z[key]);

    // Replace or add termObjects in `t`, and properties in `z`.
    canonicalizeTerms( entryLike.t || [] ) .forEach(termObj => {
      var j = entry.t.findIndex(o => o.s == termObj.s);
      if (j >= 0)  entry.t[j] = termObj;
      else  entry.t.push(termObj);
    });
    if (!entry.t.length)  return cb('entry would have no terms left', null);

    if (entryLike.z) {
      entry.z = Object.assign( entry.z || {},  deepClone(entryLike.z) );
    }

    return cb(null, this.entries[index] = entry);
  }


  _deleteEntry(id, cb) {
    var index = this._indexOfEntry(id);
    if (index < 0)  return cb(msgAbsentEntry(id));
    this.entries.splice(index, 1);
    cb(null);
  }


  _makeStringConceptID(dictInfo, entry) {
    return typeof(entry.i) != 'number' ?  entry.i :
      (dictInfo.f_id || this._default_f_id) (dictInfo, entry);
  }


  _default_f_id(dictInfo, entry) {
    return dictInfo.id + ':' + entry.i.toString().padStart(f_id_numLength, '0');
  }


  _indexOfEntry(conceptID) {  // Returns `-1` if not found.
    return this.entries.findIndex(e => e.i == conceptID);
  }


  _sortEntries() {  // Sorts the 'entries' by dictID `d` and then conceptID `i`.
    this.entries.sort((a, b) => strcmp(a.d, b.d) || strcmp(a.i, b.i));
  }



  // --- ADD/DELETE SINGLE REFTERM ---

  _addRefTerm(refTerm, cb) {
    if (!refTerm)  return cb('empty refTerm');
    this.refTerms = [...new Set(this.refTerms.concat(refTerm))].sort();
    return cb(null);
  }


  _deleteRefTerm(s, cb) {
    var index = this.refTerms.indexOf(s);
    if (index < 0)  return cb(msgAbsentRefTerm(s));
    this.refTerms.splice(index, 1);
    cb(null);
  }



  // --- "GET" FOR DICTINFOS/ENTRIES/REFTERMS ---

  getDictInfos(options, cb) {
    var o = prepGetOptions(options, ['id', 'name']);

    var filter = di =>
      (!o.filter.id   || o.filter.id  .includes(di.id)) &&
      (!o.filter.name || o.filter.name.includes(di.name));

    var sort = o.sort == 'name' ?
      (a, b) => strcmp(a.name, b.name) :
      (a, b) => strcmp(a.id, b.id);  // Default: sort by `id`.

    var arr = arrayQuery(this.dictInfos, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: arr });
  }


  getEntries(options, cb) {
    var o = prepGetOptions(options, ['i', 'd']);

    var filter = e =>
      (!o.filter.i || o.filter.i.includes(e.i)) &&
      (!o.filter.d || o.filter.d.includes(e.d));

    var sort =
      o.sort == 'i' ?
        (a, b) => strcmp(a.i, b.i) :  // Sort by their conceptID `i`.
      o.sort == 's' ?
        (a, b) => strcmp(a.t[0].s, b.t[0].s) ||  // Sort by 1st term-string, ..
                  strcmp(a.d, b.d) || strcmp(a.i, b.i):  // .. then d, then i.
        (a, b) => strcmp(a.d, b.d) || strcmp(a.i, b.i);  // Default: d, then i.

    var arr = arrayQuery(this.entries, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: zPropPrune(arr, o.z) });
  }


  getRefTerms(options, cb) {
    var o = prepGetOptions(options, ['s']);
    var filter = s => !o.filter.s || o.filter.s.includes(s);
    var sort = (a, b) => strcmp(a, b);

    var arr = arrayQuery(this.refTerms, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: arr });
  }



  // --- SEARCH BY STRING: "GET MATCHES" FOR ENTRIES ---

  getMatchesForString(str, options, cb) {
    var o = prepGetOptions(options, ['d'], ['d']);

    var arr = [];
    if (str) {
      // Build an array with just enough information for filtering and sorting
      // with arrayQuery(). It needs an item for _each_ term-str with its linked
      // entry. So, strings and entries can appear multiple times in the array.
      str = str.toLowerCase();
      this.entries.forEach(e => {
        e.t.forEach((t, p) => {
          arr.push({s: t.s, d: e.d, e, p, i: e.i}); // `p`: term's pos in `e.t`.
        });
      });

      // - Prepare filter for keeping only certain dictIDs, and string-matches.
      // - And for the ones we keep, store the match-type in `w`, and already
      //   add a field `D`='is-dictID-in-o.sort.d' for sorting in the next step.
      var filter = x => {
        if (o.filter.d && !o.filter.d.includes(x.d))  return false;
        if (     x.s.toLowerCase().startsWith(str))  x.w = 'S';
        else if (x.s.toLowerCase().includes  (str))  x.w = 'T';
        else return false;
        x.D = o.sort.d && o.sort.d.includes(x.d) ? 0: 1;
        return true;
      };

      // Prepare for sorting by 'is-dictID-in-o.sort.d', then "S" vs. "T"-type,
      // then alphabetically by term-string, then by dictID. Then by the term's
      // pos in the synonym list (=> first-term matches first), then conceptID.
      var sort = (a, b) =>
        a.D - b.D || strcmp(a.w, b.w) || strcmp(a.s, b.s) ||
        strcmp(a.d, b.d) || a.p - b.p || a.i - b.i;

      // Apply query, then replace each remaining item by a full 'match'-type
      // object, having: entry's `i/d/t/z`, term-object's `s/y/x`, and `w`.
      arr = arrayQuery(arr, filter, sort, o.page, o.perPage)
        .map(x => Object.assign( {},  x.e,  x.e.t[x.p],  {w: x.w} ));
      arr = zPropPrune(arr, o.z);
    }

    // Possibly add an exactly-matching refTerm, to the front of `arr`.
    var refTerm = this.refTerms.find(s => s.toLowerCase() == str);
    if (refTerm)  arr.unshift(
      {i: '', d: '', s: refTerm, x: '[referring term]', w: 'R'}
    );

    super.addExtraMatchesForString(str, arr, o, (err, res) => {
      callAsync(cb, null, { items: err ? arr : res });
    });
  }

}
