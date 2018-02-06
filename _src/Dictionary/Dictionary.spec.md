Dictionary.js
=============


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
              typically an abbreviation (e.g. "HUGO") and unmodifiable in a DB;
    - `name`: {String}:
              full name of a subdictionary;
    - `f_aci()`: {Function} (optional):
              generates customized Autocomplete-item content for this subdict's
              entries, using a subdict-specific style, or entries's extra-info;
    - `f_id()`: {Function} (optional, only used in DictionaryLocal):
                converts an {int} conceptID to {String}, e.g. 39 to 'X:0039'.
    + Note:
      + Because functions can not be JSON.stringify()'ed, any Function-type
        property `f_*()` must be passed as String which will be `eval()`'ed.
        This must be a string like: "function (x) { return x + 1; }".

2. An 'entry' represents a *concept* and is an object with properties:
    - `i`: {String}:
              the concept's unique (among all dictionaries) identifier; for a
              local demo-dictionary this could be anything; for a server-based
              dictionary this would typically be a URI (as in Linked Data);
    - `d`: {String}:
              a subdictionary-ID, which refers to a `dictInfo`'s `id`; this
              gives access to the entry's `dictInfo`-specific functionality;
    - `x`: {String} (optional):
              an eXplanation/description/definition of the concept;
    - `t`: {Array(Object)}:
              a list of the concept's terms, i.e. its synonyms's string-
              representations, each represented by an Object with properties:
        - `s`: {String}:
              the term as a pure string, making it findable via string-search;
        - `y`: {String|Object} (optional):
              style-information; this could be a html-repres. of `s`, e.g. with
              sub/superscript, or an object or code with styling-instructions;
        - `x`: {String} (optional):
              this `x` would override the entry's `x`, if present, enabling us
              to give a custom descr. to a concept, from a term's perspective;
    - `z`: {Object} (optional):
            any extra information, free in form, related to the entry; this
            could include subdictionary-specific data for `f_aci()` processing.

