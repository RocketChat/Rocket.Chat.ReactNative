import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import { NewMediaCall } from '../../../containers/NewMediaCall';
import { useNewMediaCall } from './useNewMediaCall';

const mockUseSubscription = jest.fn();
const mockUseMediaCallPermission = jest.fn();
const mockShowActionSheetRef = jest.fn();
const mockGetUidDirectMessage = jest.fn();
const mockSetSelectedPeer = jest.fn();
const mockUseIsInActiveVoipCall = jest.fn(() => false);
const mockGetState = jest.fn(() => ({
	setSelectedPeer: mockSetSelectedPeer
}));

jest.mock('../useSubscription', () => ({
	useSubscription: (rid?: string) => mockUseSubscription(rid)
}));

jest.mock('../useMediaCallPermission', () => ({
	useMediaCallPermission: () => mockUseMediaCallPermission()
}));

jest.mock('../../../containers/ActionSheet', () => ({
	showActionSheetRef: (params: unknown) => mockShowActionSheetRef(params)
}));

jest.mock('../../methods/helpers/helpers', () => ({
	getUidDirectMessage: (room: unknown) => mockGetUidDirectMessage(room)
}));

jest.mock('../../services/voip/usePeerAutocompleteStore', () => ({
	usePeerAutocompleteStore: {
		getState: () => mockGetState()
	}
}));

jest.mock('../../services/voip/isInActiveVoipCall', () => ({
	useIsInActiveVoipCall: () => mockUseIsInActiveVoipCall()
}));

jest.mock('../../../containers/NewMediaCall', () => ({
	NewMediaCall: jest.fn(() => null)
}));

describe('useNewMediaCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseIsInActiveVoipCall.mockReturnValue(false);
	});

	const expectNewMediaCallActionSheet = () => {
		expect(mockShowActionSheetRef).toHaveBeenCalledTimes(1);
		const [actionSheetArgs] = mockShowActionSheetRef.mock.calls[0];
		expect(React.isValidElement(actionSheetArgs.children)).toBe(true);
		expect(actionSheetArgs.children.type).toBe(NewMediaCall);
	};

	it('should set selected peer and open action sheet when room has a direct message peer', () => {
		const room = { name: 'Alice' };
		mockUseSubscription.mockReturnValue(room);
		mockUseMediaCallPermission.mockReturnValue(true);
		mockGetUidDirectMessage.mockReturnValue('user-id');

		const { result } = renderHook(() => useNewMediaCall('room-id'));

		act(() => {
			result.current.openNewMediaCall();
		});

		expect(mockGetUidDirectMessage).toHaveBeenCalledWith(room);
		expect(mockSetSelectedPeer).toHaveBeenCalledWith({
			type: 'user',
			value: 'user-id',
			label: 'Alice'
		});
		expectNewMediaCallActionSheet();
	});

	it('should open action sheet without setting selected peer when room has no direct message peer', () => {
		const room = { name: 'Alice' };
		mockUseSubscription.mockReturnValue(room);
		mockUseMediaCallPermission.mockReturnValue(true);
		mockGetUidDirectMessage.mockReturnValue(undefined);

		const { result } = renderHook(() => useNewMediaCall('room-id'));

		act(() => {
			result.current.openNewMediaCall();
		});

		expect(mockGetUidDirectMessage).toHaveBeenCalledWith(room);
		expect(mockSetSelectedPeer).not.toHaveBeenCalled();
		expectNewMediaCallActionSheet();
	});

	it('should open action sheet without resolving direct message peer when room is missing', () => {
		mockUseSubscription.mockReturnValue(undefined);
		mockUseMediaCallPermission.mockReturnValue(false);

		const { result } = renderHook(() => useNewMediaCall('room-id'));

		act(() => {
			result.current.openNewMediaCall();
		});

		expect(mockGetUidDirectMessage).not.toHaveBeenCalled();
		expect(mockSetSelectedPeer).not.toHaveBeenCalled();
		expectNewMediaCallActionSheet();
	});

	it('exposes isInActiveCall from useIsInActiveVoipCall', () => {
		mockUseSubscription.mockReturnValue(undefined);
		mockUseMediaCallPermission.mockReturnValue(true);
		mockUseIsInActiveVoipCall.mockReturnValue(true);

		const { result } = renderHook(() => useNewMediaCall('room-id'));

		expect(result.current.isInActiveCall).toBe(true);
	});

	it('openNewMediaCall no-ops when isInActiveCall is true', () => {
		const room = { name: 'Alice' };
		mockUseSubscription.mockReturnValue(room);
		mockUseMediaCallPermission.mockReturnValue(true);
		mockGetUidDirectMessage.mockReturnValue('user-id');
		mockUseIsInActiveVoipCall.mockReturnValue(true);

		const { result } = renderHook(() => useNewMediaCall('room-id'));

		act(() => {
			result.current.openNewMediaCall();
		});

		expect(mockShowActionSheetRef).not.toHaveBeenCalled();
		expect(mockSetSelectedPeer).not.toHaveBeenCalled();
	});
});
