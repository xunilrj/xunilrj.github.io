import { c as createCommonjsModule, a as commonjsGlobal } from './common/commonjsHelpers-38687f85.js';

/**
 * @module parenthesis
 */

function parse(str, opts) {
	// pretend non-string parsed per-se
	if (typeof str !== 'string') return [str]

	var res = [str];

	if (typeof opts === 'string' || Array.isArray(opts)) {
		opts = { brackets: opts };
	}
	else if (!opts) opts = {};

	var brackets = opts.brackets ? (Array.isArray(opts.brackets) ? opts.brackets : [opts.brackets]) : ['{}', '[]', '()'];

	var escape = opts.escape || '___';

	var flat = !!opts.flat;

	brackets.forEach(function (bracket) {
		// create parenthesis regex
		var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

		var ids = [];

		function replaceToken(token, idx, str) {
			// save token to res
			var refId = res.push(token.slice(bracket[0].length, -bracket[1].length)) - 1;

			ids.push(refId);

			return escape + refId + escape
		}

		res.forEach(function (str, i) {
			var prevStr;

			// replace paren tokens till there’s none
			var a = 0;
			while (str != prevStr) {
				prevStr = str;
				str = str.replace(pRE, replaceToken);
				if (a++ > 10e3) throw Error('References have circular dependency. Please, check them.')
			}

			res[i] = str;
		});

		// wrap found refs to brackets
		ids = ids.reverse();
		res = res.map(function (str) {
			ids.forEach(function (id) {
				str = str.replace(new RegExp('(\\' + escape + id + '\\' + escape + ')', 'g'), bracket[0] + '$1' + bracket[1]);
			});
			return str
		});
	});

	var re = new RegExp('\\' + escape + '([0-9]+)' + '\\' + escape);

	// transform references to tree
	function nest(str, refs, escape) {
		var res = [], match;

		var a = 0;
		while (match = re.exec(str)) {
			if (a++ > 10e3) throw Error('Circular references in parenthesis')

			res.push(str.slice(0, match.index));

			res.push(nest(refs[match[1]], refs));

			str = str.slice(match.index + match[0].length);
		}

		res.push(str);

		return res
	}

	return flat ? res : nest(res[0], res)
}

function stringify(arg, opts) {
	if (opts && opts.flat) {
		var escape = opts && opts.escape || '___';

		var str = arg[0], prevStr;

		// pretend bad string stringified with no parentheses
		if (!str) return ''


		var re = new RegExp('\\' + escape + '([0-9]+)' + '\\' + escape);

		var a = 0;
		while (str != prevStr) {
			if (a++ > 10e3) throw Error('Circular references in ' + arg)
			prevStr = str;
			str = str.replace(re, replaceRef);
		}

		return str
	}

	return arg.reduce(function f(prev, curr) {
		if (Array.isArray(curr)) {
			curr = curr.reduce(f, '');
		}
		return prev + curr
	}, '')

	function replaceRef(match, idx) {
		if (arg[idx] == null) throw Error('Reference ' + idx + 'is undefined')
		return arg[idx]
	}
}

function parenthesis(arg, opts) {
	if (Array.isArray(arg)) {
		return stringify(arg, opts)
	}
	else {
		return parse(arg, opts)
	}
}

parenthesis.parse = parse;
parenthesis.stringify = stringify;

var parenthesis_1 = parenthesis;

var balancedMatch = balanced;
function balanced(a, b, str) {
	var r = range(a, b, str);

	return r && {
		start: r[0],
		end: r[1],
		pre: str.slice(0, r[0]),
		body: str.slice(r[0] + a.length, r[1]),
		post: str.slice(r[1] + b.length)
	};
}

