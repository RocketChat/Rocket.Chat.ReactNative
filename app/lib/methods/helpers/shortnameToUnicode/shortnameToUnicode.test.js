/* eslint-disable no-undef */
import { setUser } from '../../../../actions/login';
import { mockedStore } from '../../../../reducers/mockedStore';
import shortnameToUnicode from './index';

jest.mock('../../../store/auxStore', () => ({
	store: {
		getState: () => mockedStore.getState()
	}
}));

const initialMockedStoreState = () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
};

initialMockedStoreState();

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

test('convert ascii when convertAsciiEmoji = true', () => {
	expect(shortnameToUnicode(':(')).toBe('😞');
});

test('do NOT convert ascii when convertAsciiEmoji = false', () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: false
				}
			}
		})
	);

	expect(shortnameToUnicode(':(')).toBe(':(');
});
