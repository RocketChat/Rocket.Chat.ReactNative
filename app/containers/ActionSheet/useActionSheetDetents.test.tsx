import { renderHook } from '@testing-library/react-native';

import { useActionSheetDetents } from './useActionSheetDetents';

describe('useActionSheetDetents', () => {
	const windowHeight = 1000;

	it('normalizes custom snaps when provided', () => {
		const { result } = renderHook(() =>
			useActionSheetDetents({
				windowHeight,
				itemHeight: 0,
				optionsLength: 0,
				snaps: [0.3, '80%', 2],
				headerHeight: 0,
				hasCancel: false,
				contentHeight: 0
			})
		);

		expect(result.current.detents).toEqual([0.3, 0.8, 1]);
	});

	it('returns two detents when options content is tall', () => {
		const { result } = renderHook(() =>
			useActionSheetDetents({
				windowHeight,
				itemHeight: 50,
				optionsLength: 20,
				snaps: undefined,
				headerHeight: 24,
				hasCancel: true,
				contentHeight: 0
			})
		);

		expect(result.current.maxHeight).toBe(windowHeight * 0.75);
		expect(result.current.detents).toEqual([0.5, 0.75]);
	});

	it('returns a single clamped detent when options content is short', () => {
		const { result } = renderHook(() =>
			useActionSheetDetents({
				windowHeight,
				itemHeight: 20,
				optionsLength: 3,
				snaps: undefined,
				headerHeight: 10,
				hasCancel: false,
				contentHeight: 0
			})
		);

		expect(result.current.detents).toEqual([0.098]);
	});

	it('computes detent from content height when there are no options', () => {
		const { result } = renderHook(() =>
			useActionSheetDetents({
				windowHeight,
				itemHeight: 0,
				optionsLength: 0,
				snaps: undefined,
				headerHeight: 0,
				hasCancel: false,
				contentHeight: 300
			})
		);

		expect(result.current.detents).toEqual([300 / windowHeight]);
	});

	it('falls back to minimum height when no content or options', () => {
		const { result } = renderHook(() =>
			useActionSheetDetents({
				windowHeight,
				itemHeight: 0,
				optionsLength: 0,
				snaps: undefined,
				headerHeight: 0,
				hasCancel: false,
				contentHeight: 0
			})
		);

		expect(result.current.detents).toEqual([0.15]);
	});
});
