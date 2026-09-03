import { renderHook } from '@testing-library/react-native';

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

const renderShortnameToUnicode = (str: string, isEmojiPicker?: boolean) => {
	const { result } = renderHook(() => useShortnameToUnicode(isEmojiPicker));
	return result.current.formatShortnameToUnicode(str);
};

test('render joy', () => {
	const unicodeEmoji = renderShortnameToUnicode(':joy:');
	expect(unicodeEmoji).toBe('😂');
});

test('render several emojis', () => {
	const unicodeEmoji = renderShortnameToUnicode(':dog::cat::hamburger::icecream::rocket:');
	expect(unicodeEmoji).toBe('🐶🐱🍔🍦🚀');
});

test('render flag_no emoji as the Norway flag', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':flag_no:');
	expect(unicodeEmoji).toBe('🇳🇴');
});

test('do NOT resolve a shortcode that collides with a custom emoji name', () => {
	mockedStore.dispatch(setCustomEmojis({ no: { name: 'no', extension: 'png' } }));
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':no:');
	expect(unicodeEmoji).toBe(':no:');
	mockedStore.dispatch(setCustomEmojis({}));
});

test('render unknown emoji', () => {
	const unicodeEmoji = renderShortnameToUnicode(':unknown:');
	expect(unicodeEmoji).toBe(':unknown:');
});

test('render empty', () => {
	const unicodeEmoji = renderShortnameToUnicode('');
	expect(unicodeEmoji).toBe('');
});

test('render text with emoji', () => {
	const unicodeEmoji = renderShortnameToUnicode('Hello there! :hugging:');
	expect(unicodeEmoji).toBe('Hello there! 🤗');
});

test('render ascii smile', () => {
	const unicodeEmoji = renderShortnameToUnicode(':)');
	expect(unicodeEmoji).toBe('🙂');
});

test('render several ascii emojis', () => {
	const unicodeEmoji = renderShortnameToUnicode(":) :( -_- ':-D");
	expect(unicodeEmoji).toBe('🙂 😞 😑 😅');
});

test('render text with ascii emoji', () => {
	const unicodeEmoji = renderShortnameToUnicode('Hello there! :)');
	expect(unicodeEmoji).toBe('Hello there! 🙂');
});

test('render emoji and ascii emoji', () => {
	const unicodeEmoji = renderShortnameToUnicode("':-D :joy:");
	expect(unicodeEmoji).toBe('😅 😂');
});

test('convert ascii when convertAsciiEmoji = true', () => {
	const unicodeEmoji = renderShortnameToUnicode(':(');
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
	const unicodeEmoji = renderShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe(':(');
});

test('convert ascii when convertAsciiEmoji = false and isEmojiPicker = true', () => {
	const unicodeEmoji = renderShortnameToUnicode(':(', true);
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
	const unicodeEmoji = renderShortnameToUnicode(':(', true);
	expect(unicodeEmoji).toBe('😞');
});

test('render newer unicode emojis (e.g. saluting_face, melting_face)', () => {
	expect(renderShortnameToUnicode(':saluting_face:')).toBe('🫡');
	expect(renderShortnameToUnicode(':melting_face:')).toBe('🫠');
	expect(renderShortnameToUnicode(':heart_hands:')).toBe('🫶');
	expect(renderShortnameToUnicode('Nice work! :saluting_face: 1')).toBe('Nice work! 🫡 1');
});
