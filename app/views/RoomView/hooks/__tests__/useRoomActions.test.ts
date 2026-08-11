import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import { sendMessage } from '../../../../lib/methods/sendMessage';
import { Review } from '../../../../lib/methods/helpers/review';
import { type IUseRoomActionsParams, type RoomState, type RoomStore, type TRoomInitResult } from '../../definitions';
import { useRoomActions } from '../useRoomActions';

jest.mock('../../../../lib/methods/sendMessage', () => ({ sendMessage: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/methods/helpers/review', () => ({ Review: { pushPositiveEvent: jest.fn() } }));
jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));

const mockSendMessage = sendMessage as jest.Mock;
const mockPushPositiveEvent = Review.pushPositiveEvent as jest.Mock;

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		init: jest.fn(() => Promise.resolve<TRoomInitResult>({ status: 'loaded', lastSeen: null })),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve())
	}));

const renderRoomActions = (overrides: Partial<IUseRoomActionsParams> = {}, roomStore = makeRoomStore()) => {
	const defaultProps: IUseRoomActionsParams = {
		rid: 'rid-1',
		tmid: undefined,
		roomStore,
		userRef: { current: { id: 'user-1', token: 'token-1', username: 'user1', showMessageInMainThread: false } },
		resetAction: jest.fn(),
		onMessageSent: jest.fn(),
		...overrides
	};
	const { result } = renderHook((props: IUseRoomActionsParams) => useRoomActions(props), { initialProps: defaultProps });

	return { result, roomStore };
};

describe('useRoomActions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('handleSendMessage is a no-op when message is undefined', () => {
		const resetAction = jest.fn();
		const { result } = renderRoomActions({ resetAction });

		result.current.handleSendMessage(undefined);

		expect(mockSendMessage).not.toHaveBeenCalled();
		expect(resetAction).not.toHaveBeenCalled();
	});

	it('handleSendMessage sends the message, clears the unread divider and resets the composer action', async () => {
		const resetAction = jest.fn();
		const onMessageSent = jest.fn();
		const { result } = renderRoomActions({ tmid: 'tmid-1', resetAction, onMessageSent });

		result.current.handleSendMessage('hello', true);

		expect(mockSendMessage).toHaveBeenCalledWith(
			'rid-1',
			'hello',
			'tmid-1',
			{ id: 'user-1', token: 'token-1', username: 'user1', showMessageInMainThread: false },
			true
		);
		expect(resetAction).toHaveBeenCalledTimes(1);

		await Promise.resolve();
		await Promise.resolve();

		expect(onMessageSent).toHaveBeenCalledTimes(1);
		expect(mockPushPositiveEvent).toHaveBeenCalledTimes(1);
	});
});
