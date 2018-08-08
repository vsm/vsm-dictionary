Dictionary.js
=============

Note: we simply use the name 'Dictionary' for VsmDictionary.

&nbsp;  
INTRODUCTION
------------
`Dictionary` is a provider (or an interface to an online server/provider) of
'terms' and 'concepts'. Note:
  + - A 'concept' is any thing, or general idea, that we can mentally point to.
    - A 'term' is just a text-representation/string for communicating a concept.
  + `Dictionary` does not use the typical approach of representing each concept
    by one unique term/string, because Dictionary is built to support VSM-terms.  
    See [scicura.org/vsm/vsm.html](http:/scicura.org/vsm/vsm.html) for a
    detailed list of reasons. Instead:  
    - any concept may be represented by multiple terms (synonymous terms), and
    - any term may represent multiple concepts (homonymous terms);  
    just like in natural language.  
  + A 'VSM-term' is the necessary combination of a human-friendly *term*,
    and a for-computation-needed 'concept-*identifier*', or conceptID.

`Dictionary` can provide *unified* access to multiple, domain-specific
'(sub-)dictionaries' (e.g. human gene names, mouse proteins, relations etc).

`Dictionary` returns concepts & terms via two entity types: entries and matches.
- The *entry* type provides a *concept*-centric view. It represents what a
  Dictionary knows about a certain concept. So an entry will include a list of
  the concept's synonymous terms.
- The *match* type provides a *one-term-with-a-concept* view. It is returned
  when using a string (a partial term) to search for some concept.
  It provides all information that an Autocomplete component may need to let a
  user distinguish synonymous terms, and to describe a term+ID's linked concept.


&nbsp;  
DATA TYPES
----------
A `Dictionary` provides access to a (local or remote) list of
'dictInfo', 'entry', and 'refTerm' objects, and derived 'match' objects.

