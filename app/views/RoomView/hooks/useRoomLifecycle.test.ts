import { InteractionManager } from 'react-native';
import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import I18n from '../../../i18n';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { Review } from '../../../lib/methods/helpers/review';
import AudioManager from '../../../lib/methods/AudioManager';
import EventEmitterReal from '../../../lib/methods/helpers/events';
import Navigation from '../../../lib/navigation/appNavigation';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import { joinRoom as joinRoomService, toggleFollowMessage } from '../../../lib/services/restApi';
import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import { createMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { LISTENER } from '../../../containers/Toast';
import { type RoomState, type RoomStore } from '../stores/RoomStore';
import { useRoomLifecycle, type IUseRoomLifecycleParams } from './useRoomLifecycle';

jest.mock('../../../lib/methods/sendMessage', () => ({ sendMessage: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/helpers/review', () => ({ Review: { pushPositiveEvent: jest.fn() } }));
jest.mock('../../../lib/methods/AudioManager', () => ({ pauseAudio: jest.fn(), unloadRoomAudios: jest.fn() }));
jest.mock('../../../lib/methods/helpers', () => ({ getRoomTitle: jest.fn(() => 'Room'), isIOS: false }));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../lib/navigation/appNavigation', () => ({ __esModule: true, default: { popToTop: jest.fn() } }));
jest.mock('../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../../lib/database/services/Thread', () => ({ getThreadById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../../lib/methods/getThreadName', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve('Thread Name'))
}));
jest.mock('../../../lib/services/restApi', () => ({ joinRoom: jest.fn(), toggleFollowMessage: jest.fn() }));
jest.mock('../../../ee/omnichannel/lib', () => ({ takeInquiry: jest.fn(), takeResume: jest.fn() }));

const mockSendMessage = sendMessage as jest.Mock;
const mockPushPositiveEvent = Review.pushPositiveEvent as jest.Mock;
const mockUnloadRoomAudios = AudioManager.unloadRoomAudios as jest.Mock;
const mockPopToTop = Navigation.popToTop as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;
const mockGetThreadById = getThreadById as jest.Mock;
const mockGetThreadName = getThreadName as jest.Mock;
const mockJoinRoomService = joinRoomService as jest.Mock;
const mockToggleFollowMessage = toggleFollowMessage as jest.Mock;
const mockTakeInquiry = takeInquiry as jest.Mock;
const mockTakeResume = takeResume as jest.Mock;

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

const renderRoomLifecycle = (overrides: Partial<IUseRoomLifecycleParams> = {}, roomStore = makeRoomStore()) => {
	const unsubscribeBlur = jest.fn();
	const navigation = { addListener: jest.fn(() => unsubscribeBlur) };
	const defaultProps: IUseRoomLifecycleParams = {
		rid: 'rid-1',
		tmid: undefined,
		t: 'c',
		isAuthenticated: true,
		isMasterDetail: false,
		isOmnichannel: false,
		room: { rid: 'rid-1', t: 'c' },
		roomUpdate: {},
		serverVersion: '6.0.0',
		roomStore,
		navigation: navigation as any,
		route: { params: {} } as any,
		dispatch: jest.fn(),
		messageActionStore: createMessageActionStore(),
		sub: undefined,
		queryUnreadsRef: { current: null },
		pendingJumpRef: { current: undefined },
		jumpToThreadIdRef: { current: undefined },
		unreadsCountRef: { current: null },
		roomRef: { current: { rid: 'rid-1', t: 'c' } },
		userRef: { current: { id: 'user-1', token: 'token-1', username: 'user1', showMessageInMainThread: false } },
		joinCodeRef: { current: null },
		consumeJumpParam: jest.fn(),
		navToThread: jest.fn(),
		onQuoteInit: jest.fn(),
		resetAction: jest.fn(),
		onThreadMessagesLoaded: jest.fn(),
		setUnreadsCount: jest.fn(),
		...overrides
	};
	const { result, unmount, rerender } = renderHook((props: IUseRoomLifecycleParams) => useRoomLifecycle(props), {
		initialProps: defaultProps
	});

	return {
		result,
		unmount,
		roomStore,
		navigation,
		unsubscribeBlur,
		rerender: (next: Partial<IUseRoomLifecycleParams> = {}) => rerender({ ...defaultProps, ...next })
	};
};

describe('useRoomLifecycle', () => {
	let runAfterInteractionsSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((task: any) => {
			task();
			return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as any;
		});
	});

	afterEach(() => {
		runAfterInteractionsSpy.mockRestore();
	});

	it('initializes the room store on mount when rid and isAuthenticated are set', () => {
		const roomStore = makeRoomStore();
		renderRoomLifecycle({}, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);
		expect(roomStore.getState().init).toHaveBeenCalledWith(expect.objectContaining({ tmid: undefined }));
	});

	it('does not initialize the room store when not authenticated', () => {
		const roomStore = makeRoomStore();
		renderRoomLifecycle({ isAuthenticated: false }, roomStore);

		expect(roomStore.getState().init).not.toHaveBeenCalled();
	});

	it('handleSendMessage is a no-op when message is undefined', () => {
		const resetAction = jest.fn();
		const { result } = renderRoomLifecycle({ resetAction });

		result.current.handleSendMessage(undefined);

		expect(mockSendMessage).not.toHaveBeenCalled();
		expect(resetAction).not.toHaveBeenCalled();
	});

	it('handleSendMessage sends the message, marks it sent and resets the composer action', async () => {
		const resetAction = jest.fn();
		const roomStore = makeRoomStore();
		const { result } = renderRoomLifecycle({ tmid: 'tmid-1', resetAction }, roomStore);

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

	it('unsubscribes the blur listener and unloads room audio on unmount when there is no tmid', () => {
		const { unmount, unsubscribeBlur } = renderRoomLifecycle({ tmid: undefined });

		unmount();

		expect(unsubscribeBlur).toHaveBeenCalledTimes(1);
		expect(mockUnloadRoomAudios).toHaveBeenCalledWith('rid-1');
	});

	it('does not unload room audio on unmount when there is a tmid', () => {
		const { unmount } = renderRoomLifecycle({ tmid: 'tmid-1' });

		unmount();

		expect(mockUnloadRoomAudios).not.toHaveBeenCalled();
	});

	it('joinRoom calls the join service with the room rid and joinCode, then joins the room store', async () => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomLifecycle({}, roomStore);

		await result.current.joinRoom();

		expect(mockJoinRoomService).toHaveBeenCalledWith('rid-1', null, 'c');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});

	it('joinRoom omnichannel path calls takeInquiry with the room id and server version, then joins', async () => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomLifecycle(
			{ isOmnichannel: true, room: { _id: 'room-id-1', rid: 'rid-1', t: 'l' } as any, serverVersion: '6.1.0' },
			roomStore
		);

		await result.current.joinRoom();

		expect(mockTakeInquiry).toHaveBeenCalledWith('room-id-1', '6.1.0');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});

	it('resumeRoom does nothing when the room is not omnichannel', async () => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomLifecycle({}, roomStore);

		await result.current.resumeRoom();

		expect(mockTakeResume).not.toHaveBeenCalled();
		expect(roomStore.getState().join).not.toHaveBeenCalled();
	});

	it('resumeRoom calls takeResume with the room rid then joins for omnichannel rooms', async () => {
		const roomStore = makeRoomStore();
		const { result } = renderRoomLifecycle({ isOmnichannel: true }, roomStore);

		await result.current.resumeRoom();

		expect(mockTakeResume).toHaveBeenCalledWith('rid-1');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});

	it('toggleFollowThread toggles the follow flag via REST and emits a following-thread toast', async () => {
		const emitSpy = jest.spyOn(EventEmitterReal, 'emit');
		const { result } = renderRoomLifecycle({ tmid: 'tmid-1' });

		await result.current.toggleFollowThread(false);

		expect(mockToggleFollowMessage).toHaveBeenCalledWith('tmid-1', true);
		expect(emitSpy).toHaveBeenCalledWith(LISTENER, { message: I18n.t('Following_thread') });
	});

	it('toggleFollowThread prefers the explicit threadId over tmid and emits an unfollowed toast', async () => {
		const emitSpy = jest.spyOn(EventEmitterReal, 'emit');
		const { result } = renderRoomLifecycle({ tmid: 'tmid-1' });

		await result.current.toggleFollowThread(true, 'thread-2');

		expect(mockToggleFollowMessage).toHaveBeenCalledWith('thread-2', false);
		expect(emitSpy).toHaveBeenCalledWith(LISTENER, { message: I18n.t('Unfollowed_thread') });
	});

	it('toggleFollowThread is a no-op without a thread id', async () => {
		const { result } = renderRoomLifecycle({ tmid: undefined });

		await result.current.toggleFollowThread(false);

		expect(mockToggleFollowMessage).not.toHaveBeenCalled();
	});

	it('fetchThreadName returns the removed-message copy when the thread was deleted', async () => {
		mockGetThreadById.mockResolvedValueOnce({ t: 'rm' });
		const { result } = renderRoomLifecycle({});

		const name = await result.current.fetchThreadName('thread-1', 'msg-1');

		expect(name).toBe(I18n.t('Message_removed'));
		expect(mockGetThreadName).not.toHaveBeenCalled();
	});

	it('fetchThreadName delegates to the thread-name service otherwise', async () => {
		mockGetThreadById.mockResolvedValueOnce({ t: 'c' });
		mockGetThreadName.mockResolvedValueOnce('Resolved Name');
		const { result } = renderRoomLifecycle({});

		const name = await result.current.fetchThreadName('thread-1', 'msg-1');

		expect(mockGetThreadName).toHaveBeenCalledWith('rid-1', 'thread-1', 'msg-1');
		expect(name).toBe('Resolved Name');
	});

	it('emits a popToTop navigation and error alert when the removed room matches the current rid', () => {
		const roomRef = { current: { rid: 'rid-removed-alert', t: 'c' } };
		renderRoomLifecycle({ rid: 'rid-removed-alert', isMasterDetail: true, roomRef });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'rid-removed-alert' });

		expect(mockPopToTop).toHaveBeenCalledWith(true);
		expect(mockShowErrorAlert).toHaveBeenCalledWith(I18n.t('You_were_removed_from_channel', { channel: 'Room' }), I18n.t('Oops'));
	});

	it('does not show an error alert when the removed room is a livechat room', () => {
		const roomRef = { current: { rid: 'rid-removed-livechat', t: 'l' } };
		renderRoomLifecycle({ rid: 'rid-removed-livechat', roomRef });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'rid-removed-livechat' });

		expect(mockPopToTop).toHaveBeenCalledWith(false);
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('ignores room-removed events for a different rid', () => {
		renderRoomLifecycle({ rid: 'rid-removed-ignore' });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'some-other-rid' });

		expect(mockPopToTop).not.toHaveBeenCalled();
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('re-initializes the room store when the room transitions out of INVITED status', () => {
		const roomStore = makeRoomStore();
		const { rerender } = renderRoomLifecycle({ roomUpdate: { status: 'INVITED' } }, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);

		rerender({ roomUpdate: { status: 'READY' } });

		expect(roomStore.getState().init).toHaveBeenCalledTimes(2);
	});

	it('does not re-initialize the room store when the status changes without having been INVITED', () => {
		const roomStore = makeRoomStore();
		const { rerender } = renderRoomLifecycle({ roomUpdate: { status: 'READY' } }, roomStore);

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);

		rerender({ roomUpdate: { status: 'ANOTHER' } });

		expect(roomStore.getState().init).toHaveBeenCalledTimes(1);
	});
});
