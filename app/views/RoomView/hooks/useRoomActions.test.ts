import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import I18n from '../../../i18n';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { Review } from '../../../lib/methods/helpers/review';
import EventEmitterReal from '../../../lib/methods/helpers/events';
import { toggleFollowMessage } from '../../../lib/services/restApi';
import { LISTENER } from '../../../containers/Toast';
import { type RoomState, type RoomStore } from '../stores/RoomStore';
import { useRoomActions, type IUseRoomActionsParams } from './useRoomActions';

jest.mock('../../../lib/methods/sendMessage', () => ({ sendMessage: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/helpers/review', () => ({ Review: { pushPositiveEvent: jest.fn() } }));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../lib/services/restApi', () => ({ toggleFollowMessage: jest.fn() }));

const mockSendMessage = sendMessage as jest.Mock;
const mockPushPositiveEvent = Review.pushPositiveEvent as jest.Mock;
const mockToggleFollowMessage = toggleFollowMessage as jest.Mock;

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: { rid: 'rid-1', t: 'c' },
		roomUpdate: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		loading: false,
		lastOpen: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,
		init: jest.fn(() => Promise.resolve()),
		join: jest.fn(),
		markMessageSent: jest.fn()
	}));

const renderRoomActions = (overrides: Partial<IUseRoomActionsParams> = {}, roomStore = makeRoomStore()) => {
	const defaultProps: IUseRoomActionsParams = {
		rid: 'rid-1',
		tmid: undefined,
		roomStore,
		userRef: { current: { id: 'user-1', token: 'token-1', username: 'user1', showMessageInMainThread: false } },
		resetAction: jest.fn(),
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

	it('handleSendMessage sends the message, marks it sent and resets the composer action', async () => {
		const resetAction = jest.fn();
		const roomStore = makeRoomStore();
		const { result } = renderRoomActions({ tmid: 'tmid-1', resetAction }, roomStore);

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

		expect(roomStore.getState().markMessageSent).toHaveBeenCalledTimes(1);
		expect(mockPushPositiveEvent).toHaveBeenCalledTimes(1);
	});

	it('toggleFollowThread toggles the follow flag via REST and emits a following-thread toast', async () => {
		const emitSpy = jest.spyOn(EventEmitterReal, 'emit');
		const { result } = renderRoomActions({ tmid: 'tmid-1' });

		await result.current.toggleFollowThread(false);

		expect(mockToggleFollowMessage).toHaveBeenCalledWith('tmid-1', true);
		expect(emitSpy).toHaveBeenCalledWith(LISTENER, { message: I18n.t('Following_thread') });
	});

	it('toggleFollowThread prefers the explicit threadId over tmid and emits an unfollowed toast', async () => {
		const emitSpy = jest.spyOn(EventEmitterReal, 'emit');
		const { result } = renderRoomActions({ tmid: 'tmid-1' });

		await result.current.toggleFollowThread(true, 'thread-2');

		expect(mockToggleFollowMessage).toHaveBeenCalledWith('thread-2', false);
		expect(emitSpy).toHaveBeenCalledWith(LISTENER, { message: I18n.t('Unfollowed_thread') });
	});

	it('toggleFollowThread is a no-op without a thread id', async () => {
		const { result } = renderRoomActions({ tmid: undefined });

		await result.current.toggleFollowThread(false);

		expect(mockToggleFollowMessage).not.toHaveBeenCalled();
	});
});
