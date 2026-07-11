import { InteractionManager } from 'react-native';
import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import { sendMessage } from '../../../lib/methods/sendMessage';
import { Review } from '../../../lib/methods/helpers/review';
import AudioManager from '../../../lib/methods/AudioManager';
import { createMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
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
jest.mock('../../../lib/services/restApi', () => ({ joinRoom: jest.fn(), toggleFollowMessage: jest.fn() }));
jest.mock('../../../ee/omnichannel/lib', () => ({ takeInquiry: jest.fn(), takeResume: jest.fn() }));

const mockSendMessage = sendMessage as jest.Mock;
const mockPushPositiveEvent = Review.pushPositiveEvent as jest.Mock;
const mockUnloadRoomAudios = AudioManager.unloadRoomAudios as jest.Mock;

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
	const { result, unmount } = renderHook(() =>
		useRoomLifecycle({
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
			setState: jest.fn(),
			...overrides
		})
	);

	return { result, unmount, roomStore, navigation, unsubscribeBlur };
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
});
