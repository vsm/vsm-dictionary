/*
This file handles the execution all individual `<filename>.test.js` files.

This is how the testing setup works:
- Tests are run in the browser.
- Tests will be included in the bundled .js,
  only when an environment-variable ADDTESTS=1 is detected in webpack-config.

- 1)`testRunner.js` automatically imports all tests modules (`*\*.test.js`),
    so they are ready for execution, but also findable by webpack.
  2)`main.js` has a commented-out section that links to test.js,
    and only when ADDTESTS=1, will a webpack-loader uncomment this section,
    and will webpack include it and all the here-linked test-modules.
    It exports test.js's combined `test()` function as a property on the
    final <package-name>.js). (But it doesn't call it).
  3)`demoInBrowser.js`, which is included after <package-name>.js in index.html,
    checks if `<PackageName>.test()` was added, and if so calls it.
    So demoInBrowser.js is where both optional tests, and a demo are run.

- The collected test()-functions can be placed in any subfolder,
  next to the module they test, e.g. "/Component/ModuleName.test.js".
  These test()-functions should follow this template:

    import Dictionary from './Dictionary';
    export default function test(cb, expect, T,L,D) {
      //---Anounce test-titles with: T('<title>');
      //---Place tests here. E.g.: (new ModuleName()).output().should.equal(10);
      cb();
    }
    //test.act = 2;

- - The `test.act` property may be set on a test()-function to tell 'how active'
    this test() currently is. It can be any integer >=0 (default=1). See below.
  - The `cb` callback-function must be called after all test()'s tests finished.

--- Async calling overview ---
  Here in `testRunner.js`, we first collect all these test() functions,
  then we poll the activity of each of them (their `act` property),
  then we may remove some, based on their activity-setting; and then reorder.
  Then we async-call all test()-functions on the remaining, ordered list;
  and a next is only called after a previous one finished (i.e. it called cb()).

--- Activity setting for test selection ---
  This is how 'activities' determine which tests are currently active:
  - if `testAll` is 1 here in testRunner.js, then all are called,
  - if it is -1, then none are called,
  - else:
    - the test()-functions are grouped by `act`; (default act = 1 if not set)
    - but nothing gets added to the empty group of act=0;
    - then, only the highest-`act` group's test()s will be kept and run.
++> So normally, all `test().act`s would be set to 1; and
    then you can run one particular test temporarily, by setting its `act` to 2.

--- Test order ---
  The test()s that remain are sorted based on test.js's `testOrder` array.
  This may define which component's tests (alphabetical by module),
  or which exact modules's tests, should be run before all others (which are
  then run alphabetically).
  E.g. a `testOrder` [XY, AB/B, CD] makes tests [AB/A, AB/B, CD/C, XY/X]
  run in the order [XY/X, AB/B, CD/C, AB/A].
*/

const asyncWaterfall = require('async-waterfall');

const chai = require('chai');
const expect = chai.expect;
chai.should();


// 0.) Import all *.test.js modules, recursively through subfolders.
var rc = require.context('./', true, /\.test1\.js$/);
var tests;
var win;
var testAll;
var testOrder;
var logModuleNames;
var logTestNames;



module.exports = function test(opt, done) {
  var def = x => opt && typeof opt[x] !== 'undefined';

  // Options.
  // - `testAll`:  0: let each `test().act` decide;  1: run all;  -1: run none.
  // - `logTestNames`:  if 1/true, will report individual test names.
  testAll        = def('testAll'       ) ? opt.testAll        : 1;
  logModuleNames = def('logModuleNames') ? opt.logModuleNames : 1;
  logTestNames   = def('logTestNames'  ) ? opt.logTestNames   : 1;
  testOrder      = def('testOrder'     ) ? opt.testOrder      : [];


  // 1.) Make `tests`: array of `{name: <'Component/Module'>, f: test-func}`.
  prepareTests();


  // 2.) Setup logging environment.  Make a test-output DOM-element,
  //     and global utilities that all test()-functions can use.
  prepareLoggingEnv();


  // 3.) Keep only tests that are currently set to be active.
  if (testAll == -1) {  // Blocks all tests.
    tests = [];
  }
  else if (testAll == 0) {  // Weed out currently inactive / sub-active tests.
    tests = tests
      .reduce( (groups, test) => {  // Group each test() by its activity.
          var groupNr = test.f.act;
          if (!groupNr && groupNr !== 0)  groupNr = 1;
          if (groupNr <= 0)  return groups;  // Abandon inactive tests.
          groups[groupNr] = groups[groupNr] || [];
          groups[groupNr].push(test);
          return groups;
        }, [])
      .pop() || [];  // Take the highest-state group, with `act` > 0.
  }

  // 4.) Apply an order.
  // Note: tests     = [ {name:, f:}, ... ]
  //       testOrder = [ partialName, partialName, name, name, ...]
  var tests2 = [];
  testOrder.forEach(orderName => {
    for (var i=0; i<tests.length; i++) {
      var test = tests[i];
      // If `test.name` is an exact match, or if it is located under orderName
      // which is a parent folder for it (e.g. 'A/B' under 'A/'), then collect
      // it in sorted array `tests`, and remove it from not-yet-sorted `tests`.
      if (test.name == orderName  ||  test.name.startsWith(orderName + '/')) {
        tests2.push(test);
        tests.splice(i, 1);  i--;
      }
    }
  });

  tests = tests2.concat(tests);  // Use sorted array, with non-matches appended.

  // 5.) Call each test-module's test() function.
  tests = tests.map( getDecoratedTestFunction );

  tests.push(cb => {
    outputTestTitleFunc(0)();  // Output 'Done'.
    cb();
  });

  if (typeof done == 'function')  tests.push(done);

  asyncWaterfall(tests);
}



