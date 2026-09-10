import { act, render } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type RoomState, type RoomStore } from '../../definitions';
import { RoomStoreContext, useRoomStore } from '../RoomStoreContext';

const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', topic: 'old', name: 'general' };

const makeRoomStore = (): RoomStore =>
	createStore<RoomState>(() => ({
		room: subRoom,
		membership: 'subscribed',
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		init: jest.fn(),
		join: jest.fn(),
		joinRoom: jest.fn(),
		resumeRoom: jest.fn()
	}));

describe('field selector invariant', () => {
	it('re-renders when the selected field is mutated in place and re-emitted', () => {
		const store = makeRoomStore();
		const spy = jest.fn();

		const Probe = () => {
			const topic = useRoomStore(s => ('topic' in s.room ? s.room.topic : undefined));
			spy(topic);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<Probe />
			</RoomStoreContext.Provider>
		);
		expect(spy).toHaveBeenLastCalledWith('old');

		act(() => {
			(store.getState().room as typeof subRoom).topic = 'new';
			store.setState({ room: store.getState().room });
		});

		expect(spy).toHaveBeenLastCalledWith('new');
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('does not re-render when an unrelated field changes', () => {
		const store = makeRoomStore();
		const spy = jest.fn();

		const Probe = () => {
			const topic = useRoomStore(s => ('topic' in s.room ? s.room.topic : undefined));
			spy(topic);
			return null;
		};

		render(
			<RoomStoreContext.Provider value={store}>
				<Probe />
			</RoomStoreContext.Provider>
		);
		expect(spy).toHaveBeenCalledTimes(1);

		act(() => {
			(store.getState().room as typeof subRoom).name = 'renamed';
			store.setState({ room: store.getState().room });
		});

		expect(spy).toHaveBeenCalledTimes(1);
	});
});
