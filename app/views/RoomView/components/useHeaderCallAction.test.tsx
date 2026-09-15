import { act, renderHook } from '@testing-library/react-native';

import { useHeaderCallAction } from './useHeaderCallAction';

const mockShowInitCallActionSheet = jest.fn();
const mockOpenNewMediaCall = jest.fn();
const mockStartCallImmediate = jest.fn();
let mockCallEnabled = false;
let mockDisabledTooltip: string | undefined;
let mockHasMediaCallPermission = false;
let mockIsInActiveCall = false;

jest.mock('~/containers/Header/components/HeaderButton', () => ({ Item: () => null }));
jest.mock('~/lib/hooks/useVideoConf', () => ({
	useVideoConf: () => ({
		showInitCallActionSheet: mockShowInitCallActionSheet,
		callEnabled: mockCallEnabled,
		disabledTooltip: mockDisabledTooltip
	})
}));
jest.mock('~/lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => ({
		openNewMediaCall: mockOpenNewMediaCall,
		startCallImmediate: mockStartCallImmediate,
		hasMediaCallPermission: mockHasMediaCallPermission,
		isInActiveCall: mockIsInActiveCall
	})
}));

const renderAction = (disabled = false) =>
	renderHook(() => useHeaderCallAction({ rid: 'room-id', disabled, accessibilityLabel: 'Call' }));

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockCallEnabled = false;
	mockDisabledTooltip = undefined;
	mockHasMediaCallPermission = false;
	mockIsInActiveCall = false;
});

afterEach(() => {
	jest.clearAllTimers();
	jest.useRealTimers();
});

it('hides the action when neither calling provider is available', () => {
	const { result } = renderAction();
	expect(result.current).toBeNull();
});

it('opens video conferencing immediately when media calling permission is absent', () => {
	mockCallEnabled = true;
	const { result } = renderAction();
	act(() => result.current?.onPress());
	expect(mockShowInitCallActionSheet).toHaveBeenCalledTimes(1);
	act(() => jest.advanceTimersByTime(300));
	expect(mockOpenNewMediaCall).not.toHaveBeenCalled();
	expect(mockStartCallImmediate).not.toHaveBeenCalled();
});

it('prioritizes media calling and delays its chooser until the double tap window closes', () => {
	mockCallEnabled = true;
	mockHasMediaCallPermission = true;
	mockDisabledTooltip = 'Video conferencing is unavailable';
	const { result } = renderAction();
	expect(result.current?.disabled).toBe(false);
	act(() => result.current?.onPress());
	act(() => jest.advanceTimersByTime(299));
	expect(mockOpenNewMediaCall).not.toHaveBeenCalled();
	act(() => jest.advanceTimersByTime(1));
	expect(mockOpenNewMediaCall).toHaveBeenCalledTimes(1);
	expect(mockShowInitCallActionSheet).not.toHaveBeenCalled();
	expect(mockStartCallImmediate).not.toHaveBeenCalled();
});

it.each([
	{ disabled: true, activeCall: false, tooltip: undefined },
	{ disabled: false, activeCall: true, tooltip: undefined },
	{ disabled: false, activeCall: false, tooltip: 'Video conferencing is unavailable' }
])('disables video calling for $disabled, $activeCall, $tooltip', ({ disabled, activeCall, tooltip }) => {
	mockCallEnabled = true;
	mockIsInActiveCall = activeCall;
	mockDisabledTooltip = tooltip;
	const { result } = renderAction(disabled);
	expect(result.current?.disabled).toBe(true);
});

it('disables media calling while another call is active', () => {
	mockHasMediaCallPermission = true;
	mockIsInActiveCall = true;
	const { result } = renderAction();
	expect(result.current?.disabled).toBe(true);
});

it('starts media calling immediately on a double tap and cancels the chooser', () => {
	mockHasMediaCallPermission = true;
	const { result } = renderAction();
	act(() => result.current?.onPress());
	act(() => jest.advanceTimersByTime(100));
	act(() => result.current?.onPress());
	expect(mockStartCallImmediate).toHaveBeenCalledTimes(1);
	act(() => jest.advanceTimersByTime(300));
	expect(mockOpenNewMediaCall).not.toHaveBeenCalled();
});

it('cancels a pending chooser when the screen unmounts', () => {
	mockHasMediaCallPermission = true;
	const { result, unmount } = renderAction();
	act(() => result.current?.onPress());
	unmount();
	act(() => jest.advanceTimersByTime(300));
	expect(mockOpenNewMediaCall).not.toHaveBeenCalled();
	expect(mockStartCallImmediate).not.toHaveBeenCalled();
});
