## vsm-dictionary

<br>

### Intro

[VSM-sentences](http://scicura.org/vsm/vsm.html)
are built from terms that are linked to semantic identifiers;
and these can be provided by several 'dictionary' webservices.

VsmDictionary is a module that provides a standard interface for
communicating with a term-providing service, and for translating data
in a form that a vsm-autocomplete component (or a more specialized term manager)
can easily work with.

`vsm-dictionary` provides:
- a full specification for such a module;
- a full implementation of a local (in-memory, serverless) dictionary
  module, with automated tests;
- a tiny demo-implementation of a module that talks to a server's API;
- a live demonstration of the use of the above two.

<br>

### Specification for VsmDictionary implementations

Any future implementations of a VsmDictionary (which would communicate with
a particular dictionary-webservice) should follow the interface
that is specified in [Dictionary.spec.md](src/Dictionary/Dictionary.spec.md).

<br>

### Three included implementations

The code in this project is bundled (by Webpack) into a JS-module that creates a
global variable `VsmDictionary` when used in the browser, or that provides it
as an importable package in a Node.js environment.

This `VsmDictionary` exposes three properties:
- `VsmDictionary.Dictionary`
- `VsmDictionary.DictionaryLocal`
- `VsmDictionary.DictionaryRemoteDemo`

&bull; `Dictionary` is the parent class that all future implementations should
extend from. It provides an extra layer of functionality that all should share.

&bull; `DictionaryLocal` is a subclass of `Dictionary`, and provides
access to a fully implemented, in-memory Dictionary.  
It can serve as a substitute VsmDictionary that does not depend on a third-party
term-server, while developing or demonstrating future VSM-related components.

&bull; `DictionaryRemoteDemo` is also a subclass of `Dictionary`, and
shows a partial implementation for a module that communicates
with a hypothetical server API. It only serves as inspiration for developing
real cases.

<br>`DictionaryLocal` implements all create/read/update/delete and string-search
functionality described in the Specification, while `DictionaryRemoteDemo`
only implements one part of string-search.  
In addition, the `Dictionary` parent class adds support for 'fixedTerms' and
'number-strings', as explained in detail in `Dictionary.spec.md`.

<br>The many tests in `DictionaryLocal.tests.js` formulate the Specification
as program code and can form a basis for testing future subclasses.

<br>

### Installation (for Node.js, or with Webpack):

```
npm install vsm-dictionary
```

<br>

### Importing

To import only `DictionaryLocal` with Node.js:

```
const DictionaryLocal = require('vsm-dictionary').DictionaryLocal;
```

or in an ES6 / Webpack+Babel project:

```
import { DictionaryLocal } from 'vsm-dictionary';
```

<br>

### Example use

Example of (only) **string-search**, using the included `DictionaryLocal`
subclass:

```
const VsmDictionary = require('./vsm-dictionary.js');

// Create.
var dict = new VsmDictionary.DictionaryLocal({
  dictData: [
    {id: 'DictID_12',  name: 'Example subdictionary', entries: [
      {id: 'URI:001', terms: ['aaa', 'syn']},
      {id: 'URI:002', terms: 'aab'},
      {id: 'URI:003', terms: 'abc', descr: 'description'}
    ]},
  ],
});

// Query.
dict.getMatchesForString('ab', {}, function (err, res) {
  console.dir(res.items, {depth: 4});
});
```

gives the output:

```
[ { id: 'URI:003',         // Concept-ID.
    dictID: 'DictID_12',   // Dictionary-ID.
    descr: 'description',  // Explanation of the meaning of concept `URI:003`.
    terms: [ { str: 'abc' } ],  // Term-objects: one term as an unstyled string.
    str: 'abc',            // The term-string that this match pertains to.
    type: 'S' },           // Match type. Prefix(S)-matches come before infix(T).
  { id: 'URI:002',
    dictID: 'DictID_12',
    terms: [ { str: 'aab' } ],
    str: 'aab',
    type: 'T' } ]
```

Or, just to show how to add data, like it is specified for a `Dictionary`
subclass in general (so, instead using of `DictionaryLocal`'s convenient way
of giving it to the constructor):

```
const VsmDictionary = require('./vsm-dictionary.js');

var dict = new VsmDictionary.DictionaryLocal();
var dictInfo = {id: 'DictID_12', name: 'Example subdictionary'};
var entries = [
  {id: 'URI:001', dictID: 'DictID_12', terms: ['aaa', 'syn']},
  {id: 'URI:002', dictID: 'DictID_12', terms: 'aab'},
  {id: 'URI:003', dictID: 'DictID_12', terms: 'abc', descr: 'description'}
];

dict.addDictInfos(dictInfo, (err) => {
  dict.addEntries(entries, (err) => {
    dict.getMatchesForString('ab', {}, function (err, res) {
      console.dir(res.items, {depth: 4});
    });
  });
});
```

which gives the same output.

More examples and info are included in the demo files
[demoInNode.js](src/demoInNode.js)
and [demoInBrowser.js](src/demoInBrowser.js) (see also below).

<br>

### Tests

Run `npm test`. This runs tests with Mocha.  
Run `npm run testw` to watch and reruns when any file is changed.  

<br>

### Demo

Run `npm run demo` to start a Webpack'ed demo in the browser.

The top component will show an input-field for interactive string-match
lookup based on a `DictionaryLocal`, using sample data from `src/demoData.js`.   
The second input-field does this based on (only) a single dictionary
from PubDictionaries.org, based on `DictionaryRemoteDemo`.

Or run `node src/demoinNode.js` for a more limited demo, under Node.js only.
