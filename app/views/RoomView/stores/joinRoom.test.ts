import { joinRoom as joinRoomService } from '../../../lib/services/restApi';
import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import { type IRoomViewState } from '../definitions';
import { peekOrCreateRoomStore, releaseRoomStore } from './RoomStore';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({
				query: () => ({
					observeWithColumns: () => ({
						subscribe: (next: (rows: unknown[]) => void) => {
							next([]);
							return { unsubscribe: jest.fn() };
						}
					})
				})
			})
		}
	}
}));
jest.mock('../services/getMessages', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => false)
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: {}
}));
jest.mock('../../../lib/services/restApi', () => ({ joinRoom: jest.fn(() => Promise.resolve()), getUserInfo: jest.fn() }));
jest.mock('../../../ee/omnichannel/lib', () => ({
	takeInquiry: jest.fn(() => Promise.resolve()),
	takeResume: jest.fn(() => Promise.resolve())
}));

const mockJoinRoomService = joinRoomService as jest.Mock;
const mockTakeInquiry = takeInquiry as jest.Mock;
const mockTakeResume = takeResume as jest.Mock;

// rid-less stores bypass the registry, so each case gets an isolated store with the full creator actions.
const makeStore = (room: IRoomViewState['room']) => {
	const store = peekOrCreateRoomStore({ initialRoom: room });
	store.setState({ join: jest.fn() });
	return store;
};

describe('RoomStore join/resume actions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('joinRoom fires the caller-supplied join-code trigger for a protected room and does not auto-join', async () => {
		const store = makeStore({ rid: 'rid-1', t: 'c', joinCodeRequired: true });
		const trigger = jest.fn();

		await store.getState().joinRoom(trigger);

		expect(trigger).toHaveBeenCalledTimes(1);
		expect(mockJoinRoomService).not.toHaveBeenCalled();
		expect(store.getState().join).not.toHaveBeenCalled();
	});

	it('joinRoom no-ops silently for a protected room when no trigger is passed', async () => {
		const store = makeStore({ rid: 'rid-1', t: 'c', joinCodeRequired: true });

		await expect(store.getState().joinRoom()).resolves.toBeUndefined();

		expect(mockJoinRoomService).not.toHaveBeenCalled();
		expect(store.getState().join).not.toHaveBeenCalled();
	});

	it('joinRoom omnichannel path calls takeInquiry with the room id, then joins', async () => {
		const store = makeStore({ _id: 'room-id-1', rid: 'rid-1', t: 'l' } as any);

		await store.getState().joinRoom();

		expect(mockTakeInquiry).toHaveBeenCalledWith('room-id-1');
		expect(store.getState().join).toHaveBeenCalledTimes(1);
	});

	it('joinRoom omnichannel path on a warmed rid-keyed store passes no server version', async () => {
		const room = { _id: 'room-id-2', rid: 'warm-rid', t: 'l' } as any;
		const warmed = peekOrCreateRoomStore({ rid: 'warm-rid', initialRoom: room });
		warmed.setState({ room, join: jest.fn() });

		await warmed.getState().joinRoom();

		expect(mockTakeInquiry).toHaveBeenCalledWith('room-id-2');
		expect(warmed.getState().join).toHaveBeenCalledTimes(1);
		releaseRoomStore('warm-rid');
	});

	it('joinRoom plain path calls the join service then joins the store', async () => {
		const store = makeStore({ rid: 'rid-1', t: 'c' });

		await store.getState().joinRoom();

		expect(mockJoinRoomService).toHaveBeenCalledWith('rid-1', null, 'c');
		expect(store.getState().join).toHaveBeenCalledTimes(1);
	});

	it('resumeRoom calls takeResume then joins for omnichannel rooms', async () => {
		const store = makeStore({ rid: 'rid-1', t: 'l' } as any);

		await store.getState().resumeRoom();

		expect(mockTakeResume).toHaveBeenCalledWith('rid-1');
		expect(store.getState().join).toHaveBeenCalledTimes(1);
	});

	it('resumeRoom does nothing when the room is not omnichannel', async () => {
		const store = makeStore({ rid: 'rid-1', t: 'c' });

		await store.getState().resumeRoom();

		expect(mockTakeResume).not.toHaveBeenCalled();
		expect(store.getState().join).not.toHaveBeenCalled();
	});
});