3. A 'match' is an object returned by search-string querying functionality.
  It represents one specific term linked to one specific entry. It provides the
  necessary data to build an autocomplete item, which links a term+concept into
  a VSM-term. It has properties:
    - `i`: {String}:
              concept-ID, i.e. unique identifier of the matched entry, e.g. URI;
    - `d`: {String}:
              subdictionary-ID, giving access to one dictInfo's functionality;
    - `s`: {String}:
              pure string-repres. of a term that matches the string-query;
    - `y`: {String|Object} (optional):
              style/d string (as stored in the entry's particular term-object);
    - `x`: {String} (optional):
              explanation of the entry, or the overriding explan. for this term;
    - `w`: {1-char-String}:
              what type of match it is:
        + 'S' = search-string matches the start of the term, or is fully equal;
        + 'T' = search-string appears somewhere in the term, but not its start;
        + 'F' = it matches a 'fixedTerm' term+concept, as in 'S' (see later);
        + 'G' = it matches a 'fixedTerm' term+concept, as in 'T';
        + 'R' = it is fully equal to a reference term ('refTerm', see below);
                a refTerm 'match' has empty properties `i` and `d`;
        + 'N' = a generated match that represents a number, + standard-made ID;
    - `t`: {Array(Object)} (optional):
              this may contain the entry's full terms-list `t`;
    - `z`: {Object} (optional):
              is the entry's `z` info, and is only added if the entry had it too
              and if it was requested or not un-requested.
    + Note:
      + Several match-objects can have a same term `s` but linked to a different
        concept-ID `i`, or a different term `s` but linked to a same concept-ID!
      + When multiple match-objects are returned as a list, they should be
        sorted in the order: N, R, F, G, S, T.


4. A 'refTerm' is a pure string that does not represent a concept on its own,
  but that is commonly used to refer to another concept, like "it" or "that".
  A `Dictionary` deals with refTerms as well, in order to support a vsm-box's
  autocomplete as a single accesspoint to string- and concept-type match-objs.


&nbsp;  
SUBCLASS 'GET'-TYPE FUNCTIONALITY
---------------------------------
Dictionary is a parent class for subclasses that do most of the work.
A subclass module represents a specific data-repository, and translates requests
and responses with the datastore through a common interface, which e.g.
a vsm-autocomplete can use.
- `DictionaryLocal`: implements an in-memory `Dictionary`;
- `DictionaryRemoteXyz`: would interface with a database-server's API.
  
+ Note: in the functions below, any string-sorting (such as dictID, conceptID,
  and terms) happens case-insensitively.
  
Subclasses must implement the following functions:

1. `getDictInfos(options, cb)`:
  Gets the `dictInfo`-objects (=subdictionary-info), as specified in `options`:
  - `options`: {0|Object}: if an object, supports these all-optional properties:
    - `filter`: {Object}: filter-options; properties are combined in AND-mode:
        - `id`: {String|Array(String)} (opt.):
            one or more dictIDs; returns for all dictIDs, combined in OR-mode;
        - `name`: {String|Array(String)} (opt.):
            one or more dict-names; returns for all names, combined in OR-mode;
        + When no `filter` is given (default), returns all dictInfo objects;
    - `sort`: {String}: one of:
        + "id" (default, so also without giving an `options.sort`):
            returned items are sorted by their dictID `id`;
        + "name": sorts by `name`;
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
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: has a 'dictInfo' obj for each subdictionary;
      + Note: we wrap the result array into an object, so that future
        implementations may still still add meta-information in extra fields,
        e.g. a `hasMore` field.
  + Note: this is useful for VSM-autocomplete, to access `dictInfo.f_aci()`s.

2. `getEntries(options, cb)`:
  Gets the `entry`-objects specified in `options`:
  - `options`: {0|Object}: if object, supports these all-optional properties:
    - `filter`: {Object}: filter-options; properties are combined in AND-mode:
        - `i`: {String|Array(String)} (opt.):
            one or more conceptIDs; returns for all ids, combined in OR-mode;
        - `d`: {String|Array(String)} (opt.):
            one or more dictIDs; returns for all dictIDs, combined in OR-mode;
        + When no `filter` is given (default), returns all entry objects;
    - `sort`: {String}: one of:
        + "d" (default, so also without giving an `options.sort`):
            returned items are sorted by their dictID `d`, then conceptID `i`;
        + "i": sorts by conceptID `i` only;
        + "s": sorts entries by their first term-string `t[0].s`, then `d`, `i`;
    - `z`: {true|false|String|Array(String)}:
        instructs to return a z-object with all, none (no `z`-prop then), or
        the given selection of the entries' z-properties, respectively;
        a subclass may define its own default value for when not given;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items are should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: a list of "entry"-objects, as described above,
            i.e. like `{i, d, x, t[{s,y,x},..], z}`.
  + Note: this function is necessary for term/concept-search functionality that
    would be more powerful/configurable than just autocomplete, and also for
    'fixedTerms'-preloading (see later).

3. `getRefTerms(options, cb)`:
  Returns all `refTerm` strings, sorted alphabetically.
  - `options`: {0|Object}: if object, supports these all-optional properties:
    - `filter`: {Object}: filter-options; properties are combined in AND-mode:
        - `s`: {String|Array(String)} (opt.):
            one or more refTerm-strings; returns for all, combined in OR-mode;
        + When no `filter` is given (default), returns all refTerm-strings;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items are should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: a list of refTerms.

4. `getMatchesForString(str, options, cb)`:
  Gets `match`-objects for term(+concept)s that match the search-string.
  - `str`: the search-string.
  - `options`: {0|Object}: if object, supports these all-optional properties:
    - `filter`: {Object}: filter-options:
        - `d`: {String|Array(String)} (opt.):
            one/more dictIDs; returns only for these, combined in OR-mode;
        + when no `filter.d` is given (default), returns for all sub-dicts;
    - `sort`: {Object}:
        - `d`: {String|Array(String)} (opt.):
            sorts matches whose dictID is in this list, first; then sorts as
            usual ('S' before 'T', then case-insensitively by term-string, then
            by own dictID); see notes below for details on sorting;
            this essentially defines 'preferred dictionaries';
    - `z`: {true|false|String|Array(String)}:
        will return a full, no, or a partial z-object; just like `getEntries()`;
    - `page` {int}:
        which page of the paginated result is requested (starting from 1);
    - `perPage` {int}:
        how many items are should be returned by one call.
  - `cb`: {Function}: callback with arguments:
    - `err`: {null|String|Object}
    - `res`: {Object}: with properties:
      - `items`: {Array(Object)}: a list of "match"-objects, as described above,
            i.e. like `{i, d, s, y, x, w, t[{s,y,x},..], z}`.
  + Notes:
    + Returned matches are filtered:
      only those belonging to any of the subdictionaries given in `filter.d`
      (if any given), will be returned.
    + Returned matches are sorted by the following keys, in this order:
      + if a `sort.d` is given, then matches that belong any of the subdicts
        given in `sort.d` are grouped and sorted before matches that don't;
        + Note: the order of dictIDs within `sort.d` is not important; `sort.d`
          only splits matches into 2 blocks: with dictID in the list vs without;  
      + then: within each of those one or two groups, first matches with `w`
        being 'R', then 'S', then 'T', (i.e. first a possible refTerm match,
        then prefix matches, then infix matches);
        + Note: while R/S/T-type match-sorting is the responsibility of
          `DictionaryLocal`, the `Dictionary` parent class code will mix N/F/G-
          type matches with these, to create the order N/R/F/G/S/T; see later);
      + then either..:
        + alphabetically and case-insensitively by term-string;
        + then: sorted by own dictID;
        + then, optionally and for making the order fully determinate:
          + by the term's pos. in its concept's term/synonym list; this sorts
            first-terms before those that are not the 1st term for their entry);
          + then by conceptID;
      + ..or:
        + sort it by some measure of relevance, e.g. how often the term is used
          in general, or based on some context (would be future implementation).
    + So:
      + `options = {filter: d:['AB']}` returns *only* matches in subdict. 'AB'.
      + `options = {sort: d:['AB']}` *prioritizes* matches from subdict. 'AB' in
          the returned list. Non-AB-matches may still appear after AB-matches.
    + This function should call `super.addExtraMatchesForString()` that can find
      and mix in any N/F/G-type matches, with this function's S/T-type matches.
    + A maximum of `perPage` S/T-type matches is returned. But in addition,
      for a first result-page only, an R-type match, and any parent-class
      (first-page only) matches may be added.
    + Idea: (filtering matches based on the entries's `z`-object properties
      could be a future implementation).


