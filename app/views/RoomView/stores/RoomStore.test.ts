import { createStore } from 'zustand';

jest.mock('../../../lib/methods/readMessages', () => ({ readMessages: jest.fn() }));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn() }));
jest.mock('../../../lib/services/restApi', () => ({ getUserInfo: jest.fn() }));
jest.mock('../../../lib/database', () => ({ __esModule: true, default: { active: { get: jest.fn() } } }));

import { type RoomState } from '../definitions';
import { createRoomStore } from './RoomStore';

const makeState = (): RoomState => ({
	room: { rid: 'rid-1', t: 'c' },
	roomUpdate: {},
	joined: true,
	subscribed: false,
	member: {},
	roomUserId: null,
	canAutoTranslate: false,
	canForwardGuest: false,
	canViewCannedResponse: false,
	lastMessageFromAgent: false,
	init: jest.fn(),
	join: jest.fn(),
	joinRoom: jest.fn(),
	resumeRoom: jest.fn()
});

describe('RoomStore ownership', () => {
	it('creates independent stores for screens sharing a rid', () => {
		const first = createRoomStore({ rid: 'rid-1', initialRoom: { rid: 'rid-1', t: 'c' } });
		const second = createRoomStore({ rid: 'rid-1', initialRoom: { rid: 'rid-1', t: 'c' } });
		expect(second).not.toBe(first);
		first.setState({ joined: false });
		expect(second.getState().joined).toBe(true);
	});

	it('does not share state with unrelated Zustand stores', () => {
		const first = createStore<RoomState>(makeState);
		const second = createRoomStore({ rid: 'rid-1', initialRoom: { rid: 'rid-1', t: 'c' } });
		first.setState({ canForwardGuest: true });
		expect(second.getState().canForwardGuest).toBe(false);
	});
});
