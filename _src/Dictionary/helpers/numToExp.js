/*
Given a valid number represented as string, returns a string that represents it
in exponential notation. This can be used as a unique ID for the number's value.

It works also for high precision numbers that do not fit into a JavaScript
64-bit numeric variable (but that do fit in a String, with some max length).
And it works also for very large and small numbers, whose exponent (`e...`)
does not fit into a 64-bit number.

Returns `false` if the string does not represent a number.

E.g.: for both '10.5' and '0.105E2', returns '1.05e+1'.
The exponent is 'e+1' (not 'e1') for consistency with `Number.toExponential()`.

E.g. for '-12324.3434716349863831487632112E-561640934731461387461933142',
returns: '-1.23243434716349863831487632112e-561640934731461387461933138'.
*/

var re = /^([+\-])?([0-9\.]+)(?:[e|E]([+\-]?[0-9]+))?$/;


export default function numberStringToExponential(str) {
  var m = str.match(re);  // Split into, sign; main number (incl `,`), exponent.
  if (m === null)  return false;

  var s = m[1] === '-' ? '-' : '';
  var n = m[2];
  var e = m[3] || '0';
  if (e[0] === '+')  e = e.substr(1);

  var p = n.indexOf('.');    // E.g.: '00.0001230' -> 2
  if (p < 0)  p = n.length;  // E.g.: '01230' -> 5

  var u = n.replace(/\./g, '');  // E.g.: '00.0001230' -> u = '000001230'
  if (!u || u.length < n.length - 1)  return false;  // No '.' nor '1.2.3'

  var l = u.search(/[1-9]/);  // Count leading zeros, e.g.: '000001230' -> 5
  if (l < 0)  return '0e+0';  // Case with only zeros, e.g.: '00000'

  // Adjust the exponent based on the amount of dot-shift;
  // e.g. for n = '00.0001230e+10' -> e = 10 + (2-1) - 5 = 6
  // Note: `p` and `l` fit in a JS Number, else `n` wouldn't fit in a String.
  e = addBigInts(e, (p - 1 - l).toString());

  n = u.substr(l).replace(/0+$/, '');  // Trim 0s for expon. not., e.g. -> '123'
  if (n.length > 1)  n = n[0] + '.' + n.substr(1);  // E.g. -> '1.23'

  return s + n + 'e' + (e[0] != '-' ? '+' : '') + e.toString();
}


// Adds two possibly big, signed integers, represented as strings.
export function addBigInts(a, b) {
  var sa = a[0] === '-' ? 1 : 0; // Put aside a sign. Only '-' allowed, not '+'.
  var sb = b[0] === '-' ? 1 : 0;
  if (sa)  a = a.substr(1);
  if (sb)  b = b.substr(1);
  var eq = sa === sb; // Equal sign => real addition, else actually subtraction.

  a = a.replace(/^0+/, '');  // Remove leading zeros.
  b = b.replace(/^0+/, '');
  if ( (a === '' && b === '')  ||  (!eq && a === b) )  return '0';

  if ( !eq  &&  (a.length < b.length || (a.length === b.length && a < b)) ) {
    var x = a;  a = b;  b = x;  // For subtraction, swap to make a > b; ..
    sa = sb;     // ..then e.g.:  `-6 + 2 = - (6 - 2)`, and `6 + -2 = (6 - 2)`.
  }

  // Merged code for addition/subtraction of two positive ints, repres. as str.
  a = a.split('');
  b = b.split('');
  var carry = 0;
  var acc = '';
  while (a.length || b.length || carry) {
    carry = ~~a.pop() + (eq ?  ~~b.pop() + carry:  -~~b.pop() - carry);
    acc = (carry + 10) % 10 + acc;
    carry = eq ? carry > 9 : carry < 0;
  }

  return (sa ? '-' : '') + acc.replace(/^0+/, '');
}
