/*
While Webpack generates a bundle with a versioned filename, which is what
browsers like, (and is at `vsm-dictionary-{latest-version-number}.min.js`),

this file enables us to include the package without inserting that number
in Node.js, by simply doing:
`var VsmDictionary = require('./vsm-dictionary');`
*/

module.exports = require('./vsm-dictionary-0.1.1.min.js');
