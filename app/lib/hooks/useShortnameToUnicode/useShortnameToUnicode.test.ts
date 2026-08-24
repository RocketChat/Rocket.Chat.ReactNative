import { renderHook } from '@testing-library/react-native';

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

// emojibase emits the emoji presentation sequence, hence the trailing U+FE0F.
test('render alias shortnames', () => {
	const unicodeEmoji = renderShortnameToUnicode(':water_wave::thumbs_up::red_heart:');
	expect(unicodeEmoji).toBe('🌊👍\uFE0F❤\uFE0F');
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
