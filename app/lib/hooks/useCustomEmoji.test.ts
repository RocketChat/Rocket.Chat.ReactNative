import { renderHook } from '@testing-library/react-native';

import { useCustomEmoji } from './useCustomEmoji';
import { resolveCustomEmoji } from '../../definitions';

const customEmojis = { nyan_rocket: { name: 'nyan_rocket', extension: 'png' } };

jest.mock('./useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => any) => selector({ customEmojis })
}));

describe('resolveCustomEmoji', () => {
	it('returns the emoji when the name is registered', () => {
		expect(resolveCustomEmoji(customEmojis, 'nyan_rocket')).toBe(customEmojis.nyan_rocket);
	});

	it('returns null when the name is not registered', () => {
		expect(resolveCustomEmoji(customEmojis, 'unknown')).toBeNull();
	});
});

describe('useCustomEmoji', () => {
	it('returns a getter resolving against state.customEmojis', () => {
		const { result } = renderHook(() => useCustomEmoji());

		expect(result.current('nyan_rocket')).toBe(customEmojis.nyan_rocket);
		expect(result.current('unknown')).toBeNull();
	});
});
