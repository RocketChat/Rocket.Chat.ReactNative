import { InteractionManager } from 'react-native';
import { act, render } from '@testing-library/react-native';

import database from '../../database';
import { createStaticRoomStore, peekRoomStore, warmRoomStore } from '../../../views/RoomView/stores/RoomStore';
import { mountRoomScreenAndCaptureSweeps } from '../../../views/RoomView/stores/__tests__/roomStoreLifecycle';
import { RoomStoreContext, useRoomStore, useRoomWithUpdate } from '../RoomStoreContext';

jest.mock('../../database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../views/RoomView/services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../methods/helpers/log', () => jest.fn());

const mockGet = database.active.get as jest.Mock;

const subscriptionRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'old' };

const setupObserve = () => {
	let emit: ((rows: any[]) => void) | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (callback: (rows: any[]) => void) => {
			emit = callback;
			return { unsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return { emit: (rows: any[]) => emit?.(rows) };
};

describe('RoomStoreContext', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
			cb();
			return { then: () => {} };
		}) as unknown as typeof InteractionManager.runAfterInteractions);
	});

	afterEach(() => {
		setupObserve();
		const runAfterInteractionsSpy = mountRoomScreenAndCaptureSweeps({ rid: 'rid-1', initialRoom: subscriptionRoom });
		runAfterInteractionsSpy.mockRestore();
	});

	it('re-renders with the fresh field when the same room instance re-emits a mutated tracked column', () => {
		const { emit } = setupObserve();
		const store = warmRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subscriptionRoom });
		const spy = jest.fn();

		const RoomTopic = () => {
			const room = useRoomWithUpdate();
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<RoomTopic />
			</RoomStoreContext.Provider>
		);
		expect(spy).toHaveBeenLastCalledWith('old');

		const mutableRoom = { ...subscriptionRoom };
		act(() => emit([mutableRoom]));
		expect(spy).toHaveBeenLastCalledWith('old');

		mutableRoom.topic = 'new';
		act(() => emit([mutableRoom]));

		expect(spy).toHaveBeenLastCalledWith('new');
	});

	it('does not re-render a plain room selector on the same mutated-in-place emit', () => {
		const { emit } = setupObserve();
		const store = warmRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subscriptionRoom });
		const spy = jest.fn();

		const RoomTopic = () => {
			const room = useRoomStore(state => state.room);
			spy('topic' in room ? room.topic : undefined);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<RoomTopic />
			</RoomStoreContext.Provider>
		);

		const mutableRoom = { ...subscriptionRoom };
		act(() => emit([mutableRoom]));
		const callsAfterFirstEmit = spy.mock.calls.length;

		mutableRoom.topic = 'new';
		act(() => emit([mutableRoom]));

		expect(spy.mock.calls.length).toBe(callsAfterFirstEmit);
		expect(spy).toHaveBeenLastCalledWith('old');
	});

	it('creates a static store without observing or registering the room', () => {
		const room = { rid: 'static-rid', t: 'c', name: 'static-room' } as const;

		const store = createStaticRoomStore(room);

		expect(store.getState().room).toBe(room);
		expect(peekRoomStore(room.rid)).not.toBe(store);
		expect(peekRoomStore(room.rid).getState().room).toEqual({ rid: '', t: '' });
		expect(mockGet).not.toHaveBeenCalled();
	});
});
