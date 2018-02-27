// For the browser, deliver the data via a JSONP-type call.
if(typeof gotData !== 'undefined')  gotData(createData());


// For Node.js, deliver the data via `module.exports`. But define `module`
// first, for browser compatibility.
if(typeof module === 'undefined')  { var module = {}; }
module.exports = createData();


function createData() {
  return {
    dictData: [
      {id: 'CWS',  name: 'Common words', entries: [
        {id:45,terms:'about'}, {id:82,terms:'after'}, {id:36,terms:'all'},
        {id:80,terms:'also'}, {id:95,terms:'any'}, {id:17,terms:'as'},
        {id:81,terms:'back'}, {id:94,terms:'because'}, {id:22,terms:'but'},
        {id:24,terms:'by'}, {id:53,terms:'can'}, {id:76,terms:'come'},
        {id:67,terms:'could'}, {id:98,terms:'day'}, {id:19,terms:'do'},
        {id:91,terms:'even'}, {id:88,terms:'first'}, {id:25,terms:'from'},
        {id:47,terms:'get'}, {id:97,terms:'give'}, {id:49,terms:'go'},
        {id:65,terms:'good'}, {id:9,terms:'have'}, {id:85,terms:'how'},
        {id:62,terms:'into'}, {id:57,terms:'just'}, {id:59,terms:'know'},
        {id:54,terms:'like'}, {id:74,terms:'look'}, {id:52,terms:'make'},
        {id:50,terms:'me'}, {id:99,terms:'most'}, {id:34,terms:'my'},
        {id:92,terms:'new'}, {id:56,terms:'no'}, {id:13,terms:'not'},
        {id:73,terms:'now'}, {id:4,terms:'of'}, {id:14,terms:'on'},
        {id:35,terms:'one'}, {id:75,terms:'only'}, {id:31,terms:'or'},
        {id:70,terms:'other'}, {id:86,terms:'our'}, {id:43,terms:'out'},
        {id:78,terms:'over'}, {id:61,terms:'person'}, {id:41,terms:'so'},
        {id:66,terms:'some'}, {id:60,terms:'take'}, {id:71,terms:'than'},
        {id:38,terms:'there'}, {id:79,terms:'think'}, {id:55,terms:'time'},
        {id:84,terms:'two'}, {id:42,terms:'up'}, {id:83,terms:'use'},
        {id:93,terms:'want'}, {id:90,terms:'way'}, {id:89,terms:'well'},
        {id:51,terms:'when'}, {id:33,terms:'will'}, {id:87,terms:'work'},
        {id:37,terms:'would'}, {id:63, terms: ['year', 'years'] },
        {id:101, descr: 'to eat', terms: ['eat', 'eats', 'to eat'] },
        {id:69,  descr: 'to see', terms: ['see', 'sees', 'to see'] },
        {id:28,  descr: 'to say', terms: ['say', 'says', 'to say'] },
        {id:103, descr: 'someone with little courage',
          terms: [
            'coward',
            {str:'chicken', style:'i', descr: 'as in \'coward\''} ] },
        {id:108, terms: 'fork'},
        {id:109, terms: 'burnt'},
        {id:105, descr: 'to use',
          terms: ['with', 'using', 'use of', 'to use']},
        {id:106, descr: 'to be accompanied by',
          terms: ['with', 'accompanied by' , 'to be accompanied by']},
        {id:20,  descr: 'associated with', terms: 'at'},
        {id:7,   descr: 'to be located in', terms: [
          {str: 'in', style: ''}, 'is located in', 'located in',
          'located at', 'at' ]  ///, {str:'locatedness-inside', style:'i0-18'}
        },
        {id:115, descr: 'to happen in time period',
          terms: ['in',  'during'] },
        {id:116, descr: 'to happen at timepoint',
          terms: {str:'at', descr: 'happens at timepoint'} },
        {id:111, descr: 'to pertain to',
          terms: {str:'in', descr: 'pertains to'} },
        {id:5,   descr: 'List, plain collection of items', terms: 'and'},
        {id:112, descr: 'List where item order is important',
          terms: {str:'ordered-and', style:'i0-7'} },
        {id:2,   descr: 'to be',
          terms: [
            'to be', 'being',
            {str:'is', descr: '\'to be\', in its 3rd-person avatar'},
            {str:'are', descr: '\'to be\', in its plural avatar'} ] },
        {id:123, descr: 'belonging to', terms: ['of', '\'s'] },
        {id:3,   descr: 'having purpose', terms: ['to', 'for'] },
        {id:126, terms: 'book'},
        {id:131, descr: 'Single-term relation for the \'if ... then ...\' ' +
          'construct in natural language',
          terms: 'if-then'},
        {id:132, descr: '\'if not ... then ...\'', terms: 'else'},
        {id:255, descr: 'Visual Syntax Method, a way to represent ' +
          'contextualised information, so it is manageable by ' +
          'both humans and computers',
          terms: 'VSM'},
        {id:256, descr: 'Steven Vercruysse (Cruy), creator of VSM',
          terms: 'Steven'},
        {id:133, terms: 'has'},
        {id:141, descr: 'being located amongst',
            terms: ['between', 'is between', 'are between']},
        {id:142, descr: 'the location amongst some things', terms: 'between'},
      ]},
      {id: 'PRS', name: 'Persons', entries: [
        {id:4,terms:'Brown'}, {id:20,terms:'Clarke'}, {id:8,terms:'Davis'},
        {id:12,terms:'Evans'}, {id:16,terms:'Green'}, {id:17,terms:'Hall'},
        {id:19,terms:'Jackson'}, {id:7,terms:'Johnson'}, {id:2,terms:'Jones'},
        {id:15,terms:'Roberts'}, {id:9,terms:'Robinson'}, {id:1,terms:'Smith'},
        {id:3,terms:'Taylor'}, {id:11,terms:'Thompson'}, {id:13,terms:'Walker'},
        {id:14,terms:'White'}, {id:5,terms:'Williams'}, {id:6,terms:'Wilson'},
        {id:18,terms:'Wood'}, {id:10,terms:'Wright'},
        {id:501,terms:'Alice'},
        {id:502,terms:'Bob'},
        {id:510,terms:'John', descr: 'my imaginary friend John Doe in Norway'},
      ]},
      {id: 'BIO', name: 'Biological concepts', entries: [
        {id:10,  terms: {str:'Ca2+', style:'u2-3'} },
        {id:11,  terms: {str:'Na+Cl-', style:'u2u5'} },
        {id:1,   terms: ['beta-Carotene', 'β-Carotene'] },
        {id:2,   descr: 'the Human gene ICER', terms: 'ICER' },
        {id:3,   descr: 'the Human gene cdc2',
          terms: [{str: 'cdc2', style: 'i'}],  ///, {str: 'cdc'}, {str: 'KRP5'},
          z: {species: 'Human'} },
        {id:903, descr: 'the Mouse gene cdc2', terms: 'cdc2' },
        {id:14,  descr: 'to activate (= the activation of) a molecule, ' +
          'by some actor',
          terms: ['activates', 'activation']
          ///, {str: 'activation (of)', style: 'i11-14'}
        },
        {id:15,  terms: 'inhibits'},
        {id:16,  terms: ['regulates', 'regulation'] },
        {id:17,  terms: 'has function'},
        {id:18,  terms: 'according to'},
        {id:19,  terms: ['binds to', 'binds', 'bind', 'bound to'] },
        {id:30,  descr: 'addition of a ubiquitin-molecule tag to a protein, ' +
          'which marks it for degradation by a proteasome',
          terms: 'ubiquitinates'},
        {id:42,  descr: 'the animal',         terms: 'chicken'},
        {id:101, descr: 'example molecule A', terms: 'A'},
        {id:102, descr: 'example molecule B', terms: 'B'},
        {id:103, descr: 'example molecule C', terms: 'C'},
        {id:104, descr: 'example molecule D', terms: 'D'},
        {id:124, descr: 'example molecule X', terms: 'X'},
        {id:131, descr: 'example protein A',  terms: 'protein A'},
        {id:132, descr: 'example protein B',  terms: 'protein B'},
        {id:133, descr: 'example location C', terms: 'location C'},
        {id:151, descr: 'the blade of a plant leaf (Plant Ontology term)',
          terms: 'leaf lamina'},
        {id:152, descr: 'a plant leaf shape variation (PATO term)',
          terms: 'twisted'},
      ]},
      {id: 'VAR', name: 'Various concepts', entries: [
        {id:15,  descr: 'Computer science, Information Technology', terms: 'IT'},
        {id:16,  descr: 'to turn on a device',
          terms: ['activate', 'activates'] },
        {id:17,  terms: 'device'},
        {id:18,  descr: 'is subclass of', terms: ['is subclass of', 'is a'] },
        {id:21,  descr: 'percent', terms: ['percent', '%', 'percentage'] },
        {id:93,  descr: 'unit of acceleration',
          terms: {str:'m/s2', style:'u3'} },
        {id:151, descr: 'the mathematical operator \'for all\'',
          terms: ['∀','for all']},
        {id:153, descr: 'the mathematical operator \'there exists\'',
          terms: ['∃', 'exists'] },
      ]},
      {id: '00', name: 'Numbers', entries: [
        {id: '00:5e+0',   terms: ['5', 'five'] },
        {id: '00:1.2e+1', terms: ['12', 'twelve', 'dozen'],
          descr: 'the amount of twelve' },
        {id: '00:4e+1',   terms: ['40', 'forty'] },
      ]},
      {id: 'NEW', name: 'New Concepts', entries: []},
    ],

    refTerms: [
      'it', 'this', 'that', 'they', 'these'
    ]
  };
}
