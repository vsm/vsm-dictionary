// In the browser, deliver the data via a JSONP-call.
if(typeof gotData !== 'undefined')  gotData(createData());


// In node.js, deliver the data via `module.exports`. But define it first
// for browser compatibility.
if(typeof module === 'undefined')  { var module = {} }
module.exports = createData();


function createData() {
  return {
    dictData: [
      {id: 'CWS',  name: 'Common words', entries: [
        {i:45,t:'about'}, {i:82,t:'after'}, {i:36,t:'all'}, {i:80,t:'also'},
        {i:95,t:'any'}, {i:17,t:'as'}, {i:81,t:'back'}, {i:94,t:'because'},
        {i:22,t:'but'}, {i:24,t:'by'}, {i:53,t:'can'}, {i:76,t:'come'},
        {i:67,t:'could'}, {i:98,t:'day'}, {i:19,t:'do'}, {i:91,t:'even'},
        {i:88,t:'first'}, {i:25,t:'from'}, {i:47,t:'get'}, {i:97,t:'give'},
        {i:49,t:'go'}, {i:65,t:'good'}, {i:9,t:'have'}, {i:85,t:'how'},
        {i:62,t:'into'}, {i:57,t:'just'}, {i:59,t:'know'}, {i:54,t:'like'},
        {i:74,t:'look'}, {i:52,t:'make'}, {i:50,t:'me'}, {i:99,t:'most'},
        {i:34,t:'my'}, {i:92,t:'new'}, {i:56,t:'no'}, {i:13,t:'not'},
        {i:73,t:'now'}, {i:4,t:'of'}, {i:14,t:'on'}, {i:35,t:'one'},
        {i:75,t:'only'}, {i:31,t:'or'}, {i:70,t:'other'}, {i:86,t:'our'},
        {i:43,t:'out'}, {i:78,t:'over'}, {i:61,t:'person'}, {i:41,t:'so'},
        {i:66,t:'some'}, {i:60,t:'take'}, {i:71,t:'than'}, {i:38,t:'there'},
        {i:79,t:'think'}, {i:55,t:'time'}, {i:84,t:'two'}, {i:42,t:'up'},
        {i:83,t:'use'}, {i:93,t:'want'}, {i:90,t:'way'}, {i:89,t:'well'},
        {i:51,t:'when'}, {i:33,t:'will'}, {i:87,t:'work'}, {i:37,t:'would'},
        {i:63, t:['year', 'years'] },
        {i:101, x:'to eat', t:['eat', 'eats', 'to eat'] },
        {i:69,  x:'to see', t:['see', 'sees', 'to see'] },
        {i:28,  x:'to say', t:['say', 'says', 'to say'] },
        {i:103, x:'someone with little courage',
            t: [ 'coward',  {s:'chicken', y:'i', x:'as in \'coward\''} ] },
        {i:108, t:'fork'}, {i:109, t:'burnt'},
        {i:105, x:'to use',
            t:['with', 'using', 'use of', 'to use']},
        {i:106, x:'to be accompanied by',
            t:['with', 'accompanied by' , 'to be accompanied by']},
        {i:20,  x:'associated with', t:'at'},
        {i:7,   x: 'to be located in',
            t: [
              {s: 'in', p: 1, y: ''}, 'is located in', 'located in',
              'located at', 'at' ] },  /// {s:'locatedness-inside', y'i0-18'}
        {i:115, x: 'to happen in time period',
          t: ['in',  'during'] },
        {i:116, x: 'to happen at timepoint',
          t: {s:'at', x:'happens at timepoint'} },
        {i:111, x: 'to pertain to',
          t: {s:'in', x:'pertains to'} },
        {i:5,   x:'List, plain collection of items', t:'and'},
        {i:112, x:'List where item order is important',
            t: {s:'ordered-and', y:'i0-7'} },
        {i:2,   x:'to be',
            t: [
              'to be', 'being',
              {s:'is', x:'\'to be\', in its 3rd-person avatar'},
              {s:'are', x:'\'to be\', in its plural avatar'} ] },
        {i:123, x:'belonging to', t: ['of', '\'s'] },
        {i:3,   x:'having purpose', t: ['to', 'for'] },
        {i:126, t:'book'},
        {i:131, x:'Single-term relation for the \'if ... then ...\' construct ' +
            'in natural language', t:'if-then'},
        {i:132, x:'\'if not ... then ...\'', t:'else'},
        {i:255, x:'Visual Syntax Method, a way to represent contextualised ' +
            'information, so it is manageable by both humans and computers',
            t:'VSM'},
        {i:256, x:'Steven Vercruysse (Cruy), creator of VSM', t:'Steven'},
        {i:133, t:'has'},
        {i:141, x:'being located amongst',
            t: ['between', 'is between', 'are between']},
        {i:142, x:'the location amongst some things', t:'between'},
      ]},
      {id: 'PRS', name: 'Persons', entries: [
        {i:4,t:'Brown'}, {i:20,t:'Clarke'}, {i:8,t:'Davis'}, {i:12,t:'Evans'},
        {i:16,t:'Green'}, {i:17,t:'Hall'}, {i:19,t:'Jackson'}, {i:7,t:'Johnson'},
        {i:2,t:'Jones'}, {i:15,t:'Roberts'}, {i:9,t:'Robinson'}, {i:1,t:'Smith'},
        {i:3,t:'Taylor'}, {i:11,t:'Thompson'}, {i:13,t:'Walker'},{i:14,t:'White'},
        {i:5,t:'Williams'}, {i:6,t:'Wilson'}, {i:18,t:'Wood'}, {i:10,t:'Wright'},
        {i:501,t:'Alice'}, {i:502,t:'Bob'},
        {i:510, x:'my imaginary friend John Doe in Norway', t:'John'},
      ]},
      {id: 'BIO', name: 'Biological concepts', entries: [
        {i:10,  t: {s:'Ca2+', y:'u2-3'} },
        {i:11,  t: {s:'Na+Cl-', y:'u2u5'} },
        {i:1,   t: ['beta-Carotene', 'β-Carotene'] },
        {i:2,   x:'the Human gene ICER', t:'ICER' },
        {i:3,   x:'the Human gene cdc2', t: {s:'cdc2', y:'i'},
          z: {species: 'Human'} },
        {i:903, x:'the Mouse gene cdc2', t:'cdc2' },
        {i:14,  x:'to activate (= the activation of) a molecule, by some actor',
            t: ['activates', 'activation'] },  /// {s:'activation (of)',y'i11-14'}
        {i:15,  t:'inhibits'},
        {i:16,  t: ['regulates', 'regulation'] },
        {i:17,  t:'has function'},
        {i:18,  t:'according to'},
        {i:19,  t: ['binds to', 'binds', 'bind', 'bound to'] },
        {i:30,  x:'addition of a ubiquitin-molecule tag to a protein, which ' +
            'marks it for degradation by a proteasome', t:'ubiquitinates'},
        {i:42,  x:'the animal',         t:'chicken'},
        {i:101, x:'example molecule A', t:'A'},
        {i:102, x:'example molecule B', t:'B'},
        {i:103, x:'example molecule C', t:'C'},
        {i:104, x:'example molecule D', t:'D'},
        {i:124, x:'example molecule X', t:'X'},
        {i:131, x:'example protein A',  t:'protein A'},
        {i:132, x:'example protein B',  t:'protein B'},
        {i:133, x:'example location C', t:'location C'},
        {i:151, x:'the blade of a plant leaf (Plant Ontology term)',
            t:'leaf lamina'},
        {i:152, x:'a plant leaf shape variation (PATO term)', t:'twisted'},
      ]},
      {id: 'VAR', name: 'Various concepts', entries: [
        {i:15,  x:'Computer science, Information Technology', t:'IT'},
        {i:16,  x:'to turn on a device', t: ['activate', 'activates'] },
        {i:17,  t:'device'},
        {i:18,  x:'is subclass of', t: ['is subclass of', 'is a'] },
        {i:21,  x:'percent', t: ['percent', '%', 'percentage'] },
        {i:93,  x:'unit of acceleration', t: {s:'m/s2', y:'u3'} },
        {i:151, x:'the mathematical operator \'for all\'', t: ['∀','for all']},
        {i:153, x:'the mathematical operator \'there exists\'',
            t: ['∃', 'exists'] },
      ]},
      {id: 'NEW', name: 'New Concepts', entries: []},
      {id: '00', name: 'Numbers', entries: [
        {i:'00:5e+0', t: ['5', 'five'] },
        {i:'00:4e+1', t: ['40', 'forty'] },
      ]},
    ],

    refTerms: [
    'it', 'this', 'that', 'they', 'these'
    ]
  };
}
