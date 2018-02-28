/*
`DictionaryRemoteDemo` is a demo implementation of a `Dictionary` subclass.

It implements the required `get...()`-type functions only.

It interfaces with a fictitious server-API that supports the these functions's
options literally. (The required functions and options are described in the
parent class's specification: 'Dictionary.spec.txt').

It assumes that that server returns a JSON-array with requested data, which
does not need to be processed further any more. It simply wraps the
received array into an `{ items: [...] }` object.
*/

const Dictionary = require('./Dictionary');


module.exports = class DictionaryRemoteDemo extends Dictionary {

  constructor(options) {
    var opt = options || {};
    super(opt);

    var base = opt.base || 'http://test';
    var pp = '&page=$page&perPage=$perPage';

    this.urlGetDictInfos = opt.urlGetDictInfos ||
            base + '/dic?id=$filterID&name=$filterName&sort=$sort' + pp;
    this.urlGetEntries   = opt.urlGetEntries   ||
            base + '/ent?id=$filterID&dictID=$filterDictID&z=$z&sort=$sort'+ pp;
    this.urlGetRefTerms  = opt.urlGetRefTerms  ||
            base + '/ref?str=$filterStr' + pp;
    this.urlGetMatches   = opt.urlGetMatches   ||
            base + '/mat?q=$str&dictID=$filterDictID&sort=$sortD' + pp;
  }


  getDictInfos(options, cb) {
    var o = this._prepGetOptions(options, ['id', 'name']);
    var url = this.urlGetDictInfos
      .replace('$filterID'  , o.filter.id  .join(','))
      .replace('$filterName', o.filter.name.join(','))
      .replace('$sort'      , o.sort)  // = 'id' or 'name'.
      .replace('$page'      , o.page)
      .replace('$perPage'   , o.perPage);
    this._request(url, (err, items) => cb(err, {items}));
  }


  getEntries(options, cb) {
    var o = this._prepGetOptions(options, ['id', 'dictID']);
    var url = this.urlGetEntries
      .replace('$filterID'    , o.filter.id.join(','))
      .replace('$filterDictID', o.filter.dictID.join(','))
      .replace('$z'           , o.z       .join(','))
      .replace('$sort'        , o.sort)  // = 'dictID', 'id', or 'str'.
      .replace('$page'        , o.page)
      .replace('$perPage'     , o.perPage);
    this._request(url, (err, items) => cb(err, {items}));
  }


  getRefTerms(options, cb) {
    var o = this._prepGetOptions(options, ['str']);
    var url = this.urlGetRefTerms
      .replace('$filterStr', o.filter.str.join(','))
      .replace('$page'     , o.page)
      .replace('$perPage'  , o.perPage);
    this._request(url, (err, items) => cb(err, {items}));
  }


  getMatchesForString(str, options, cb) {
    if (!str)  return cb(null, {items: []});

    var o = this._prepGetOptions(options, ['dictID'], ['dictID']);
    var url = this.urlGetMatches
      .replace('$str'         , encodeURIComponent(str))
      .replace('$filterDictID', o.filter.dictID.join(','))
      .replace('$sortD'       , o.sort  .dictID.join(','))
      .replace('$z'           , o.z       .join(','))
      .replace('$page'        , o.page)
      .replace('$perPage'     , o.perPage);

    this._request(url, (err, arr) => {
      if (err)  return cb(err);
      // In reality, some processing on the received array would happen first.
      super.addExtraMatchesForString(str, arr, o, (err, res) => {
        cb(null, { items: err ? arr : res });
      });
    });
  }


  // Returns an `options` obj. in standard form like: `{filter: {dictID:[],..}, ..}`.
  _prepGetOptions(options, filterKeys = [], sortKeys) {
    var o = Dictionary.prepGetOptions(options, filterKeys, sortKeys);
    var enc = encodeURIComponent;

    filterKeys.forEach(k => {  // Convert any `false` to `[]`, then encode all.
      o.filter[k] = (o.filter[k] || []).map(s => enc(s));
    });

    if (sortKeys) { // If a `sortKeys` is given, `o.sort` is an Array, else Str.
      sortKeys = sortKeys.forEach(k => {
        o.sort[k] = (o.sort[k] || []).map(s => enc(s));
      });
    }
    else  o.sort = enc(o.sort || '');

    o.z =  // Make `o.z` a join()'able array.
      (typeof o.z === 'undefined' || o.z === true) ? ['true'] :
      !o.z ? ['false'] :
      [].concat(o.z).map(s => enc(s));

    o.page    = enc(o.page    || '');
    o.perPage = enc(o.perPage || '');

    return o;
  }


  _getReqObj() {
    /*
    1. In the browser, we have to use a 'XMLHttpRequest' object for requests.
       But in Node.js (our development and testing environment), this object
       is not available. Therefore in Node, we wrap Node's http.get() into a
       similar object, which is what the npm package `xmlhttprequest` does.
    2. When bundling this DictionaryRemoteDemo for the browser, with webpack,
       `webpack.config` should include `node: {child_process: 'empty'}`.
       Or better (or, in addition):
       it should string-replace "require('xmlhttprequest')" by "{}", so that
       the `xmlhttprequest` package does not get bundled at all!
       + This XMLHttpRequest-switching setup must also be used by other, future
         `vsm-dictionary-remote-...`s, **SO THAT THEY WORK IN THE BROWSER TOO**;
         and the package-eliminating setup should be used when webpack'ing
         future, browser-based modules that include a `vsm-dictionary-remote..`.
    3. By placing this in a separate function, we also make this request-
       object replacable and spy-upon'able, for testing. This would be useful
       if we ever need to make testing work in both Node.js and the browser.
    */
    return new (typeof XMLHttpRequest !== 'undefined' ?
      XMLHttpRequest :  // In browser.
      require('xmlhttprequest').XMLHttpRequest  // In Node.js.
    )();
  }


  _request(url, cb) {
    var req = this._getReqObj();
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        if (req.status != 200)  cb('Error: req.status = ' + req.status);
        else {
          try {
            var arr = JSON.parse(req.responseText);
            if (!Array.isArray(arr)) {
              return cb('The server did not send an Array');
            }
            cb(null, arr);
          }
          catch (err) { cb(err); }
        }
      }
    };
    req.open('GET', url, true);
    req.send();
  }

}
