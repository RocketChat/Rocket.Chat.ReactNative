import { createStore } from 'zustand';

import { type RoomState, type RoomStore, type TRoomInitResult } from '../definitions';
import { createRoomSnapshot } from '../../../lib/roomObservation';
import { type TRoomOrPreview } from '../../../definitions/TRoom';
import { type TSubscriptionModel } from '../../../definitions/ISubscription';

const DEFAULT_ROOM = { rid: 'rid-1', t: 'c' };

export const makeRoomStore = (overrides: Partial<RoomState> = {}): RoomStore =>
	createStore<RoomState>(() => ({
		roomSnapshot: createRoomSnapshot(DEFAULT_ROOM),
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

export const makeRoomSnapshotState = (
	roomDouble: Partial<Omit<TSubscriptionModel, 't'>> & { t?: string }
): Pick<RoomState, 'roomSnapshot'> => ({ roomSnapshot: createRoomSnapshot(roomDouble as TRoomOrPreview) });
