/*
Design specification: see DictionaryLocal.spec.md.
*/
const Dictionary = require('./Dictionary');
const callAsync   = require('./helpers/async').callAsync;
const callAsyncOE = require('./helpers/async').callAsyncForOneOrEach;
const {deepClone, strcmp, asArray, arrayQuery} = require('./helpers/util');
const prepGetOptions = Dictionary.prepGetOptions;
const zPropPrune     = Dictionary.zPropPrune;

const msgAbsentDictInfo = s => `dictInfo for '${s}' does not exist`;
const msgAbsentEntry    = s =>    `entry for '${s}' does not exist`;
const msgAbsentRefTerm  = s =>      `refTerm '${s}' does not exist`;
const msgNoSuchDictID   = s => `entry is linked to non-existent dictID '${s}'`;
const f_id_numLength = 4;
const perPageDefault = 20;
const perPageMax     = 100;


module.exports = class DictionaryLocal extends Dictionary {

  constructor(options) {
    var opt = options || {};
    super(opt);

    this.dictInfos = [];
    this.entries = [];
    this.refTerms = [];

    if (opt.dictData || opt.refTerms) {
      var errs = this.addDictionaryData(opt.dictData || [], opt.refTerms);
      if (errs)  throw errs;
    }

    this.perPageDefault = opt.perPageDefault || perPageDefault;
    this.perPageMax     = opt.perPageMax     || perPageMax;
  }


  // --- ADD/UPDATE/DELETE ONE OR MORE DICTINFOS/ENTRIES/REFTERMS ---

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


  _cbDict(cb) {  // Gets called after every set of dictInfo-changing operations.
    return (...args) => { this._sortDictInfos();  cb(...args); }
  }


  _cbEntr(cb) {
    return (...args) => { this._sortEntries();  cb(...args); }
  }



  // --- CONVENIENT SYNCHRONOUS ADDING OF DICTINFOS+ENTRIES+REFTERMS ---

  addDictionaryData(dictData = [], refTerms = []) {
    /* Note: here we make *synchronous calls* to _add/update-DictInfo/etc(),
      which are in fact designed to return data asynchronously (= via callback).
      This is possible because: 1. those 5 functions only mock async callbacks;
      2. we give them a sync. callback function that simply `return`s the first
      argument it gets (so only error, not result); 3. we made those functions
      always exit via `*return* cb(err);` (never as `cb(err);`). */
    var cb = err => err;
    var errs = [];
    var err;
    dictData.forEach(dict => {
      err = this._addDictInfo(dict, cb);
      if (err)  err = this._updateDictInfo(dict, cb);
      if (err)  errs.push(err);

      (dict.entries || []) .forEach(e => {
        if (!e.dictID)  e.dictID = dict.id; // Fill in any omitted entry.dictID.
        else if (e.dictID !== dict.id) {
          return errs.push(`an entry tries to override dictID \'${dict.id}\'`);
        }

        err = this._addEntry(e, cb);
        if (err && err.endsWith('already exists')) {
          err = this._updateEntry(e, cb);
        }
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

    this.dictInfos[index] = di2;
    return cb(null, di2);
  }


  _deleteDictInfo(id, cb) {
    var index = this._indexOfDictInfo(id);
    if (index < 0)  return cb(msgAbsentDictInfo(id));

    if (this.entries.find(e => e.dictID == id)) {
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
    if (!entry.id || !entry.dictID || !entry.terms ||
        (Array.isArray(entry.terms) && !entry.terms.length)) { // `terms` != [].
      return cb('entry misses a required property: id, dictID, or terms');
    }

    var di = this.dictInfos[ this._indexOfDictInfo(entry.dictID) ];
    if (!di)  return cb(msgNoSuchDictID(entry.dictID));

    entry.id = this._makeStringConceptID(di, entry);  // Convert any Int to Str.

    if (this._indexOfEntry(entry.id) >= 0) {
      return cb(`entry for '${entry.id}' already exists`);
    }

    entry = Dictionary.canonicalizeEntry(entry);
    if (entry.terms.filter(t => !t.str).length)  return cb('invalid term');

    this.entries.push(entry);
    return cb(null);
  }


  _updateEntry(entryLike, cb) {
    var index = this._indexOfEntry(entryLike.id);
    if (index < 0)  return cb(msgAbsentEntry(entryLike.id), null);

    if (entryLike.dictID  &&  this._indexOfDictInfo(entryLike.dictID) < 0) {
      return cb(msgNoSuchDictID(entryLike.dictID), null);
    }

    var entry = deepClone(this.entries[index]);
    if (entryLike.dictID)  entry.dictID = entryLike.dictID;
    if (entryLike.descr )  entry.descr  = entryLike.descr;

    // Delete as needed any items from `terms`, and properties from `z`.
    var termsDel = asArray(entryLike.termsDel);
    entry.terms = entry.terms.filter(term => !termsDel.includes(term.str) );

    if (entryLike.zDel === true)  delete entry.z;
    else if(entry.z) {
      asArray(entryLike.zDel) .forEach(key => delete entry.z[key]);
    }

    // Replace(-if-exists) or add, termObjects in `terms`.
    var terms = Dictionary.canonicalizeTerms( entryLike.terms || [] );
    terms.forEach(t => {
      var j = entry.terms.findIndex(t2 => t2.str == t.str);
      if (j >= 0)  entry.terms[j] = t;
      else  entry.terms.push(t);
    });
    if (!entry.terms.length)  return cb('entry would have no terms left', null);

    // Replace-if-exists, or add, properties in `z`.
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
    return typeof(entry.id) != 'number' ?  entry.id :
      (dictInfo.f_id || this._default_f_id) (dictInfo, entry);
  }


  _default_f_id(dictInfo, entry) {
    return dictInfo.id + ':' + entry.id.toString().padStart(f_id_numLength, '0');
  }


  _indexOfEntry(conceptID) {  // Returns `-1` if not found.
    return this.entries.findIndex(entry => entry.id == conceptID);
  }


  _sortEntries() {  // Sorts the 'entries' by `dictID` and then by `id`.
    this.entries.sort(
      (a, b) => strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id) );
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

    var arr = this._arrayQuery(this.dictInfos, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: arr });
  }


  getEntries(options, cb) {
    var o = prepGetOptions(options, ['id', 'dictID']);

    var filter = e =>
      (!o.filter.id     || o.filter.id    .includes(e.id    )) &&
      (!o.filter.dictID || o.filter.dictID.includes(e.dictID));

    var sort =
      o.sort == 'id' ?
        (a, b) => strcmp(a.id, b.id) :
      o.sort == 'str' ?  // --> First sort entries by their first term-string.
        (a, b) => strcmp(a.terms[0].str, b.terms[0].str) ||
                  strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id):
        (a, b) => strcmp(a.dictID, b.dictID) || strcmp(a.id, b.id); // =Default.

    var arr = this._arrayQuery(this.entries, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: Dictionary.zPropPrune(arr, o.z) });
  }


  getRefTerms(options, cb) {
    var o = prepGetOptions(options, ['str']);
    var filter = s => !o.filter.str || o.filter.str.includes(s);
    var sort = (a, b) => strcmp(a, b);

    var arr = this._arrayQuery(this.refTerms, filter, sort, o.page, o.perPage);
    callAsync(cb, null, { items: arr });
  }


  _arrayQuery(array, filter, sort, page, perPage) {
    return arrayQuery(
      array, filter, sort, page, perPage, this.perPageDefault, this.perPageMax);
  }



  // --- SEARCH BY STRING: "GET MATCHES" FOR ENTRIES ---

  getMatchesForString(str, options, cb) {
    var o = prepGetOptions(options, ['dictID'], ['dictID']);

    var arr = [];
    if (str) {
      // Build an array with just enough information for filtering and sorting
      // with arrayQuery(). It needs an item for _each_ term-str with its linked
      // entry. So, strings and entries can appear multiple times in the array.
      str = str.toLowerCase();
      this.entries.forEach(e => {
        e.terms.forEach((t, p) => {  // `p`: term's position in `e.terms`.
          arr.push({str: t.str, dictID: e.dictID, e, p, id: e.id});
        });
      });

      // - Prepare filter for keeping only certain dictIDs, and string-matches.
      // - And for the ones we keep, we store the match-type in `type`;
      //   and we already add a field `D` = 'is-dictID-in-o.sort.dictID'
      //   for sorting in the next step.
      var filter = x => {
        if (o.filter.dictID && !o.filter.dictID.includes(x.dictID)) return false;
        if (     x.str.toLowerCase().startsWith(str))  x.type = 'S';
        else if (x.str.toLowerCase().includes  (str))  x.type = 'T';
        else return false;
        x.D = o.sort.dictID && o.sort.dictID.includes(x.dictID) ? 0: 1;
        return true;
      };

      // Prepare for sorting by 'is-dictID-in-o.sort.dictID', then S- vs. T-type,
      // then alphabetically by term-string, then by dictID. Then by the term's
      // pos in the synonym list (=> first-term matches first), then conceptID.
      var sort = (a, b) =>
        a.D - b.D || strcmp(a.type, b.type) || strcmp(a.str, b.str) ||
        strcmp(a.dictID, b.dictID) || a.p - b.p || a.id - b.id;

      // Apply query, then replace each remaining item by a full 'match'-type
      // object, having: entry's `id/dictID/terms/z`,
      // term-object's `str/style/descr`, and match-type `type`.
      arr = this._arrayQuery(arr, filter, sort, o.page, o.perPage)
        .map(x => Object.assign( {},  x.e,  x.e.terms[x.p],  {type: x.type} ));
      arr = Dictionary.zPropPrune(arr, o.z);
    }

    // Possibly add an exactly-matching refTerm, to the front of `arr`.
    var refTerm = this.refTerms.find(s => s.toLowerCase() == str);
    if (refTerm)  arr.unshift(
      {id: '', dictID: '', str: refTerm, descr: '[referring term]', type: 'R'}
    );

    super.addExtraMatchesForString(str, arr, o, (err, res) => {
      callAsync(cb, null, { items: err ? arr : res });
    });
  }

}