balanced.range = range;
function range(a, b, str) {
	var begs, beg, left, right, result;
	var ai = str.indexOf(a);
	var bi = str.indexOf(b, ai + 1);
	var i = ai;

	if (ai >= 0 && bi > 0) {
		begs = [];
		left = str.length;

		while (i < str.length && i >= 0 && !result) {
			if (i == ai) {
				begs.push(i);
				ai = str.indexOf(a, i + 1);
			} else if (begs.length == 1) {
				result = [begs.pop(), bi];
			} else {
				beg = begs.pop();
				if (beg < left) {
					left = beg;
					right = bi;
				}

				bi = str.indexOf(b, i + 1);
			}

			i = ai < bi && ai >= 0 ? ai : bi;
		}

		if (begs.length) {
			result = [left, right];
		}
	}

	return result;
}

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
			'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var escaper = createCommonjsModule(function (module, exports) {
	/*!
	 * Escaper v2.5.3
	 * https://github.com/kobezzza/Escaper
	 *
	 * Released under the MIT license
	 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
	 *
	 * Date: Tue, 23 Jan 2018 15:58:45 GMT
	 */

	(function (global, factory) {
		factory(exports);
	}(commonjsGlobal, (function (exports) {
		var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
			return typeof obj;
		} : function (obj) {
			return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
		};

		var Escaper = void 0;
		var escaper = Escaper = {
			VERSION: [2, 5, 3],
			content: [],
			cache: {},
			snakeskinRgxp: null,
			symbols: null,
			replace: replace,
			paste: paste
		};

		var stringLiterals = {
			'"': true,
			'\'': true,
			'`': true
		};

		var literals = {
			'/': true
		};

		for (var key in stringLiterals) {
			if (!stringLiterals.hasOwnProperty(key)) {
				break;
			}

			literals[key] = true;
		}

		var singleComments = {
			'//': true,
			'//*': true,
			'//!': true,
			'//#': true,
			'//@': true,
			'//$': true
		};

		var multComments = {
			'/*': true,
			'/**': true,
			'/*!': true,
			'/*#': true,
			'/*@': true,
			'/*$': true
		};

		var keyArr = [];
		var finalMap = {};

		for (var _key in literals) {
			if (!literals.hasOwnProperty(_key)) {
				break;
			}

			keyArr.push(_key);
			finalMap[_key] = true;
		}

		for (var _key2 in singleComments) {
			if (!singleComments.hasOwnProperty(_key2)) {
				break;
			}

			keyArr.push(_key2);
			finalMap[_key2] = true;
		}

		for (var _key3 in multComments) {
			if (!multComments.hasOwnProperty(_key3)) {
				break;
			}

			keyArr.push(_key3);
			finalMap[_key3] = true;
		}

		var rgxpFlags = [];
		var rgxpFlagsMap = {
			'g': true,
			'm': true,
			'i': true,
			'y': true,
			'u': true
		};

		for (var _key4 in rgxpFlagsMap) {
			if (!rgxpFlagsMap.hasOwnProperty(_key4)) {
				break;
			}

			rgxpFlags.push(_key4);
		}

		var escapeEndMap = {
			'-': true,
			'+': true,
			'*': true,
			'%': true,
			'~': true,
			'>': true,
			'<': true,
			'^': true,
			',': true,
			';': true,
			'=': true,
			'|': true,
			'&': true,
			'!': true,
			'?': true,
			':': true,
			'(': true,
			'{': true,
			'[': true
		};

		var escapeEndWordMap = {
			'return': true,
			'yield': true,
			'await': true,
			'typeof': true,
			'void': true,
			'instanceof': true,
			'delete': true,
			'in': true,
			'new': true,
			'of': true
		};

		/**
		 * @param {!Object} obj
		 * @param {!Object} p
		 * @param {(boolean|number)} val
		 */
		function mix(obj, p, val) {
			for (var _key5 in obj) {
				if (!obj.hasOwnProperty(_key5)) {
					break;
				}

				if (_key5 in p === false) {
					p[_key5] = val;
				}
			}
		}

		var symbols = void 0;
		var snakeskinRgxp = void 0;

		var uSRgxp = /[^\s/]/;
		var wRgxp = /[a-z]/;
		var sRgxp = /\s/;
		var nRgxp = /[\r\n]/;
		var posRgxp = /\${pos}/g;

		var objMap = {
			'object': true,
			'function': true
		};

		/**
		 * Replaces all found blocks ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ to
		 * __ESCAPER_QUOT__number_ in a string and returns a new string
		 *
		 * @param {string} str - source string
		 * @param {(Object<string, boolean>|boolean)=} [opt_withCommentsOrParams=false] - parameters:
		 *
		 *     (if a parameter value is set to -1, then all found matches will be removed from the final string,
		 *          or if the value will be set to true/false they will be included/excluded)
		 *
		 *     *) @label    - template for replacement, e.g. __ESCAPER_QUOT__${pos}_
		 *     *) @all      - replaces all found matches
		 *     *) @comments - replaces all kinds of comments
		 *     *) @strings  - replaces all kinds of string literals
		 *     *) @literals - replaces all kinds of string literals and regular expressions
		 *     *) `
		 *     *) '
		 *     *) "
		 *     *) /
		 *     *) //
		 *     *) //*
		 *     *) //!
		 *     *) //#
		 *     *) //@
		 *     *) //$
		 *     *) /*
		 *     *) /**
		 *     *) /*!
		 *     *) /*#
		 *     *) /*@
		 *     *) /*$
		 *
		 *     OR if the value is boolean, then will be replaced all found comments (true) / literals (false)
		 *
		 * @param {Array=} [opt_content=Escaper.content] - array for matches
		 * @param {?boolean=} [opt_snakeskin] - private parameter for using with Snakeskin
		 * @return {string}
		 */
		function replace(str, opt_withCommentsOrParams, opt_content, opt_snakeskin) {
			symbols = symbols || Escaper.symbols || 'a-z';
			snakeskinRgxp = snakeskinRgxp || Escaper.snakeskinRgxp || new RegExp('[!$' + symbols + '_]', 'i');

			var _Escaper = Escaper,
				cache = _Escaper.cache,
				content = _Escaper.content;


			var isObj = Boolean(opt_withCommentsOrParams && objMap[typeof opt_withCommentsOrParams === 'undefined' ? 'undefined' : _typeof(opt_withCommentsOrParams)]);

			var p = isObj ? Object(opt_withCommentsOrParams) : {};

			function mark(pos) {
				if (p['@label']) {
					return p['@label'].replace(posRgxp, pos);
				}

				return '__ESCAPER_QUOT__' + pos + '_';
			}

			var withComments = false;
			if (typeof opt_withCommentsOrParams === 'boolean') {
				withComments = Boolean(opt_withCommentsOrParams);
			}

			if ('@comments' in p) {
				mix(multComments, p, p['@comments']);
				mix(singleComments, p, p['@comments']);
				delete p['@comments'];
			}

			if ('@strings' in p) {
				mix(stringLiterals, p, p['@strings']);
				delete p['@strings'];
			}

			if ('@literals' in p) {
				mix(literals, p, p['@literals']);
				delete p['@literals'];
			}

			if ('@all' in p) {
				mix(finalMap, p, p['@all']);
				delete p['@all'];
			}

			var cacheKey = '';
			for (var i = -1; ++i < keyArr.length;) {
				var el = keyArr[i];

				if (multComments[el] || singleComments[el]) {
					p[el] = withComments || p[el];
				} else {
					p[el] = p[el] || !isObj;
				}

				cacheKey += p[el] + ',';
			}

			var initStr = str,
				stack = opt_content || content;

			if (stack === content && cache[cacheKey] && cache[cacheKey][initStr]) {
				return cache[cacheKey][initStr];
			}

			var begin = false,
				end = true;

			var escape = false,
				comment = false;

			var selectionStart = 0,
				block = false;

			var templateVar = 0,
				filterStart = false;

			var cut = void 0,
				label = void 0;

			var part = '',
				rPart = '';

			for (var _i = -1; ++_i < str.length;) {
				var _el = str.charAt(_i);

				var next = str.charAt(_i + 1),
					word = str.substr(_i, 2),
					extWord = str.substr(_i, 3);

				if (!comment) {
					if (!begin) {
						if (_el === '/') {
							if (singleComments[word] || multComments[word]) {
								if (singleComments[extWord] || multComments[extWord]) {
									comment = extWord;
								} else {
									comment = word;
								}
							}

							if (comment) {
								selectionStart = _i;
								continue;
							}
						}

						if (escapeEndMap[_el] || escapeEndWordMap[rPart]) {
							end = true;
							rPart = '';
						} else if (uSRgxp.test(_el)) {
							end = false;
						}

						if (wRgxp.test(_el)) {
							part += _el;
						} else {
							rPart = part;
							part = '';
						}

						var skip = false;
						if (opt_snakeskin) {
							if (_el === '|' && snakeskinRgxp.test(next)) {
								filterStart = true;
								end = false;
								skip = true;
							} else if (filterStart && sRgxp.test(_el)) {
								filterStart = false;
								end = true;
								skip = true;
							}
						}

						if (!skip) {
							if (escapeEndMap[_el]) {
								end = true;
							} else if (uSRgxp.test(_el)) {
								end = false;
							}
						}
					}

					// [] inside RegExp
					if (begin === '/' && !escape) {
						if (_el === '[') {
							block = true;
						} else if (_el === ']') {
							block = false;
						}
					}

					if (!begin && templateVar) {
						if (_el === '}') {
							templateVar--;
						} else if (_el === '{') {
							templateVar++;
						}

						if (!templateVar) {
							_el = '`';
						}
					}

					if (begin === '`' && !escape && word === '${') {
						_el = '`';
						_i++;
						templateVar++;
					}

					if (finalMap[_el] && (_el !== '/' || end) && !begin) {
						begin = _el;
						selectionStart = _i;
					} else if (begin && (_el === '\\' || escape)) {
						escape = !escape;
					} else if (finalMap[_el] && begin === _el && !escape && (begin !== '/' || !block)) {
						if (_el === '/') {
							for (var j = -1; ++j < rgxpFlags.length;) {
								if (rgxpFlagsMap[str.charAt(_i + 1)]) {
									_i++;
								}
							}
						}

						begin = false;
						end = false;

						if (p[_el]) {
							cut = str.substring(selectionStart, _i + 1);

							if (p[_el] === -1) {
								label = '';
							} else {
								label = mark(stack.length);
								stack.push(cut);
							}

							str = str.substring(0, selectionStart) + label + str.substring(_i + 1);
							_i += label.length - cut.length;
						}
					}
				} else if (nRgxp.test(next) && singleComments[comment] || multComments[_el + str.charAt(_i - 1)] && _i - selectionStart > 2 && multComments[comment]) {
					if (p[comment]) {
						cut = str.substring(selectionStart, _i + 1);

						if (p[comment] === -1) {
							label = '';
						} else {
							label = mark(stack.length);
							stack.push(cut);
						}

						str = str.substring(0, selectionStart) + label + str.substring(_i + 1);
						_i += label.length - cut.length;
					}

					comment = false;
				}
			}

			if (stack === content) {
				cache[cacheKey] = cache[cacheKey] || {};
				cache[cacheKey][initStr] = str;
			}

			return str;
		}

		var pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;

		/**
		 * Replaces all found blocks __ESCAPER_QUOT__number_ to real content in a string
		 * and returns a new string
		 *
		 * @param {string} str - source string
		 * @param {Array=} [opt_content=Escaper.content] - array of matches
		 * @param {RegExp=} [opt_rgxp] - RegExp for searching, e.g. /__ESCAPER_QUOT__(\d+)_/g
		 * @return {string}
		 */
		function paste(str, opt_content, opt_rgxp) {
			return str.replace(opt_rgxp || pasteRgxp, function (str, pos) {
				return (opt_content || Escaper.content)[pos];
			});
		}

		exports['default'] = escaper;
		exports.replace = replace;
		exports.paste = paste;

		Object.defineProperty(exports, '__esModule', { value: true });

	})));
});

