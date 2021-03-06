(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;
				if (!u && a) return a(o, !0);
				if (i) return i(o, !0);
				var f = new Error("Cannot find module '" + o + "'");
				throw f.code = "MODULE_NOT_FOUND", f
			}
			var l = n[o] = {
				exports: {}
			};
			t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];
				return s(n ? n : e)
			}, l, l.exports, e, t, n, r)
		}
		return n[o].exports
	}
	var i = typeof require == "function" && require;
	for (var o = 0; o < r.length; o++) s(r[o]);
	return s
})({
	1: [function (require, module, exports) {
		(function (global) {
			/*! https://mths.be/punycode v1.4.0 by @mathias */
			;
			(function (root) {

				/** Detect free variables */
				var freeExports = typeof exports == 'object' && exports &&
					!exports.nodeType && exports;
				var freeModule = typeof module == 'object' && module &&
					!module.nodeType && module;
				var freeGlobal = typeof global == 'object' && global;
				if (
					freeGlobal.global === freeGlobal ||
					freeGlobal.window === freeGlobal ||
					freeGlobal.self === freeGlobal
				) {
					root = freeGlobal;
				}

				/**
				 * The `punycode` object.
				 * @name punycode
				 * @type Object
				 */
				var punycode,

					/** Highest positive signed 32-bit float value */
					maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

					/** Bootstring parameters */
					base = 36,
					tMin = 1,
					tMax = 26,
					skew = 38,
					damp = 700,
					initialBias = 72,
					initialN = 128, // 0x80
					delimiter = '-', // '\x2D'

					/** Regular expressions */
					regexPunycode = /^xn--/,
					regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
					regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

					/** Error messages */
					errors = {
						'overflow': 'Overflow: input needs wider integers to process',
						'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
						'invalid-input': 'Invalid input'
					},

					/** Convenience shortcuts */
					baseMinusTMin = base - tMin,
					floor = Math.floor,
					stringFromCharCode = String.fromCharCode,

					/** Temporary variable */
					key;

				/*--------------------------------------------------------------------------*/

				/**
				 * A generic error utility function.
				 * @private
				 * @param {String} type The error type.
				 * @returns {Error} Throws a `RangeError` with the applicable error message.
				 */
				function error(type) {
					throw new RangeError(errors[type]);
				}

				/**
				 * A generic `Array#map` utility function.
				 * @private
				 * @param {Array} array The array to iterate over.
				 * @param {Function} callback The function that gets called for every array
				 * item.
				 * @returns {Array} A new array of values returned by the callback function.
				 */
				function map(array, fn) {
					var length = array.length;
					var result = [];
					while (length--) {
						result[length] = fn(array[length]);
					}
					return result;
				}

				/**
				 * A simple `Array#map`-like wrapper to work with domain name strings or email
				 * addresses.
				 * @private
				 * @param {String} domain The domain name or email address.
				 * @param {Function} callback The function that gets called for every
				 * character.
				 * @returns {Array} A new string of characters returned by the callback
				 * function.
				 */
				function mapDomain(string, fn) {
					var parts = string.split('@');
					var result = '';
					if (parts.length > 1) {
						// In email addresses, only the domain name should be punycoded. Leave
						// the local part (i.e. everything up to `@`) intact.
						result = parts[0] + '@';
						string = parts[1];
					}
					// Avoid `split(regex)` for IE8 compatibility. See #17.
					string = string.replace(regexSeparators, '\x2E');
					var labels = string.split('.');
					var encoded = map(labels, fn).join('.');
					return result + encoded;
				}

				/**
				 * Creates an array containing the numeric code points of each Unicode
				 * character in the string. While JavaScript uses UCS-2 internally,
				 * this function will convert a pair of surrogate halves (each of which
				 * UCS-2 exposes as separate characters) into a single code point,
				 * matching UTF-16.
				 * @see `punycode.ucs2.encode`
				 * @see <https://mathiasbynens.be/notes/javascript-encoding>
				 * @memberOf punycode.ucs2
				 * @name decode
				 * @param {String} string The Unicode input string (UCS-2).
				 * @returns {Array} The new array of code points.
				 */
				function ucs2decode(string) {
					var output = [],
						counter = 0,
						length = string.length,
						value,
						extra;
					while (counter < length) {
						value = string.charCodeAt(counter++);
						if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
							// high surrogate, and there is a next character
							extra = string.charCodeAt(counter++);
							if ((extra & 0xFC00) == 0xDC00) { // low surrogate
								output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
							} else {
								// unmatched surrogate; only append this code unit, in case the next
								// code unit is the high surrogate of a surrogate pair
								output.push(value);
								counter--;
							}
						} else {
							output.push(value);
						}
					}
					return output;
				}

				/**
				 * Creates a string based on an array of numeric code points.
				 * @see `punycode.ucs2.decode`
				 * @memberOf punycode.ucs2
				 * @name encode
				 * @param {Array} codePoints The array of numeric code points.
				 * @returns {String} The new Unicode string (UCS-2).
				 */
				function ucs2encode(array) {
					return map(array, function (value) {
						var output = '';
						if (value > 0xFFFF) {
							value -= 0x10000;
							output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
							value = 0xDC00 | value & 0x3FF;
						}
						output += stringFromCharCode(value);
						return output;
					}).join('');
				}

				/**
				 * Converts a basic code point into a digit/integer.
				 * @see `digitToBasic()`
				 * @private
				 * @param {Number} codePoint The basic numeric code point value.
				 * @returns {Number} The numeric value of a basic code point (for use in
				 * representing integers) in the range `0` to `base - 1`, or `base` if
				 * the code point does not represent a value.
				 */
				function basicToDigit(codePoint) {
					if (codePoint - 48 < 10) {
						return codePoint - 22;
					}
					if (codePoint - 65 < 26) {
						return codePoint - 65;
					}
					if (codePoint - 97 < 26) {
						return codePoint - 97;
					}
					return base;
				}

				/**
				 * Converts a digit/integer into a basic code point.
				 * @see `basicToDigit()`
				 * @private
				 * @param {Number} digit The numeric value of a basic code point.
				 * @returns {Number} The basic code point whose value (when used for
				 * representing integers) is `digit`, which needs to be in the range
				 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
				 * used; else, the lowercase form is used. The behavior is undefined
				 * if `flag` is non-zero and `digit` has no uppercase form.
				 */
				function digitToBasic(digit, flag) {
					//  0..25 map to ASCII a..z or A..Z
					// 26..35 map to ASCII 0..9
					return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
				}

				/**
				 * Bias adaptation function as per section 3.4 of RFC 3492.
				 * https://tools.ietf.org/html/rfc3492#section-3.4
				 * @private
				 */
				function adapt(delta, numPoints, firstTime) {
					var k = 0;
					delta = firstTime ? floor(delta / damp) : delta >> 1;
					delta += floor(delta / numPoints);
					for ( /* no initialization */ ; delta > baseMinusTMin * tMax >> 1; k += base) {
						delta = floor(delta / baseMinusTMin);
					}
					return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
				}

				/**
				 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
				 * symbols.
				 * @memberOf punycode
				 * @param {String} input The Punycode string of ASCII-only symbols.
				 * @returns {String} The resulting string of Unicode symbols.
				 */
				function decode(input) {
					// Don't use UCS-2
					var output = [],
						inputLength = input.length,
						out,
						i = 0,
						n = initialN,
						bias = initialBias,
						basic,
						j,
						index,
						oldi,
						w,
						k,
						digit,
						t,
						/** Cached calculation results */
						baseMinusT;

					// Handle the basic code points: let `basic` be the number of input code
					// points before the last delimiter, or `0` if there is none, then copy
					// the first basic code points to the output.

					basic = input.lastIndexOf(delimiter);
					if (basic < 0) {
						basic = 0;
					}

					for (j = 0; j < basic; ++j) {
						// if it's not a basic code point
						if (input.charCodeAt(j) >= 0x80) {
							error('not-basic');
						}
						output.push(input.charCodeAt(j));
					}

					// Main decoding loop: start just after the last delimiter if any basic code
					// points were copied; start at the beginning otherwise.

					for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */ ) {

						// `index` is the index of the next character to be consumed.
						// Decode a generalized variable-length integer into `delta`,
						// which gets added to `i`. The overflow checking is easier
						// if we increase `i` as we go, then subtract off its starting
						// value at the end to obtain `delta`.
						for (oldi = i, w = 1, k = base; /* no condition */ ; k += base) {

							if (index >= inputLength) {
								error('invalid-input');
							}

							digit = basicToDigit(input.charCodeAt(index++));

							if (digit >= base || digit > floor((maxInt - i) / w)) {
								error('overflow');
							}

							i += digit * w;
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

							if (digit < t) {
								break;
							}

							baseMinusT = base - t;
							if (w > floor(maxInt / baseMinusT)) {
								error('overflow');
							}

							w *= baseMinusT;

						}

						out = output.length + 1;
						bias = adapt(i - oldi, out, oldi == 0);

						// `i` was supposed to wrap around from `out` to `0`,
						// incrementing `n` each time, so we'll fix that now:
						if (floor(i / out) > maxInt - n) {
							error('overflow');
						}

						n += floor(i / out);
						i %= out;

						// Insert `n` at position `i` of the output
						output.splice(i++, 0, n);

					}

					return ucs2encode(output);
				}

				/**
				 * Converts a string of Unicode symbols (e.g. a domain name label) to a
				 * Punycode string of ASCII-only symbols.
				 * @memberOf punycode
				 * @param {String} input The string of Unicode symbols.
				 * @returns {String} The resulting Punycode string of ASCII-only symbols.
				 */
				function encode(input) {
					var n,
						delta,
						handledCPCount,
						basicLength,
						bias,
						j,
						m,
						q,
						k,
						t,
						currentValue,
						output = [],
						/** `inputLength` will hold the number of code points in `input`. */
						inputLength,
						/** Cached calculation results */
						handledCPCountPlusOne,
						baseMinusT,
						qMinusT;

					// Convert the input in UCS-2 to Unicode
					input = ucs2decode(input);

					// Cache the length
					inputLength = input.length;

					// Initialize the state
					n = initialN;
					delta = 0;
					bias = initialBias;

					// Handle the basic code points
					for (j = 0; j < inputLength; ++j) {
						currentValue = input[j];
						if (currentValue < 0x80) {
							output.push(stringFromCharCode(currentValue));
						}
					}

					handledCPCount = basicLength = output.length;

					// `handledCPCount` is the number of code points that have been handled;
					// `basicLength` is the number of basic code points.

					// Finish the basic string - if it is not empty - with a delimiter
					if (basicLength) {
						output.push(delimiter);
					}

					// Main encoding loop:
					while (handledCPCount < inputLength) {

						// All non-basic code points < n have been handled already. Find the next
						// larger one:
						for (m = maxInt, j = 0; j < inputLength; ++j) {
							currentValue = input[j];
							if (currentValue >= n && currentValue < m) {
								m = currentValue;
							}
						}

						// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
						// but guard against overflow
						handledCPCountPlusOne = handledCPCount + 1;
						if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
							error('overflow');
						}

						delta += (m - n) * handledCPCountPlusOne;
						n = m;

						for (j = 0; j < inputLength; ++j) {
							currentValue = input[j];

							if (currentValue < n && ++delta > maxInt) {
								error('overflow');
							}

							if (currentValue == n) {
								// Represent delta as a generalized variable-length integer
								for (q = delta, k = base; /* no condition */ ; k += base) {
									t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
									if (q < t) {
										break;
									}
									qMinusT = q - t;
									baseMinusT = base - t;
									output.push(
										stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
									);
									q = floor(qMinusT / baseMinusT);
								}

								output.push(stringFromCharCode(digitToBasic(q, 0)));
								bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
								delta = 0;
								++handledCPCount;
							}
						}

						++delta;
						++n;

					}
					return output.join('');
				}

				/**
				 * Converts a Punycode string representing a domain name or an email address
				 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
				 * it doesn't matter if you call it on a string that has already been
				 * converted to Unicode.
				 * @memberOf punycode
				 * @param {String} input The Punycoded domain name or email address to
				 * convert to Unicode.
				 * @returns {String} The Unicode representation of the given Punycode
				 * string.
				 */
				function toUnicode(input) {
					return mapDomain(input, function (string) {
						return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
					});
				}

				/**
				 * Converts a Unicode string representing a domain name or an email address to
				 * Punycode. Only the non-ASCII parts of the domain name will be converted,
				 * i.e. it doesn't matter if you call it with a domain that's already in
				 * ASCII.
				 * @memberOf punycode
				 * @param {String} input The domain name or email address to convert, as a
				 * Unicode string.
				 * @returns {String} The Punycode representation of the given domain name or
				 * email address.
				 */
				function toASCII(input) {
					return mapDomain(input, function (string) {
						return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
					});
				}

				/*--------------------------------------------------------------------------*/

				/** Define the public API */
				punycode = {
					/**
					 * A string representing the current Punycode.js version number.
					 * @memberOf punycode
					 * @type String
					 */
					'version': '1.3.2',
					/**
					 * An object of methods to convert from JavaScript's internal character
					 * representation (UCS-2) to Unicode code points, and back.
					 * @see <https://mathiasbynens.be/notes/javascript-encoding>
					 * @memberOf punycode
					 * @type Object
					 */
					'ucs2': {
						'decode': ucs2decode,
						'encode': ucs2encode
					},
					'decode': decode,
					'encode': encode,
					'toASCII': toASCII,
					'toUnicode': toUnicode
				};

				/** Expose `punycode` */
				// Some AMD build optimizers, like r.js, check for specific condition patterns
				// like the following:
				if (
					typeof define == 'function' &&
					typeof define.amd == 'object' &&
					define.amd
				) {
					define('punycode', function () {
						return punycode;
					});
				} else if (freeExports && freeModule) {
					if (module.exports == freeExports) {
						// in Node.js, io.js, or RingoJS v0.8.0+
						freeModule.exports = punycode;
					} else {
						// in Narwhal or RingoJS v0.7.0-
						for (key in punycode) {
							punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
						}
					}
				} else {
					// in Rhino or a web browser
					root.punycode = punycode;
				}

			}(this));

		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
	2: [function (require, module, exports) {
		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		'use strict';

		// If obj.hasOwnProperty has been overridden, then calling
		// obj.hasOwnProperty(prop) will break.
		// See: https://github.com/joyent/node/issues/1707
		function hasOwnProperty(obj, prop) {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		}

		module.exports = function (qs, sep, eq, options) {
			sep = sep || '&';
			eq = eq || '=';
			var obj = {};

			if (typeof qs !== 'string' || qs.length === 0) {
				return obj;
			}

			var regexp = /\+/g;
			qs = qs.split(sep);

			var maxKeys = 1000;
			if (options && typeof options.maxKeys === 'number') {
				maxKeys = options.maxKeys;
			}

			var len = qs.length;
			// maxKeys <= 0 means that we should not limit keys count
			if (maxKeys > 0 && len > maxKeys) {
				len = maxKeys;
			}

			for (var i = 0; i < len; ++i) {
				var x = qs[i].replace(regexp, '%20'),
					idx = x.indexOf(eq),
					kstr, vstr, k, v;

				if (idx >= 0) {
					kstr = x.substr(0, idx);
					vstr = x.substr(idx + 1);
				} else {
					kstr = x;
					vstr = '';
				}

				k = decodeURIComponent(kstr);
				v = decodeURIComponent(vstr);

				if (!hasOwnProperty(obj, k)) {
					obj[k] = v;
				} else if (isArray(obj[k])) {
					obj[k].push(v);
				} else {
					obj[k] = [obj[k], v];
				}
			}

			return obj;
		};

		var isArray = Array.isArray || function (xs) {
			return Object.prototype.toString.call(xs) === '[object Array]';
		};

}, {}],
	3: [function (require, module, exports) {
		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		'use strict';

		var stringifyPrimitive = function (v) {
			switch (typeof v) {
				case 'string':
					return v;

				case 'boolean':
					return v ? 'true' : 'false';

				case 'number':
					return isFinite(v) ? v : '';

				default:
					return '';
			}
		};

		module.exports = function (obj, sep, eq, name) {
			sep = sep || '&';
			eq = eq || '=';
			if (obj === null) {
				obj = undefined;
			}

			if (typeof obj === 'object') {
				return map(objectKeys(obj), function (k) {
					var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
					if (isArray(obj[k])) {
						return map(obj[k], function (v) {
							return ks + encodeURIComponent(stringifyPrimitive(v));
						}).join(sep);
					} else {
						return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
					}
				}).join(sep);

			}

			if (!name) return '';
			return encodeURIComponent(stringifyPrimitive(name)) + eq +
				encodeURIComponent(stringifyPrimitive(obj));
		};

		var isArray = Array.isArray || function (xs) {
			return Object.prototype.toString.call(xs) === '[object Array]';
		};

		function map(xs, f) {
			if (xs.map) return xs.map(f);
			var res = [];
			for (var i = 0; i < xs.length; i++) {
				res.push(f(xs[i], i));
			}
			return res;
		}

		var objectKeys = Object.keys || function (obj) {
			var res = [];
			for (var key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
			}
			return res;
		};

}, {}],
	4: [function (require, module, exports) {
		'use strict';

		exports.decode = exports.parse = require('./decode');
		exports.encode = exports.stringify = require('./encode');

}, {
		"./decode": 2,
		"./encode": 3
	}],
	5: [function (require, module, exports) {
		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		'use strict';

		var punycode = require('punycode');
		var util = require('./util');

		exports.parse = urlParse;
		exports.resolve = urlResolve;
		exports.resolveObject = urlResolveObject;
		exports.format = urlFormat;

		exports.Url = Url;

		function Url() {
			this.protocol = null;
			this.slashes = null;
			this.auth = null;
			this.host = null;
			this.port = null;
			this.hostname = null;
			this.hash = null;
			this.search = null;
			this.query = null;
			this.pathname = null;
			this.path = null;
			this.href = null;
		}

		// Reference: RFC 3986, RFC 1808, RFC 2396

		// define these here so at least they only have to be
		// compiled once on the first module load.
		var protocolPattern = /^([a-z0-9.+-]+:)/i,
			portPattern = /:[0-9]*$/,

			// Special case for a simple path URL
			simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

			// RFC 2396: characters reserved for delimiting URLs.
			// We actually just auto-escape these.
			delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

			// RFC 2396: characters not allowed for various reasons.
			unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

			// Allowed by RFCs, but cause of XSS attacks.  Always escape these.
			autoEscape = ['\''].concat(unwise),
			// Characters that are never ever allowed in a hostname.
			// Note that any invalid chars are also handled, but these
			// are the ones that are *expected* to be seen, so we fast-path
			// them.
			nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
			hostEndingChars = ['/', '?', '#'],
			hostnameMaxLen = 255,
			hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
			hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
			// protocols that can allow "unsafe" and "unwise" chars.
			unsafeProtocol = {
				'javascript': true,
				'javascript:': true
			},
			// protocols that never have a hostname.
			hostlessProtocol = {
				'javascript': true,
				'javascript:': true
			},
			// protocols that always contain a // bit.
			slashedProtocol = {
				'http': true,
				'https': true,
				'ftp': true,
				'gopher': true,
				'file': true,
				'http:': true,
				'https:': true,
				'ftp:': true,
				'gopher:': true,
				'file:': true
			},
			querystring = require('querystring');

		function urlParse(url, parseQueryString, slashesDenoteHost) {
			if (url && util.isObject(url) && url instanceof Url) return url;

			var u = new Url;
			u.parse(url, parseQueryString, slashesDenoteHost);
			return u;
		}

		Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
			if (!util.isString(url)) {
				throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
			}

			// Copy chrome, IE, opera backslash-handling behavior.
			// Back slashes before the query string get converted to forward slashes
			// See: https://code.google.com/p/chromium/issues/detail?id=25916
			var queryIndex = url.indexOf('?'),
				splitter =
				(queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
				uSplit = url.split(splitter),
				slashRegex = /\\/g;
			uSplit[0] = uSplit[0].replace(slashRegex, '/');
			url = uSplit.join(splitter);

			var rest = url;

			// trim before proceeding.
			// This is to support parse stuff like "  http://foo.com  \n"
			rest = rest.trim();

			if (!slashesDenoteHost && url.split('#').length === 1) {
				// Try fast path regexp
				var simplePath = simplePathPattern.exec(rest);
				if (simplePath) {
					this.path = rest;
					this.href = rest;
					this.pathname = simplePath[1];
					if (simplePath[2]) {
						this.search = simplePath[2];
						if (parseQueryString) {
							this.query = querystring.parse(this.search.substr(1));
						} else {
							this.query = this.search.substr(1);
						}
					} else if (parseQueryString) {
						this.search = '';
						this.query = {};
					}
					return this;
				}
			}

			var proto = protocolPattern.exec(rest);
			if (proto) {
				proto = proto[0];
				var lowerProto = proto.toLowerCase();
				this.protocol = lowerProto;
				rest = rest.substr(proto.length);
			}

			// figure out if it's got a host
			// user@server is *always* interpreted as a hostname, and url
			// resolution will treat //foo/bar as host=foo,path=bar because that's
			// how the browser resolves relative URLs.
			if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
				var slashes = rest.substr(0, 2) === '//';
				if (slashes && !(proto && hostlessProtocol[proto])) {
					rest = rest.substr(2);
					this.slashes = true;
				}
			}

			if (!hostlessProtocol[proto] &&
				(slashes || (proto && !slashedProtocol[proto]))) {

				// there's a hostname.
				// the first instance of /, ?, ;, or # ends the host.
				//
				// If there is an @ in the hostname, then non-host chars *are* allowed
				// to the left of the last @ sign, unless some host-ending character
				// comes *before* the @-sign.
				// URLs are obnoxious.
				//
				// ex:
				// http://a@b@c/ => user:a@b host:c
				// http://a@b?@c => user:a host:c path:/?@c

				// v0.12 TODO(isaacs): This is not quite how Chrome does things.
				// Review our test case against browsers more comprehensively.

				// find the first instance of any hostEndingChars
				var hostEnd = -1;
				for (var i = 0; i < hostEndingChars.length; i++) {
					var hec = rest.indexOf(hostEndingChars[i]);
					if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
						hostEnd = hec;
				}

				// at this point, either we have an explicit point where the
				// auth portion cannot go past, or the last @ char is the decider.
				var auth, atSign;
				if (hostEnd === -1) {
					// atSign can be anywhere.
					atSign = rest.lastIndexOf('@');
				} else {
					// atSign must be in auth portion.
					// http://a@b/c@d => host:b auth:a path:/c@d
					atSign = rest.lastIndexOf('@', hostEnd);
				}

				// Now we have a portion which is definitely the auth.
				// Pull that off.
				if (atSign !== -1) {
					auth = rest.slice(0, atSign);
					rest = rest.slice(atSign + 1);
					this.auth = decodeURIComponent(auth);
				}

				// the host is the remaining to the left of the first non-host char
				hostEnd = -1;
				for (var i = 0; i < nonHostChars.length; i++) {
					var hec = rest.indexOf(nonHostChars[i]);
					if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
						hostEnd = hec;
				}
				// if we still have not hit it, then the entire thing is a host.
				if (hostEnd === -1)
					hostEnd = rest.length;

				this.host = rest.slice(0, hostEnd);
				rest = rest.slice(hostEnd);

				// pull out port.
				this.parseHost();

				// we've indicated that there is a hostname,
				// so even if it's empty, it has to be present.
				this.hostname = this.hostname || '';

				// if hostname begins with [ and ends with ]
				// assume that it's an IPv6 address.
				var ipv6Hostname = this.hostname[0] === '[' &&
					this.hostname[this.hostname.length - 1] === ']';

				// validate a little.
				if (!ipv6Hostname) {
					var hostparts = this.hostname.split(/\./);
					for (var i = 0, l = hostparts.length; i < l; i++) {
						var part = hostparts[i];
						if (!part) continue;
						if (!part.match(hostnamePartPattern)) {
							var newpart = '';
							for (var j = 0, k = part.length; j < k; j++) {
								if (part.charCodeAt(j) > 127) {
									// we replace non-ASCII char with a temporary placeholder
									// we need this to make sure size of hostname is not
									// broken by replacing non-ASCII by nothing
									newpart += 'x';
								} else {
									newpart += part[j];
								}
							}
							// we test again with ASCII char only
							if (!newpart.match(hostnamePartPattern)) {
								var validParts = hostparts.slice(0, i);
								var notHost = hostparts.slice(i + 1);
								var bit = part.match(hostnamePartStart);
								if (bit) {
									validParts.push(bit[1]);
									notHost.unshift(bit[2]);
								}
								if (notHost.length) {
									rest = '/' + notHost.join('.') + rest;
								}
								this.hostname = validParts.join('.');
								break;
							}
						}
					}
				}

				if (this.hostname.length > hostnameMaxLen) {
					this.hostname = '';
				} else {
					// hostnames are always lower case.
					this.hostname = this.hostname.toLowerCase();
				}

				if (!ipv6Hostname) {
					// IDNA Support: Returns a punycoded representation of "domain".
					// It only converts parts of the domain name that
					// have non-ASCII characters, i.e. it doesn't matter if
					// you call it with a domain that already is ASCII-only.
					this.hostname = punycode.toASCII(this.hostname);
				}

				var p = this.port ? ':' + this.port : '';
				var h = this.hostname || '';
				this.host = h + p;
				this.href += this.host;

				// strip [ and ] from the hostname
				// the host field still retains them, though
				if (ipv6Hostname) {
					this.hostname = this.hostname.substr(1, this.hostname.length - 2);
					if (rest[0] !== '/') {
						rest = '/' + rest;
					}
				}
			}

			// now rest is set to the post-host stuff.
			// chop off any delim chars.
			if (!unsafeProtocol[lowerProto]) {

				// First, make 100% sure that any "autoEscape" chars get
				// escaped, even if encodeURIComponent doesn't think they
				// need to be.
				for (var i = 0, l = autoEscape.length; i < l; i++) {
					var ae = autoEscape[i];
					if (rest.indexOf(ae) === -1)
						continue;
					var esc = encodeURIComponent(ae);
					if (esc === ae) {
						esc = escape(ae);
					}
					rest = rest.split(ae).join(esc);
				}
			}


			// chop off from the tail first.
			var hash = rest.indexOf('#');
			if (hash !== -1) {
				// got a fragment string.
				this.hash = rest.substr(hash);
				rest = rest.slice(0, hash);
			}
			var qm = rest.indexOf('?');
			if (qm !== -1) {
				this.search = rest.substr(qm);
				this.query = rest.substr(qm + 1);
				if (parseQueryString) {
					this.query = querystring.parse(this.query);
				}
				rest = rest.slice(0, qm);
			} else if (parseQueryString) {
				// no query string, but parseQueryString still requested
				this.search = '';
				this.query = {};
			}
			if (rest) this.pathname = rest;
			if (slashedProtocol[lowerProto] &&
				this.hostname && !this.pathname) {
				this.pathname = '/';
			}

			//to support http.request
			if (this.pathname || this.search) {
				var p = this.pathname || '';
				var s = this.search || '';
				this.path = p + s;
			}

			// finally, reconstruct the href based on what has been validated.
			this.href = this.format();
			return this;
		};

		// format a parsed object into a url string
		function urlFormat(obj) {
			// ensure it's an object, and not a string url.
			// If it's an obj, this is a no-op.
			// this way, you can call url_format() on strings
			// to clean up potentially wonky urls.
			if (util.isString(obj)) obj = urlParse(obj);
			if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
			return obj.format();
		}

		Url.prototype.format = function () {
			var auth = this.auth || '';
			if (auth) {
				auth = encodeURIComponent(auth);
				auth = auth.replace(/%3A/i, ':');
				auth += '@';
			}

			var protocol = this.protocol || '',
				pathname = this.pathname || '',
				hash = this.hash || '',
				host = false,
				query = '';

			if (this.host) {
				host = auth + this.host;
			} else if (this.hostname) {
				host = auth + (this.hostname.indexOf(':') === -1 ?
					this.hostname :
					'[' + this.hostname + ']');
				if (this.port) {
					host += ':' + this.port;
				}
			}

			if (this.query &&
				util.isObject(this.query) &&
				Object.keys(this.query).length) {
				query = querystring.stringify(this.query);
			}

			var search = this.search || (query && ('?' + query)) || '';

			if (protocol && protocol.substr(-1) !== ':') protocol += ':';

			// only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
			// unless they had them to begin with.
			if (this.slashes ||
				(!protocol || slashedProtocol[protocol]) && host !== false) {
				host = '//' + (host || '');
				if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
			} else if (!host) {
				host = '';
			}

			if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
			if (search && search.charAt(0) !== '?') search = '?' + search;

			pathname = pathname.replace(/[?#]/g, function (match) {
				return encodeURIComponent(match);
			});
			search = search.replace('#', '%23');

			return protocol + host + pathname + search + hash;
		};

		function urlResolve(source, relative) {
			return urlParse(source, false, true).resolve(relative);
		}

		Url.prototype.resolve = function (relative) {
			return this.resolveObject(urlParse(relative, false, true)).format();
		};

		function urlResolveObject(source, relative) {
			if (!source) return relative;
			return urlParse(source, false, true).resolveObject(relative);
		}

		Url.prototype.resolveObject = function (relative) {
			if (util.isString(relative)) {
				var rel = new Url();
				rel.parse(relative, false, true);
				relative = rel;
			}

			var result = new Url();
			var tkeys = Object.keys(this);
			for (var tk = 0; tk < tkeys.length; tk++) {
				var tkey = tkeys[tk];
				result[tkey] = this[tkey];
			}

			// hash is always overridden, no matter what.
			// even href="" will remove it.
			result.hash = relative.hash;

			// if the relative url is empty, then there's nothing left to do here.
			if (relative.href === '') {
				result.href = result.format();
				return result;
			}

			// hrefs like //foo/bar always cut to the protocol.
			if (relative.slashes && !relative.protocol) {
				// take everything except the protocol from relative
				var rkeys = Object.keys(relative);
				for (var rk = 0; rk < rkeys.length; rk++) {
					var rkey = rkeys[rk];
					if (rkey !== 'protocol')
						result[rkey] = relative[rkey];
				}

				//urlParse appends trailing / to urls like http://www.example.com
				if (slashedProtocol[result.protocol] &&
					result.hostname && !result.pathname) {
					result.path = result.pathname = '/';
				}

				result.href = result.format();
				return result;
			}

			if (relative.protocol && relative.protocol !== result.protocol) {
				// if it's a known url protocol, then changing
				// the protocol does weird things
				// first, if it's not file:, then we MUST have a host,
				// and if there was a path
				// to begin with, then we MUST have a path.
				// if it is file:, then the host is dropped,
				// because that's known to be hostless.
				// anything else is assumed to be absolute.
				if (!slashedProtocol[relative.protocol]) {
					var keys = Object.keys(relative);
					for (var v = 0; v < keys.length; v++) {
						var k = keys[v];
						result[k] = relative[k];
					}
					result.href = result.format();
					return result;
				}

				result.protocol = relative.protocol;
				if (!relative.host && !hostlessProtocol[relative.protocol]) {
					var relPath = (relative.pathname || '').split('/');
					while (relPath.length && !(relative.host = relPath.shift()));
					if (!relative.host) relative.host = '';
					if (!relative.hostname) relative.hostname = '';
					if (relPath[0] !== '') relPath.unshift('');
					if (relPath.length < 2) relPath.unshift('');
					result.pathname = relPath.join('/');
				} else {
					result.pathname = relative.pathname;
				}
				result.search = relative.search;
				result.query = relative.query;
				result.host = relative.host || '';
				result.auth = relative.auth;
				result.hostname = relative.hostname || relative.host;
				result.port = relative.port;
				// to support http.request
				if (result.pathname || result.search) {
					var p = result.pathname || '';
					var s = result.search || '';
					result.path = p + s;
				}
				result.slashes = result.slashes || relative.slashes;
				result.href = result.format();
				return result;
			}

			var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
				isRelAbs = (
					relative.host ||
					relative.pathname && relative.pathname.charAt(0) === '/'
				),
				mustEndAbs = (isRelAbs || isSourceAbs ||
					(result.host && relative.pathname)),
				removeAllDots = mustEndAbs,
				srcPath = result.pathname && result.pathname.split('/') || [],
				relPath = relative.pathname && relative.pathname.split('/') || [],
				psychotic = result.protocol && !slashedProtocol[result.protocol];

			// if the url is a non-slashed url, then relative
			// links like ../.. should be able
			// to crawl up to the hostname, as well.  This is strange.
			// result.protocol has already been set by now.
			// Later on, put the first path part into the host field.
			if (psychotic) {
				result.hostname = '';
				result.port = null;
				if (result.host) {
					if (srcPath[0] === '') srcPath[0] = result.host;
					else srcPath.unshift(result.host);
				}
				result.host = '';
				if (relative.protocol) {
					relative.hostname = null;
					relative.port = null;
					if (relative.host) {
						if (relPath[0] === '') relPath[0] = relative.host;
						else relPath.unshift(relative.host);
					}
					relative.host = null;
				}
				mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
			}

			if (isRelAbs) {
				// it's absolute.
				result.host = (relative.host || relative.host === '') ?
					relative.host : result.host;
				result.hostname = (relative.hostname || relative.hostname === '') ?
					relative.hostname : result.hostname;
				result.search = relative.search;
				result.query = relative.query;
				srcPath = relPath;
				// fall through to the dot-handling below.
			} else if (relPath.length) {
				// it's relative
				// throw away the existing file, and take the new path instead.
				if (!srcPath) srcPath = [];
				srcPath.pop();
				srcPath = srcPath.concat(relPath);
				result.search = relative.search;
				result.query = relative.query;
			} else if (!util.isNullOrUndefined(relative.search)) {
				// just pull out the search.
				// like href='?foo'.
				// Put this after the other two cases because it simplifies the booleans
				if (psychotic) {
					result.hostname = result.host = srcPath.shift();
					//occationaly the auth can get stuck only in host
					//this especially happens in cases like
					//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
					var authInHost = result.host && result.host.indexOf('@') > 0 ?
						result.host.split('@') : false;
					if (authInHost) {
						result.auth = authInHost.shift();
						result.host = result.hostname = authInHost.shift();
					}
				}
				result.search = relative.search;
				result.query = relative.query;
				//to support http.request
				if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
					result.path = (result.pathname ? result.pathname : '') +
						(result.search ? result.search : '');
				}
				result.href = result.format();
				return result;
			}

			if (!srcPath.length) {
				// no path at all.  easy.
				// we've already handled the other stuff above.
				result.pathname = null;
				//to support http.request
				if (result.search) {
					result.path = '/' + result.search;
				} else {
					result.path = null;
				}
				result.href = result.format();
				return result;
			}

			// if a url ENDs in . or .., then it must get a trailing slash.
			// however, if it ends in anything else non-slashy,
			// then it must NOT get a trailing slash.
			var last = srcPath.slice(-1)[0];
			var hasTrailingSlash = (
				(result.host || relative.host || srcPath.length > 1) &&
				(last === '.' || last === '..') || last === '');

			// strip single dots, resolve double dots to parent dir
			// if the path tries to go above the root, `up` ends up > 0
			var up = 0;
			for (var i = srcPath.length; i >= 0; i--) {
				last = srcPath[i];
				if (last === '.') {
					srcPath.splice(i, 1);
				} else if (last === '..') {
					srcPath.splice(i, 1);
					up++;
				} else if (up) {
					srcPath.splice(i, 1);
					up--;
				}
			}

			// if the path is allowed to go above the root, restore leading ..s
			if (!mustEndAbs && !removeAllDots) {
				for (; up--; up) {
					srcPath.unshift('..');
				}
			}

			if (mustEndAbs && srcPath[0] !== '' &&
				(!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
				srcPath.unshift('');
			}

			if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
				srcPath.push('');
			}

			var isAbsolute = srcPath[0] === '' ||
				(srcPath[0] && srcPath[0].charAt(0) === '/');

			// put the host back
			if (psychotic) {
				result.hostname = result.host = isAbsolute ? '' :
					srcPath.length ? srcPath.shift() : '';
				//occationaly the auth can get stuck only in host
				//this especially happens in cases like
				//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
				var authInHost = result.host && result.host.indexOf('@') > 0 ?
					result.host.split('@') : false;
				if (authInHost) {
					result.auth = authInHost.shift();
					result.host = result.hostname = authInHost.shift();
				}
			}

			mustEndAbs = mustEndAbs || (result.host && srcPath.length);

			if (mustEndAbs && !isAbsolute) {
				srcPath.unshift('');
			}

			if (!srcPath.length) {
				result.pathname = null;
				result.path = null;
			} else {
				result.pathname = srcPath.join('/');
			}

			//to support request.http
			if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
				result.path = (result.pathname ? result.pathname : '') +
					(result.search ? result.search : '');
			}
			result.auth = relative.auth || result.auth;
			result.slashes = result.slashes || relative.slashes;
			result.href = result.format();
			return result;
		};

		Url.prototype.parseHost = function () {
			var host = this.host;
			var port = portPattern.exec(host);
			if (port) {
				port = port[0];
				if (port !== ':') {
					this.port = port.substr(1);
				}
				host = host.substr(0, host.length - port.length);
			}
			if (host) this.hostname = host;
		};

}, {
		"./util": 6,
		"punycode": 1,
		"querystring": 4
	}],
	6: [function (require, module, exports) {
		'use strict';

		module.exports = {
			isString: function (arg) {
				return typeof (arg) === 'string';
			},
			isObject: function (arg) {
				return typeof (arg) === 'object' && arg !== null;
			},
			isNull: function (arg) {
				return arg === null;
			},
			isNullOrUndefined: function (arg) {
				return arg == null;
			}
		};

}, {}],
	7: [function (require, module, exports) {
		var request = require('superagent'),
			auth = require('superagent-d2l-session-auth')();
		window.valence_req = request;
		window.valence_auth = auth;

}, {
		"superagent": 34,
		"superagent-d2l-session-auth": 33
	}],
	8: [function (require, module, exports) {

		/**
		 * Expose `Emitter`.
		 */

		module.exports = Emitter;

		/**
		 * Initialize a new `Emitter`.
		 *
		 * @api public
		 */

		function Emitter(obj) {
			if (obj) return mixin(obj);
		};

		/**
		 * Mixin the emitter properties.
		 *
		 * @param {Object} obj
		 * @return {Object}
		 * @api private
		 */

		function mixin(obj) {
			for (var key in Emitter.prototype) {
				obj[key] = Emitter.prototype[key];
			}
			return obj;
		}

		/**
		 * Listen on the given `event` with `fn`.
		 *
		 * @param {String} event
		 * @param {Function} fn
		 * @return {Emitter}
		 * @api public
		 */

		Emitter.prototype.on =
			Emitter.prototype.addEventListener = function (event, fn) {
				this._callbacks = this._callbacks || {};
				(this._callbacks['$' + event] = this._callbacks['$' + event] || [])
				.push(fn);
				return this;
			};

		/**
		 * Adds an `event` listener that will be invoked a single
		 * time then automatically removed.
		 *
		 * @param {String} event
		 * @param {Function} fn
		 * @return {Emitter}
		 * @api public
		 */

		Emitter.prototype.once = function (event, fn) {
			function on() {
				this.off(event, on);
				fn.apply(this, arguments);
			}

			on.fn = fn;
			this.on(event, on);
			return this;
		};

		/**
		 * Remove the given callback for `event` or all
		 * registered callbacks.
		 *
		 * @param {String} event
		 * @param {Function} fn
		 * @return {Emitter}
		 * @api public
		 */

		Emitter.prototype.off =
			Emitter.prototype.removeListener =
			Emitter.prototype.removeAllListeners =
			Emitter.prototype.removeEventListener = function (event, fn) {
				this._callbacks = this._callbacks || {};

				// all
				if (0 == arguments.length) {
					this._callbacks = {};
					return this;
				}

				// specific event
				var callbacks = this._callbacks['$' + event];
				if (!callbacks) return this;

				// remove all handlers
				if (1 == arguments.length) {
					delete this._callbacks['$' + event];
					return this;
				}

				// remove specific handler
				var cb;
				for (var i = 0; i < callbacks.length; i++) {
					cb = callbacks[i];
					if (cb === fn || cb.fn === fn) {
						callbacks.splice(i, 1);
						break;
					}
				}
				return this;
			};

		/**
		 * Emit `event` with the given args.
		 *
		 * @param {String} event
		 * @param {Mixed} ...
		 * @return {Emitter}
		 */

		Emitter.prototype.emit = function (event) {
			this._callbacks = this._callbacks || {};
			var args = [].slice.call(arguments, 1),
				callbacks = this._callbacks['$' + event];

			if (callbacks) {
				callbacks = callbacks.slice(0);
				for (var i = 0, len = callbacks.length; i < len; ++i) {
					callbacks[i].apply(this, args);
				}
			}

			return this;
		};

		/**
		 * Return array of callbacks for `event`.
		 *
		 * @param {String} event
		 * @return {Array}
		 * @api public
		 */

		Emitter.prototype.listeners = function (event) {
			this._callbacks = this._callbacks || {};
			return this._callbacks['$' + event] || [];
		};

		/**
		 * Check if this emitter has `event` handlers.
		 *
		 * @param {String} event
		 * @return {Boolean}
		 * @api public
		 */

		Emitter.prototype.hasListeners = function (event) {
			return !!this.listeners(event).length;
		};

}, {}],
	9: [function (require, module, exports) {
		'use strict';

		module.exports = function framed() {
			return !window.D2L;
		};

}, {}],
	10: [function (require, module, exports) {
		'use strict';

		var Client = require('ifrau/client'),
			Promise = require('lie');

		var REQUEST_KEY = require('./request-key');

		module.exports = function getFramedJwt(scope) {
			return Promise
				.resolve()
				.then(function () {
					var client = new Client({
						syncTitle: false
					});

					return client
						.connect()
						.then(function () {
							return client.request(REQUEST_KEY, scope);
						});
				});
		};

}, {
		"./request-key": 13,
		"ifrau/client": 18,
		"lie": 31
	}],
	11: [function (require, module, exports) {
		'use strict';

		var framed = require('frau-framed');

		var getFramed = require('./framed'),
			getLocal = require('./local');

		module.exports = function frauJwt() {
			var fn = framed() ? getFramed : getLocal;
			return fn.apply(fn, arguments);
		};

}, {
		"./framed": 10,
		"./local": 12,
		"frau-framed": 9
	}],
	12: [function (require, module, exports) {
		'use strict';

		var Promise = require('lie'),
			request = require('superagent'),
			xsrfToken = require('frau-superagent-xsrf-token');

		var DEFAULT_SCOPE = '*:*:*',
			TOKEN_ROUTE = '/d2l/lp/auth/oauth2/token';

		var CACHED_TOKENS = {},
			IN_FLIGHT_REQUESTS = {};

		function clock() {
			return (Date.now() / 1000) | 0;
		}

		function expired(token) {
			return module.exports._clock() > token.expires_at;
		}

		function cacheToken(scope, token) {
			CACHED_TOKENS[scope] = token;
		}

		function cachedToken(scope) {
			return Promise
				.resolve()
				.then(function () {
					var cached = CACHED_TOKENS[scope];
					if (cached) {
						if (!expired(cached)) {
							return cached.access_token;
						}

						delete CACHED_TOKENS[scope];
					}

					throw new Error('No cached token');
				});
		}

		function requestToken(scope) {
			return new Promise(function (resolve, reject) {
				request
					.post(TOKEN_ROUTE)
					.type('form')
					.send({
						scope: scope
					})
					.use(xsrfToken)
					.end(function (err, res) {
						if (err) {
							return reject(err);
						}

						resolve(res.body);
					});
			});
		}

		function requestTokenDeduped(scope) {
			if (!IN_FLIGHT_REQUESTS[scope]) {
				IN_FLIGHT_REQUESTS[scope] = requestToken(scope)
					.then(function (token) {
						delete IN_FLIGHT_REQUESTS[scope];
						return token;
					})
					.catch(function (e) {
						delete IN_FLIGHT_REQUESTS[scope];
						throw e;
					});
			}

			return IN_FLIGHT_REQUESTS[scope];
		}

		module.exports = function getLocalJwt(scope) {
			return Promise
				.resolve()
				.then(function () {
					scope = scope || DEFAULT_SCOPE;

					var cached = cachedToken.bind(null, scope);

					return cached()
						.catch(function () {
							return requestTokenDeduped(scope)
								.then(cacheToken.bind(null, scope))
								.then(cached);
						});
				});
		};

		module.exports._clock = clock;
		module.exports._resetCaches = function () {
			CACHED_TOKENS = {};
			IN_FLIGHT_REQUESTS = {};
		};

}, {
		"frau-superagent-xsrf-token": 14,
		"lie": 31,
		"superagent": 34
	}],
	13: [function (require, module, exports) {
		'use strict';

		module.exports = 'frau-jwt-new-jwt';

}, {}],
	14: [function (require, module, exports) {
		'use strict';

		var xsrfToken = require('frau-xsrf-token');

		var XSRF_HEADER = 'X-Csrf-Token';

		function noop() {}

		function isRelative /*ly safe*/ (url) {
			return typeof url === 'string' && url.length > 0 && url[0] === '/';
		}

		module.exports = function getXsrfToken(req) {
			var end = req.end;

			req.end = function getXsrfTokenEndOverride(cb) {
				function completeRequest() {
					req.end = end;
					return req.end(cb);
				}

				if (!isRelative(req.url)) {
					return completeRequest();
				}

				xsrfToken()
					.then(function (token) {
						req.set('X-Csrf-Token', token);
					})
					.catch(noop)
					.then(function () {
						// Run this async in another turn
						// So we don't catch errors with our promise
						setTimeout(completeRequest);
					});

				return this;
			};

			return req;
		};

}, {
		"frau-xsrf-token": 15
	}],
	15: [function (require, module, exports) {
		'use strict';

		var Promise = require('lie');

		var requestToken = require('./request-token'),
			storage = require('./storage');

		module.exports = function getXsrfToken() {
			return Promise
				.resolve()
				.then(storage.get)
				.then(function (token) {
					if (token) {
						return token;
					}

					return requestToken
						.get()
						.then(storage.set);
				});
		};

}, {
		"./request-token": 16,
		"./storage": 17,
		"lie": 31
	}],
	16: [function (require, module, exports) {
		'use strict';

		var Promise = require('lie'),
			request = require('superagent');

		var XSRF_TOKEN_PATH = '/d2l/lp/auth/xsrf-tokens';

		function requestXsrfToken() {
			return new Promise(function (resolve, reject) {
				request
					.get(XSRF_TOKEN_PATH)
					.end(function (err, res) {
						if (err) {
							return reject(err);
						}

						return resolve(res.body.referrerToken);
					});
			});
		}

		module.exports.get = requestXsrfToken;
		module.exports.XSRF_TOKEN_PATH = XSRF_TOKEN_PATH;

}, {
		"lie": 31,
		"superagent": 34
	}],
	17: [function (require, module, exports) {
		(function (global) {
			'use strict';

			var STORAGE_KEY = 'XSRF.Token';

			var fallback = null;

			function get(key) {
				if (global.localStorage) {
					try {
						return global.localStorage.getItem(key);
					} catch (e) {}
				}

				return fallback;
			}

			function set(key, value) {
				if (global.localStorage) {
					try {
						global.localStorage.setItem(key, value);
						return;
					} catch (e) {}
				}

				fallback = value;
			}

			module.exports.get = function getWrapper() {
				return get(STORAGE_KEY);
			};
			module.exports.set = function setWrapper(value) {
				set(STORAGE_KEY, value);
				return value;
			};
			module.exports._resetFallback = function resetFallback() {
				fallback = null;
			};

		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
	18: [function (require, module, exports) {
		'use strict';

		module.exports = require('./src/client');

}, {
		"./src/client": 19
	}],
	19: [function (require, module, exports) {
		'use strict';

		var inherits = require('inherits'),
			Promise = require('lie');

		var Port = require('./port'),
			syncLang = require('./plugins/sync-lang').client,
			syncTitle = require('./plugins/sync-title').client,
			syncFont = require('./plugins/sync-font').client;

		function Client(options) {
			if (!(this instanceof Client)) {
				return new Client(options);
			}

			options = options || {};

			Port.call(this, window.parent, '*', options);

			if (options.syncLang) {
				this.use(syncLang);
			}
			if (options.syncTitle !== false) {
				this.use(syncTitle);
			}
			if (options.syncFont) {
				this.use(syncFont);
			}
		}
		inherits(Client, Port);

		Client.prototype.connect = function connect() {
			var me = this;

			return new Promise(function (resolve /*, reject*/ ) {
				me.open();
				me._sendMessage('evt', 'ready');

				Port.prototype.connect.call(me);

				resolve(me);
			});
		};

		module.exports = Client;

}, {
		"./plugins/sync-font": 20,
		"./plugins/sync-lang": 21,
		"./plugins/sync-title": 22,
		"./port": 24,
		"inherits": 30,
		"lie": 31
	}],
	20: [function (require, module, exports) {
		'use strict';

		module.exports.client = function clientSyncFont(client) {
			return client.request('font').then(function (font) {
				document.body.style.fontFamily = font.family;
				document.body.style.fontSize = font.size;
			});
		};

		module.exports.host = function hostSyncFont(host) {
			host.onRequest('font', function () {
				var computedStyle = window.getComputedStyle(document.body);
				return {
					family: computedStyle.fontFamily,
					size: computedStyle.fontSize
				};
			});
		};

}, {}],
	21: [function (require, module, exports) {
		'use strict';

		module.exports.client = function clientSyncLang(client) {
			return client.request('lang').then(function (lang) {
				var htmlElem = document.getElementsByTagName('html')[0];
				htmlElem.setAttribute('lang', lang.lang);
				if (lang.fallback) {
					htmlElem.setAttribute('data-lang-default', lang.fallback);
				}
				if (lang.isRtl) {
					document.body.dir = 'rtl';
				}
			});
		};

		module.exports.host = function hostSyncLang(host) {
			host.onRequest('lang', function () {
				var htmlElem = document.getElementsByTagName('html')[0];
				var isRtl = (document.body.dir.toLowerCase() === 'rtl');
				return {
					isRtl: isRtl,
					lang: htmlElem.getAttribute('lang'),
					fallback: htmlElem.getAttribute('data-lang-default')
				};
			});
		};

}, {}],
	22: [function (require, module, exports) {
		'use strict';

		function installClientPolling(sync) {

			var title = '';

			setInterval(function () {
				var newTitle = document.title;
				if (newTitle !== title) {
					title = newTitle;
					sync(title);
				}
			}, 100);

		}

		function installClientMutation(sync) {

			var elem = document.querySelector('title');
			if (elem === null) {
				elem = document.createElement('title');
				document.getElementsByTagName('head')[0].appendChild(elem);
			}
			sync(document.title);

			var observer = new window.MutationObserver(function (mutations) {
				sync(mutations[0].target.textContent);
			});
			observer.observe(
				elem, {
					subtree: true,
					characterData: true,
					childList: true
				}
			);

		}

		module.exports.client = function clientSyncTitle(client) {

			function sync(value) {
				client.sendEvent('title', value);
			}

			if ('MutationObserver' in window) {
				installClientMutation(sync);
			} else {
				installClientPolling(sync);
			}
		};

		module.exports.host = function hostSyncTitle(options) {
			options = options || {};
			return function (host) {
				host.onEvent('title', function (title) {
					if (options.page) {
						document.title = title;
					}
					if (host.iframe) {
						host.iframe.title = title;
					}
				});
			};
		};

}, {}],
	23: [function (require, module, exports) {
		'use strict';

		var uuid = require('uuid');

		var validateEvent = require('./validate-event');

		function Port(endpoint, targetOrigin, options) {
			if (!(this instanceof Port)) {
				return new Port(endpoint, targetOrigin, options);
			}

			options = options || {};
			this._connectQueue = [];
			this._debugEnabled = options.debug || false;
			this._endpoint = endpoint;
			this._eventHandlers = {};
			this._isConnected = false;
			this._isOpen = false;
			this._messageHandlers = {};
			this._onCloseCallbacks = [];
			this._targetOrigin = targetOrigin;

			this._id = uuid();

			var me = this;
			this._onMessage('evt', function () {
				me._receiveEvent.apply(me, arguments);
			});
		}

		Port.prototype.close = function close() {
			if (!this._isOpen) {
				throw new Error('Port cannot be closed, call open() first');
			}
			this._isOpen = false;
			this._isConnected = false;
			window.removeEventListener('message', this._receiveMessage);
			this._onCloseCallbacks.forEach(function (cb) {
				cb();
			});
			this.debug('closed');
		};

		Port.prototype.connect = function connect() {
			this._isConnected = true;
			this.debug('connected');
			this._connectQueue.forEach(function (func) {
				func();
			});
			this._connectQueue = [];
			return this;
		};

		Port.prototype.debug = function debug(msg) {
			if (this._debugEnabled) {
				/* eslint-disable no-console */
				console.log(msg);
			}
		};

		Port.prototype._initHashArrAndPush = function initHashArrAndPush(dic, key, obj) {
			if (dic[key] === undefined) {
				dic[key] = [];
			}
			dic[key].push(obj);
		};

		Port.prototype.onClose = function onClose(cb) {
			this._onCloseCallbacks.push(cb);
		};

		Port.prototype.onEvent = function onEvent(eventType, handler) {
			this.debug('onEvent handler added for "' + eventType + '"');
			if (this._isConnected) {
				this.debug('You\'ve attached event handlers after connecting, you may have missed some events');
			}
			this._initHashArrAndPush(this._eventHandlers, eventType, handler);
			return this;
		};

		Port.prototype.open = function open() {
			if (this._isOpen) {
				throw new Error('Port is already open.');
			}
			this._isOpen = true;
			window.addEventListener('message', this._receiveMessage.bind(this), false);
			this.debug('opened');
			return this;
		};

		Port.prototype._receiveMessage = function receiveMessage(e) {
			if (!validateEvent(this._targetOrigin, this._endpoint, e)) {
				return;
			}

			var clazz = e.data.key.substr(5, 3);
			var key = e.data.key.substr(9);

			this.debug('received ' + clazz + '.' + key);

			var handler = this._messageHandlers[clazz];
			if (handler) {
				handler.call(this, key, e.data.payload);
			}
		};

		Port.prototype._onMessage = function onMessage(clazz, handler) {
			if (clazz.length !== 3) {
				throw new Error('message class name must be 3 characters');
			}

			this._messageHandlers[clazz] = handler;
		};

		Port.prototype._receiveEvent = function receiveEvent(eventType, payload) {
			if (this._eventHandlers[eventType] === undefined) {
				return;
			}
			this._eventHandlers[eventType].forEach(function (handler) {
				handler.apply(handler, payload);
			});
		};

		Port.prototype._sendMessage = function sendMessage(clazz, key, data) {
			var message = {
				key: 'frau.' + clazz + '.' + key,
				payload: data
			};
			this.debug('sending key: ' + message.key);
			this._endpoint.postMessage(message, this._targetOrigin);
			return this;
		};

		Port.prototype.sendEvent = function sendEvent(eventType) {
			var args = [];
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			if (!this._isConnected) {
				var me = this;
				this._connectQueue.push(function () {
					me._sendMessage('evt', eventType, args);
				});
				return this;
			}
			return this._sendMessage('evt', eventType, args);
		};

		Port.prototype.use = function use(fn) {
			fn(this);
			return this;
		};

		module.exports = Port;

}, {
		"./validate-event": 28,
		"uuid": 36
	}],
	24: [function (require, module, exports) {
		'use strict';

		module.exports = require('./services');

}, {
		"./services": 26
	}],
	25: [function (require, module, exports) {
		'use strict';

		var inherits = require('inherits'),
			Promise = require('lie');

		var Port = require('./base');

		var fromError = require('./transform-error').fromError,
			toError = require('./transform-error').toError;

		function PortWithRequests() {
			if (!(this instanceof PortWithRequests)) {
				return new PortWithRequests.apply(this, arguments);
			}

			Port.apply(this, arguments);

			this._pendingRequests = {};
			this._requestHandlers = {};
			this._requestCounter = 0;
			this._waitingRequests = [];

			var me = this;
			this._onMessage('req', function () {
				me._receiveRequest.apply(me, arguments);
			});
			this._onMessage('res', function () {
				me._receiveRequestResponse.apply(me, arguments);
			});
		}
		inherits(PortWithRequests, Port);

		PortWithRequests.prototype.request = function request(requestType) {
			var args = new Array(arguments.length - 1);
			for (var i = 1; i < arguments.length; ++i) {
				args[i - 1] = arguments[i];
			}

			var me = this;
			return new Promise(function (resolve, reject) {
				var counter = ++me._requestCounter;
				var id = me._id + '_' + counter;

				me._initHashArrAndPush(me._pendingRequests, requestType, {
					id: id,
					resolve: resolve,
					reject: reject
				});

				function finish() {
					me._sendMessage('req', requestType, {
						id: id,
						args: args
					});
				}

				if (!me._isConnected) {
					me._connectQueue.push(finish);
				} else {
					finish();
				}
			});
		};

		PortWithRequests.prototype.onRequest = function onRequest(requestType, handler) {
			if (this._isConnected) {
				throw new Error('Add request handlers before connecting');
			}

			if (this._requestHandlers[requestType] !== undefined) {
				throw new Error('Duplicate onRequest handler for type "' + requestType + '"');
			}

			this.debug('onRequest handler added for "' + requestType + '"');

			this._requestHandlers[requestType] = handler;

			// process requests we've received before adding handler, somehow
			this._sendRequestResponse(requestType);

			return this;
		};

		PortWithRequests.prototype._receiveRequest = function receiveRequest(requestType, payload) {
			this._initHashArrAndPush(this._waitingRequests, requestType, payload);
			this._sendRequestResponse(requestType);
		};

		PortWithRequests.prototype._sendRequestResponse = function sendRequestResponse(requestType) {
			var handler = this._requestHandlers[requestType];
			var waiting = this._waitingRequests[requestType];
			delete this._waitingRequests[requestType];

			if (handler === undefined || waiting === undefined || waiting.length === 0) {
				return;
			}

			var me = this;

			waiting.forEach(function (w) {
				Promise
					.resolve()
					.then(function () {
						if (typeof handler === 'function') {
							return handler.apply(handler, w.args);
						}

						// otherwise "handler" is a value / Promise
						return handler;
					})
					.then(function (val) {
						me._sendMessage('res', requestType, {
							id: w.id,
							val: val
						});
					})
					.catch(function (e) {
						var err = fromError(e);

						me._sendMessage('res', requestType, {
							id: w.id,
							err: err
						});
					});
			});
		};

		PortWithRequests.prototype._receiveRequestResponse = function receiveRequestResponse(requestType, payload) {
			var requests = this._pendingRequests[requestType];
			if (requests === undefined) {
				return;
			}

			// search for the request this response is for
			for (var i = 0; i < requests.length; ++i) {
				var req = requests[i];
				if (req.id !== payload.id) {
					continue;
				}

				if (payload.hasOwnProperty('err')) {
					var error = toError(payload.err);
					req.reject(error);
				} else {
					req.resolve(payload.val);
				}

				requests.splice(i, 1);
				return;
			}
		};

		module.exports = PortWithRequests;

}, {
		"./base": 23,
		"./transform-error": 27,
		"inherits": 30,
		"lie": 31
	}],
	26: [function (require, module, exports) {
		'use strict';

		var inherits = require('inherits');

		var PortWithRequests = require('./requests');

		var typeNameValidator = /^[a-zA-Z]+[a-zA-Z\-]*$/;

		function PortWithServices() {
			if (!(this instanceof PortWithServices)) {
				return new PortWithServices.apply(this, arguments);
			}

			PortWithRequests.apply(this, arguments);
		}
		inherits(PortWithServices, PortWithRequests);

		PortWithServices.prototype.getService = function getService(sericeType, version) {
			if (!this._isConnected) {
				throw new Error('Cannot getService() before connect() has completed');
			}

			var serviceVersionPrefix = 'service:' + sericeType + ':' + version;
			var me = this;

			function createProxy(methodNames) {
				function createProxyMethod(name) {
					return function () {
						var args = new Array(arguments.length + 1);
						args[0] = serviceVersionPrefix + ':' + name;
						for (var i = 0; i < arguments.length; ++i) {
							args[i + 1] = arguments[i];
						}

						return me.request.apply(me, args);
					};
				}

				var proxy = {};
				methodNames.forEach(function (name) {
					proxy[name] = createProxyMethod(name);
				});
				return proxy;
			}

			return me
				.request(serviceVersionPrefix)
				.then(createProxy);
		};

		PortWithServices.prototype.registerService = function registerService(serviceType, version, service) {
			if (this._isConnected) {
				throw new Error('Register services before connecting');
			}

			if (!typeNameValidator.test(serviceType)) {
				throw new Error('Invalid service type "' + serviceType + '"');
			}

			var serviceVersionPrefix = 'service:' + serviceType + ':' + version;

			var methodNames = Object
				.keys(service)
				.filter(function (k) {
					return typeof service[k] === 'function';
				});

			this.onRequest(serviceVersionPrefix, methodNames);

			var me = this;
			methodNames.forEach(function (name) {
				me.onRequest(serviceVersionPrefix + ':' + name, service[name]);
			});

			return this;
		};

		module.exports = PortWithServices;

}, {
		"./requests": 25,
		"inherits": 30
	}],
	27: [function (require, module, exports) {
		'use strict';

		var ERROR_OBJECT_SENTINEL = '_ifrau-error-object';

		function deErrorifyArray(input) {
			var result = input.map(deErrorify);
			return result;
		}

		function errorifyArray(input) {
			var result = input.map(errorify);
			return result;
		}

		function deErrorifyObject(input) {
			var isError = input instanceof Error;
			var result = isError ? {
				props: {}
			} : {};

			if (isError) {
				result.message = input.message;
				result.name = input.name;

				result[ERROR_OBJECT_SENTINEL] = true;
			}

			var propTarget = isError ? result.props : result;

			Object.keys(input).forEach(function (key) {
				var prop = deErrorify(input[key]);

				propTarget[key] = prop;
			});

			return result;
		}

		function errorifyObject(input) {
			var isError = input[ERROR_OBJECT_SENTINEL] === true;

			var result = isError ? new Error(input.message) : {};

			if (isError) {
				result.name = input.name;
			}

			var propSource = isError ? input.props : input;
			Object.keys(propSource).forEach(function (key) {
				var prop = errorify(propSource[key]);

				result[key] = prop;
			});

			return result;
		}

		function deErrorify(input) {
			if (input !== null && typeof input === 'object') {
				if (Array.isArray(input)) {
					return deErrorifyArray(input);
				}

				return deErrorifyObject(input);
			}

			if (typeof input === 'function') {
				// Not much to be done here :(
				return null;
			}

			return input;
		}

		function errorify(input) {
			if (input !== null && typeof input === 'object') {
				if (Array.isArray(input)) {
					return errorifyArray(input);
				}

				return errorifyObject(input);
			}

			return input;
		}

		module.exports.ERROR_OBJECT_SENTINEL = ERROR_OBJECT_SENTINEL;
		module.exports.fromError = deErrorify;
		module.exports.toError = errorify;

}, {}],
	28: [function (require, module, exports) {
		'use strict';

		function isStringEmpty(str) {
			return (!str || 0 === str.length);
		}

		function validateEvent(targetOrigin, endpoint, e) {
			var isValid = (e.source === endpoint) && (
				targetOrigin === '*' || !isStringEmpty(targetOrigin) && !isStringEmpty(e.origin) && targetOrigin.toUpperCase() === e.origin.toUpperCase()
			) && (e.data.key !== undefined) && (e.data.key !== null) && (e.data.key.indexOf('frau.') === 0);
			return isValid;
		}

		module.exports = validateEvent;

}, {}],
	29: [function (require, module, exports) {
		(function (global) {
			'use strict';
			var Mutation = global.MutationObserver || global.WebKitMutationObserver;

			var scheduleDrain;

			{
				if (Mutation) {
					var called = 0;
					var observer = new Mutation(nextTick);
					var element = global.document.createTextNode('');
					observer.observe(element, {
						characterData: true
					});
					scheduleDrain = function () {
						element.data = (called = ++called % 2);
					};
				} else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
					var channel = new global.MessageChannel();
					channel.port1.onmessage = nextTick;
					scheduleDrain = function () {
						channel.port2.postMessage(0);
					};
				} else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
					scheduleDrain = function () {

						// Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
						// into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
						var scriptEl = global.document.createElement('script');
						scriptEl.onreadystatechange = function () {
							nextTick();

							scriptEl.onreadystatechange = null;
							scriptEl.parentNode.removeChild(scriptEl);
							scriptEl = null;
						};
						global.document.documentElement.appendChild(scriptEl);
					};
				} else {
					scheduleDrain = function () {
						setTimeout(nextTick, 0);
					};
				}
			}

			var draining;
			var queue = [];
			//named nextTick for less confusing stack traces
			function nextTick() {
				draining = true;
				var i, oldQueue;
				var len = queue.length;
				while (len) {
					oldQueue = queue;
					queue = [];
					i = -1;
					while (++i < len) {
						oldQueue[i]();
					}
					len = queue.length;
				}
				draining = false;
			}

			module.exports = immediate;

			function immediate(task) {
				if (queue.push(task) === 1 && !draining) {
					scheduleDrain();
				}
			}

		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
	30: [function (require, module, exports) {
		if (typeof Object.create === 'function') {
			// implementation from standard node.js 'util' module
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor
				ctor.prototype = Object.create(superCtor.prototype, {
					constructor: {
						value: ctor,
						enumerable: false,
						writable: true,
						configurable: true
					}
				});
			};
		} else {
			// old school shim for old browsers
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor
				var TempCtor = function () {}
				TempCtor.prototype = superCtor.prototype
				ctor.prototype = new TempCtor()
				ctor.prototype.constructor = ctor
			}
		}

}, {}],
	31: [function (require, module, exports) {
		'use strict';
		var immediate = require('immediate');

		/* istanbul ignore next */
		function INTERNAL() {}

		var handlers = {};

		var REJECTED = ['REJECTED'];
		var FULFILLED = ['FULFILLED'];
		var PENDING = ['PENDING'];

		module.exports = exports = Promise;

		function Promise(resolver) {
			if (typeof resolver !== 'function') {
				throw new TypeError('resolver must be a function');
			}
			this.state = PENDING;
			this.queue = [];
			this.outcome = void 0;
			if (resolver !== INTERNAL) {
				safelyResolveThenable(this, resolver);
			}
		}

		Promise.prototype["catch"] = function (onRejected) {
			return this.then(null, onRejected);
		};
		Promise.prototype.then = function (onFulfilled, onRejected) {
			if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
				typeof onRejected !== 'function' && this.state === REJECTED) {
				return this;
			}
			var promise = new this.constructor(INTERNAL);
			if (this.state !== PENDING) {
				var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
				unwrap(promise, resolver, this.outcome);
			} else {
				this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
			}

			return promise;
		};

		function QueueItem(promise, onFulfilled, onRejected) {
			this.promise = promise;
			if (typeof onFulfilled === 'function') {
				this.onFulfilled = onFulfilled;
				this.callFulfilled = this.otherCallFulfilled;
			}
			if (typeof onRejected === 'function') {
				this.onRejected = onRejected;
				this.callRejected = this.otherCallRejected;
			}
		}
		QueueItem.prototype.callFulfilled = function (value) {
			handlers.resolve(this.promise, value);
		};
		QueueItem.prototype.otherCallFulfilled = function (value) {
			unwrap(this.promise, this.onFulfilled, value);
		};
		QueueItem.prototype.callRejected = function (value) {
			handlers.reject(this.promise, value);
		};
		QueueItem.prototype.otherCallRejected = function (value) {
			unwrap(this.promise, this.onRejected, value);
		};

		function unwrap(promise, func, value) {
			immediate(function () {
				var returnValue;
				try {
					returnValue = func(value);
				} catch (e) {
					return handlers.reject(promise, e);
				}
				if (returnValue === promise) {
					handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
				} else {
					handlers.resolve(promise, returnValue);
				}
			});
		}

		handlers.resolve = function (self, value) {
			var result = tryCatch(getThen, value);
			if (result.status === 'error') {
				return handlers.reject(self, result.value);
			}
			var thenable = result.value;

			if (thenable) {
				safelyResolveThenable(self, thenable);
			} else {
				self.state = FULFILLED;
				self.outcome = value;
				var i = -1;
				var len = self.queue.length;
				while (++i < len) {
					self.queue[i].callFulfilled(value);
				}
			}
			return self;
		};
		handlers.reject = function (self, error) {
			self.state = REJECTED;
			self.outcome = error;
			var i = -1;
			var len = self.queue.length;
			while (++i < len) {
				self.queue[i].callRejected(error);
			}
			return self;
		};

		function getThen(obj) {
			// Make sure we only access the accessor once as required by the spec
			var then = obj && obj.then;
			if (obj && typeof obj === 'object' && typeof then === 'function') {
				return function appyThen() {
					then.apply(obj, arguments);
				};
			}
		}

		function safelyResolveThenable(self, thenable) {
			// Either fulfill, reject or reject with error
			var called = false;

			function onError(value) {
				if (called) {
					return;
				}
				called = true;
				handlers.reject(self, value);
			}

			function onSuccess(value) {
				if (called) {
					return;
				}
				called = true;
				handlers.resolve(self, value);
			}

			function tryToUnwrap() {
				thenable(onSuccess, onError);
			}

			var result = tryCatch(tryToUnwrap);
			if (result.status === 'error') {
				onError(result.value);
			}
		}

		function tryCatch(func, value) {
			var out = {};
			try {
				out.value = func(value);
				out.status = 'success';
			} catch (e) {
				out.status = 'error';
				out.value = e;
			}
			return out;
		}

		exports.resolve = resolve;

		function resolve(value) {
			if (value instanceof this) {
				return value;
			}
			return handlers.resolve(new this(INTERNAL), value);
		}

		exports.reject = reject;

		function reject(reason) {
			var promise = new this(INTERNAL);
			return handlers.reject(promise, reason);
		}

		exports.all = all;

		function all(iterable) {
			var self = this;
			if (Object.prototype.toString.call(iterable) !== '[object Array]') {
				return this.reject(new TypeError('must be an array'));
			}

			var len = iterable.length;
			var called = false;
			if (!len) {
				return this.resolve([]);
			}

			var values = new Array(len);
			var resolved = 0;
			var i = -1;
			var promise = new this(INTERNAL);

			while (++i < len) {
				allResolver(iterable[i], i);
			}
			return promise;

			function allResolver(value, i) {
				self.resolve(value).then(resolveFromAll, function (error) {
					if (!called) {
						called = true;
						handlers.reject(promise, error);
					}
				});

				function resolveFromAll(outValue) {
					values[i] = outValue;
					if (++resolved === len && !called) {
						called = true;
						handlers.resolve(promise, values);
					}
				}
			}
		}

		exports.race = race;

		function race(iterable) {
			var self = this;
			if (Object.prototype.toString.call(iterable) !== '[object Array]') {
				return this.reject(new TypeError('must be an array'));
			}

			var len = iterable.length;
			var called = false;
			if (!len) {
				return this.resolve([]);
			}

			var i = -1;
			var promise = new this(INTERNAL);

			while (++i < len) {
				resolver(iterable[i]);
			}
			return promise;

			function resolver(value) {
				self.resolve(value).then(function (response) {
					if (!called) {
						called = true;
						handlers.resolve(promise, response);
					}
				}, function (error) {
					if (!called) {
						called = true;
						handlers.reject(promise, error);
					}
				});
			}
		}

}, {
		"immediate": 29
	}],
	32: [function (require, module, exports) {

		/**
		 * Reduce `arr` with `fn`.
		 *
		 * @param {Array} arr
		 * @param {Function} fn
		 * @param {Mixed} initial
		 *
		 * TODO: combatible error handling?
		 */

		module.exports = function (arr, fn, initial) {
			var idx = 0;
			var len = arr.length;
			var curr = arguments.length == 3 ? initial : arr[idx++];

			while (idx < len) {
				curr = fn.call(null, curr, arr[idx], ++idx, arr);
			}

			return curr;
		};
}, {}],
	33: [function (require, module, exports) {
		'use strict';

		var getJwt = require('frau-jwt'),
			url = require('url'),
			xsrf = require('frau-superagent-xsrf-token');

		function noop() {}

		function isRelative /*ly safe*/ (url) {
			return url.hostname === null;
		}

		function endsWith(haystack, needle) {
			var expectedPosition = haystack.length - needle.length;
			var lastIndex = haystack.indexOf(needle, expectedPosition);
			var result = lastIndex !== -1 && lastIndex === expectedPosition;
			return result;
		}

		function isBrightspaceApi(url) {
			return url.protocol === 'https:' && (url.hostname === 'api.brightspace.com' || endsWith(url.hostname, '.api.brightspace.com'));
		}

		function isTrustedHost(url, trustedHost) {
			return typeof trustedHost === 'string' && url.host === trustedHost.toLowerCase();
		}

		function isTrusted(parsed, trustedHost) {
			return isBrightspaceApi(parsed) || isTrustedHost(parsed, trustedHost);
		}

		module.exports = function (opts) {
			opts = opts || {};

			return function (req) {
				req = req.use(xsrf);

				var end = req.end;
				req.end = function (cb) {
					function finish() {
						req.end = end;
						req.end(cb);
					}

					var parsed = url.parse(req.url);

					if (isRelative(parsed) || !isTrusted(parsed, opts.trustedHost)) {
						finish();
						return this;
					}

					getJwt(opts.scope)
						.then(function (token) {
							req.set('Authorization', 'Bearer ' + token);
						})
						.catch(noop)
						.then(function () {
							// Run this async in another turn
							// So we don't catch errors with our Promise
							setTimeout(finish);
						});

					return this;
				};

				return req;
			};
		};

}, {
		"frau-jwt": 11,
		"frau-superagent-xsrf-token": 14,
		"url": 5
	}],
	34: [function (require, module, exports) {
		/**
		 * Module dependencies.
		 */

		var Emitter = require('emitter');
		var reduce = require('reduce');

		/**
		 * Root reference for iframes.
		 */

		var root;
		if (typeof window !== 'undefined') { // Browser window
			root = window;
		} else if (typeof self !== 'undefined') { // Web Worker
			root = self;
		} else { // Other environments
			root = this;
		}

		/**
		 * Noop.
		 */

		function noop() {};

		/**
		 * Check if `obj` is a host object,
		 * we don't want to serialize these :)
		 *
		 * TODO: future proof, move to compoent land
		 *
		 * @param {Object} obj
		 * @return {Boolean}
		 * @api private
		 */

		function isHost(obj) {
			var str = {}.toString.call(obj);

			switch (str) {
				case '[object File]':
				case '[object Blob]':
				case '[object FormData]':
					return true;
				default:
					return false;
			}
		}

		/**
		 * Determine XHR.
		 */

		request.getXHR = function () {
			if (root.XMLHttpRequest && (!root.location || 'file:' != root.location.protocol || !root.ActiveXObject)) {
				return new XMLHttpRequest;
			} else {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
				} catch (e) {}
				try {
					return new ActiveXObject('Msxml2.XMLHTTP.6.0');
				} catch (e) {}
				try {
					return new ActiveXObject('Msxml2.XMLHTTP.3.0');
				} catch (e) {}
				try {
					return new ActiveXObject('Msxml2.XMLHTTP');
				} catch (e) {}
			}
			return false;
		};

		/**
		 * Removes leading and trailing whitespace, added to support IE.
		 *
		 * @param {String} s
		 * @return {String}
		 * @api private
		 */

		var trim = ''.trim ? function (s) {
			return s.trim();
		} : function (s) {
			return s.replace(/(^\s*|\s*$)/g, '');
		};

		/**
		 * Check if `obj` is an object.
		 *
		 * @param {Object} obj
		 * @return {Boolean}
		 * @api private
		 */

		function isObject(obj) {
			return obj === Object(obj);
		}

		/**
		 * Serialize the given `obj`.
		 *
		 * @param {Object} obj
		 * @return {String}
		 * @api private
		 */

		function serialize(obj) {
			if (!isObject(obj)) return obj;
			var pairs = [];
			for (var key in obj) {
				if (null != obj[key]) {
					pushEncodedKeyValuePair(pairs, key, obj[key]);
				}
			}
			return pairs.join('&');
		}

		/**
		 * Helps 'serialize' with serializing arrays.
		 * Mutates the pairs array.
		 *
		 * @param {Array} pairs
		 * @param {String} key
		 * @param {Mixed} val
		 */

		function pushEncodedKeyValuePair(pairs, key, val) {
			if (Array.isArray(val)) {
				return val.forEach(function (v) {
					pushEncodedKeyValuePair(pairs, key, v);
				});
			}
			pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
		}

		/**
		 * Expose serialization method.
		 */

		request.serializeObject = serialize;

		/**
		 * Parse the given x-www-form-urlencoded `str`.
		 *
		 * @param {String} str
		 * @return {Object}
		 * @api private
		 */

		function parseString(str) {
			var obj = {};
			var pairs = str.split('&');
			var parts;
			var pair;

			for (var i = 0, len = pairs.length; i < len; ++i) {
				pair = pairs[i];
				parts = pair.split('=');
				obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
			}

			return obj;
		}

		/**
		 * Expose parser.
		 */

		request.parseString = parseString;

		/**
		 * Default MIME type map.
		 *
		 *     superagent.types.xml = 'application/xml';
		 *
		 */

		request.types = {
			html: 'text/html',
			json: 'application/json',
			xml: 'application/xml',
			urlencoded: 'application/x-www-form-urlencoded',
			'form': 'application/x-www-form-urlencoded',
			'form-data': 'application/x-www-form-urlencoded'
		};

		/**
		 * Default serialization map.
		 *
		 *     superagent.serialize['application/xml'] = function(obj){
		 *       return 'generated xml here';
		 *     };
		 *
		 */

		request.serialize = {
			'application/x-www-form-urlencoded': serialize,
			'application/json': JSON.stringify
		};

		/**
		 * Default parsers.
		 *
		 *     superagent.parse['application/xml'] = function(str){
		 *       return { object parsed from str };
		 *     };
		 *
		 */

		request.parse = {
			'application/x-www-form-urlencoded': parseString,
			'application/json': JSON.parse
		};

		/**
		 * Parse the given header `str` into
		 * an object containing the mapped fields.
		 *
		 * @param {String} str
		 * @return {Object}
		 * @api private
		 */

		function parseHeader(str) {
			var lines = str.split(/\r?\n/);
			var fields = {};
			var index;
			var line;
			var field;
			var val;

			lines.pop(); // trailing CRLF

			for (var i = 0, len = lines.length; i < len; ++i) {
				line = lines[i];
				index = line.indexOf(':');
				field = line.slice(0, index).toLowerCase();
				val = trim(line.slice(index + 1));
				fields[field] = val;
			}

			return fields;
		}

		/**
		 * Check if `mime` is json or has +json structured syntax suffix.
		 *
		 * @param {String} mime
		 * @return {Boolean}
		 * @api private
		 */

		function isJSON(mime) {
			return /[\/+]json\b/.test(mime);
		}

		/**
		 * Return the mime type for the given `str`.
		 *
		 * @param {String} str
		 * @return {String}
		 * @api private
		 */

		function type(str) {
			return str.split(/ *; */).shift();
		};

		/**
		 * Return header field parameters.
		 *
		 * @param {String} str
		 * @return {Object}
		 * @api private
		 */

		function params(str) {
			return reduce(str.split(/ *; */), function (obj, str) {
				var parts = str.split(/ *= */),
					key = parts.shift(),
					val = parts.shift();

				if (key && val) obj[key] = val;
				return obj;
			}, {});
		};

		/**
		 * Initialize a new `Response` with the given `xhr`.
		 *
		 *  - set flags (.ok, .error, etc)
		 *  - parse header
		 *
		 * Examples:
		 *
		 *  Aliasing `superagent` as `request` is nice:
		 *
		 *      request = superagent;
		 *
		 *  We can use the promise-like API, or pass callbacks:
		 *
		 *      request.get('/').end(function(res){});
		 *      request.get('/', function(res){});
		 *
		 *  Sending data can be chained:
		 *
		 *      request
		 *        .post('/user')
		 *        .send({ name: 'tj' })
		 *        .end(function(res){});
		 *
		 *  Or passed to `.send()`:
		 *
		 *      request
		 *        .post('/user')
		 *        .send({ name: 'tj' }, function(res){});
		 *
		 *  Or passed to `.post()`:
		 *
		 *      request
		 *        .post('/user', { name: 'tj' })
		 *        .end(function(res){});
		 *
		 * Or further reduced to a single call for simple cases:
		 *
		 *      request
		 *        .post('/user', { name: 'tj' }, function(res){});
		 *
		 * @param {XMLHTTPRequest} xhr
		 * @param {Object} options
		 * @api private
		 */

		function Response(req, options) {
			options = options || {};
			this.req = req;
			this.xhr = this.req.xhr;
			// responseText is accessible only if responseType is '' or 'text' and on older browsers
			this.text = ((this.req.method != 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined') ? this.xhr.responseText : null;
			this.statusText = this.req.xhr.statusText;
			this.setStatusProperties(this.xhr.status);
			this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
			// getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
			// getResponseHeader still works. so we get content-type even if getting
			// other headers fails.
			this.header['content-type'] = this.xhr.getResponseHeader('content-type');
			this.setHeaderProperties(this.header);
			this.body = this.req.method != 'HEAD' ? this.parseBody(this.text ? this.text : this.xhr.response) : null;
		}

		/**
		 * Get case-insensitive `field` value.
		 *
		 * @param {String} field
		 * @return {String}
		 * @api public
		 */

		Response.prototype.get = function (field) {
			return this.header[field.toLowerCase()];
		};

		/**
		 * Set header related properties:
		 *
		 *   - `.type` the content type without params
		 *
		 * A response of "Content-Type: text/plain; charset=utf-8"
		 * will provide you with a `.type` of "text/plain".
		 *
		 * @param {Object} header
		 * @api private
		 */

		Response.prototype.setHeaderProperties = function (header) {
			// content-type
			var ct = this.header['content-type'] || '';
			this.type = type(ct);

			// params
			var obj = params(ct);
			for (var key in obj) this[key] = obj[key];
		};

		/**
		 * Parse the given body `str`.
		 *
		 * Used for auto-parsing of bodies. Parsers
		 * are defined on the `superagent.parse` object.
		 *
		 * @param {String} str
		 * @return {Mixed}
		 * @api private
		 */

		Response.prototype.parseBody = function (str) {
			var parse = request.parse[this.type];
			return parse && str && (str.length || str instanceof Object) ? parse(str) : null;
		};

		/**
		 * Set flags such as `.ok` based on `status`.
		 *
		 * For example a 2xx response will give you a `.ok` of __true__
		 * whereas 5xx will be __false__ and `.error` will be __true__. The
		 * `.clientError` and `.serverError` are also available to be more
		 * specific, and `.statusType` is the class of error ranging from 1..5
		 * sometimes useful for mapping respond colors etc.
		 *
		 * "sugar" properties are also defined for common cases. Currently providing:
		 *
		 *   - .noContent
		 *   - .badRequest
		 *   - .unauthorized
		 *   - .notAcceptable
		 *   - .notFound
		 *
		 * @param {Number} status
		 * @api private
		 */

		Response.prototype.setStatusProperties = function (status) {
			// handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
			if (status === 1223) {
				status = 204;
			}

			var type = status / 100 | 0;

			// status / class
			this.status = this.statusCode = status;
			this.statusType = type;

			// basics
			this.info = 1 == type;
			this.ok = 2 == type;
			this.clientError = 4 == type;
			this.serverError = 5 == type;
			this.error = (4 == type || 5 == type) ? this.toError() : false;

			// sugar
			this.accepted = 202 == status;
			this.noContent = 204 == status;
			this.badRequest = 400 == status;
			this.unauthorized = 401 == status;
			this.notAcceptable = 406 == status;
			this.notFound = 404 == status;
			this.forbidden = 403 == status;
		};

		/**
		 * Return an `Error` representative of this response.
		 *
		 * @return {Error}
		 * @api public
		 */

		Response.prototype.toError = function () {
			var req = this.req;
			var method = req.method;
			var url = req.url;

			var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
			var err = new Error(msg);
			err.status = this.status;
			err.method = method;
			err.url = url;

			return err;
		};

		/**
		 * Expose `Response`.
		 */

		request.Response = Response;

		/**
		 * Initialize a new `Request` with the given `method` and `url`.
		 *
		 * @param {String} method
		 * @param {String} url
		 * @api public
		 */

		function Request(method, url) {
			var self = this;
			Emitter.call(this);
			this._query = this._query || [];
			this.method = method;
			this.url = url;
			this.header = {};
			this._header = {};
			this.on('end', function () {
				var err = null;
				var res = null;

				try {
					res = new Response(self);
				} catch (e) {
					err = new Error('Parser is unable to parse the response');
					err.parse = true;
					err.original = e;
					// issue #675: return the raw response if the response parsing fails
					err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
					return self.callback(err);
				}

				self.emit('response', res);

				if (err) {
					return self.callback(err, res);
				}

				if (res.status >= 200 && res.status < 300) {
					return self.callback(err, res);
				}

				var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
				new_err.original = err;
				new_err.response = res;
				new_err.status = res.status;

				self.callback(new_err, res);
			});
		}

		/**
		 * Mixin `Emitter`.
		 */

		Emitter(Request.prototype);

		/**
		 * Allow for extension
		 */

		Request.prototype.use = function (fn) {
			fn(this);
			return this;
		}

		/**
		 * Set timeout to `ms`.
		 *
		 * @param {Number} ms
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.timeout = function (ms) {
			this._timeout = ms;
			return this;
		};

		/**
		 * Clear previous timeout.
		 *
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.clearTimeout = function () {
			this._timeout = 0;
			clearTimeout(this._timer);
			return this;
		};

		/**
		 * Abort the request, and clear potential timeout.
		 *
		 * @return {Request}
		 * @api public
		 */

		Request.prototype.abort = function () {
			if (this.aborted) return;
			this.aborted = true;
			this.xhr.abort();
			this.clearTimeout();
			this.emit('abort');
			return this;
		};

		/**
		 * Set header `field` to `val`, or multiple fields with one object.
		 *
		 * Examples:
		 *
		 *      req.get('/')
		 *        .set('Accept', 'application/json')
		 *        .set('X-API-Key', 'foobar')
		 *        .end(callback);
		 *
		 *      req.get('/')
		 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
		 *        .end(callback);
		 *
		 * @param {String|Object} field
		 * @param {String} val
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.set = function (field, val) {
			if (isObject(field)) {
				for (var key in field) {
					this.set(key, field[key]);
				}
				return this;
			}
			this._header[field.toLowerCase()] = val;
			this.header[field] = val;
			return this;
		};

		/**
		 * Remove header `field`.
		 *
		 * Example:
		 *
		 *      req.get('/')
		 *        .unset('User-Agent')
		 *        .end(callback);
		 *
		 * @param {String} field
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.unset = function (field) {
			delete this._header[field.toLowerCase()];
			delete this.header[field];
			return this;
		};

		/**
		 * Get case-insensitive header `field` value.
		 *
		 * @param {String} field
		 * @return {String}
		 * @api private
		 */

		Request.prototype.getHeader = function (field) {
			return this._header[field.toLowerCase()];
		};

		/**
		 * Set Content-Type to `type`, mapping values from `request.types`.
		 *
		 * Examples:
		 *
		 *      superagent.types.xml = 'application/xml';
		 *
		 *      request.post('/')
		 *        .type('xml')
		 *        .send(xmlstring)
		 *        .end(callback);
		 *
		 *      request.post('/')
		 *        .type('application/xml')
		 *        .send(xmlstring)
		 *        .end(callback);
		 *
		 * @param {String} type
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.type = function (type) {
			this.set('Content-Type', request.types[type] || type);
			return this;
		};

		/**
		 * Force given parser
		 *
		 * Sets the body parser no matter type.
		 *
		 * @param {Function}
		 * @api public
		 */

		Request.prototype.parse = function (fn) {
			this._parser = fn;
			return this;
		};

		/**
		 * Set Accept to `type`, mapping values from `request.types`.
		 *
		 * Examples:
		 *
		 *      superagent.types.json = 'application/json';
		 *
		 *      request.get('/agent')
		 *        .accept('json')
		 *        .end(callback);
		 *
		 *      request.get('/agent')
		 *        .accept('application/json')
		 *        .end(callback);
		 *
		 * @param {String} accept
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.accept = function (type) {
			this.set('Accept', request.types[type] || type);
			return this;
		};

		/**
		 * Set Authorization field value with `user` and `pass`.
		 *
		 * @param {String} user
		 * @param {String} pass
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.auth = function (user, pass) {
			var str = btoa(user + ':' + pass);
			this.set('Authorization', 'Basic ' + str);
			return this;
		};

		/**
		 * Add query-string `val`.
		 *
		 * Examples:
		 *
		 *   request.get('/shoes')
		 *     .query('size=10')
		 *     .query({ color: 'blue' })
		 *
		 * @param {Object|String} val
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.query = function (val) {
			if ('string' != typeof val) val = serialize(val);
			if (val) this._query.push(val);
			return this;
		};

		/**
		 * Write the field `name` and `val` for "multipart/form-data"
		 * request bodies.
		 *
		 * ``` js
		 * request.post('/upload')
		 *   .field('foo', 'bar')
		 *   .end(callback);
		 * ```
		 *
		 * @param {String} name
		 * @param {String|Blob|File} val
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.field = function (name, val) {
			if (!this._formData) this._formData = new root.FormData();
			this._formData.append(name, val);
			return this;
		};

		/**
		 * Queue the given `file` as an attachment to the specified `field`,
		 * with optional `filename`.
		 *
		 * ``` js
		 * request.post('/upload')
		 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
		 *   .end(callback);
		 * ```
		 *
		 * @param {String} field
		 * @param {Blob|File} file
		 * @param {String} filename
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.attach = function (field, file, filename) {
			if (!this._formData) this._formData = new root.FormData();
			this._formData.append(field, file, filename || file.name);
			return this;
		};

		/**
		 * Send `data` as the request body, defaulting the `.type()` to "json" when
		 * an object is given.
		 *
		 * Examples:
		 *
		 *       // manual json
		 *       request.post('/user')
		 *         .type('json')
		 *         .send('{"name":"tj"}')
		 *         .end(callback)
		 *
		 *       // auto json
		 *       request.post('/user')
		 *         .send({ name: 'tj' })
		 *         .end(callback)
		 *
		 *       // manual x-www-form-urlencoded
		 *       request.post('/user')
		 *         .type('form')
		 *         .send('name=tj')
		 *         .end(callback)
		 *
		 *       // auto x-www-form-urlencoded
		 *       request.post('/user')
		 *         .type('form')
		 *         .send({ name: 'tj' })
		 *         .end(callback)
		 *
		 *       // defaults to x-www-form-urlencoded
		 *      request.post('/user')
		 *        .send('name=tobi')
		 *        .send('species=ferret')
		 *        .end(callback)
		 *
		 * @param {String|Object} data
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.send = function (data) {
			var obj = isObject(data);
			var type = this.getHeader('Content-Type');

			// merge
			if (obj && isObject(this._data)) {
				for (var key in data) {
					this._data[key] = data[key];
				}
			} else if ('string' == typeof data) {
				if (!type) this.type('form');
				type = this.getHeader('Content-Type');
				if ('application/x-www-form-urlencoded' == type) {
					this._data = this._data ? this._data + '&' + data : data;
				} else {
					this._data = (this._data || '') + data;
				}
			} else {
				this._data = data;
			}

			if (!obj || isHost(data)) return this;
			if (!type) this.type('json');
			return this;
		};

		/**
		 * Invoke the callback with `err` and `res`
		 * and handle arity check.
		 *
		 * @param {Error} err
		 * @param {Response} res
		 * @api private
		 */

		Request.prototype.callback = function (err, res) {
			var fn = this._callback;
			this.clearTimeout();
			fn(err, res);
		};

		/**
		 * Invoke callback with x-domain error.
		 *
		 * @api private
		 */

		Request.prototype.crossDomainError = function () {
			var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
			err.crossDomain = true;

			err.status = this.status;
			err.method = this.method;
			err.url = this.url;

			this.callback(err);
		};

		/**
		 * Invoke callback with timeout error.
		 *
		 * @api private
		 */

		Request.prototype.timeoutError = function () {
			var timeout = this._timeout;
			var err = new Error('timeout of ' + timeout + 'ms exceeded');
			err.timeout = timeout;
			this.callback(err);
		};

		/**
		 * Enable transmission of cookies with x-domain requests.
		 *
		 * Note that for this to work the origin must not be
		 * using "Access-Control-Allow-Origin" with a wildcard,
		 * and also must set "Access-Control-Allow-Credentials"
		 * to "true".
		 *
		 * @api public
		 */

		Request.prototype.withCredentials = function () {
			this._withCredentials = true;
			return this;
		};

		/**
		 * Initiate request, invoking callback `fn(res)`
		 * with an instanceof `Response`.
		 *
		 * @param {Function} fn
		 * @return {Request} for chaining
		 * @api public
		 */

		Request.prototype.end = function (fn) {
			var self = this;
			var xhr = this.xhr = request.getXHR();
			var query = this._query.join('&');
			var timeout = this._timeout;
			var data = this._formData || this._data;

			// store callback
			this._callback = fn || noop;

			// state change
			xhr.onreadystatechange = function () {
				if (4 != xhr.readyState) return;

				// In IE9, reads to any property (e.g. status) off of an aborted XHR will
				// result in the error "Could not complete the operation due to error c00c023f"
				var status;
				try {
					status = xhr.status
				} catch (e) {
					status = 0;
				}

				if (0 == status) {
					if (self.timedout) return self.timeoutError();
					if (self.aborted) return;
					return self.crossDomainError();
				}
				self.emit('end');
			};

			// progress
			var handleProgress = function (e) {
				if (e.total > 0) {
					e.percent = e.loaded / e.total * 100;
				}
				e.direction = 'download';
				self.emit('progress', e);
			};
			if (this.hasListeners('progress')) {
				xhr.onprogress = handleProgress;
			}
			try {
				if (xhr.upload && this.hasListeners('progress')) {
					xhr.upload.onprogress = handleProgress;
				}
			} catch (e) {
				// Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
				// Reported here:
				// https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
			}

			// timeout
			if (timeout && !this._timer) {
				this._timer = setTimeout(function () {
					self.timedout = true;
					self.abort();
				}, timeout);
			}

			// querystring
			if (query) {
				query = request.serializeObject(query);
				this.url += ~this.url.indexOf('?') ? '&' + query : '?' + query;
			}

			// initiate request
			xhr.open(this.method, this.url, true);

			// CORS
			if (this._withCredentials) xhr.withCredentials = true;

			// body
			if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
				// serialize stuff
				var contentType = this.getHeader('Content-Type');
				var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
				if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
				if (serialize) data = serialize(data);
			}

			// set header fields
			for (var field in this.header) {
				if (null == this.header[field]) continue;
				xhr.setRequestHeader(field, this.header[field]);
			}

			// send stuff
			this.emit('request', this);

			// IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
			// We need null here if data is undefined
			xhr.send(typeof data !== 'undefined' ? data : null);
			return this;
		};

		/**
		 * Faux promise support
		 *
		 * @param {Function} fulfill
		 * @param {Function} reject
		 * @return {Request}
		 */

		Request.prototype.then = function (fulfill, reject) {
			return this.end(function (err, res) {
				err ? reject(err) : fulfill(res);
			});
		}

		/**
		 * Expose `Request`.
		 */

		request.Request = Request;

		/**
		 * Issue a request:
		 *
		 * Examples:
		 *
		 *    request('GET', '/users').end(callback)
		 *    request('/users').end(callback)
		 *    request('/users', callback)
		 *
		 * @param {String} method
		 * @param {String|Function} url or callback
		 * @return {Request}
		 * @api public
		 */

		function request(method, url) {
			// callback
			if ('function' == typeof url) {
				return new Request('GET', method).end(url);
			}

			// url first
			if (1 == arguments.length) {
				return new Request('GET', method);
			}

			return new Request(method, url);
		}

		/**
		 * GET `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		request.get = function (url, data, fn) {
			var req = request('GET', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.query(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * HEAD `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		request.head = function (url, data, fn) {
			var req = request('HEAD', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * DELETE `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		function del(url, fn) {
			var req = request('DELETE', url);
			if (fn) req.end(fn);
			return req;
		};

		request['del'] = del;
		request['delete'] = del;

		/**
		 * PATCH `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed} data
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		request.patch = function (url, data, fn) {
			var req = request('PATCH', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * POST `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed} data
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		request.post = function (url, data, fn) {
			var req = request('POST', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * PUT `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */

		request.put = function (url, data, fn) {
			var req = request('PUT', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * Expose `request`.
		 */

		module.exports = request;

}, {
		"emitter": 8,
		"reduce": 32
	}],
	35: [function (require, module, exports) {
		(function (global) {

			var rng;

			if (global.crypto && crypto.getRandomValues) {
				// WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
				// Moderately fast, high quality
				var _rnds8 = new Uint8Array(16);
				rng = function whatwgRNG() {
					crypto.getRandomValues(_rnds8);
					return _rnds8;
				};
			}

			if (!rng) {
				// Math.random()-based (RNG)
				//
				// If all else fails, use Math.random().  It's fast, but is of unspecified
				// quality.
				var _rnds = new Array(16);
				rng = function () {
					for (var i = 0, r; i < 16; i++) {
						if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
						_rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
					}

					return _rnds;
				};
			}

			module.exports = rng;


		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
	36: [function (require, module, exports) {
		//     uuid.js
		//
		//     Copyright (c) 2010-2012 Robert Kieffer
		//     MIT License - http://opensource.org/licenses/mit-license.php

		// Unique ID creation requires a high quality random # generator.  We feature
		// detect to determine the best RNG source, normalizing to a function that
		// returns 128-bits of randomness, since that's what's usually required
		var _rng = require('./rng');

		// Maps for number <-> hex string conversion
		var _byteToHex = [];
		var _hexToByte = {};
		for (var i = 0; i < 256; i++) {
			_byteToHex[i] = (i + 0x100).toString(16).substr(1);
			_hexToByte[_byteToHex[i]] = i;
		}

		// **`parse()` - Parse a UUID into it's component bytes**
		function parse(s, buf, offset) {
			var i = (buf && offset) || 0,
				ii = 0;

			buf = buf || [];
			s.toLowerCase().replace(/[0-9a-f]{2}/g, function (oct) {
				if (ii < 16) { // Don't overflow!
					buf[i + ii++] = _hexToByte[oct];
				}
			});

			// Zero out remaining bytes if string was short
			while (ii < 16) {
				buf[i + ii++] = 0;
			}

			return buf;
		}

		// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
		function unparse(buf, offset) {
			var i = offset || 0,
				bth = _byteToHex;
			return bth[buf[i++]] + bth[buf[i++]] +
				bth[buf[i++]] + bth[buf[i++]] + '-' +
				bth[buf[i++]] + bth[buf[i++]] + '-' +
				bth[buf[i++]] + bth[buf[i++]] + '-' +
				bth[buf[i++]] + bth[buf[i++]] + '-' +
				bth[buf[i++]] + bth[buf[i++]] +
				bth[buf[i++]] + bth[buf[i++]] +
				bth[buf[i++]] + bth[buf[i++]];
		}

		// **`v1()` - Generate time-based UUID**
		//
		// Inspired by https://github.com/LiosK/UUID.js
		// and http://docs.python.org/library/uuid.html

		// random #'s we need to init node and clockseq
		var _seedBytes = _rng();

		// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
		var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

		// Per 4.2.2, randomize (14 bit) clockseq
		var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

		// Previous uuid creation time
		var _lastMSecs = 0,
			_lastNSecs = 0;

		// See https://github.com/broofa/node-uuid for API details
		function v1(options, buf, offset) {
			var i = buf && offset || 0;
			var b = buf || [];

			options = options || {};

			var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

			// UUID timestamps are 100 nano-second units since the Gregorian epoch,
			// (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
			// time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
			// (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
			var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

			// Per 4.2.1.2, use count of uuid's generated during the current clock
			// cycle to simulate higher resolution clock
			var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

			// Time since last uuid creation (in msecs)
			var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs) / 10000;

			// Per 4.2.1.2, Bump clockseq on clock regression
			if (dt < 0 && options.clockseq === undefined) {
				clockseq = clockseq + 1 & 0x3fff;
			}

			// Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
			// time interval
			if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
				nsecs = 0;
			}

			// Per 4.2.1.2 Throw error if too many uuids are requested
			if (nsecs >= 10000) {
				throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
			}

			_lastMSecs = msecs;
			_lastNSecs = nsecs;
			_clockseq = clockseq;

			// Per 4.1.4 - Convert from unix epoch to Gregorian epoch
			msecs += 12219292800000;

			// `time_low`
			var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
			b[i++] = tl >>> 24 & 0xff;
			b[i++] = tl >>> 16 & 0xff;
			b[i++] = tl >>> 8 & 0xff;
			b[i++] = tl & 0xff;

			// `time_mid`
			var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
			b[i++] = tmh >>> 8 & 0xff;
			b[i++] = tmh & 0xff;

			// `time_high_and_version`
			b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
			b[i++] = tmh >>> 16 & 0xff;

			// `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
			b[i++] = clockseq >>> 8 | 0x80;

			// `clock_seq_low`
			b[i++] = clockseq & 0xff;

			// `node`
			var node = options.node || _nodeId;
			for (var n = 0; n < 6; n++) {
				b[i + n] = node[n];
			}

			return buf ? buf : unparse(b);
		}

		// **`v4()` - Generate random UUID**

		// See https://github.com/broofa/node-uuid for API details
		function v4(options, buf, offset) {
			// Deprecated - 'format' argument, as supported in v1.2
			var i = buf && offset || 0;

			if (typeof (options) == 'string') {
				buf = options == 'binary' ? new Array(16) : null;
				options = null;
			}
			options = options || {};

			var rnds = options.random || (options.rng || _rng)();

			// Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
			rnds[6] = (rnds[6] & 0x0f) | 0x40;
			rnds[8] = (rnds[8] & 0x3f) | 0x80;

			// Copy bytes to buffer, if provided
			if (buf) {
				for (var ii = 0; ii < 16; ii++) {
					buf[i + ii] = rnds[ii];
				}
			}

			return buf || unparse(rnds);
		}

		// Export public API
		var uuid = v4;
		uuid.v1 = v1;
		uuid.v4 = v4;
		uuid.parse = parse;
		uuid.unparse = unparse;

		module.exports = uuid;

}, {
		"./rng": 35
	}]
}, {}, [7]);