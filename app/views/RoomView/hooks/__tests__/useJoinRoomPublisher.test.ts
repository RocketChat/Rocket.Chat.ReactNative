import { createStore } from 'zustand';
import { renderHook } from '@testing-library/react-native';

import { joinRoom as joinRoomService } from '../../../../lib/services/restApi';
import { takeInquiry, takeResume } from '../../../../ee/omnichannel/lib';
import { type IUseJoinRoomPublisherParams, type RoomState, type RoomStore } from '../../definitions';
import { useJoinRoomPublisher } from '../useJoinRoomPublisher';

jest.mock('../../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	...jest.requireActual('../../../../lib/methods/helpers/log'),
	default: jest.fn(),
	logEvent: jest.fn()
}));
jest.mock('../../../../lib/services/restApi', () => ({ joinRoom: jest.fn() }));
jest.mock('../../../../ee/omnichannel/lib', () => ({ takeInquiry: jest.fn(), takeResume: jest.fn() }));

const mockJoinRoomService = joinRoomService as jest.Mock;
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

const renderJoinRoomPublisher = (overrides: Partial<IUseJoinRoomPublisherParams> = {}, roomStore = makeRoomStore()) => {
	const defaultProps: IUseJoinRoomPublisherParams = {
		roomStore,
		room: { rid: 'rid-1', t: 'c' },
		isOmnichannel: false,
		serverVersion: '6.0.0',
		t: 'c',
		joinCodeRef: { current: null },
		...overrides
	};
	renderHook((props: IUseJoinRoomPublisherParams) => useJoinRoomPublisher(props), { initialProps: defaultProps });

	return { roomStore };
};

describe('useJoinRoomPublisher', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('joinRoom calls the join service with the room rid and joinCode, then joins the room store', async () => {
		const roomStore = makeRoomStore();
		renderJoinRoomPublisher({}, roomStore);

		await roomStore.getState().joinRoom?.();

		expect(mockJoinRoomService).toHaveBeenCalledWith('rid-1', null, 'c');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});

	it('joinRoom shows the join-code modal instead of auto-joining a protected room without a subscription', async () => {
		const roomStore = makeRoomStore();
		const show = jest.fn();
		renderJoinRoomPublisher(
			{ room: { rid: 'rid-1', t: 'c', joinCodeRequired: true }, joinCodeRef: { current: { show } } },
			roomStore
		);

		await roomStore.getState().joinRoom?.();

		expect(show).toHaveBeenCalledTimes(1);
		expect(mockJoinRoomService).not.toHaveBeenCalled();
		expect(roomStore.getState().join).not.toHaveBeenCalled();
	});

	it('joinRoom omnichannel path calls takeInquiry with the room id and server version, then joins', async () => {
		const roomStore = makeRoomStore();
		renderJoinRoomPublisher(
			{ isOmnichannel: true, room: { _id: 'room-id-1', rid: 'rid-1', t: 'l' } as any, serverVersion: '6.1.0' },
			roomStore
		);

		await roomStore.getState().joinRoom?.();

		expect(mockTakeInquiry).toHaveBeenCalledWith('room-id-1', '6.1.0');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});

	it('resumeRoom does nothing when the room is not omnichannel', async () => {
		const roomStore = makeRoomStore();
		renderJoinRoomPublisher({}, roomStore);

		await roomStore.getState().resumeRoom?.();

		expect(mockTakeResume).not.toHaveBeenCalled();
		expect(roomStore.getState().join).not.toHaveBeenCalled();
	});

	it('resumeRoom calls takeResume with the room rid then joins for omnichannel rooms', async () => {
		const roomStore = makeRoomStore();
		renderJoinRoomPublisher({ isOmnichannel: true }, roomStore);

		await roomStore.getState().resumeRoom?.();

		expect(mockTakeResume).toHaveBeenCalledWith('rid-1');
		expect(roomStore.getState().join).toHaveBeenCalledTimes(1);
	});
});