var jsep = createCommonjsModule(function (module, exports) {
	//     JavaScript Expression Parser (JSEP) 0.3.4
	//     JSEP may be freely distributed under the MIT License
	//     http://jsep.from.so/

	/*global module: true, exports: true, console: true */
	(function (root) {
		// Node Types
		// ----------

		// This is the full set of types that any JSEP node can be.
		// Store them here to save space when minified
		var COMPOUND = 'Compound',
			IDENTIFIER = 'Identifier',
			MEMBER_EXP = 'MemberExpression',
			LITERAL = 'Literal',
			THIS_EXP = 'ThisExpression',
			CALL_EXP = 'CallExpression',
			UNARY_EXP = 'UnaryExpression',
			BINARY_EXP = 'BinaryExpression',
			LOGICAL_EXP = 'LogicalExpression',
			CONDITIONAL_EXP = 'ConditionalExpression',
			ARRAY_EXP = 'ArrayExpression',

			PERIOD_CODE = 46, // '.'
			COMMA_CODE = 44, // ','
			SQUOTE_CODE = 39, // single quote
			DQUOTE_CODE = 34, // double quotes
			OPAREN_CODE = 40, // (
			CPAREN_CODE = 41, // )
			OBRACK_CODE = 91, // [
			CBRACK_CODE = 93, // ]
			QUMARK_CODE = 63, // ?
			SEMCOL_CODE = 59, // ;
			COLON_CODE = 58, // :

			throwError = function (message, index) {
				var error = new Error(message + ' at character ' + index);
				error.index = index;
				error.description = message;
				throw error;
			},

			// Operations
			// ----------

			// Set `t` to `true` to save space (when minified, not gzipped)
			t = true,
			// Use a quickly-accessible map to store all of the unary operators
			// Values are set to `true` (it really doesn't matter)
			unary_ops = { '-': t, '!': t, '~': t, '+': t },
			// Also use a map for the binary operations but set their values to their
			// binary precedence for quick reference:
			// see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
			binary_ops = {
				'||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
				'==': 6, '!=': 6, '===': 6, '!==': 6,
				'<': 7, '>': 7, '<=': 7, '>=': 7,
				'<<': 8, '>>': 8, '>>>': 8,
				'+': 9, '-': 9,
				'*': 10, '/': 10, '%': 10
			},
			// Get return the longest key length of any object
			getMaxKeyLen = function (obj) {
				var max_len = 0, len;
				for (var key in obj) {
					if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
						max_len = len;
					}
				}
				return max_len;
			},
			max_unop_len = getMaxKeyLen(unary_ops),
			max_binop_len = getMaxKeyLen(binary_ops),
			// Literals
			// ----------
			// Store the values to return for the various literals we may encounter
			literals = {
				'true': true,
				'false': false,
				'null': null
			},
			// Except for `this`, which is special. This could be changed to something like `'self'` as well
			this_str = 'this',
			// Returns the precedence of a binary operator or `0` if it isn't a binary operator
			binaryPrecedence = function (op_val) {
				return binary_ops[op_val] || 0;
			},
			// Utility function (gets called from multiple places)
			// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
			createBinaryExpression = function (operator, left, right) {
				var type = (operator === '||' || operator === '&&') ? LOGICAL_EXP : BINARY_EXP;
				return {
					type: type,
					operator: operator,
					left: left,
					right: right
				};
			},
			// `ch` is a character code in the next three functions
			isDecimalDigit = function (ch) {
				return (ch >= 48 && ch <= 57); // 0...9
			},
			isIdentifierStart = function (ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
					(ch >= 65 && ch <= 90) || // A...Z
					(ch >= 97 && ch <= 122) || // a...z
					(ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
			},
			isIdentifierPart = function (ch) {
				return (ch === 36) || (ch === 95) || // `$` and `_`
					(ch >= 65 && ch <= 90) || // A...Z
					(ch >= 97 && ch <= 122) || // a...z
					(ch >= 48 && ch <= 57) || // 0...9
					(ch >= 128 && !binary_ops[String.fromCharCode(ch)]); // any non-ASCII that is not an operator
			},

			// Parsing
			// -------
			// `expr` is a string with the passed in expression
			jsep = function (expr) {
				// `index` stores the character number we are currently at while `length` is a constant
				// All of the gobbles below will modify `index` as we move along
				var index = 0,
					charAtFunc = expr.charAt,
					charCodeAtFunc = expr.charCodeAt,
					exprI = function (i) { return charAtFunc.call(expr, i); },
					exprICode = function (i) { return charCodeAtFunc.call(expr, i); },
					length = expr.length,

					// Push `index` up to the next non-space character
					gobbleSpaces = function () {
						var ch = exprICode(index);
						// space or tab
						while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
							ch = exprICode(++index);
						}
					},

					// The main parsing function. Much of this code is dedicated to ternary expressions
					gobbleExpression = function () {
						var test = gobbleBinaryExpression(),
							consequent, alternate;
						gobbleSpaces();
						if (exprICode(index) === QUMARK_CODE) {
							// Ternary expression: test ? consequent : alternate
							index++;
							consequent = gobbleExpression();
							if (!consequent) {
								throwError('Expected expression', index);
							}
							gobbleSpaces();
							if (exprICode(index) === COLON_CODE) {
								index++;
								alternate = gobbleExpression();
								if (!alternate) {
									throwError('Expected expression', index);
								}
								return {
									type: CONDITIONAL_EXP,
									test: test,
									consequent: consequent,
									alternate: alternate
								};
							} else {
								throwError('Expected :', index);
							}
						} else {
							return test;
						}
					},

					// Search for the operation portion of the string (e.g. `+`, `===`)
					// Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
					// and move down from 3 to 2 to 1 character until a matching binary operation is found
					// then, return that binary operation
					gobbleBinaryOp = function () {
						gobbleSpaces();
						var to_check = expr.substr(index, max_binop_len), tc_len = to_check.length;
						while (tc_len > 0) {
							// Don't accept a binary op when it is an identifier.
							// Binary ops that start with a identifier-valid character must be followed
							// by a non identifier-part valid character
							if (binary_ops.hasOwnProperty(to_check) && (
								!isIdentifierStart(exprICode(index)) ||
								(index + to_check.length < expr.length && !isIdentifierPart(exprICode(index + to_check.length)))
							)) {
								index += tc_len;
								return to_check;
							}
							to_check = to_check.substr(0, --tc_len);
						}
						return false;
					},

					// This function is responsible for gobbling an individual expression,
					// e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
					gobbleBinaryExpression = function () {
						var node, biop, prec, stack, biop_info, left, right, i;

						// First, try to get the leftmost thing
						// Then, check to see if there's a binary operator operating on that leftmost thing
						left = gobbleToken();
						biop = gobbleBinaryOp();

						// If there wasn't a binary operator, just return the leftmost node
						if (!biop) {
							return left;
						}

						// Otherwise, we need to start a stack to properly place the binary operations in their
						// precedence structure
						biop_info = { value: biop, prec: binaryPrecedence(biop) };

						right = gobbleToken();
						if (!right) {
							throwError("Expected expression after " + biop, index);
						}
						stack = [left, biop_info, right];

						// Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
						while ((biop = gobbleBinaryOp())) {
							prec = binaryPrecedence(biop);

							if (prec === 0) {
								break;
							}
							biop_info = { value: biop, prec: prec };

							// Reduce: make a binary expression from the three topmost entries.
							while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
								right = stack.pop();
								biop = stack.pop().value;
								left = stack.pop();
								node = createBinaryExpression(biop, left, right);
								stack.push(node);
							}

							node = gobbleToken();
							if (!node) {
								throwError("Expected expression after " + biop, index);
							}
							stack.push(biop_info, node);
						}

						i = stack.length - 1;
						node = stack[i];
						while (i > 1) {
							node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
							i -= 2;
						}
						return node;
					},

					// An individual part of a binary expression:
					// e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
					gobbleToken = function () {
						var ch, to_check, tc_len;

						gobbleSpaces();
						ch = exprICode(index);

						if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
							// Char code 46 is a dot `.` which can start off a numeric literal
							return gobbleNumericLiteral();
						} else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
							// Single or double quotes
							return gobbleStringLiteral();
						} else if (ch === OBRACK_CODE) {
							return gobbleArray();
						} else {
							to_check = expr.substr(index, max_unop_len);
							tc_len = to_check.length;
							while (tc_len > 0) {
								// Don't accept an unary op when it is an identifier.
								// Unary ops that start with a identifier-valid character must be followed
								// by a non identifier-part valid character
								if (unary_ops.hasOwnProperty(to_check) && (
									!isIdentifierStart(exprICode(index)) ||
									(index + to_check.length < expr.length && !isIdentifierPart(exprICode(index + to_check.length)))
								)) {
									index += tc_len;
									return {
										type: UNARY_EXP,
										operator: to_check,
										argument: gobbleToken(),
										prefix: true
									};
								}
								to_check = to_check.substr(0, --tc_len);
							}

							if (isIdentifierStart(ch) || ch === OPAREN_CODE) { // open parenthesis
								// `foo`, `bar.baz`
								return gobbleVariable();
							}
						}

						return false;
					},
					// Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
					// keep track of everything in the numeric literal and then calling `parseFloat` on that string
					gobbleNumericLiteral = function () {
						var number = '', ch, chCode;
						while (isDecimalDigit(exprICode(index))) {
							number += exprI(index++);
						}

						if (exprICode(index) === PERIOD_CODE) { // can start with a decimal marker
							number += exprI(index++);

							while (isDecimalDigit(exprICode(index))) {
								number += exprI(index++);
							}
						}

						ch = exprI(index);
						if (ch === 'e' || ch === 'E') { // exponent marker
							number += exprI(index++);
							ch = exprI(index);
							if (ch === '+' || ch === '-') { // exponent sign
								number += exprI(index++);
							}
							while (isDecimalDigit(exprICode(index))) { //exponent itself
								number += exprI(index++);
							}
							if (!isDecimalDigit(exprICode(index - 1))) {
								throwError('Expected exponent (' + number + exprI(index) + ')', index);
							}
						}


						chCode = exprICode(index);
						// Check to make sure this isn't a variable name that start with a number (123abc)
						if (isIdentifierStart(chCode)) {
							throwError('Variable names cannot start with a number (' +
								number + exprI(index) + ')', index);
						} else if (chCode === PERIOD_CODE) {
							throwError('Unexpected period', index);
						}

						return {
							type: LITERAL,
							value: parseFloat(number),
							raw: number
						};
					},

					// Parses a string literal, staring with single or double quotes with basic support for escape codes
					// e.g. `"hello world"`, `'this is\nJSEP'`
					gobbleStringLiteral = function () {
						var str = '', quote = exprI(index++), closed = false, ch;

						while (index < length) {
							ch = exprI(index++);
							if (ch === quote) {
								closed = true;
								break;
							} else if (ch === '\\') {
								// Check for all of the common escape codes
								ch = exprI(index++);
								switch (ch) {
									case 'n': str += '\n'; break;
									case 'r': str += '\r'; break;
									case 't': str += '\t'; break;
									case 'b': str += '\b'; break;
									case 'f': str += '\f'; break;
									case 'v': str += '\x0B'; break;
									default: str += ch;
								}
							} else {
								str += ch;
							}
						}

						if (!closed) {
							throwError('Unclosed quote after "' + str + '"', index);
						}

						return {
							type: LITERAL,
							value: str,
							raw: quote + str + quote
						};
					},

					// Gobbles only identifiers
					// e.g.: `foo`, `_value`, `$x1`
					// Also, this function checks if that identifier is a literal:
					// (e.g. `true`, `false`, `null`) or `this`
					gobbleIdentifier = function () {
						var ch = exprICode(index), start = index, identifier;

						if (isIdentifierStart(ch)) {
							index++;
						} else {
							throwError('Unexpected ' + exprI(index), index);
						}

						while (index < length) {
							ch = exprICode(index);
							if (isIdentifierPart(ch)) {
								index++;
							} else {
								break;
							}
						}
						identifier = expr.slice(start, index);

						if (literals.hasOwnProperty(identifier)) {
							return {
								type: LITERAL,
								value: literals[identifier],
								raw: identifier
							};
						} else if (identifier === this_str) {
							return { type: THIS_EXP };
						} else {
							return {
								type: IDENTIFIER,
								name: identifier
							};
						}
					},

					// Gobbles a list of arguments within the context of a function call
					// or array literal. This function also assumes that the opening character
					// `(` or `[` has already been gobbled, and gobbles expressions and commas
					// until the terminator character `)` or `]` is encountered.
					// e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
					gobbleArguments = function (termination) {
						var ch_i, args = [], node, closed = false;
						while (index < length) {
							gobbleSpaces();
							ch_i = exprICode(index);
							if (ch_i === termination) { // done parsing
								closed = true;
								index++;
								break;
							} else if (ch_i === COMMA_CODE) { // between expressions
								index++;
							} else {
								node = gobbleExpression();
								if (!node || node.type === COMPOUND) {
									throwError('Expected comma', index);
								}
								args.push(node);
							}
						}
						if (!closed) {
							throwError('Expected ' + String.fromCharCode(termination), index);
						}
						return args;
					},

					// Gobble a non-literal variable name. This variable name may include properties
					// e.g. `foo`, `bar.baz`, `foo['bar'].baz`
					// It also gobbles function calls:
					// e.g. `Math.acos(obj.angle)`
					gobbleVariable = function () {
						var ch_i, node;
						ch_i = exprICode(index);

						if (ch_i === OPAREN_CODE) {
							node = gobbleGroup();
						} else {
							node = gobbleIdentifier();
						}
						gobbleSpaces();
						ch_i = exprICode(index);
						while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
							index++;
							if (ch_i === PERIOD_CODE) {
								gobbleSpaces();
								node = {
									type: MEMBER_EXP,
									computed: false,
									object: node,
									property: gobbleIdentifier()
								};
							} else if (ch_i === OBRACK_CODE) {
								node = {
									type: MEMBER_EXP,
									computed: true,
									object: node,
									property: gobbleExpression()
								};
								gobbleSpaces();
								ch_i = exprICode(index);
								if (ch_i !== CBRACK_CODE) {
									throwError('Unclosed [', index);
								}
								index++;
							} else if (ch_i === OPAREN_CODE) {
								// A function call is being made; gobble all the arguments
								node = {
									type: CALL_EXP,
									'arguments': gobbleArguments(CPAREN_CODE),
									callee: node
								};
							}
							gobbleSpaces();
							ch_i = exprICode(index);
						}
						return node;
					},

					// Responsible for parsing a group of things within parentheses `()`
					// This function assumes that it needs to gobble the opening parenthesis
					// and then tries to gobble everything within that parenthesis, assuming
					// that the next thing it should see is the close parenthesis. If not,
					// then the expression probably doesn't have a `)`
					gobbleGroup = function () {
						index++;
						var node = gobbleExpression();
						gobbleSpaces();
						if (exprICode(index) === CPAREN_CODE) {
							index++;
							return node;
						} else {
							throwError('Unclosed (', index);
						}
					},

					// Responsible for parsing Array literals `[1, 2, 3]`
					// This function assumes that it needs to gobble the opening bracket
					// and then tries to gobble the expressions as arguments.
					gobbleArray = function () {
						index++;
						return {
							type: ARRAY_EXP,
							elements: gobbleArguments(CBRACK_CODE)
						};
					},

					nodes = [], ch_i, node;

				while (index < length) {
					ch_i = exprICode(index);

					// Expressions can be separated by semicolons, commas, or just inferred without any
					// separators
					if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
						index++; // ignore separators
					} else {
						// Try to gobble each expression individually
						if ((node = gobbleExpression())) {
							nodes.push(node);
							// If we weren't able to find a binary expression and are out of room, then
							// the expression passed in probably has too much
						} else if (index < length) {
							throwError('Unexpected "' + exprI(index) + '"', index);
						}
					}
				}

				// If there's only one expression just try returning the expression
				if (nodes.length === 1) {
					return nodes[0];
				} else {
					return {
						type: COMPOUND,
						body: nodes
					};
				}
			};

		// To be filled in by the template
		jsep.version = '0.3.4';
		jsep.toString = function () { return 'JavaScript Expression Parser (JSEP) v' + jsep.version; };

		/**
		 * @method jsep.addUnaryOp
		 * @param {string} op_name The name of the unary op to add
		 * @return jsep
		 */
		jsep.addUnaryOp = function (op_name) {
			max_unop_len = Math.max(op_name.length, max_unop_len);
			unary_ops[op_name] = t; return this;
		};

		/**
		 * @method jsep.addBinaryOp
		 * @param {string} op_name The name of the binary op to add
		 * @param {number} precedence The precedence of the binary op (can be a float)
		 * @return jsep
		 */
		jsep.addBinaryOp = function (op_name, precedence) {
			max_binop_len = Math.max(op_name.length, max_binop_len);
			binary_ops[op_name] = precedence;
			return this;
		};

		/**
		 * @method jsep.addLiteral
		 * @param {string} literal_name The name of the literal to add
		 * @param {*} literal_value The value of the literal
		 * @return jsep
		 */
		jsep.addLiteral = function (literal_name, literal_value) {
			literals[literal_name] = literal_value;
			return this;
		};

		/**
		 * @method jsep.removeUnaryOp
		 * @param {string} op_name The name of the unary op to remove
		 * @return jsep
		 */
		jsep.removeUnaryOp = function (op_name) {
			delete unary_ops[op_name];
			if (op_name.length === max_unop_len) {
				max_unop_len = getMaxKeyLen(unary_ops);
			}
			return this;
		};

		/**
		 * @method jsep.removeAllUnaryOps
		 * @return jsep
		 */
		jsep.removeAllUnaryOps = function () {
			unary_ops = {};
			max_unop_len = 0;

			return this;
		};

		/**
		 * @method jsep.removeBinaryOp
		 * @param {string} op_name The name of the binary op to remove
		 * @return jsep
		 */
		jsep.removeBinaryOp = function (op_name) {
			delete binary_ops[op_name];
			if (op_name.length === max_binop_len) {
				max_binop_len = getMaxKeyLen(binary_ops);
			}
			return this;
		};

		/**
		 * @method jsep.removeAllBinaryOps
		 * @return jsep
		 */
		jsep.removeAllBinaryOps = function () {
			binary_ops = {};
			max_binop_len = 0;

			return this;
		};

		/**
		 * @method jsep.removeLiteral
		 * @param {string} literal_name The name of the literal to remove
		 * @return jsep
		 */
		jsep.removeLiteral = function (literal_name) {
			delete literals[literal_name];
			return this;
		};

		/**
		 * @method jsep.removeAllLiterals
		 * @return jsep
		 */
		jsep.removeAllLiterals = function () {
			literals = {};

			return this;
		};

		// In desktop environments, have a way to restore the old value for `jsep`
		{
			// In Node.JS environments
			if (module.exports) {
				exports = module.exports = jsep;
			} else {
				exports.parse = jsep;
			}
		}
	}());
});

