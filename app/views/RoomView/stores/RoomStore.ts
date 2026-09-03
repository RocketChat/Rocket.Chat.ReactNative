import { Q } from '@nozbe/watermelondb';
import { createStore, type StateCreator } from 'zustand';

import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../lib/methods/readMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat, getUidDirectMessage, canAutoTranslate as canAutoTranslateMethod } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type RoomType, type TSubscriptionModel } from '../../../definitions';
import { type IRoomStoreInitParams, type IRoomViewState, type RoomState, type RoomStore } from '../definitions';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import getMessages from '../services/getMessages';
import { joinRoomImpl, resumeRoomImpl } from '../services/joinRoom';

const OBSERVED_COLUMNS = Object.values(roomAttrsUpdateColumns);

interface IRoomMemberResult {
	// Absent for anything that is not a one-to-one DM: the caller leaves the current value alone
	// instead of clearing a roomUserId it was seeded with.
	roomUserId?: string;
	member: IRoomViewState['member'];
}

// Pure read: resolves the DM counterpart without touching the store, so nothing lands in state
// until the caller decides the run is still current.
const getRoomMember = async (room: IRoomViewState['room']): Promise<IRoomMemberResult> => {
	if ('id' in room && room.t === 'd' && !isGroupChat(room)) {
		const roomUserId = getUidDirectMessage(room);
		try {
			const result = await getUserInfo(roomUserId);
			if (result.success) {
				return { roomUserId, member: result.user };
			}
		} catch (e) {
			log(e);
		}
		return { roomUserId, member: {} };
	}
	return { member: {} };
};

const EMPTY_ROOM: IRoomViewState['room'] = { rid: '', t: '' };

const INIT_MAX_ATTEMPTS = 3;
const INIT_RETRY_DELAY = 1000;

interface ILoadRoomResult {
	failed: boolean;
	// An invite subscription is not loaded, it is declined work: `init` reports it as `skipped`.
	skipped?: boolean;
	lastSeen: IRoomViewState['lastSeen'];
	// The read receipt the attempt earned. `init` fires it, so a superseded run never marks a room
	// read on the user's behalf.
	markRead?: boolean;
	// What the attempt wants written. `init` applies it, so an aborted run can drop it wholesale.
	patch?: Partial<RoomState>;
}