&nbsp;  
OWN FUNCTIONALITY
-----------------
This parent class `Dictionary` defines an interface (as described above and
later below), that subclasses should follow, for managing 'entries' and
'match-objects' (among others).  
In addition, it adds a layer of own functionality (that augments the main
functionality that left to be implemented by a subclass), for managing
so-called 'fixedTerms' and 'number-strings' too.  
Note: the constructor can be given an `options` object (also see later), and
subclasses should pass this object when calling `super`, i.e. `super(options)`.


### 1. FixedTerms

+ A 'fixedTerm' is a concept, paired with one of its representative terms,
  that is meant to appear in a VSM-template field's autocomplete list,
  even when the user has not yet typed anything. So they are one-click matches,
  which appear as soon as the field gets the webpage's focus.  
  In addition, when the user has typed some character/s, still-matching (by
  prefix or infix) fixedTerms will remain shown above any other normal matching
  terms.  
  &nbsp;  
  A VSM-template stores fixedTerms by their conceptID + (usually also) term.
  But VSM-autocomplete needs full match-objects. Therefore, and because of query
  efficiency, the `Dictionary` parent class provides *`loadFixedTerms()`*
  to pre-load (from the subclass's storage resource) and pre-build them:  

+ `loadFixedTerms(idts, options, cb)`:  
  Preloads match-objects for fixedTerms and stores them in a cache.  
    - `idts`: {String|Object|Array(String|Object)}:  
        one/more fixedTerms, represented by a conceptID + optional term:
        this can have the form: `'id'`, or `{i: 'id', s: 'term'}`, or
        they can be an array of a mix of these two.
    - `options`: {0|Object}:  
        `loadFixedTerms()` will use the subclass's `getEntries()` to query
        for entries and build match-objects from them;
        this `options` object (along with changes like: no pagination) is
        passed along to that `getEntries()` call;
        it can be used to configure z-object-pruning via `options.z`.  
    + For any `idts`-item for which the `getEntries()` call returned an entry:
      + a match-object is created based on that entry and the following term-obj
        (i.e. the match-obj gets this term-obj's fields `s`, `y`, `x`):
        + if the `idts`-item has a term-string `.s` that is also present in
          the returned entry's terms-list `.t`, then we use that one's term-obj;
        + if this string is not in `.t`, or if no `.s` was given, then we just
          use the first term-object of the entry's terms-list `.t`;
      + the match-object is added to the cache `Dictionary.fixedTermsCache`,
        accessible via a lookup key, which is calculated by concatenating the
        conceptID, a newline, and (if present) the `idts`-item's term-string.
    + For any `idts`-item for which no entry was returned (so there was no entry
      with that id `i`), no item is added to the cache.
    - `cb`: {Function}: callback with argument:
      - `err`: {null|String|Object}:  
        an error will be generated if some maximum number of requested items was
        exceeded (specific to the subclass's `getEntries()` implementation),
        because all items are requested as a non-paginated list.  
        So to pre-load many fixedTerms, use several `loadFixedTerms()` calls.


+ `addExtraMatchesForString(str, array, options, cb)`:  
  this function should be called by a subclass's `getMatchesForString()`.  
  It looks up and can add certain extra match-objects, to the match-objects
  that the subclass already found.  
  Here first, we discuss the addition of match-objects from `fixedTermsCache`.
    - `str`: the search-string;
    - `array`: the list of sorted match-objects, already found by the subclass;
    - `options`: {0|Object}: if object, supports these all-opt. props:
        + there are no filtering, sorting, or (active) pagination options here;
        - `z`: {true|false|String|Array(String)}:  
            includes a full, no, or partial z-obj; just like `getEntries()`;
        - `idts`: {String|Object|Array(String|Object)}:  
            a selection of fixedTerms, represented by a conceptID + optional
            term, just like the `loadFixedTerms()` argument;
        - `page` {int}:  
          is used to decide if fixedTerm-matches should be added, because they
          will only be added to page 1 of a possibly paginated result;
    - `cb`: {Function}: callback with arguments:
      - `err`: {null|String|Object}
      - `array`: {Array(Object)}:  
        a merged list of the given match-objects plus newfound extra ones.
    + Notes:
      + If `str` is empty, then all of `idts`'s corresponding fixedTerm-
        match-objects from the cache are added.
      + `options.z` works on the z-objects _as stored by `loadFixedTerms()`_,
        so these may already be pre-pruned z-objects.
      + Only fixedTerms that are in `options.idts` *and* already pre-loaded in
        `fixedTermsCache` are considered. From those, only those with `str` as
        a prefix or infix will give an extra match-object, of F/G-type resp.
      + + It sorts 'F'-type matches before 'G'-type matches, and then case-
          insensitively according to term-string, then dictID, then conceptID.
        + It adds F/G-type matches into the given `array`, between the one
          possible R-type match, and the many possible S/T-type matches;
          this results in the order: R-F-G-S-T.
        + If a fixedTerm-match is a duplicate of normal match (on page 1), the
          normal match will be removed.
      + + Matches are only searched and added for the first page of possibly
          paginated results.
        + An `options.perPage` will be ignored. So the extra-added matches may
          cause that the subclass's `getMatchesForString()` ends up returning
          more than `perPage` matches, only for the first page.  (But still a
          maximum `perPage` S/T-type matches).
      + Even though this function currently uses only synchronous operations,
        its interface is asynchronous (i.e. with a `cb()`).  
        This is to prepare for future extra code that may use some async lookup,
        and it is also consistent with subclasses's `getMatchesForString()`
        async interface. So, it calls back on the next event-loop for consistent
        async behavior.


### 2. Number-strings

+ Numbers can be 'concepts' too in a VSM-sentence. But no dictionary can
  store all possible or necessary numbers beforehand.  
  So to support VSM-autocomplete, `Dictionary.addExtraMatchesForString()` will
  also detect strings that represent a numeric value. It will generate an ID
  for the value on-the-fly, and serve a match-object for it.  
  As this is common functionality for any `Dictionary` implementation, this
  happens in the parent class.
+ The generated ID is a standardized exponential notation, which maps different
  strings that represent the same value, on the same ID. A prefix is added too.
  + E.g. it maps both '105' and '0.105E3' onto the same ID: '00:1.05e+2'.
  + For strings representable as a 64-bit number in JS, this corresponds to
    a prefix plus the result of `Number(str).toExponential()`. For higher-
    precision numbers (many decimals), and for very large or small numbers
    (> 64-bit exponent), the ID is also generated correctly, with 'numToExp.js'.
+ The prefix '00:' represents an implicit 'numeric sub-dictionary'.
  Its dictID and this prefix are set to default values, but they can be changed
  by giving a `numberMatchConfig` object as property to the `options` object
  and passing that to the `Dictionary` constructor.
    `Dictionary.numberMatchConfig` {false|Object}:  
        - `dictID`: {String}:
            is used as dictID `d` in a generated match-object;
        - `conceptIDPrefix`: {String}:
            is used as prefix to a conceptID's standardizing exponential form.
        + If the object is `false`, then the addition of any number-string
          match-objects is deactivated.
          + So, `new DictionaryX({numberMatchConfig: false})` would create a
            subclass `DictionaryX` that does not generate number-string matches.
+ + A number-string match is only considered for the first results-page (as is
    also the case with fixedTerms).
  + `Dictionary.addExtraMatchesForString()` gives any number-string match-object
    the type 'N', and merges it with any other match-objects, in the order:
    N-R-F-G-S-T.
  + If a number-string match is a duplicate of normal match returned by the
    subclass (so, if that number was already stored as a concept in the
    dictionary), then the normal match is used instead of the generated one
    (as it may be more informative than the generated one), and it is moved
    to the top of the matches-list, and it gets its `w` set to `'N'`.


&nbsp;  
DELEGATED FUNCTIONALITY
-----------------------
Here is just a selection of functionality, delegated to small extra modules:

+ 'canonicalize.js' provides functions to bring both entries and terms
  from a possibly more simplified form, into their standard form as
  described earlier, (and hereby deep-clones them).
  &nbsp;
  When applying that functionality, `addEntries()` and `updateEntries()` (see
  below) can be made to behave in a more convenient and also forgiving way,
  by accepting 'entry'-type objects that:
  - may have unsupported properties (also in any of their terms-objects); these
    will be pruned away;
  - may have a simplified terms-list `t`: which is in its canonical form
    an {Array(Object)}, but can be accepted as being any of:
    + {String}: one plain term-string;
    + {Object}: one term-Object, like `{s:, y:, x:}`;
    + {Array(String|Object)}: an array of a mix of the above two;
  - may have a term-list that has term-objects with a same term-string; then the
    one further in the list will be put in the original one's place in the list.
  + It is still up to the particular implementation (a Dictionary subclass) for
    how to store this, as long as `getEntries()` returns them in the canonical
    way, like `{i:, d:, x:, t: [{s:, y:, x:}, ...], z:}`.


&nbsp;  
SUBCLASS 'ADD'-TYPE FUNCTIONALITY
---------------------------------
Subclasses could implement the following functions, if the underlying storage
(e.g. an own or third-party database) allows it.
+ Note:  
  All `cb(err, ..)` functions under ADD/UPDATE/DELETE report errors in this way:
  - if no error occurred, then `err` is simply `null`,
    no matter if add/...() was called with a single item or an array;
  - if one/more errors occurred with the individual add/update/deletes, then:
    - if it was called with a single id/str, then `err` is a plain {String|Obj};
    - if it was called with an Array, then `err` is an {Array(null|String|Obj)},
      with items representing the success or error for each element in the
      given array, in given order.
  - if another type of error occurred (e.g. database problem),
    then `err` may be {String|Object}, no matter if it was an Array of add/..s.
+ They return a single null or error, or an array of them, similar to what type
  of argument is given.

1. `addDictInfos(dictInfos, cb)`:
  Adds one/more new subdictionary info-objects to the storage.
    - `dictInfos`: a 'dictInfo'-type {Object}, or an {Array(Object)} of them;
    - `cb(err)`: {Function}.  
      An error occurs for any `dictInfo` for which the same `id` already exists.

2. `addEntries(entries, cb)`:
  Adds one/more 'entry'-type object to the storage.
  Only valid properties for an entry should make it to storage.
    - `entry`: {Object} or {Array(Object)};
    - `cb(err)`: {Function}.
      + An error occurs for an entry, if an entry with id `i` already exists.
      + An error occurs for an entry, if no dictInfo for its `d` exists yet.
    + Note: any entry's term-list `t` may be given in a simplified way, etc, as
      described earlier, whereby `canonicalizeEntry()` can make it standardized.

3. `addRefTerms(refTerms, cb)`:
  Adds one/more refTerms to the storage.
    - `refTerm`: {String} or {Array(String)};
    - `cb(err)`: {Function}.
      + An error occurs for a refTerm, it if is an empty string.
      + No error occurs if the refTerm was already present in the storage.


&nbsp;  
SUBCLASS 'UPDATE'-TYPE FUNCTIONALITY
------------------------------------
Subclasses could implement these functions, if the underlying storage allows:

1. `updateDictInfos(dictInfos, cb)`:
  Updates one/more subdictionary info-objects in the storage, by copying an
  object's valid properties into its corresponding stored object.
    - `dictInfos`: a 'dictInfo'-type {Object}, or an {Array(Object)} of them;
    - `cb(err, result)`: {Function}.
      - `err`:
              an error is added for any 'dictInfo' for which no `id` exists.
      - `result`: {null|Object|Array(null|Object)}:
              one or a list of updated 'dictInfo'-objects (also if unchanged),
              and `null` for those whose id `id` was not found.
    + Note that a dictInfo's dictID `id` can not be changed.
      For that to happen, one must delete it and add one with the new dictID.

2. `updateEntries(entryLikes, cb)`:
  Updates one/more 'entry'-type objects in the storage.
    - `entryLikes`: {Object} or {Array(Object)};
      + These are basically 'entry'-type objects, which will be used to update
        the corresponding entry in storage, i.e. the one with same id `i`.
      + Their `d` and `x` properties will replace the ones in the entry,
        or be added if not present.
      + But their terms-array `t` and extra-info object `z` have a deeper
        structure. So because of race conditions, it is *not* supported to let
        an entryLike's `t` or `z` completely replace those of the entry.  
      + Instead, `t` and `z` will only be used for *adding or replacing t-items*
        *or z-properties*, and `tdel` and `zdel` can be used to delete these.
      + So:
        - `t` {String|Object|Array(String|Object)}:
              each item in an entryLike's `t` array replaces the term-object in
              the entry's `t` array that has the same term-string `s`; or it is
              added to the array if there is no such term-object yet;
          + `t` may be given in the simplified format as in `addEntries()`,
              so `t` should get pre-processed by `canonicalizeTerms()`;
        -  `z` {Object}:
              each property of an entryLike's `z` object replaces the same-named
              one in the entry's `z` object, or gets added if no such prop yet;
        - `tdel` {String|Array(String)}:
              deletes terms in `t`, based on given term-strings `s`; no error if
              nonexistent; but error if trying to delete an entry's last
              term-object (and this cancels all of entryLike's other changes);
        - `zdel` {true|String|Array(String)}:
              deletes one or more properties from the entry's `z`-object; if
              `true` then deletes `z` entirely; no error for non-existent props.
      + Deletions happen before additions. So to install a brand new `z` object,
        use `zdel: true`, together with the new `z`, i.e. use an `entryLike`
        like: `{ zdel: true,  z: {...} }`.
    - `cb(err, result)`: {Function}.
      - `err`:
              an error is added for any entryLike for which no id `i` exists;
      - `result`: {null|Object|Array(null|Object)}:
              one or a list of updated 'entry'-objects (whether changed or not),
              and `null` for those whose id `i` was not found.
    + Note that an entry's conceptID `i` can not be changed.


3. There is no `updateRefTerm()` function, because refTerms are not changeable
  objects.


&nbsp;  
SUBCLASS 'DELETE'-TYPE FUNCTIONALITY
------------------------------------
Subclasses could implement these functions, if the underlying storage allows:
+ They generate an error if a dictInfo/refTerm/entry did not exist in storage.

1. `deleteDictInfos(dictIDs, cb)`:
    - `dictIDs`: {String|Array(String)}: one or more subdictionary-IDs;
    - `cb(err)`: {Function}.
      + Error if there still exist entries linked to `dictID` in storage.

2. `deleteEntries(conceptIDs, cb)`:
    - `conceptIDs`: {String|Array(String)}: one or more conceptIDs;
    - `cb(err)`: {Function}.

3. `deleteRefTerms(refTerms, cb)`:
    - `refTerms`: {String|Array(String)}: one or more refTerms;
    - `cb(err)`: {Function}.