/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 */

var binops = {
	'||': function (a, b) { return a || b; },
	'&&': function (a, b) { return a && b; },
	'|': function (a, b) { return a | b; },
	'^': function (a, b) { return a ^ b; },
	'&': function (a, b) { return a & b; },
	'==': function (a, b) { return a == b; }, // jshint ignore:line
	'!=': function (a, b) { return a != b; }, // jshint ignore:line
	'===': function (a, b) { return a === b; },
	'!==': function (a, b) { return a !== b; },
	'<': function (a, b) { return a < b; },
	'>': function (a, b) { return a > b; },
	'<=': function (a, b) { return a <= b; },
	'>=': function (a, b) { return a >= b; },
	'<<': function (a, b) { return a << b; },
	'>>': function (a, b) { return a >> b; },
	'>>>': function (a, b) { return a >>> b; },
	'+': function (a, b) { return a + b; },
	'-': function (a, b) { return a - b; },
	'*': function (a, b) { return a * b; },
	'/': function (a, b) { return a / b; },
	'%': function (a, b) { return a % b; }
};

var unops = {
	'-': function (a) { return -a; },
	'+': function (a) { return a; },
	'~': function (a) { return ~a; },
	'!': function (a) { return !a; },
};

function evaluateArray(list, context) {
	return list.map(function (v) { return evaluate(v, context); });
}

