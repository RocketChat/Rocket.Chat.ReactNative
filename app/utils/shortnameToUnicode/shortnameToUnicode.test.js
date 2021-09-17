/* eslint-disable no-undef */
import shortnameToUnicode from './index';

test('render joy', () => {
	expect(shortnameToUnicode(':joy:')).toBe('😂');
});

test('render several emojis', () => {
	expect(shortnameToUnicode(':dog::cat::hamburger::icecream::rocket:')).toBe('🐶🐱🍔🍦🚀');
});

test('render unknown emoji', () => {
	expect(shortnameToUnicode(':unknown:')).toBe(':unknown:');
});

test('render empty', () => {
	expect(shortnameToUnicode('')).toBe('');
});

test('render text with emoji', () => {
	expect(shortnameToUnicode('Hello there! :hugging:')).toBe('Hello there! 🤗');
});

test('render ascii smile', () => {
	expect(shortnameToUnicode(':)')).toBe('🙂');
});

test('render several ascii emojis', () => {
	expect(shortnameToUnicode(":) :( -_- ':-D")).toBe('🙂😞😑😅');
});

test('render text with ascii emoji', () => {
	expect(shortnameToUnicode('Hello there! :)')).toBe('Hello there!🙂');
});

test('render emoji and ascii emoji', () => {
	expect(shortnameToUnicode("':-D :joy:")).toBe('😅 😂');
});
