import { act, render } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { createRoomStore, observeRoom } from '../RoomStore';
import { RoomStoreContext, useRoomStore, useRoomWithUpdate } from '../RoomStoreContext';

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

const mockGet = database.active.get as jest.Mock;

const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'old' };

const setupObserve = () => {
	let emit: ((rows: any[]) => void) | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: (rows: any[]) => void) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return { emit: (rows: any[]) => emit?.(rows) };
};

describe('useRoomWithUpdate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('re-renders with the fresh field when the same room instance re-emits a mutated tracked column', () => {
		const { emit } = setupObserve();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });
		observeRoom('rid-1', store);
		const spy = jest.fn();

		const Probe = () => {
			const room = useRoomWithUpdate();
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<Probe />
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

	it('does NOT re-render a plain `s.room` selector on the same mutated-in-place emit (documents why the hook exists)', () => {
		const { emit } = setupObserve();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });
		observeRoom('rid-1', store);
		const spy = jest.fn();

		const PlainProbe = () => {
			const room = useRoomStore(s => s.room);
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<PlainProbe />
			</RoomStoreContext.Provider>
		);

		const mutable = { ...subRoom };
		act(() => emit([mutable]));
		const callsAfterFirstEmit = spy.mock.calls.length;

		// Same reference, mutated in place — the plain `room` selector sees no reference change and skips the re-render.
		mutable.topic = 'new';
		act(() => emit([mutable]));

		expect(spy.mock.calls.length).toBe(callsAfterFirstEmit);
		expect(spy).toHaveBeenLastCalledWith('old');
	});
});
