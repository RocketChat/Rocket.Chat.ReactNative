import { renderHook } from '@testing-library/react-native';

import { useStackItems } from './useStackItems';

const mockTakeOverCall = jest.fn(() => Promise.resolve());
jest.mock('~/lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { takeOverCall: () => mockTakeOverCall() }
}));

const mockUseCanTakeOverCall = jest.fn(() => false);
jest.mock('~/lib/services/voip/useCanTakeOverCall', () => ({
	useCanTakeOverCall: () => mockUseCanTakeOverCall()
}));

const mockUseNewMediaCall = jest.fn(() => ({ openNewMediaCall: jest.fn(), hasMediaCallPermission: true, isInActiveCall: false }));
jest.mock('~/lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => mockUseNewMediaCall()
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

const TAKE_OVER_TEST_ID = 'sidebar-media-call-take-over';

describe('useStackItems take over', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('hides the take over item when there is no call to take over', () => {
		const { result } = renderHook(() => useStackItems('ChatsStackNavigator'));

		expect(result.current.find(item => item.testID === TAKE_OVER_TEST_ID)).toBeUndefined();
	});

	it('shows the take over item next to the voice call item', () => {
		mockUseCanTakeOverCall.mockReturnValue(true);
		const { result } = renderHook(() => useStackItems('ChatsStackNavigator'));

		const testIDs = result.current.map(item => item.testID);
		expect(testIDs.indexOf(TAKE_OVER_TEST_ID)).toBe(testIDs.indexOf('sidebar-media-call') - 1);

		result.current.find(item => item.testID === TAKE_OVER_TEST_ID)?.onPress();
		expect(mockTakeOverCall).toHaveBeenCalledTimes(1);
	});

	it('hides the take over item without the media call permission', () => {
		mockUseCanTakeOverCall.mockReturnValue(true);
		mockUseNewMediaCall.mockReturnValue({ openNewMediaCall: jest.fn(), hasMediaCallPermission: false, isInActiveCall: false });
		const { result } = renderHook(() => useStackItems('ChatsStackNavigator'));

		expect(result.current.find(item => item.testID === TAKE_OVER_TEST_ID)).toBeUndefined();
	});
});