function evaluateMember(node, context) {
	var object = evaluate(node.object, context);
	if (node.computed) {
		return [object, object[evaluate(node.property, context)]];
	} else {
		return [object, object[node.property.name]];
	}
}

function evaluate(node, context) {

	switch (node.type) {

		case 'ArrayExpression':
			return evaluateArray(node.elements, context);

		case 'BinaryExpression':
			return binops[node.operator](evaluate(node.left, context), evaluate(node.right, context));

		case 'CallExpression':
			var caller, fn, assign;
			if (node.callee.type === 'MemberExpression') {
				assign = evaluateMember(node.callee, context);
				caller = assign[0];
				fn = assign[1];
			} else {
				fn = evaluate(node.callee, context);
			}
			if (typeof fn !== 'function') { return undefined; }
			return fn.apply(caller, evaluateArray(node.arguments, context));

		case 'ConditionalExpression':
			return evaluate(node.test, context)
				? evaluate(node.consequent, context)
				: evaluate(node.alternate, context);

		case 'Identifier':
			return context[node.name];

		case 'Literal':
			return node.value;

		case 'LogicalExpression':
			if (node.operator === '||') {
				return evaluate(node.left, context) || evaluate(node.right, context);
			} else if (node.operator === '&&') {
				return evaluate(node.left, context) && evaluate(node.right, context);
			}
			return binops[node.operator](evaluate(node.left, context), evaluate(node.right, context));

		case 'MemberExpression':
			return evaluateMember(node, context)[1];

		case 'ThisExpression':
			return context;

		case 'UnaryExpression':
			return unops[node.operator](evaluate(node.argument, context));

		default:
			return undefined;
	}

}

