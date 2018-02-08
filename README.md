## vsm-dictionary

<br>

### Intro

[VSM-sentences](http://scicura.org/vsm/vsm.html)
are built from terms that are linked to semantic identifiers,
which can be provided by several 'dictionary' webservices.

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
that is specified in [Dictionary.spec.md](_src/Dictionary/Dictionary.spec.md).

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

### Installation:

#### For Node.js (or Webpack):

```
npm install vsm-dictionary
```

#### For the browser:  

Get the latest `vsm-dictionary-{versionNumber}.min.js` (under `dist/`),
place it on your server, and include an HTML-&lt;head&gt; tag like:

```
<script src="vsm-dictionary-{versionNumber}.min.js"></script>
```

* To support old Internet Explorer too, first add a polyfill like this:
  ```
  <script> if(/MSIE \d|Trident.*rv:/.test(navigator.userAgent))  document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"><\/script>'); </script>
  ```

<br>

### Importing

To import just `DictionaryLocal` with Node.js:

```
const DictionaryLocal = require('vsm-dictionary').DictionaryLocal;
```

or in an ES6 / Webpack+Babel project:

```
import { DictionaryLocal } from 'vsm-dictionary';
```

or in the browser: it is already available as a property on a global variable:

```
VsmDictionary.DictionaryLocal;
```

<br>

### Example use

Example of (only) **string-search**, using the included `DictionaryLocal`
subclass:

```
const VsmDictionary = require('./dist/vsm-dictionary.js');

// Create.
var dict = new VsmDictionary.DictionaryLocal({
  dictData: [
    {id: 'DictID_12',  name: 'Example subdictionary', entries: [
      {i: 'URI:001', t: ['aaa', 'syn']},
      {i: 'URI:002', t: 'aab'},
      {i: 'URI:003', t: 'abc', 'x': 'descr'}
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
[ { i: 'URI:003',         // Concept-ID.
    d: 'DictID_12',       // Dictionary-ID.
    x: 'descr',           // Explanation of the meaning of concept `URI:003`.
    t: [ { s: 'abc' } ],  // Term-objects: one term as an unstyled string.
    s: 'abc',             // The term-string that this match pertains to.
    w: 'S' },             // Match type. Prefix(S)-matches come before infix(T).
  { i: 'URI:002',
    d: 'DictID_12',
    t: [ { s: 'aab' } ],
    s: 'aab',
    w: 'T' } ]
```

Or, just to show how to add data, like it is specified for a `Dictionary`
subclass in general (so, instead using of `DictionaryLocal`'s convenient way
of giving it to the constructor):

```
const VsmDictionary = require('./dist/vsm-dictionary.js');

var dict = new VsmDictionary.DictionaryLocal();
var dictInfo = {id: 'DictID_12', name: 'Example subdictionary'};
var entries = [
  {i: 'URI:001', d: 'DictID_12', t: ['aaa', 'syn']},
  {i: 'URI:002', d: 'DictID_12', t: 'aab'},
  {i: 'URI:003', d: 'DictID_12', t: 'abc', 'x': 'descr'}
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
[demoInNode.js](_src/demoInNode.js)
and [demoInBrowser.js](_src/demoInBrowser.js) (see also below).

<br>

### Tests

Run `npm test` (or equally: `npm run dev:test`).  
This runs test in the browser, and reruns when any file is changed.  
Tests in the browser are combined with an interactive demo.  

Or run `npm run build:test` and then `node dist/demoinNode.js`
for a single test run under Node.js.

<br>

### Demo

Run `npm run dev` (or `npm run dev:test`) to start a demo in the browser.

The top component will show an input-field for interactive string-match
lookup based on a `DictionaryLocal`, using sample data from `_src/demoData.js`.   
The second input-field does this based on (only) a single dictionary
from PubDictionaries.org, based on `DictionaryRemoteDemo`.

Or run `npm run build` (only needed if `dist/` is still empty)
and then `node dist/demoinNode.js` for more limited demo output under Node.js.

<br>

### Build

Run `npm run build` to make Webpack compile the code into a minified bundle
that can be loaded in the browser, or that can be `require()`ed
in a Node.js-based project.
