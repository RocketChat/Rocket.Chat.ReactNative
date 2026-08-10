import { renderHook } from '@testing-library/react-native';
import { act } from 'react';

import { useResponderLongPress } from './useResponderLongPress';

const pressEvent = {} as never;

describe('useResponderLongPress', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('returns null when there is no handler, so the view stays out of the responder system', () => {
		const { result } = renderHook(() => useResponderLongPress(undefined));

		expect(result.current).toBeNull();
	});

	it('returns null when disabled', () => {
		const { result } = renderHook(() => useResponderLongPress(jest.fn(), false));

		expect(result.current).toBeNull();
	});

	it('claims the responder so nested press targets can win by depth', () => {
		const { result } = renderHook(() => useResponderLongPress(jest.fn()));

		expect(result.current?.onStartShouldSetResponder()).toBe(true);
	});

	it('allows termination so an ancestor scroll view can take the touch over', () => {
		const { result } = renderHook(() => useResponderLongPress(jest.fn()));

		expect(result.current?.onResponderTerminationRequest()).toBe(true);
	});

	it('calls the handler once the press is held long enough', () => {
		const onLongPress = jest.fn();
		const { result } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		expect(onLongPress).not.toHaveBeenCalled();

		act(() => jest.advanceTimersByTime(500));
		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	it('forwards the grant event to the handler, as Pressability does', () => {
		const onLongPress = jest.fn();
		const { result } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		act(() => jest.advanceTimersByTime(500));

		expect(onLongPress).toHaveBeenCalledWith(pressEvent);
	});

	it('does not call the handler for a press released early', () => {
		const onLongPress = jest.fn();
		const { result } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		act(() => jest.advanceTimersByTime(400));
		act(() => result.current?.onResponderRelease());
		act(() => jest.advanceTimersByTime(500));

		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('does not call the handler when the responder is terminated, e.g. by scrolling', () => {
		const onLongPress = jest.fn();
		const { result } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		act(() => result.current?.onResponderTerminate());
		act(() => jest.advanceTimersByTime(500));

		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('does not fire twice when a new press starts before the previous timer elapsed', () => {
		const onLongPress = jest.fn();
		const { result } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		act(() => jest.advanceTimersByTime(400));
		act(() => result.current?.onResponderGrant(pressEvent));
		act(() => jest.advanceTimersByTime(500));

		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	it('cancels a pending long press on unmount', () => {
		const onLongPress = jest.fn();
		const { result, unmount } = renderHook(() => useResponderLongPress(onLongPress));

		act(() => result.current?.onResponderGrant(pressEvent));
		unmount();
		act(() => jest.advanceTimersByTime(500));

		expect(onLongPress).not.toHaveBeenCalled();
	});
});
