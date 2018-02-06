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
    dict: dict,
    dictID: '',
    initialSearchStr: 'cd',
    getMatchesF: getNewMatchesLocal,
  });

  elems.a.focus();
  elems.a.setSelectionRange(0, elems.a.value.length);
}



function makeDemoRemote() {
  var dict = new VsmDictionary.DictionaryRemoteDemo({
    urlGetMatches: 'http://pubdictionaries.org/dictionaries/$filterD/' +
                   'prefix_completion?term=$str'
  });

  var elems = createDemoPanel({
    title: 'VsmDictionary.DictionaryRemoteDemo + \'PubDictionaries.org\':',
    elemIDStr: 'Remote',
    dict: dict,
    dictID: 'GO-BP',
    initialSearchStr: 'cell b',
    getMatchesF: getNewMatchesRemote,
  });
}



function createDemoPanel(opt) {
  var de = document.getElementById('demo');
  if (!de)  return;

  var t = document.createElement('div');
  var a = document.createElement('input');
  var d = opt.dictID ? document.createElement('input') : false;
  var b = document.createElement('pre');

  t.innerHTML = '&bull; ' + opt.title + '<br>';
  t.setAttribute('style', 'margin: 18px 0 2px -8px; font-size: 12px;');
  a.setAttribute('id', 'str' + opt.elemIDStr);
  b.setAttribute('style',
    'background-color: #fafafa;  border: 1px solid #ddd; '+
    'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;' +
    'width: 90%;  min-height: 24px;  margin: 2px 0 0 0;  padding: 0 0 1px 0;' +
    'white-space: pre-wrap;'
  );

  if(d) {  // Only add extra dictID-inputfield, if a dictID is given.
    d.setAttribute('style', 'margin: 0 0 0 10px; width: 60px');
    d.setAttribute('placeholder', 'dictID');
    d.setAttribute('id', 'dictID' + opt.elemIDStr);  // E.g. 'dictIDRemote'.
    d.value = opt.dictID;
    d.addEventListener('input', function (ev) {  // On dictID change, reset.
      a.value = '';
      b.innerHTML = '';
    });
  }

  de.appendChild(t);
  de.appendChild(a);
  if(d)  de.appendChild(d);
  de.appendChild(b);

  a.addEventListener('input', function (ev) {
    opt.getMatchesF(opt.dict, this.value, searchOptionsFunc, b);
  });

  a.setAttribute('value', opt.initialSearchStr);
  opt.getMatchesF(opt.dict, a.value, searchOptionsFunc, b);  // Get 1st matches.

  var ans = {a: a, b: b};
  if(d)  ans.d = d;
  return ans;

  function searchOptionsFunc() {
    var ans = { perPage: matchesMaxCount };
    if(d)  ans.filter = { d: d.value };  // Always use latest filled-in dictID.
    return ans;
  }
}



function getNewMatchesLocal(dict, str, optionsFunc, el) {
  var options = optionsFunc();

  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { el.innerHTML = 'Error: ' + err;  return; }
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      s += matchToString(res.items[i]) + '\n';
    }
    if(document.getElementById('strLocal').value == str)  el.innerHTML = s;
  });
}



function getNewMatchesRemote(dict, str, optionsFunc, el) {
  var options = optionsFunc();

  dict.getMatchesForString(str, options, function (err, res) {
    if (err)  { el.innerHTML = 'Error: ' + err;  return; }

    // In a real case, the data conversion code below would be located inside
    // a `Dictionary` subclass, e.g. in a `DictionaryRemotePubDict`.
    for (var i = 0, s = '';  i < res.items.length;  i++) {
      var e = res.items[i];
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
  var a = [
    'w:\'' + m.w,
    'd:\'' + m.d,
    'i:\'<span style="font-weight:800; color:#737373">' + m.i + n,
    's:\'<span style="font-weight:800; color:#a00">' + m.s + n,
  ];
  if (m.y)  a.push('y:\'<span style="color:#66e">' + m.y + n);
  if (m.x)  a.push('x:\'<span style="color:#772">' +
    m.x + n);
  if (m.z)  a.push('z:\'<span style="color:#db8">' + JSON.stringify(m.z) + n);
  if (m.t)  a.push('t:\'<span style="color:#bbb">' + JSON.stringify(m.t)
    .replace(/"s"/g, 's') .replace(/"y"/g, 'y').replace(/"x"/g, 'x') + n);

  return '{' + a.join('\', ') + '\'}';
}
