import useShortnameToUnicode from './index';
import { setUser } from '../../../actions/login';
import { setCustomEmojis } from '../../../actions/customEmojis';
import { mockedStore } from '../../../reducers/mockedStore';
import { initStore } from '../../store/auxStore';

jest.mock('../useAppSelector', () => ({
	useAppSelector: (selector: (state: ReturnType<typeof mockedStore.getState>) => unknown) => selector(mockedStore.getState())
}));

initStore(mockedStore);

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

test('render flag_no emoji as the Norway flag', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':flag_no:');
	expect(unicodeEmoji).toBe('🇳🇴');
});

test('do NOT resolve a shortcode that collides with a custom emoji name', () => {
	mockedStore.dispatch(setCustomEmojis({ no: { name: 'no', extension: 'png' } }));
	const { formatShortnameToUnicode } = useShortnameToUnicode();
	const unicodeEmoji = formatShortnameToUnicode(':no:');
	expect(unicodeEmoji).toBe(':no:');
	mockedStore.dispatch(setCustomEmojis({}));
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

test('convert ascii when convertAsciiEmoji = false and isEmojiPicker = true', () => {
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);
	const unicodeEmoji = formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe('😞');
});

test('convert ascii when convertAsciiEmoji = true and isEmojiPicker = true', () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
	const { formatShortnameToUnicode } = useShortnameToUnicode(true);
	const unicodeEmoji = formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe('😞');
});
