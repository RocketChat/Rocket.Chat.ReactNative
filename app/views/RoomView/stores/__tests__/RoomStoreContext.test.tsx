import { act, render } from '@testing-library/react-native';

import { createRoomStore, observeRoom } from '../RoomStore';
import { RoomStoreContext, useRoomStore, useRoom } from '../RoomStoreContext';
import { getRoom } from '../../../../lib/roomObservation';
import { setupObserveRoomDatabase } from './observeRoomHarness';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());

const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'old' };

describe('useRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('re-renders with the fresh field when the same room instance re-emits a mutated tracked column', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });
		observeRoom('rid-1', store);
		const spy = jest.fn();

		const Reader = () => {
			const { room } = useRoom();
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<Reader />
			</RoomStoreContext.Provider>
		);
		expect(spy).toHaveBeenLastCalledWith('old');

		const mutable = { ...subRoom };
		act(() => emit([mutable]));
		expect(spy).toHaveBeenLastCalledWith('old');

		// observeWithColumns re-emits the same cached instance, mutated in place
		mutable.topic = 'new';
		act(() => emit([mutable]));

		expect(spy).toHaveBeenLastCalledWith('new');
	});

	it('re-renders a `s.roomSnapshot` selector only when a tracked field of the same instance changes', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });
		observeRoom('rid-1', store);
		const spy = jest.fn();

		const SnapshotReader = () => {
			const snapshot = useRoomStore(s => s.roomSnapshot);
			const room = getRoom(snapshot);
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<SnapshotReader />
			</RoomStoreContext.Provider>
		);

		const mutable = { ...subRoom };
		act(() => emit([mutable]));
		const callsAfterFirstEmit = spy.mock.calls.length;

		act(() => emit([mutable]));
		expect(spy.mock.calls.length).toBe(callsAfterFirstEmit);
		expect(spy).toHaveBeenLastCalledWith('old');

		mutable.topic = 'new';
		act(() => emit([mutable]));

		expect(spy.mock.calls.length).toBe(callsAfterFirstEmit + 1);
		expect(spy).toHaveBeenLastCalledWith('new');
	});
});