function compile(expression) {
	return evaluate.bind(null, jsep(expression));
}

var expressionEval = {
	parse: jsep,
	eval: evaluate,
	compile: compile
};

var singleComment = 1;
var multiComment = 2;

function stripWithoutWhitespace() {
	return '';
}

function stripWithWhitespace(str, start, end) {
	return str.slice(start, end).replace(/\S/g, ' ');
}

var stripJsonComments = function (str, opts) {
	opts = opts || {};

	var currentChar;
	var nextChar;
	var insideString = false;
	var insideComment = false;
	var offset = 0;
	var ret = '';
	var strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	for (var i = 0; i < str.length; i++) {
		currentChar = str[i];
		nextChar = str[i + 1];

		if (!insideComment && currentChar === '"') {
			var escaped = str[i - 1] === '\\' && str[i - 2] !== '\\';
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentChar + nextChar === '//') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentChar + nextChar === '\r\n') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentChar === '\n') {
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
		} else if (!insideComment && currentChar + nextChar === '/*') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentChar + nextChar === '*/') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	return ret + (insideComment ? strip(str.substr(offset)) : str.substr(offset));
};

/**
 * Preprocess in C-preprocessor fashion
 * @module  prepr
 */









/**
 * Main processing function
 */
function preprocess(what, how) {
	var source = what + '';

	//defined macros
	//FIXME: provide real values here
	var macros = objectAssign({
		__LINE__: 0,
		__FILE__: '_',
		__VERSION__: 100,
		defined: function (arg) {
			return [].slice.call(arguments).every(function (arg) {
				return macros[arg] != null;
			}) ? 1 : 0;
		}
	}, how);

	return process(source);


	//process chunk of a string by finding out macros and replacing them
	function process(str) {
		if (!str) return '';

		var arr = [];

		var chunk = str;

		//find next directive, get chunk to process before it
		var directive = /#[A-Za-z0-9_$]+/ig.exec(str);

		//get chunk to process - before next call
		if (directive) {
			chunk = chunk.slice(0, directive.index);
			str = str.slice(directive.index);
		}


		//escape bad things
		chunk = escape(chunk, arr);

		//replace all defined X to defined (X)
		chunk = chunk.replace(/\bdefined\s*([A-Za-z0-9_$]+)/g, 'defined($1)');

		//for each registered macro do it’s call
		for (var name in macros) {
			//fn macro
			if (macros[name] instanceof Function) {
				chunk = processFunction(chunk, name, macros[name]);
			}
		}

		chunk = escape(chunk, arr);

		//for each defined var do replacement
		for (var name in macros) {
			//value replacement
			if (!(macros[name] instanceof Function)) {
				chunk = processDefinition(chunk, name, macros[name]);
			}
		}

		chunk = unescape(chunk, arr);

		//process directive
		if (directive) {
			if (/^#def/.test(directive[0])) {
				str = define(str);
			}
			else if (/^#undef/.test(directive[0])) {
				str = undefine(str);
			}
			else if (/^#if/.test(directive[0])) {
				str = processIf(str);
			}
			else if (/^#line/.test(directive[0])) {
				var data = /#[A-Za-z0-9_]+\s*([-0-9]+)?[^\n]*/.exec(str);
				macros.__LINE__ = parseInt(data[1]);
				str = str.slice(data.index + data[0].length);
			}
			else if (/^#version/.test(directive[0])) {
				var data = /#[A-Za-z0-9_]+\s*([-0-9]+)?[^\n]*/.exec(str);
				macros.__VERSION__ = parseInt(data[1]);
				str = str.slice(data.index + data[0].length);
			}
			else {
				//drop directive line
				var directiveDecl = /\n/m.exec(str);
				chunk += str.slice(0, directiveDecl.index) + '\n';
				str = str.slice(directiveDecl.index);
			}

			return chunk + process(str);
		}

		return chunk;
	}

	//replace defined macros from a string
	function processFunction(str, name, fn) {
		var arr = [];
		str = escape(str, arr);

		var parts = parenthesis_1(str, {
			flat: true,
			brackets: '()',
			escape: '___'
		});

		var re = new RegExp(name + '\\s*\\(___([0-9]+)___\\)', 'g');

		//replace each macro call with result
		parts = parts.map(function (part) {
			return part.replace(re, function (match, argsPartIdx) {
				//parse arguments
				var args = parts[argsPartIdx].trim();
				if (args.length) {
					args = args.split(/\s*,\s*/);
					args = args.map(function (arg) {
						var argParts = parts.slice();
						argParts[0] = arg;
						return parenthesis_1.stringify(argParts, { flat: true, escape: '___' });
					}).map(function (arg) {
						return arg;
					});
				} else {
					args = [];
				}

				if (args.length != fn.length) throw Error(`macro "${name}" requires ${fn.length} arguments, but ${args.length} given`);

				//apply macro call with args
				return fn.apply(null, args);
			});
		});

		str = parenthesis_1.stringify(parts, { flat: true, escape: '___' });

		str = unescape(str, arr);

		return str;
	}

	//replace defined variables from a string
	function processDefinition(str, name, value) {
		var arr = [];
		str = escape(str, arr);

		//apply concatenation ENTRY ## something → valueSomething
		str = str.replace(new RegExp(`([^#A-Za-z0-9_$]|^)${name}\\s*##\\s*([A-Za-z0-9_$]*)`, 'g'), function (match, pre, post) {
			return pre + value + post;
		});
		str = str.replace(new RegExp(`([A-Za-z0-9_$]*)\\s*##\\s*${name}([^A-Za-z0-9_$]|$)`, 'g'), function (match, pre, post) {
			return pre + value + post;
		});

		//replace definition entries
		str = str.replace(new RegExp(`([^#A-Za-z0-9_$]|^)${name}([^A-Za-z0-9_$]|$)`, 'g'), function (match, pre, post) {

			//insert definition
			if (macros[value] != null && !(macros[value] instanceof Function)) value = macros[value];

			return pre + value + post;
		});
		//replace stringifications
		str = str.replace(new RegExp(`#${name}([^A-Za-z0-9_$]|$)`, 'g'), function (match, post) {
			return '"' + value + '"' + post;
		});

		str = unescape(str, arr);

		return str;
	}

	//helpers to escape unfoldable things in strings
	function escape(str, arr) {
		return escaper.replace(str, true, arr)
	}

	function unescape(str, arr) {
		if (!arr || !arr.length) return str

		return escaper.paste(str, arr)
	}



	//register macro, #define directive
	function define(str) {
		var data = /#[A-Za-z]+[ ]*([A-Za-z0-9_$]*)(?:\(([^\(\)]*)\))?[ \r]*([^\n]*)$/m.exec(str);
		str = str.slice(data.index + data[0].length);

		var name = data[1];
		var args = data[2];
		var value = data[3] || true;

		if (!name || !value) throw Error(`Macro definition "${data[0]}" is malformed`);

		//register function macro
		//#define FOO(A, B) (expr)
		if (args != null) {
			if (args.trim().length) {
				args = args.split(/\s*,\s*/);
			}
			else {
				args = [];
			}

			function fn() {
				var result = value;

				//for each arg - replace it’s occurence in `result`
				for (var i = 0; i < args.length; i++) {
					result = processDefinition(result, args[i], arguments[i]);
				}

				result = process(result);

				return result;
			} Object.defineProperty(fn, 'length', {
				value: args.length
			});

			macros[name] = fn;
		}

		//register value macro
		//#define FOO insertion
		//#define FOO (expr)
		else {
			macros[name] = value;
		}

		return str;
	}

	//unregister macro, #undef directive
	function undefine(str) {
		var data = /#[A-Za-z0-9_]+[ ]*([A-Za-z0-9_$]+)/.exec(str);
		delete macros[data[1]];

		return str.slice(data.index + data[0].length);
	}

	//process if/else/ifdef/elif/ifndef/defined
	function processIf(str) {
		var match = balancedMatch('#if', '#endif', str);

		//if no nested ifs - means we are in clause, return as is
		if (!match) return str;
		var body = match.body;
		var post = match.post;
		var elseBody = '';

		//find else part
		var matchElse = balancedMatch('#if', '#else', str);
		if (matchElse && matchElse.end <= match.end) {
			elseBody = matchElse.post.slice(matchElse.post.indexOf('\n'), -match.post.length - 6);
			body = matchElse.body;
		}

		//ifdef
		if (/^def/.test(body)) {
			body = body.slice(3);
			var nameMatch = /[A-Za-z0-9_$]+/.exec(body);
			var name = nameMatch[0];
			body = body.slice(name.length + nameMatch.index);
			if (macros[name] != null) str = process(body);
			else str = process(elseBody);
		}
		//ifndef
		else if (/^ndef/.test(body)) {
			body = body.slice(4);
			var nameMatch = /[A-Za-z0-9_$]+/.exec(body);
			var name = nameMatch[0];
			body = body.slice(name.length + nameMatch.index);
			if (macros[name] == null) str = process(body);
			else str = process(elseBody);
		}
		//if
		else {
			//split elifs
			var clauses = body.split(/^\s*#elif\s+/m);

			var result = false;

			//find first triggered clause
			for (var i = 0; i < clauses.length; i++) {
				var clause = clauses[i];

				var exprMatch = /\s*(.*)/.exec(clause);
				var expr = exprMatch[0];
				clause = clause.slice(expr.length + exprMatch.index);

				//eval expression
				expr = stripJsonComments(process(expr));

				try {
					var expr = expressionEval.parse(expr);
					result = expressionEval.eval(expr, macros);
				} catch (e) {
					result = false;
				}

				if (result) {
					str = process(clause);
					break;
				}
			}

			//else clause
			if (!result) {
				str = process(elseBody);
			}
		}


		//trim post till the first endline, because there may be comments after #endif
		var match = /[\n\r]/.exec(post);
		if (match) post = post.slice(match.index);

		return str + post;
	}
}


var prepr = preprocess;

export default prepr;