// One load attempt, over a `room` snapshot the caller read for this attempt. It reads nothing from
// the store and writes nothing to it directly: everything it learned comes back in the result. It
// still writes to the database, which the subscription observer turns into a store write — that
// indirect path is exactly what lets a retry pick up a room the first attempt did not have.
// The unread divider anchor is returned rather than written to the store, because it is per-screen
// (see stores/RoomScreenContext). `failed` tells `init` whether to repeat the attempt.
const loadRoom = async (
	rid: string,
	room: IRoomViewState['room'],
	joined: boolean,
	{ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams
): Promise<ILoadRoomResult> => {
	let lastSeen: IRoomViewState['lastSeen'] = null;
	let markRead = false;
	try {
		if ('id' in room && isInviteSubscription(room)) {
			return { failed: false, skipped: true, lastSeen: null };
		}

		// The DM counterpart is a REST round trip that needs nothing from the message load, so it
		// runs alongside it instead of extending the room-open path.
		const memberPromise = getRoomMember(room);

		if (tmid) {
			await loadThreadMessages({ tmid, rid });
			onThreadMessagesLoaded?.();
		} else {
			await getMessages({
				rid: room.rid,
				...('lastOpen' in room && room.lastOpen ? {} : { t: room.t as RoomType })
			});

			if (joined && 'id' in room) {
				lastSeen = room.alert || room.unread || room.userMentions ? room.ls : null;
				markRead = true;
			}
		}

		const canAutoTranslate = canAutoTranslateMethod();
		const { roomUserId, member } = await memberPromise;

		return {
			failed: false,
			lastSeen,
			markRead,
			patch: { canAutoTranslate, member, ...(roomUserId ? { roomUserId } : {}) }
		};
	} catch (e) {
		log(e);
		return { failed: true, lastSeen: null };
	}
};

const createRoomState =
	(
		rid: string | undefined,
		initialRoom: IRoomViewState['room'] = EMPTY_ROOM,
		roomUserId: string | null | undefined = null
	): StateCreator<RoomState> =>
	(set, get) => ({
		room: initialRoom,
		roomUpdate: {},
		joined: true,
		subscribed: 'id' in initialRoom,
		member: {},
		roomUserId,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		lastMessageFromAgent: false,

		// A transient failure retries a couple of times instead of leaving the screen empty until the
		// user navigates away and back. The loop lives here so the caller's single `loading` window
		// spans the whole retry stretch: no per-attempt `loading` write, no loaded-but-empty flash.
		init: async ({ tmid, onThreadMessagesLoaded, signal }: IRoomStoreInitParams = {}) => {
			if (!rid) {
				return { status: 'skipped' };
			}
			for (let attempt = 1; attempt <= INIT_MAX_ATTEMPTS; attempt += 1) {
				// Read the room fresh for every attempt: the subscription observer can fill an
				// initially-empty store between attempts, and that later attempt is the one that loads it.
				const { room, joined } = get();
				const { failed, skipped, lastSeen, markRead, patch } = await loadRoom(rid, room, joined, {
					tmid,
					onThreadMessagesLoaded
				});
				// The caller superseded this run while the attempt was in flight, so its result is stale:
				// drop the patch and the read receipt rather than writing over the run that replaced it.
				if (signal?.aborted) {
					return { status: 'skipped' };
				}
				if (skipped) {
					return { status: 'skipped' };
				}
				if (!failed) {
					if (patch) {
						set(patch);
					}
					if (markRead) {
						readMessages(room.rid).catch(e => log(e));
					}
					return { status: 'loaded', lastSeen };
				}
				if (attempt === INIT_MAX_ATTEMPTS) {
					return { status: 'failed' };
				}
				await new Promise(resolve => {
					setTimeout(resolve, INIT_RETRY_DELAY);
				});
				if (signal?.aborted) {
					return { status: 'skipped' };
				}
			}
			return { status: 'failed' };
		},

		join: () => set({ joined: true }),

		// The join-code modal is per-screen state: two RoomViews (room + thread) share this rid-keyed
		// store, so the caller passes its own trigger instead of registering one here.
		joinRoom: requestJoinCode =>
			joinRoomImpl(get().room, {
				requestJoinCode,
				onJoin: get().join
			}),
		resumeRoom: () => resumeRoomImpl(get().room, { onJoin: get().join })
	});

const observeRoom = (
	rid: string | undefined,
	initialRoom: IRoomViewState['room'],
	store: RoomStore,
	onReady?: () => void
): (() => void) => {
	if (!rid) {
		return () => {};
	}
	let lastRoomType = initialRoom.t;
	let lastMessageFromAgent = store.getState().lastMessageFromAgent;
	const observable = database.active
		.get('subscriptions')
		.query(Q.where('rid', rid))
		.observeWithColumns([...OBSERVED_COLUMNS, 'last_message']);
	const subscription = observable.subscribe((rows: IRoomViewState['room'][]) => {
		const next = rows[0];
		if (next) {
			lastRoomType = next.t;
			const nextLastMessageFromAgent = next.t === 'l' && !!(next.lastMessage && !next.lastMessage.token && next.lastMessage.u);
			const roomUpdate = Object.fromEntries(
				roomAttrsUpdate.map(attr => [attr, (next as TSubscriptionModel)[attr]])
			) as IRoomViewState['roomUpdate'];
			const { room: previousRoom, roomUpdate: previousRoomUpdate } = store.getState();
			const rowRecreated = next !== previousRoom;
			const roomChanged = rowRecreated || roomAttrsUpdate.some(attr => previousRoomUpdate[attr] !== roomUpdate[attr]);
			const state = roomChanged
				? {
						room: next,
						roomUpdate,
						subscribed: true,
						joined: true
					}
				: { subscribed: true, joined: true };
			if (nextLastMessageFromAgent !== lastMessageFromAgent) {
				lastMessageFromAgent = nextLastMessageFromAgent;
				store.setState({ ...state, lastMessageFromAgent });
			} else if (roomChanged || !store.getState().subscribed) {
				store.setState(state);
			}
			return;
		}
		store.setState({ subscribed: false, ...(lastRoomType !== 'd' ? { joined: false } : {}) });
	});
	onReady?.();
	return () => subscription.unsubscribe();
};

export const createRoomStore = ({
	rid,
	initialRoom,
	roomUserId
}: {
	rid?: string;
	initialRoom: IRoomViewState['room'];
	roomUserId?: string | null;
}): RoomStore => createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));

export { observeRoom };