1. A 'dictInfo' is an object with info on one subdictionary, with properties:
    - `id`: {String}:
              unique identifier for a subdictionary; this is
              typically an abbreviation (e.g. "HUGO")
              and should never be modified in a database;
    - `name`: {String}:
              full name of a subdictionary;
    - `f_aci()`: {Function} (optional):  
        + In a user interface (UI), when a user searches for terms in this
          subdictionary, the matching results can be shown in a list of
          UI-components called "**A**uto**c**omplete **i**tem"s.  
          `f_aci()` can be used to define customized content
          for such a list item, specific to a subdictionary.  
        + E.g. for a Human Gene names dictionary: it could also show a list of
          gene-name synonyms.  
          Or for a Taxonomy dictionary: it could show an image of the organism
          next to its species name.
        + This function is described in `vsm-autocomplete`'s
          [specification](https://github.com/vsmjs/vsm-autocomplete).
          (This requires familiarity with the 'match' data type, described below).
    + Notes:
      + Additional `f_*()` functions may be defined in subclasses.
      + Functions can not be stored in a JSON data-object, so Function-typed
        properties `f_*()` may be passed as String, which will be `eval()`'ed.  
        This must be a string like: `"function(x) { return x + 1; }"`.

2. An 'entry' represents a *concept* and is an object with properties:
    - `id`: {String}:
              the concept's unique (among all dictionaries!) identifier; for a
              local demo-dictionary this could be anything; for a server-based
              dictionary this would typically be a
              [URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier)
              (as in Linked Data); (we also refer to this ID as a 'conceptID',
              since an entry represents a single concept);
    - `dictID`: {String}:
              a subdictionary-ID, which refers to a `dictInfo`'s `id`; this
              gives access to the entry's `dictInfo`-specific functionality;
    - `descr`: {String} (optional):
              an explanation/description/definition of the concept;
    - `terms`: {Array(Object)}:
              a non-empty list of the concept's terms, i.e. its synonyms's
              string-representations, each represented by an Object with props:
        - `str`: {String}:
              the term as a pure string, making it findable via string-search;
        - `style`: {String|Object} (optional):
              style-information; this could be a html-representation of `str`,
              e.g. with sub/superscript, or an object, or a code-string with
              styling-instructions as described in
              [string-style-html](https://github.com/vsmjs/string-style-html);
        - `descr`: {String} (optional):
              if present, this `descr` overrides the entry's `descr`, enabling
              us to give a custom description of a concept, from a particular
              term's perspective;
    - `z`: {Object} (optional):
            any extra information, free in form, related to the entry; this
            could include subdictionary-specific data for `f_aci()` processing;
            as `z` is an Object, the extra info must be set on properties of `z`.

3. A 'refTerm' ('reference term') is a pure string that does not represent a
  concept on its own, but that is commonly used to refer to another concept,
  like "it" or "that".
  A `Dictionary` deals with refTerms as well, in order to support a vsm-box's
  autocomplete as a single accesspoint to string- and concept-type match-objs.

4. A 'match' is an object returned by search-string querying functionality.
  It represents one specific term linked to one specific entry. It provides the
  necessary data to build an autocomplete item, which links a term+concept into
  a VSM-term. It has properties:
    - `id`: {String}:
              concept-ID, i.e. unique identifier of the matched entry, e.g. URI;
    - `dictID`: {String}:
              subdictionary-ID, giving access to one dictInfo's functionality;
    - `str`: {String}:
              pure string-representation of a term that matches the
              string-query;
    - `style`: {String|Object} (optional):
              style/d string (as stored in the entry's particular term-object);
    - `descr`: {String} (optional):
              explanation of the entry, or the overriding explanation
              for this term;
    - `type`: {1-char-String}:
              what type of match it is:
        + 'S' = search-string matches the start of the term, or is fully equal;
        + 'T' = search-string appears somewhere in the term, but not its start;
        + 'F' = it matches a 'fixedTerm' term+concept, as in 'S' (see later);
        + 'G' = it matches a 'fixedTerm' term+concept, as in 'T';
        + 'R' = it is fully equal to a 'refTerm';
                a refTerm 'match' has empty properties `id` and `dictID`;
        + 'N' = a generated match that represents a number, + standard-made ID;
    - `terms`: {Array(Object)} (optional):
              this may contain the entry's full terms-list `terms`;
    - `z`: {Object} (optional):
              is the entry's `z` info,  filtered according to the query's
              `options.z` (see `getMatchesForString()`).
    + Note:
      + In one query result, multiple match-objects may have a same term `str`,
        which will then be linked to a different conceptID `id`.
        And multiple match-objects can be linked to the same ID, but will then
        have a different term-string `str`!
      + When multiple match-objects are returned as a list, they should be
        sorted in the order: N, R, F, G, S, T.


&nbsp;  
SUBCLASS 'GET'-TYPE FUNCTIONALITY
---------------------------------
Dictionary is a parent class for subclasses that will do most of the work.
A subclass module represents a specific data-repository, and translates requests
and responses with the datastore through a common interface, which e.g.
a vsm-autocomplete can use. - E.g.:
- 'vsm-dictionary-local': implements an in-memory 'vsm-dictionary';
- 'vsm-dictionary-xyz':
  would interface with a database-server "xyz"'s API.
  
+ Note: in the functions below, any string-sorting (such as by dictID,
  conceptID, or term-string) happens case-insensitively.

+ Note: all functions below must return their results via a callback `cb` that
  is called in a truly asynchronous way.  
  This means: in case results would not be fetched from a database but directly
  from a memory cache (e.g. in vsm-dictionary-local), they must be returned on
  the next event-loop (via `setTimeout(() => cb(err, res), 0);`).
  This leads to reliable and consistent, guaranteed async behavior.

Subclasses must implement the following functions:

1. `getDictInfos(options, cb)`:
  Gets the "dictInfo"-objects (=subdictionary-info), as specified in `options`:
  - `options`: {Object}: supports these all-optional properties:
    - `filter`: {Object}: filter-options; properties are combined in AND-mode:
        - `id`: {Array(String)} (optional):
            a list of dictIDs; returns for all dictIDs, combined in OR-mode;
        - `name`: {Array(String)} (opt.):
            a list of dict-names; returns for all names, combined in OR-mode;
        + Note: when no `filter` is given (default), returns all dictInfo
          objects;
    - `sort`: {String}: one of:
        + 'id' (default, is same as not giving an `options.sort`):
            returned items are sorted by their dictID `id`;
        + 'name': sorts by `name`;
    - `page` {int}:
        because too many items could match, the results will be paginated;
        this field tells which 'page' of results is requested by this call;
        counting starts from page 1, which is also the default value (so not 0);
    - `perPage` {int}:
        how many items should be returned by one call; this can be overridden by
        some DictionaryX-subclass implementation's particular limit (without
        notification); if not given it will be DictionaryX's own default value.
  - `cb`: {Function}: is a callback function with arguments:
    - `err`: {null|String|Object}: null if no error, else the error/message;  
      + Note: no error occurs if no dictInfo was found for some `id` in `filter`;
    - `res`: {Object}: a result-object, with properties:
      - `items`: {Array(Object)}: has a 'dictInfo' object for each subdictionary;
      + Note: we wrap the result array into an object, so that future
        implementations may still add meta-information in extra fields,
        e.g. a `hasMore` field.
  + Note: the function `getDictInfos()` is useful for vsm-autocomplete, to
    access the `dictInfo.f_aci()`s.

2. `getEntries(options, cb)`:
  Gets the "entry"-objects specified in `options`:
  - `options`: {Object}: supports these all-optional properties:
    - `filter`: {Object}: filter-options; properties are combined in AND-mode:
        - `id`: {Array(String)} (opt.):
            a list of conceptIDs; returns for all ids, combined in OR-mode;
        - `dictID`: {Array(String)} (opt.):
            a list of dictIDs; returns for all dictIDs, combined in OR-mode;
        + Note: when no `filter` is given (default), returns all entry objects;
    - `sort`: {String}: one of:
        + 'dictID' (default, is same as not giving an `options.sort`):
            returned items are sorted by their `dictID`, then conceptID `id`;
        + 'id': sorts by conceptID `id` only;
        + 'str': sorts entries by their first term-string `terms[0].str`, then
            by `dictID`, and then by `id`;
    - `z`: {true|Array(String)}:
        the returned entries will have a z-object that contains all, or only
        the given selection of the stored entries' z-properties, respectively;  
        a subclass may define its own default selection for when no `options.z`
        is given;  
        if the result is an empty z-object, then the returned entry's z-property
        is dropped;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: a list of 'entry'-objects, as described above,
            i.e. like: `{id, dictID, descr, terms[{str, style, descr}, ...], z}`.
  + Note: this function is necessary for term/concept-search functionality that
    would be more powerful/configurable than just autocomplete, and also for
    'fixedTerms'-preloading (see later).

3. `getRefTerms(options, cb)`:
  Returns all "refTerm" strings, sorted alphabetically.
  - `options`: {Object}: supports these all-optional properties:
    - `filter`: {Object}: filter-options:
        - `str`: {Array(String)} (opt.):
            a list of refTerm-strings; returns for all, combined in OR-mode;
        + Note: when no `filter` is given (default), returns all refTerm-strings;
        + Note: when `str` is the empty string, returns no refTerms;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(String)}: a list of refTerms.
  + Note: it is optional to implement this function in the subclass,
    because the parent class includes a default implementation:
    one that works with a small, in-memory list of default refTerms.  
    (Note that there happens no mixing between these default refTerms and
    subclass-managed refTerms; because when a subclass implements its own
    `getRefTerms()`, it overrides and cancels this parent-class functionality
    completely).

4. `getEntryMatchesForString(str, options, cb)`:
  Gets "match"-objects for term(+concept)s that match the search-string. This
  searches only for S/T-type matches that come directly from 'entry' objects.
  (Other match types are handled by the parent class's `getMatchesForString()`,
  see later).
  - `str`: the search-string.
  - `options`: {Object}: supports these all-optional properties:
    - `filter`: {Object}: filter-options:
        - `dictID`: {Array(String)} (opt.):
            a list of dictIDs; returns only for these, combined in OR-mode;
        + Note: when no `filter` is given (default), returns for all sub-dicts;
    - `sort`: {Object}:
        - `dictID`: {Array(String)} (opt.):
            sorts matches whose dictID is in this list, first; then sorts as
            usual ('S' before 'T', then case-insensitively by term-string, then
            by own dictID); see notes below for details on sorting;  
            this property essentially enables defining 'preferred dictionaries';
    - `z`: {true|Array(String)}:
        will include full, partial, or no z-object; as described for the
        `options.z` of `getEntries()`;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: a list of 'match'-objects, as described above,
            i.e. like:
      `{id, dictID, str, style, descr, type, terms[{str, style, descr}, ...], z}`.
  + Notes:
    + Returned matches are filtered:
      only those belonging to any of the subdictionaries given in `filter.dictID`
      (if any given), will be returned.
    + Returned matches are sorted by the following keys, in this order:
      + If a `sort.dictID` is given, then matches that belong to any of the
        subdicts given in that list, are grouped and sorted before matches
        that don't;
        + Note: the order of dictIDs within `sort.dictID` is not important;
          `sort.dictID` only splits matches into 2 blocks: those with a dictID
          in the list vs. those without;
      + then: within each of those one or two groups, matches with `type` 'S'
        are sorted before those with 'T' (i.e. first prefix matches, then infix
        matches);
        + Note: while S/T-type match-sorting is the responsibility of
          VsmDictionary-subclasses, the VsmDictionary parent class code will mix
          N/R/F/G- type matches with these, to create the order N/R/F/G/S/T;
          see later, under `getMatchesForString()`/`_addExtraMatchesForString()`);
      + then, within each S/T-group, either..:
        + alphabetically and case-insensitively by term-string;
        + then: sorted by own dictID;
        + then, optionally and for making the order fully determinate:
          + by the term's position in its concept's term/synonym list;  
            this sorts matches that are linked to the first term of their entry,
            before those linked to a not-first term);
          + then by conceptID;
      + ..or:
        + sorted by some measure of relevance, e.g. how often the term is used
          in general, or based on some context (would be future implementation).
    + So:
      + `options = {filter: dictID:['D']}` returns *only* matches in subdict 'D'.
      + `options = {sort: dictID:['D']}` *prioritizes* matches from subdict 'D'
          in the returned list. Non-D-matches may still appear after D-matches.
    + A maximum of `perPage` S/T-type matches is returned. But in addition,
      for a first result-page only, any parent-class-made N/R/F/G-matches
      may be added.
    + (Idea: filtering matches based on the entries's `z`-object properties
      could be a future implementation).


