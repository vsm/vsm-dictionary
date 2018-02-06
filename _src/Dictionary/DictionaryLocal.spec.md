DictionaryLocal.js
==================


&nbsp;  
INTRO
-----
`DictionaryLocal` is a local (=not on a remote server), in-memory implementation
and subclass of the `Dictionary` parent class.

So it stores 'entry'-type objects that can represent any semantic 'concept',
through multiple synonyms ('terms'), it collects entries/terms of
possibly several domain-specific 'sub-dictionaries', and it deals with any
extra info for these entries, all in support of an Autocomplete for VSM-terms.

+ Note: callbacks are called in a truly asynchronous way (via `setTimeout(,0)`,
  i.e. on the next event-loop), in order to show consistent behavior.  
  This makes this local Dictionary implementation behave in the exact same way
  as a remote one.


&nbsp;  
BASIC DATA TYPES AND 'GET'/'ADD'/'UPDATE'/'DELETE' FUNCTIONALITY
----------------------------------------------------------------
See the parent class `Dictionary`; there these concepts and functions are
explained in detail.
In particular, `DictionaryLocal` manages storage in and access to three arrays:
`dictInfos`, `entries` (with 'entry'-type objects, as `Dictionary` describes),
and `refTerms`.


&nbsp;  
ADDITONAL 'ADD'-FUNCTIONALITY
-----------------------------
In order to create a local dictionary in a convenient way, DictionaryLocal
provides some extra functionality and augments some parent function definitions.

+ One may call `addEntries()` with entries that have an {int} conceptID, rather
  than a {String} one.
  The entry's associated subdictionary-dictInfo's `f_id()` will convert it to a
  String which is unique within DictionaryLocal.
  + Note: this does not apply to `updateEntries()`, because the required dictID
    reference (`entryLike.d`), for converting the ID, may be absent there.

+ When adding a subdictionary's `dictInfo` (via `addInfoForSubdictionaries()`)
  one can give it a custom `f_id()`. Or else a default function is used, to
  convert an {int} conceptID to a {String} one, like: 39 --> 'DictID:0039'.
  + `f_id()` will be called with arguments: `dictInfo` and `entry`.
  + Note: a dictInfo's `f_id()` is only used in subclass `DictionaryLocal`.

+ `addDictionaryData(dictData, refTerms)` is a powerful convenience function.
  It enables to add/update multiple subdictionaries's info and entries at once,
  and with convenient simplifications. It executes *synchronously*.
  - `dictData`: {Object|Array(Object)}:
            is one, or a list of, to-add subdictionary/ies:
    - each item is like a `dictInfo` object, but has one added property:
      - `entries` {Array(Object)}`:
            these are normal (as described in `Dictionary`) or *simplified*
            'entry'-type Objects:
        + The  `d` (dictID) property may be left away, because then
          the `id` (dictID) from their encompassing subdictionary-info is used;
        + The `t` (terms) can be simplified (as in any `Dictionary`) to any of:
          + {String}: a plain term-string;
          + {Object}: a term-Object, like `{s:, [y:], [x:]}`;
          + {Array(String|Object)}: an array of a mix of the above two.
  + All of this will be converted internally and stored as standard 'dictInfo'
    and 'entry' objects, as they are described in the parent class `Dictionary`.
  + Any object (any dictInfo and entry), is first attempted to be added;
    and if that gave an error, then the update function is tried instead.
  + Returns an array of collected errors (so, only the not-null ones),
    or simply null if there were none (so if that array would be empty).
  + One can create and fill a new DictionaryLocal() in one go, by giving
    `dictData` and/or `refTerms` as properties to an `options` object when
    calling the constructor. That will automatically run `addDictionaryData()`.


&nbsp;  
ADDITONAL INTERNAL FUNCTIONALITY
--------------------------------
- `this.entries` are sorted by dictID, then conceptID, for nice console-output.
