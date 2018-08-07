# vsm-dictionary

<br>

## Intro

[VSM-sentences](http://scicura.org/vsm/vsm.html)
are built from terms (=words or phrases) that are linked to semantic identifiers
(=unique IDs that represent a concept with a definition).

These terms+IDs are typically stored on various 'dictionary' servers
that make them accessible through their own API.

`vsm-dictionary` provides a standardized interface for communicating with
dictionary webservers, in order to support VSM-sentence-building tools.
(Tools such as [`vsm-autocomplete`](https://github.com/vsmjs/vsm-autocomplete),
or more advanced components for searching, storing, and managing terms).

`vsm-dictionary` is also designed to handle multiple 'sub-dictionaries',
as well as multiple synonyms per term.  
And it supports the representation of stylized terms,
e.g. with italic or superscript parts, like <i>Ca<sup>2+</sup></i>, and more.

<br>

## Overview

`vsm-dictionary` contains only:
- a full [specification](Dictionary.spec.md)
  for the above interface (for search, creating terms, etc);
- a '`VsmDictionary`' parent-class implementation, which provides VSM-specific
  and shared functionality that subclasses should use.

The real interface with a dictionary service is thus
*implemented by subclasses of `VsmDictionary`*.

Currently there are at least two such implementations available:
- [`vsm-dictionary-local`](https://github.com/vsmjs/vsm-dictionary-local):  
  a full implementation of a local (in-memory, serverless) VsmDictionary.
  - This module can be used as a fully functional placeholder that does not
    depend on a third-party term-server, while developing new tools
    that depend on a VsmDictionary.
  - Or it could provide mock terms+ids while running
    standalone demos of VSM-sentence building tools.
  - The many automated tests in VsmDictionaryLocal can give inspiration
    for testing future, webserver-linked subclasses.
- [`vsm-dictionary-remote-demo`](https://github.com/vsmjs/vsm-dictionary-remote-demo):  
  a bare-minimum demo-implementation of a VsmDictionary that connects to a
  hypothetical server API.
  - This module only serves as inspiration for developing real interfaces
    to an online dictionary service.
  - Still, it includes a live demo that connects to a real server API.

<br>

## How to implement a VsmDictionary subclass

<br>

### Specification

&bull; Any implementation of a VsmDictionary (which communicates with
a particular dictionary-webservice) must follow the interface specified in&nbsp;
----&gt;&nbsp;[Dictionary.spec.md](Dictionary.spec.md)&nbsp;&lt;----- .  
&bull; `VsmDictionary` is the parent class that all implementations must
'`extends`' from.  
&bull; <span style="font-size: smaller;">
(Note: we simply use the name 'Dictionary' for VsmDictionary,
in the spec &amp; source code).</span>  


<br>

### Installation with NPM for Node.js:

```
mkdir vsm-dictionary-newwwww
cd    vsm-dictionary-newwwww
npm init -y
```
```
npm install vsm-dictionary
```

<br>

### Template for a subclass, as a Node.js module:

(See also [`VsmDictionaryLocal`](https://github.com/vsmjs/vsm-dictionary-local)
and [`VsmDictionaryRemoteDemo`](https://github.com/vsmjs/vsm-dictionary-remote-demo)).

<br>

```javascript
// Import the parent class.
const VsmDictionary = require('vsm-dictionary');

// Make subclass and export as Node.js module.
module.exports = class VsmDictionaryNewwwww extends VsmDictionary {

  constructor(options) {
    // We must make call to parent constructor first.
    super(options);

    // ...

  }


  // Methods for Create, Read, Update, Delete of terms, subdictionary-info
  // objects, etc. (see spec).

  // ...
  // ...


  getEntryMatchesForString(str, options, cb) {
    var matches = [];

    // ...

    cb(null, { items: matches });
  }

}
```


<div style="font-size: smaller;">

(If the above code is placed in a file named 'VsmDictionaryNewwwww.js',
it can already be usde in another file 'test.js':
```javascript
var Dict = require('./VsmDictionaryNewwwww.js');
var dict = new Dict();
console.dir(dict);
dict.getMatchesForString('42', {}, (err, res) => console.dir(res));
```
by running: `node test.js`).

</div>


<br>

## Tests

Run `npm test`, which runs tests with Mocha.  
Run `npm run testw`, which automatically reruns tests on any file change.

<br>

## Demo

See [`vsm-dictionary-local`](https://github.com/vsmjs/vsm-dictionary-local)
and [`vsm-dictionary-remote-demo`](https://github.com/vsmjs/vsm-dictionary-remote-demo)
for interactive demos of at least the string-search functionality.
