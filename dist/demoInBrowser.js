/*
In the browser, we can access `VsmDictionary` as a global variable.

NOTE!: This only works from within the `dist` folder. This JS-file (and also a
an updated index.html) will be copied there by running `npm run build`,
(or `npm run build:test`).
This makes webpack compile the module's code into a package that can be
loaded by an HTML-file, and that exposes a global variable `VsmDictionary`
that can be accessed by a JS-script, like this one.
*/


// ---------- TESTS ----------
if (VsmDictionary.test) {
  var options = {
    testAll: 1,
    logTestNames: 0,  // Set to 1 to make it verbose.
    logModuleNames: 1
  };

  VsmDictionary.test(options, runDemo);  // Run tests, and when done, run demo.
}
else runDemo();



// ---------- DEMO ----------
function runDemo() {
  // Load the data via a JSONP script, which will call `gotData()`.
  var script = document.createElement('script');
  script.src = 'demoData.js';
  document.getElementsByTagName('head')[0].appendChild(script);
}



var matchesMaxCount = 20;

function gotData(demoData) {
  makeDemoLocal(demoData);
  makeDemoRemote();
  setTimeout(function() {window.scrollTo(0, 0)}, 1000);
}



function makeDemoLocal(demoData) {
  var dict = new VsmDictionary.DictionaryLocal(demoData);

  console.log('--- VsmDictionary.DictionaryLocal entries sample:');
  dict.getEntries({ filter: { d: 'BIO' } },  function(err, res) {
    console.dir(res.items.slice(0, 5), {depth: 4});
    console.log(dict.entries.length + ' entries.');
    window.scrollTo(0, document.body.scrollHeight);
  });

  var elems = createDemoPanel({
    title: 'VsmDictionary.DictionaryLocal &nbsp;demo:',
    //+'&nbsp;<span style="color:#777">(with no options or fixedTerms)</span>:',
    elemIDStr: 'Local',
    dictionary: dict,
    dictID: '',
    initialSearchStr: 'cd',
    getMatchesF: getNewMatchesLocal,
  });

  elems.input.focus();
  elems.input.setSelectionRange(0, elems.input.value.length);
}



function makeDemoRemote() {
  var dict = new VsmDictionary.DictionaryRemoteDemo({
    urlGetMatches: 'http://pubdictionaries.org/dictionaries/$filterD/' +
                   'prefix_completion?term=$str'
  });

  var elems = createDemoPanel({
    title: 'VsmDictionary.DictionaryRemoteDemo + \'PubDictionaries.org\':',
    elemIDStr: 'Remote',
    dictionary: dict,
    dictID: 'GO-BP',
    initialSearchStr: 'cell b',
    getMatchesF: getNewMatchesRemote,
  });
}



function createDemoPanel(opt) {
  var parent = document.getElementById('demo');
  if (!parent)  return;

  var title = document.createElement('div');
  var input = document.createElement('input');
  var dictInput = opt.dictID ? document.createElement('input') : false;
  var output = document.createElement('pre');

  title.innerHTML = '&bull; ' + opt.title + '<br>';
  title.setAttribute('style', 'margin: 18px 0 2px -8px; font-size: 12px;');
  input.setAttribute('id', 'str' + opt.elemIDStr);
  output.setAttribute('style',
    'background-color: #fafafa;  border: 1px solid #ddd; '+
    'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;' +
    'width: 90%;  min-height: 24px;  margin: 2px 0 0 0;  padding: 0 0 1px 0;' +
    'white-space: pre-wrap;'
  );

  if(dictInput) {  // Only add a dictID-inputfield, if a dictID is given.
    dictInput.setAttribute('style', 'margin: 0 0 0 10px; width: 60px');
    dictInput.setAttribute('placeholder', 'dictID');
    dictInput.value = opt.dictID;
    dictInput.addEventListener('input', function (ev) {  // On change, reset.
      input.value = '';
      output.innerHTML = '';
    });
  }

  parent.appendChild(title);
  parent.appendChild(input);
  if(dictInput)  parent.appendChild(dictInput);
  parent.appendChild(output);

  input.addEventListener('input', function (ev) {
    opt.getMatchesF(opt.dictionary, this.value, searchOptionsFunc(), output);
  });

  input.setAttribute('value', opt.initialSearchStr);
  opt.getMatchesF(opt.dictionary, input.value, searchOptionsFunc(), output);

  var ans = {input: input};
  if(dictInput)  ans.dictInput = dictInput;
  return ans;

  function searchOptionsFunc() {
    var ans = { perPage: matchesMaxCount };
    if(dictInput)  ans.filter = { d: dictInput.value };  // Use latest value.
    return ans;
  }
}



function getNewMatchesLocal(dict, str, options, el) {

  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { el.innerHTML = 'Error: ' + err;  return; }
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      s += matchToString(res.items[i]) + '\n';
    }
    if(document.getElementById('strLocal').value == str)  el.innerHTML = s;
  });
}



function getNewMatchesRemote(dict, str, options, el) {

  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { el.innerHTML = 'Error: ' + err;  return; }

    // In a real case, the data conversion code below would be located inside
    // a `Dictionary` subclass, e.g. in a `DictionaryRemotePubDict`.
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      var e = res.items[i];
      if(!e.w) {  // Don't convert parent-class generated match-objects.
        e = {
          i: e.identifier,
          d: options.filter.d,
          s: e.label,
          w: e.label.startsWith(str) ? 'S' : 'T',
          /*
          z: {
            dictionary_id: e.dictionary_id,
            id: e.id,
            label_length: e.label_length,
            mode: e.mode,
            norm1: e.norm1,
            norm2: e.norm2,
            created_at: e.created_at,
            updated_at: e.updated_at
          } //*/
        };
      }

      s += matchToString(e) + '\n';
    }

    // Place the results, but only if the search string hasn't changed yet.
    if(document.getElementById('strRemote').value == str) {
      el.innerHTML = s;
    }
  });
}



function matchToString(m) {
  var n = '</span>';
  var arr = [
    'w:\'' + m.w,
    'd:\'' + m.d,
    'i:\'<span style="font-weight:800; color:#737373">' + m.i + n,
    's:\'<span style="font-weight:800; color:#a00">' + m.s + n,
  ];
  if (m.y)  arr.push('y:\'<span style="color:#66e">' + m.y + n);
  if (m.x)  arr.push('x:\'<span style="color:#772">' +
    m.x + n);
  if (m.z)  arr.push('z:\'<span style="color:#db8">' + JSON.stringify(m.z) + n);
  if (m.t)  arr.push('t:\'<span style="color:#bbb">' + JSON.stringify(m.t)
    .replace(/"s"/g, 's') .replace(/"y"/g, 'y').replace(/"x"/g, 'x') + n);

  return '{' + arr.join('\', ') + '\'}';
}
