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

test('render joy', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':joy:');
	expect(unicodeEmoji).toBe('😂');
});

test('render several emojis', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':dog::cat::hamburger::icecream::rocket:');
	expect(unicodeEmoji).toBe('🐶🐱🍔🍦🚀');
});

test('render unknown emoji', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':unknown:');
	expect(unicodeEmoji).toBe(':unknown:');
});

test('render empty', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode('');
	expect(unicodeEmoji).toBe('');
});

test('render text with emoji', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode('Hello there! :hugging:');
	expect(unicodeEmoji).toBe('Hello there! 🤗');
});

test('render ascii smile', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':)');
	expect(unicodeEmoji).toBe('🙂');
});

test('render several ascii emojis', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(":) :( -_- ':-D");
	expect(unicodeEmoji).toBe('🙂 😞 😑 😅');
});

test('render text with ascii emoji', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode('Hello there! :)');
	expect(unicodeEmoji).toBe('Hello there! 🙂');
});

test('render emoji and ascii emoji', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode("':-D :joy:");
	expect(unicodeEmoji).toBe('😅 😂');
});

test('convert ascii when convertAsciiEmoji = true', () => {
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':(');
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
	const { result } = renderHook(() => useShortnameToUnicode());
	const unicodeEmoji = result.current.formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe(':(');
});

test('convert ascii when convertAsciiEmoji = false and isEmojiPicker = true', () => {
	const { result } = renderHook(() => useShortnameToUnicode(true));
	const unicodeEmoji = result.current.formatShortnameToUnicode(':(');
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
	const { result } = renderHook(() => useShortnameToUnicode(true));
	const unicodeEmoji = result.current.formatShortnameToUnicode(':(');
	expect(unicodeEmoji).toBe('😞');
});
