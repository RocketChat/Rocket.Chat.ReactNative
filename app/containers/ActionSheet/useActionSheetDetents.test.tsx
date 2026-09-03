import { renderHook } from '@testing-library/react-native';

import { HANDLE_HEIGHT, getSheetContentPaddingBottom, useActionSheetDetents } from './useActionSheetDetents';

let mockIsAndroid = false;

jest.mock('../../lib/methods/helpers/deviceInfo', () => ({
	get isAndroid() {
		return mockIsAndroid;
	}
}));

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

		expect(result.current.detents).toEqual([(300 + HANDLE_HEIGHT) / windowHeight]);
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

describe('getSheetContentPaddingBottom', () => {
	const bottom = 32;

	beforeEach(() => {
		mockIsAndroid = false;
	});

	it('returns the safe-area bottom when no flags are set', () => {
		expect(getSheetContentPaddingBottom({ bottom })).toBe(bottom);
	});

	it('returns the safe-area bottom on iOS even for a full-container sheet', () => {
		expect(getSheetContentPaddingBottom({ bottom, fullContainer: true, scrollEnabled: false })).toBe(bottom);
	});

	it('adds the handle height on Android for a non-scrollable full-container sheet', () => {
		mockIsAndroid = true;

		expect(getSheetContentPaddingBottom({ bottom, fullContainer: true, scrollEnabled: false })).toBe(bottom + HANDLE_HEIGHT);
	});

	it('returns the safe-area bottom on Android for a scrollable full-container sheet', () => {
		mockIsAndroid = true;

		expect(getSheetContentPaddingBottom({ bottom, fullContainer: true, scrollEnabled: true })).toBe(bottom);
	});

	it('returns the safe-area bottom on Android when hugging content', () => {
		mockIsAndroid = true;

		expect(getSheetContentPaddingBottom({ bottom, fullContainer: true, hugContent: true, scrollEnabled: false })).toBe(bottom);
	});

	it('returns the safe-area bottom on Android for a regular sheet', () => {
		mockIsAndroid = true;

		expect(getSheetContentPaddingBottom({ bottom })).toBe(bottom);
	});
});
