import useShortnameToUnicode from './index';
import { setUser } from '../../../actions/login';
import { mockedStore } from '../../../reducers/mockedStore';

jest.mock('../useAppSelector', () => ({
	useAppSelector: () => mockedStore.getState().login.user.settings?.preferences?.convertAsciiEmoji
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
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':joy:');
	expect(unicodeEmoji).toBe('😂');
});

test('render several emojis', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':dog::cat::hamburger::icecream::rocket:');
	expect(unicodeEmoji).toBe('🐶🐱🍔🍦🚀');
});

test('render unknown emoji', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':unknown:');
	expect(unicodeEmoji).toBe(':unknown:');
});

test('render empty', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode('');
	expect(unicodeEmoji).toBe('');
});

test('render text with emoji', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode('Hello there! :hugging:');
	expect(unicodeEmoji).toBe('Hello there! 🤗');
});

test('render ascii smile', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':)');
	expect(unicodeEmoji).toBe('🙂');
});

test('render several ascii emojis', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(":) :( -_- ':-D");
	expect(unicodeEmoji).toBe('🙂 😞 😑 😅');
});

test('render text with ascii emoji', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode('Hello there! :)');
	expect(unicodeEmoji).toBe('Hello there! 🙂');
});

test('render emoji and ascii emoji', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode("':-D :joy:");
	expect(unicodeEmoji).toBe('😅 😂');
});

test('convert ascii when convertAsciiEmoji = true', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe('😞');
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
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe(':(');
});
