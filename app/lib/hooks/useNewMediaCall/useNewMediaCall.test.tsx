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
const mockStartCall = jest.fn();
const mockIsSelfUserId = jest.fn((_userId: unknown) => false);
const mockShowErrorAlert = jest.fn();
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

jest.mock('../../methods/helpers/deviceInfo', () => ({
	isAndroid: false
}));

jest.mock('../../services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: {
		startCall: (...args: unknown[]) => mockStartCall(...args)
	}
}));

jest.mock('../../services/voip/isSelfUserId', () => ({
	isSelfUserId: (userId: unknown) => mockIsSelfUserId(userId)
}));

jest.mock('../../methods/helpers/info', () => ({
	showErrorAlert: (...args: unknown[]) => mockShowErrorAlert(...args)
}));

jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key
	}
}));

describe('useNewMediaCall', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseIsInActiveVoipCall.mockReturnValue(false);
		mockIsSelfUserId.mockReturnValue(false);
		mockStartCall.mockReset();
		mockStartCall.mockResolvedValue(undefined);
	});

	const expectNewMediaCallActionSheet = (expectedFullContainer = false) => {
		expect(mockShowActionSheetRef).toHaveBeenCalledTimes(1);
		const [actionSheetArgs] = mockShowActionSheetRef.mock.calls[0];
		expect(React.isValidElement(actionSheetArgs.children)).toBe(true);
		expect(actionSheetArgs.children.type).toBe(NewMediaCall);
		expect(actionSheetArgs.fullContainer).toBe(expectedFullContainer);
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

	describe('startCallImmediate', () => {
		it('starts the call directly when room has a direct message peer', async () => {
			const room = { name: 'Alice' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue('user-id');

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockStartCall).toHaveBeenCalledWith('user-id', 'user');
			expect(mockShowActionSheetRef).not.toHaveBeenCalled();
			expect(mockShowErrorAlert).not.toHaveBeenCalled();
		});

		it('falls back to action sheet when room has no direct message peer', async () => {
			const room = { name: 'Group' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue(undefined);

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockStartCall).not.toHaveBeenCalled();
			expectNewMediaCallActionSheet();
		});

		it('falls back to action sheet when peer is the logged-in user (note-to-self)', async () => {
			const room = { name: 'Me' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue('self-id');
			mockIsSelfUserId.mockReturnValue(true);

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockStartCall).not.toHaveBeenCalled();
			expectNewMediaCallActionSheet();
		});

		it('shows error alert when startCall throws', async () => {
			const room = { name: 'Alice' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue('user-id');
			mockStartCall.mockRejectedValueOnce(new Error('boom'));

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockStartCall).toHaveBeenCalledWith('user-id', 'user');
			expect(mockShowErrorAlert).toHaveBeenCalledWith('boom', 'Oops');
		});

		it('falls back to default i18n message when error has no message', async () => {
			const room = { name: 'Alice' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue('user-id');
			mockStartCall.mockRejectedValueOnce(new Error(''));

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockShowErrorAlert).toHaveBeenCalledWith('VoIP_Call_Issue', 'Oops');
		});

		it('no-ops when isInActiveCall is true', async () => {
			const room = { name: 'Alice' };
			mockUseSubscription.mockReturnValue(room);
			mockUseMediaCallPermission.mockReturnValue(true);
			mockGetUidDirectMessage.mockReturnValue('user-id');
			mockUseIsInActiveVoipCall.mockReturnValue(true);

			const { result } = renderHook(() => useNewMediaCall('room-id'));

			await act(async () => {
				await result.current.startCallImmediate();
			});

			expect(mockStartCall).not.toHaveBeenCalled();
			expect(mockShowActionSheetRef).not.toHaveBeenCalled();
			expect(mockShowErrorAlert).not.toHaveBeenCalled();
		});
	});

	it('should pass fullContainer to the action sheet when isAndroid is true', () => {
		jest.resetModules();
		jest.doMock('../../methods/helpers/deviceInfo', () => ({
			isAndroid: true
		}));
		// Must load hook after doMock so `fullContainer: isAndroid` uses Android.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { useNewMediaCall: useNewMediaCallAndroid } = require('./useNewMediaCall');

		mockUseSubscription.mockReturnValue(undefined);
		mockUseMediaCallPermission.mockReturnValue(false);

		const { result } = renderHook(() => useNewMediaCallAndroid('room-id'));

		act(() => {
			result.current.openNewMediaCall();
		});

		// Re-required hook uses a fresh NewMediaCall mock ref; only assert fullContainer and element shape.
		expect(mockShowActionSheetRef).toHaveBeenCalledTimes(1);
		const [actionSheetArgs] = mockShowActionSheetRef.mock.calls[0];
		expect(React.isValidElement(actionSheetArgs.children)).toBe(true);
		expect(actionSheetArgs.fullContainer).toBe(true);
	});
});