// ----- HELPER FUNCTIONS -----

function prepareTests() {
  tests = rc.keys()
    .sort((a, b) => {
      a = a.toLowerCase();
      b = b.toLowerCase();
      return a > b ?  1 :  a < b ?  -1 :  0;
    })
    .map(key => {
      var name = key.replace(/^\.\/(.+)\.test1\.js$/, '$1');
      return { name,  f: rc(key).default };
    });
    /// D(rc); D(tests);
}



function prepareLoggingEnv() {
  win = {};
  if (typeof window !== 'undefined') {
    win = window;  // This enables compatibility with both browser and node.js.
    directAllOutputToEl( createTestOutputDOMEl() );
  }
  win.T = outputTestTitleFunc(1);
  win.L = console.log;
  win.D = console.dir;  // These makes T/L/D() globally available in browser.
}



function createTestOutputDOMEl() {
  var el = document.createElement('pre');
  el.setAttribute('id', 'testoutput');
  el.setAttribute('style',
    'background-color: white;  margin: 0;  border-top: 1px solid #CCC;' +
    'color: #333;  font-size: 12px;  font-family: Inconsolata, monospace;'
  );
  document.body.appendChild(el);
  return el;
}


function directAllOutputToEl(outputEl) {
  var origLog = console.log;
  var origDir = console.dir;

  console.log = s => {
    origLog(s);
    var el = document.createElement('div');
    el.innerHTML = s;
    outputEl.appendChild(el);
    window.scrollTo(0, document.body.scrollHeight);
  };

  console.dir = (o, opt = {}) => {
    origDir(o);
    console.log(
      require('util').inspect( o,
        typeof(opt) == 'number' ? {depth: opt} : opt // Int opt => use as depth.
      )
    );
  }

  // Make the errors that `window` catches go to the output-element too.
  window.onerror = function(msg, url, lineNr, colNr, err) {
    console.log(`Error: ${msg} at line ${lineNr}, col ${colNr}, for ${url}`);
  }
}


// Returns a log-function that wraps the given string in some text-decoration.
function outputTestTitleFunc(level){
  var n = typeof window === 'undefined';  // For browser vs node.js output.
  var pre1 = n ? '' : '<span style="font-weight:800; color:#B00">';
  var pre2 = n ? '' : '<span style="font-weight:500; color:#00F">';
  var pre3 = n ? '' : '<span style="font-weight:500; color:#CCC">';
  var post = n ? '' : '</span>';
  return (s, ...args) => {
    if ((level ==2 && !logModuleNames) || (level ==1 && !logTestNames))  return;
    console.log(
      level == 2 ? `${pre1}=== Test: ${s} ----------${post}` :
      level == 1 ? `${pre2}--- ${s}${post}` :
      level == 0 ? `${pre3}--- Tests Done ----------${post}` :
      s
    );
  };
}


function getDecoratedTestFunction(test) {
  var logTitle = outputTestTitleFunc(2);
  return cb => {  // 1.) Decorate each test: wrap it in msgs.
    logTitle(test.name);
    // 2.) Make the decorated function call test**.f** .
    test.f(
      () => {
        // 3.) Add any post-test output here.  ///log(`Tested ${test.name}. ]`);
        cb();
      },
      // 4.) Add any arguments to the call to <file>.test.js's test()-function.
      expect, win.T, win.L, win.D
    );
  };
}
