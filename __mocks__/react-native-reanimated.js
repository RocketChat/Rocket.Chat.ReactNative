const {
	View, Text, Image, ScrollView
} = require('react-native');

const NOOP = () => undefined;

const Code = () => null;

class Value {
	interpolate = () => {}
}

export default {
	SpringUtils: {
		makeDefaultConfig: NOOP,
		makeConfigFromBouncinessAndSpeed: NOOP,
		makeConfigFromOrigamiTensionAndFriction: NOOP
	},

	View,
	Text,
	Image,
	ScrollView,
	Code,

	Clock: NOOP,
	Node: NOOP,
	Value,

	Extrapolate: {
		EXTEND: 'extend',
		CLAMP: 'clamp',
		IDENTITY: 'identity'
	},

	add: NOOP,
	sub: NOOP,
	multiply: NOOP,
	divide: NOOP,
	pow: NOOP,
	modulo: NOOP,
	sqrt: NOOP,
	sin: NOOP,
	cos: NOOP,
	tan: NOOP,
	acos: NOOP,
	asin: NOOP,
	atan: NOOP,
	exp: NOOP,
	round: NOOP,
	floor: NOOP,
	ceil: NOOP,
	lessThan: NOOP,
	eq: NOOP,
	greaterThan: NOOP,
	lessOrEq: NOOP,
	greaterOrEq: NOOP,
	neq: NOOP,
	and: NOOP,
	or: NOOP,
	defined: NOOP,
	not: NOOP,
	set: NOOP,
	concat: NOOP,
	cond: NOOP,
	block: NOOP,
	call: NOOP,
	debug: NOOP,
	onChange: NOOP,
	startClock: NOOP,
	stopClock: NOOP,
	clockRunning: NOOP,
	event: NOOP,
	abs: NOOP,
	acc: NOOP,
	color: NOOP,
	diff: NOOP,
	diffClamp: NOOP,
	interpolate: NOOP,
	max: NOOP,
	min: NOOP,


	decay: NOOP,
	timing: NOOP,
	spring: NOOP,

	useCode: NOOP
};