&nbsp;  
OWN FUNCTIONALITY
-----------------
This parent class `Dictionary` defines an interface (as described above and
later below), that subclasses should follow, for managing 'entries' and
'match-objects', among others.  
In addition, it adds a layer of own functionality (that augments the main
functionality that is left to be implemented by a subclass), for managing
so-called 'fixedTerms' and 'number-strings' too, among others.  
<br>
Note: the constructor can be given an `options` object (see also later).
When a subclass's constructor is called, it must make a call to its parent
class(=this class)'s constructor, and pass on the `options` object,
via `super`, i.e.: `super(options)`.  
<br>
Note: we will first discuss fixedTerms and number-strings. After that we will
explain how match-objects for them are combined with the normal, entry-derived
match-objects.


### 1. FixedTerms

+ A 'fixedTerm' is a concept, paired with one of its representative terms,
  that is meant to appear in a VSM-template field's autocomplete list,
  even when the user has not yet typed anything. So they are one-click matches,
  which appear as soon as the field gets the webpage's focus.  
  In addition, when the user has typed some character/s, any still-matching (by
  prefix or infix) fixedTerms will remain shown above any other normal matching
  terms.  
  &nbsp;  
  A VSM-template stores fixedTerms efficiently: just by their conceptID +
  (usually also) term.
  But VSM-autocomplete needs full match-objects. Therefore, and because of query
  efficiency, the `Dictionary` parent class provides the function
  `loadFixedTerms()`, to pre-load (from the subclass's storage resource) and
  pre-build match-objects for them (which are then stored in-memory in the
  VsmDictionary) :  

+ `loadFixedTerms(idts, options, cb)`:  
  Preloads match-objects for fixedTerms and stores them in a cache.  
    - `idts`: {Array(Object)}:  
        a list of fixedTerms represented by a conceptID + optional term, having
        the form: `{id: 'id'}` or `{id: 'id', str: 'term'}`.
    - `options`: {Object}:  
        + Note: `loadFixedTerms()` will use the subclass's `getEntries()` to
          query for entries and build match-objects from them;  
        + this `options` object is used for that `getEntries()` call (after
          being augmented with changes like 'no pagination', to prevent cut-off
          of results);  
        + this `options` can be used to configure z-object-pruning of the
          in-memory-stored match-objects, via `options.z`.  
    + Note: for any `idts`-item for which the `getEntries()` call returned an
      entry:
      + a match-object is created based on that entry, and on one of the entry's
        term-objects (meaning: the match-object gets the entry's fields, plus
        the term-object's fields `str`, `style`, `descr`), as follows:
        + if the `idts`-item has a term-string `str` that is also present in
          the returned entry's `terms` list, then we use that term-object;
        + if its `str` is not in `terms`, or if no `str` was given, then we
          just use the first term-object of the entry's `terms` list;
      + this match-object is added to the cache `Dictionary.fixedTermsCache`,
        accessible via a lookup key, which is calculated by concatenating the
        conceptID, a newline, and (if present) the `idts`-item's term-string.
    + Note: for any `idts`-item for which no entry was returned (so there was no
      entry with that `id`), no item is added to the cache.
    + Note: the cache stores only one version of a fixedTerm, regardless of how
      it may have been z-pruned.  It stores fixedTerms by 'id+str' cache-key,
      (not by id+str+zOptions).  
      This is because we assume that entries from a particular subdictionary
      will always be z-pruned in the same way. So there will be no change in
      how a particular entry is z-pruned/-requested.
    - `cb`: {Function}: callback with argument:
      - `err`: {null|String|Object}:  
        an error will be generated if some maximum number of requested items was
        exceeded (specific to the subclass's `getEntries()` implementation),
        because all items are requested as a non-paginated list.  
        In order to pre-load many fixedTerms, use several `loadFixedTerms()`
        calls.


### 2. Number-strings

+ Numbers can be 'concepts' too in a VSM-sentence. But no dictionary can
  store all possible or necessary numbers beforehand.  
  So to support VSM-autocomplete, a VsmDictionary will also detect strings that
  represent a numeric value. It will generate a unique, value-base ID for it,
  on-the-fly, and serve a match-object for it.  
  This is a common functionality for any `Dictionary` implementation, so this
  happens in the parent class.

  + The generated ID is a standardized exponential notation, which maps
    different strings that represent the same value, onto the same ID. A prefix
    is added too.
    + E.g. it maps both '105' and '0.105E3' onto the same ID: '00:1.05e+2'.
      (the prefix here is '00:', and both numbers equal '1.05e+2').
    + For strings representable as a 64-bit number in JavaScript, this
      corresponds to a prefix plus the result of `Number(str).toExponential()`.
      And for higher-precision numbers (many decimals), and for very large or
      small numbers (> 64-bit exponent), the ID is also generated correctly,
      using the module
      [`to-exponential`](https://github.com/stcruy/to-exponential).
  + The prefix '00:' represents an _implicit 'sub-dictionary of numbers'_.  
    So this implicit subdictionary must have also a 'dictID' identifier.  
    Its dictID and prefix are set to default values, but these can be changed
    by specifying them in `options.numberMatchConfig` (in the `options` given to
    the `Dictionary` constructor). This is then stored as:  
      `Dictionary.numberMatchConfig` {false|Object}:  
      + If `false`, then the addition of number-string match-objects is
        deactivated.
        + So, `new DictionaryX({numberMatchConfig: false})` would create a
          subclass `DictionaryX` that does not generate number-string matches.
      + If an Object, then it has properties:
        - `dictID`: {String}:
              is used as the `dictID` for a generated number-string match-object;
        - `conceptIDPrefix`: {String} (default: `'00:'`):
              is used as prefix (before the standard-exponential-form part), for
              the generated conceptID.
+ Because the above introduces a new dictID, we need a function
  that can provide a dictInfo-object for it:  
  `getExtraDictInfos()`:  
  + Returns an Array of dictInfos, for all the custom dictIDs that a
    VsmDictionary can create.
    Currently, this is only the dictInfo for number-string matches.
  + So, code that uses a VsmDictionary, and that needs to load dictInfos
    for any possibly occurring dictID, needs to call both (the subclass's)
    `getDictInfos()` (async), and (the parent class's) `getExtraDictInfos()`
    (sync). The latter returns the dictInfo for number-string matches,
    (and in future implementations perhaps more).


### 3. Combining all match-objects

+ `getMatchesForString(str, options, cb)`:  
  This is the function that retrieves all possible types of match-objects
  from a VsmDictionary, for a given `str`. It is this function that
  'vsm-autocomplete' will call.

  Arguments:
  - Same as defined for the subclass's `getEntryMatchesForString()`.
  - `options` may have additional properties, which are discussed further below.

  This function:
    + calls the subclass's `getEntryMatchesForString()` to get normal, S/T-type
      match-objects;
    + calls `getRefTerms()` to get a possible matching refTerm, and builds a
      match-object around it;
    + searches in the pre-loaded 'fixedTerms', for any matches that it is
      currently told to consider (according to `options` (see below));
    + considers if a number-string match-object should be built.
    + Finally, it merges/edits and sorts this list of collected match-objects.

  The 'extra', non-S/T-type matches are considered only for the **first** page
  of possibly paginated results (i.e. with `options.page` equal to 1,
  or omitted).  
  Note: since `options.perPage` pertains to S/T-type matches only, the extra
  matches may cause that `getMatchesForString()` returns more than `perPage`
  matches in total, for the first page only.  
  <br>
  The addition of some non-S/T match-objects is elaborated below:

+ Addition of match-objects from `fixedTermsCache`:  
  + It will consider the following `options` props:
    - `options.z`: as in `getEntryMatchesForString()`;
    - `options.idts`: {Array(Object)}:  
        a selection of fixedTerms, represented by a conceptID + optional term,
        in the same format as the `options.idts` of `loadFixedTerms()`;
  + Only fixedTerms that are in `options.idts` *and* already pre-loaded in
    `fixedTermsCache` are considered.
    + From those, only those with `str` as a prefix or infix will yield an
      extra match-object, with type 'F' or 'G' respectively.
    + If `str` is empty, then the entire given list `options.idts` is considered,
      to find and add corresponding match-objects from the fixedTerm-cache.
  + `options.z` works on the z-objects _as stored by `loadFixedTerms()`_,
    so these may already be pre-pruned z-objects.

+ Addition of a match-object for a number-string:
  + A number-string match-object gets the type 'N'.

+ Merging and sorting all collected match-objects:
  + It sorts a possible 'N'-type (number-string) match on top.
    + If a number-string match is a duplicate of a normal match returned by the
      subclass (so, if that number was already stored as a concept in the
      dictionary, i.e. with same conceptID), then the normal match is used
      instead of the generated one.
      Because it may be more informative than the generated one (e.g. '12' may
      have extra terms like 'twelve' or 'dozen').
      That normal match is then moved to the top of the matches-list, and
      gets its `type` set to 'N'.
  + Next, it puts a possible 'R'-type (refTerm) match.
  + Next, it puts 'F'/'G'-type (fixedTerm) matches. Hereby:
    + it sorts 'F'-type (prefix) matches before 'G'-type (infix) matches,
      and then case-insensitively according to term-string, then dictID, 
      then conceptID;
    + if a fixedTerm-match is a duplicate of a normal match, then the
      normal match will be removed.
  + Next, it puts the (remaining) normal, 'S'/'T'-type matches from the subclass,
    leaving them ordered as received from the subclass.
  + So match-objects are ordered overall by type: N-R-F-G-S-T.


&nbsp;  
AUXILIARY FUNCTIONALITY
-----------------------
`Dictionary` exposes additional functionality that subclasses can use,
in the form of static methods.

+ `prepTerms()`:  
  this can take a list of term-objects, and transforms it (and hereby
  deep-clones it) like this:
  - if any one of the term-objects has any unsupported properties, then these
    properties will be pruned away;
  - if the term-list has two term-objects with a same term-string, then the
    second one will be moved to replace the first one in the list;
    this is repeated until there are no more such duplicates.
  + Note: this function may be useful for a subclass, to (partially) sanitize
    given entries's term-objects, especially for `updateEntries()` (see below).
  + Arguments:
    - an entry's term-objects list {Array(Object)}.
+ `prepEntry()`:  
  this can take an entry-object, and transforms it (and hereby shallow-clones it)
  like this:
  - if the entry-object has any unsupported properties, then these properties
    will be pruned away;
  - the entry's term-objects are processed by `prepTerms()`.
  + Note: this function may be useful for a subclass, to (partially) sanitize
    entry-objects given to it, especially for `addEntries()` (see below).
  + Arguments:
    - an entry {Object}.
+ `zPropPrune()`:  
  performs `z`-property pruning as described above (under `getEntries()`'s
  `options.z`).  
  This is used in `Dictionary` while adding fixedTerm-matches, and may be useful
  for a subclass as well (especially for 'vsm-dictionary-local').
  + Arguments:
    - an entry or match-object {Object},
    - a {true|Array(String)}, like `getEntries()`'s `options.z`.


&nbsp;  
SUBCLASS 'ADD'-TYPE FUNCTIONALITY
---------------------------------
Subclasses could implement the following functions, if the underlying storage
(e.g. an own or third-party database) allows it.
+ **Note**:  
  All `cb(err, ..)` functions under ADD/UPDATE/DELETE report errors or success
  in this way:
  - if no error occurred, then `err` is simply `null`;
  - if one/more errors occurred with the individual add/update/deletes, then
    `err` is an {Array(null|String|Object)},
    with items representing the success (null) or error (String|Object)
    for each element in the given array, in given order.
  - if another type of error occurred (e.g. database problem), then `err` is
    a {String|Object}.

1. `addDictInfos(dictInfos, cb)`:
  Adds subdictionary-info objects to the storage.
    - `dictInfos`: an {Array(Object)} of 'dictInfo'-type objects;
    - `cb(err)`: {Function}.  
      An error is added for any `dictInfo` for which the same `id` already
      exists.

2. `addEntries(entries, cb)`:
  Adds 'entry'-type objects to the storage.
  Only valid properties for an entry should make it to storage (`prepEntry()`
  can assist in this).
    - `entry`: {Array(Object)};
    - `cb(err)`: {Function}.
      + An error is added for an entry, if an entry for `id` already exists.
      + An error is added for an entry, if no dictInfo for its `dictID` exists
        yet.

3. `addRefTerms(refTerms, cb)`:
  Adds refTerms to the storage.
    - `refTerm`: {Array(String)};
    - `cb(err)`: {Function}.
      + An error is added for a refTerm, it if is an empty string.
      + No error is added if the refTerm was already present in the storage.


&nbsp;  
SUBCLASS 'UPDATE'-TYPE FUNCTIONALITY
------------------------------------
Subclasses could implement these functions, if the underlying storage allows:

1. `updateDictInfos(dictInfos, cb)`:
  Updates a list of subdictionary info-objects in the storage, by copying each
  object's valid properties into its corresponding stored object.
    - `dictInfos`: an {Array(Object)} of 'dictInfo'-type objects;
    - `cb(err, result)`: {Function}.
      - `err`:
            an error is added for any 'dictInfo' for which no dictID `id` exists.
      - `result`: {Array(null|Object)}:
            a list of updated 'dictInfo'-objects (also if unchanged), and
            `null` for those whose `id` was not found.
    + Note that a dictInfo's dictID `id` can not be changed.
      (One could effectively do it like this though: add one with the new dictID,
      then update all dependent entries with it, and then delete the old one).

2. `updateEntries(entryLikes, cb)`:
  Updates one/more 'entry'-type objects in the storage.
    - `entryLikes`: {Array(Object)};
      + These are basically 'entry'-type objects, which will be used to update
        the corresponding entry in storage, i.e. the one with same `id`.
      + Their `dictID` and `descr` properties will replace the ones in the entry,
        or be added if not present.
      + But their terms-array `terms` and extra-info object `z` have a deeper
        structure. So because of race conditions, it is *not* supported to let
        an entryLike's `terms` or `z` completely replace those of the entry.  
      + Instead, `terms` and `z` will only be used
        for *adding or replacing term-object items or z-properties*, while the
        special properties  `termsDel` and `zDel` can be used to delete these.
      + So:
        - `terms` {Array(Object)}:
              each item in an entryLike's `terms` array replaces the term-object
              in the entry's `terms` array that has the same term-string `str`;
              or it is added to the array if there is no such term-object yet;
          + Only valid properties for an entry and its term-objects should make
            it to storage (`prepTerms()` can assist in the second part).
        -  `z` {Object}:
              each property of an entryLike's `z` object replaces the same-named
              one in the entry's `z` object, or gets added if no such property
              exists yet;
        - `termsDel` {Array(String)}:
              deletes terms in `terms`, based on these given term-strings;
              no error if some term-string does not occur;
              but errors when trying to delete an entry's last term-object (this
              then also cancels all of the entryLike's other requested changes);
        - `zDel` {true|Array(String)}:
              deletes the given properties from the entry's `z`-object; if
              `true` then deletes `z` entirely;
              no error if some properties do not exist.
      + Deletions happen before additions. So to install a brand new `z` object,
        use `zDel: true`, together with the new `z`, i.e. use an `entryLike`
        like: `{ zDel: true,  z: {...} }`.
    - `cb(err, result)`: {Function}.
      - `err`:
              an error is added for any entryLike for which no `id` exists;
      - `result`: {Array(null|Object)}:
              a list of updated 'entry'-objects (whether changed or not),
              and `null` for those whose `id` was not found.
    + Note that an entry's `id` can not be changed.


3. There is no `updateRefTerm()` function, because refTerms are not editable
  objects.


&nbsp;  
SUBCLASS 'DELETE'-TYPE FUNCTIONALITY
------------------------------------
Subclasses could implement these functions, if the underlying storage allows:

1. `deleteDictInfos(dictIDs, cb)`:
    - `dictIDs`: {Array(String)}: a list of subdictionary-IDs;
    - `cb(err)`: {Function}.
      + Adds an error for any subdictionary for which there still exist an entry
        linked to its `dictID` in storage.
      + Adds an error if some `dictID` did not exist in storage.

2. `deleteEntries(conceptIDs, cb)`:
    - `conceptIDs`: {Array(String)}: a list of conceptIDs that correspond to
      entry-objects.
    - `cb(err)`: {Function}.
      + Adds an error if some conceptID `id` did not exist in storage.

3. `deleteRefTerms(refTerms, cb)`:
    - `refTerms`: {Array(String)}: a list of refTerms;
    - `cb(err)`: {Function}.
      + Adds an error if some refTerm did not exist in storage.
