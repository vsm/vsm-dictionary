// Expose functionality.
const Dictionary = require('./Dictionary/Dictionary');
const DictionaryLocal = require('./Dictionary/DictionaryLocal');
const DictionaryRemoteDemo = require('./Dictionary/DictionaryRemoteDemo');

module.exports = { Dictionary, DictionaryLocal, DictionaryRemoteDemo };



/*--[IF_ADDTESTS]--
module.exports.test = require('./testRunner');
/**/
