/*
With Node.js, we can import `VsmDictionary` with `require()`.

NOTE!: This only works from within the `dist` folder. This JS-file will be
copied there by running `npm run build`, (or `npm run build:test`).
This makes webpack compile the modules;s code into a package that can be
`require()`d from within a Node.js script, like this one.
*/

const VsmDictionary = require('./vsm-dictionary');


// ---------- TESTS ----------
if (VsmDictionary.test) {
  var options = { testAll: 1, logTestNames: 0 };
  VsmDictionary.test(options, runDemo);  // When done, run demo.
}
else runDemo();



// ---------- DEMO ----------
var dict;

function runDemo() {
  const demoData = require('./demoData');
  dict = new VsmDictionary.DictionaryLocal(demoData);
  demo1();
}



function demo1() {
  console.log('--- DictionaryLocal entries sample:');
  dict.getEntries({ filter: { d: 'BIO' } },  function(err, res) {
    console.dir(res.items.slice(0, 5), {depth: 4});
    console.log(dict.entries.length + ' entries.');
    demo2();
  });
}



function demo2() {
  var str = 'in';
  console.log('--- DictionaryLocal matches for \'' + str + '\':');

  var options = { perPage: 10 };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, demo3);
  });
}



function demo3() {
  var str = 'in';
  var dictID = 'BIO';
  console.log('--- DictionaryLocal matches for \'' + str + '\', ' +
    'with dictID-filter for \'' + dictID + '\':');

  var options = { perPage: 10,  filter: {d: dictID} };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, done);
  });
}



function done() {
  console.log('--- Done.');
}



function showOutput(err, res, cb) {
  if (err)  console.log('Error: ' + err);
  else {
    for (var i = 0;  i < res.items.length;  i++) {
      console.log( matchToString(res.items[i]) );
    }
  }
  cb();
}



function matchToString(m) {
  var a = [
    'w:\'' + m.w,
    'd:\'' + m.d,
    'i:\'' + m.i,
    's:\'' + m.s,
  ];
  if (m.y)  a.push('y:\'' + m.y);
  if (m.x)  a.push('x:\'' + m.x);
  if (m.z)  a.push('z:\'' + JSON.stringify(m.z));
  if (m.t)  a.push('t:\'' + JSON.stringify(m.t)
    .replace(/"s"/g, 's') .replace(/"y"/g, 'y').replace(/"x"/g, 'x'));

  return '{' + a.join('\', ') + '}';
}
