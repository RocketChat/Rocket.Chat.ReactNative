import { createStore } from 'zustand';

import { type RoomState, type RoomStore, type TRoomInitResult } from '../definitions';

export const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		room: { room: { rid: 'rid-1', t: 'c' } },
		observedValues: {},
		joined: true,
		subscribed: true,
		member: {},
		roomUserId: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		lastMessageFromAgent: false,
		init: jest.fn(() => Promise.resolve<TRoomInitResult>({ status: 'loaded', lastSeen: null })),
		join: jest.fn(),
		joinRoom: jest.fn(() => Promise.resolve()),
		resumeRoom: jest.fn(() => Promise.resolve()),
		...overrides
	}));
