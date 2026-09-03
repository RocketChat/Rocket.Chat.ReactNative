import { renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { clearInAppFeedback, removeInAppFeedback } from '../../../../actions/inAppFeedback';
import UserPreferences from '../../../../lib/methods/userPreferences';
import { useInAppFeedback } from '../useInAppFeedback';

const mockDispatch = jest.fn();
const mockUseIsFocused = jest.fn();
const mockState = { inAppFeedback: {} as Record<string, string> };

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selectorFn: (state: typeof mockState) => unknown) => selectorFn(mockState)
}));
jest.mock('@react-navigation/native', () => ({
	useIsFocused: () => mockUseIsFocused()
}));
jest.mock('expo-haptics', () => ({
	notificationAsync: jest.fn(),
	NotificationFeedbackType: { Success: 'success' }
}));
jest.mock('../../../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: { getBool: jest.fn(() => null) }
}));

const mockNotificationAsync = Haptics.notificationAsync as jest.Mock;
const mockGetBool = UserPreferences.getBool as jest.Mock;

describe('useInAppFeedback', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetBool.mockReturnValue(null);
		mockState.inAppFeedback = { 'msg-1': 'msg-1' };
	});

	it('fires exactly one haptic across a focused and an unfocused instance', () => {
		mockUseIsFocused.mockReturnValueOnce(true).mockReturnValueOnce(false);

		renderHook(() => useInAppFeedback());
		renderHook(() => useInAppFeedback());

		expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
	});

	it('does not fire a haptic when unfocused', () => {
		mockUseIsFocused.mockReturnValue(false);

		renderHook(() => useInAppFeedback());

		expect(mockNotificationAsync).not.toHaveBeenCalled();
	});

	it('does not fire a haptic when the slice is empty', () => {
		mockState.inAppFeedback = {};
		mockUseIsFocused.mockReturnValue(true);

		renderHook(() => useInAppFeedback());

		expect(mockNotificationAsync).not.toHaveBeenCalled();
	});

	it('dispatches clearInAppFeedback on mount and unmount', () => {
		mockUseIsFocused.mockReturnValue(true);

		const { unmount } = renderHook(() => useInAppFeedback());

		expect(mockDispatch).toHaveBeenCalledWith(clearInAppFeedback());

		const callCountBeforeUnmount = mockDispatch.mock.calls.length;
		unmount();

		expect(mockDispatch).toHaveBeenCalledWith(clearInAppFeedback());
		expect(mockDispatch.mock.calls.length).toBe(callCountBeforeUnmount + 1);
	});

	it('dispatches removeInAppFeedback once per entry when focused with multiple feedback entries', () => {
		mockState.inAppFeedback = { 'msg-1': 'msg-1', 'msg-2': 'msg-2' };
		mockUseIsFocused.mockReturnValue(true);

		renderHook(() => useInAppFeedback());

		expect(mockDispatch).toHaveBeenCalledWith(removeInAppFeedback('msg-1'));
		expect(mockDispatch).toHaveBeenCalledWith(removeInAppFeedback('msg-2'));
		expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
	});
});
