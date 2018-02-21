/*
Demo of (only) the `getEntries()` and `getMatchesForString()` functions
of `DictionaryLocal`, using the data in `demoData.js`.

Just run: `node demoInNode.js`.
*/


// With Node.js, we can import `VsmDictionary` with `require()`.
const VsmDictionary = require('./vsm-dictionary');


runDemo();


var dict;

function runDemo() {
  console.log('\n=== This is a basic demo of (only) the' +
    '\n=== `getEntries()` and `getMatchesForString()` functions.');

  const demoData = require('./demoData');
  dict = new VsmDictionary.DictionaryLocal(demoData);
  demo1();
}



function demo1() {
  console.log('\n--- DictionaryLocal entries sample:');
  dict.getEntries({ filter: { d: 'BIO' } },  function(err, res) {
    console.dir(res.items.slice(0, 5), {depth: 4});
    console.log(dict.entries.length + ' entries.');
    demo2();
  });
}



function demo2() {
  var str = 'in';
  console.log('\n--- DictionaryLocal match-objects for \'' + str + '\':');

  var options = { perPage: 10 };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, demo3);
  });
}



function demo3() {
  var str = 'in';
  var dictID = 'BIO';
  console.log('\n--- DictionaryLocal match-objects for \'' + str + '\', ' +
    'with dictID-filter for \'' + dictID + '\':');

  var options = { perPage: 10,  filter: {d: dictID} };
  dict.getMatchesForString(str, options, function (err, res) {
    showOutput(err, res, done);
  });
}



function done() {
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
  var arr = [
    'w:\'' + m.w,
    'd:\'' + m.d,
    'i:\'' + m.i,
    's:\'' + m.s,
  ];
  if (m.y)  arr.push('y:\'' + m.y);
  if (m.x)  arr.push('x:\'' + m.x);
  if (m.z)  arr.push('z:\'' + JSON.stringify(m.z));
  if (m.t)  arr.push('t:\'' + JSON.stringify(m.t)
    .replace(/"s"/g, 's') .replace(/"y"/g, 'y').replace(/"x"/g, 'x'));

  return '{' + arr.join('\', ') + '}';
}
