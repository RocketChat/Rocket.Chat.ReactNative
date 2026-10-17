import { act, render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import { colors } from '~/lib/constants/colors';
import RaisedHandChip, { getRaisedHandColors, REVEAL_DELAY_MS } from '../RaisedHandChip';

describe('RaisedHandChip', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('shows only the hand at first', () => {
		const { getByText, queryByText } = render(<RaisedHandChip label='(1) Ada' isSelf={false} />);

		expect(getByText('✋')).toBeTruthy();
		expect(queryByText('(1) Ada')).toBeNull();
	});

	it('reveals the name once the hand has been up for a moment', () => {
		const { getByText, queryByText } = render(<RaisedHandChip label='(1) Ada' isSelf={false} />);

		act(() => {
			jest.advanceTimersByTime(REVEAL_DELAY_MS - 1);
		});
		expect(queryByText('(1) Ada')).toBeNull();

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(getByText('(1) Ada')).toBeTruthy();
	});

	it('shows the name straight away when the system asks for less motion', () => {
		jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);

		const { getByText } = render(<RaisedHandChip label='(1) Ada' isSelf={false} />);

		expect(getByText('(1) Ada')).toBeTruthy();
	});

	it('keeps up with the place in the queue after the name is out', () => {
		const { getByText, rerender } = render(<RaisedHandChip label='(2) Ada' isSelf={false} />);
		act(() => {
			jest.advanceTimersByTime(REVEAL_DELAY_MS);
		});

		rerender(<RaisedHandChip label='(1) Ada' isSelf={false} />);

		expect(getByText('(1) Ada')).toBeTruthy();
	});

	it('does not reveal anything once it has gone away', () => {
		const { unmount } = render(<RaisedHandChip label='(1) Ada' isSelf={false} />);

		unmount();

		expect(() => act(() => jest.advanceTimersByTime(REVEAL_DELAY_MS))).not.toThrow();
		expect(jest.getTimerCount()).toBe(0);
	});
});

describe('getRaisedHandColors', () => {
	it.each(['light', 'dark', 'black'] as const)('gives our own raised hand the green of a success button (%s theme)', theme => {
		const palette = colors[theme];

		expect(getRaisedHandColors(palette, true)).toEqual({
			background: palette.buttonBackgroundSuccessDefault,
			text: palette.buttonFontSuccess
		});
	});

	it.each(['light', 'dark', 'black'] as const)('gives anybody else a white raised hand with dark text (%s theme)', theme => {
		const palette = colors[theme];

		expect(getRaisedHandColors(palette, false)).toEqual({ background: palette.fontPureWhite, text: palette.fontPureBlack });
		expect(palette.fontPureWhite).toBe('#FFFFFF');
	});

	it('tells our hand apart from everybody else', () => {
		expect(getRaisedHandColors(colors.light, true).background).not.toBe(getRaisedHandColors(colors.light, false).background);
	});
});
