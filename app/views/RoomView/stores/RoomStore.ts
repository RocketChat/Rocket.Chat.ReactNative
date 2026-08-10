import { Q } from '@nozbe/watermelondb';
import { InteractionManager } from 'react-native';
import { createStore, useStore, type StateCreator, type StoreApi } from 'zustand';

import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../lib/methods/readMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat, getUidDirectMessage, canAutoTranslate as canAutoTranslateMethod } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type RoomType, type TSubscriptionModel } from '../../../definitions';
import {
	type IGetOrCreateRoomStoreParams,
	type IRoomStoreInitParams,
	type IRoomViewState,
	type RoomState,
	type RoomStore
} from '../definitions';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import getMessages from '../services/getMessages';
import { joinRoomImpl, resumeRoomImpl } from '../services/joinRoom';
import { store as reduxStore } from '../../../lib/store/auxStore';

const OBSERVED_COLUMNS = Object.values(roomAttrsUpdateColumns);

const getRoomMember = async (get: () => RoomState, set: StoreApi<RoomState>['setState']): Promise<IRoomViewState['member']> => {
	const currentRoom = get().room;
	if ('id' in currentRoom && currentRoom.t === 'd' && !isGroupChat(currentRoom)) {
		try {
			const nextRoomUserId = getUidDirectMessage(currentRoom);
			set({ roomUserId: nextRoomUserId });
			const result = await getUserInfo(nextRoomUserId);
			if (result.success) {
				return result.user;
			}
		} catch (e) {
			log(e);
		}
	}
	return {};
};

const EMPTY_ROOM: IRoomViewState['room'] = { rid: '', t: '' };

const isEmptyRoom = (room: IRoomViewState['room']): boolean => room.rid === EMPTY_ROOM.rid;

const INIT_MAX_ATTEMPTS = 3;
const INIT_RETRY_DELAY = 1000;

interface ILoadRoomResult {
	failed: boolean;
	lastSeen: IRoomViewState['lastSeen'];
}

// One load attempt. `lastSeen` is per-screen: room and thread mount two RoomViews on one rid-keyed
// store, so the unread divider anchor is returned to the caller instead of written to the shared
// state. `failed` tells `init` whether the attempt is worth repeating.
const loadRoom = async (
	rid: string,
	get: () => RoomState,
	set: StoreApi<RoomState>['setState'],
	{ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams
): Promise<ILoadRoomResult> => {
	let lastSeen: IRoomViewState['lastSeen'] = null;
	try {
		const currentRoom = get().room;
		if ('id' in currentRoom && isInviteSubscription(currentRoom)) {
			return { failed: false, lastSeen: null };
		}

		if (tmid) {
			await loadThreadMessages({ tmid, rid });
			onThreadMessagesLoaded?.();
		} else {
			await getMessages({
				rid: currentRoom.rid,
				...('lastOpen' in currentRoom && currentRoom.lastOpen ? {} : { t: currentRoom.t as RoomType })
			});

			if (get().joined && 'id' in currentRoom) {
				lastSeen = currentRoom.alert || currentRoom.unread || currentRoom.userMentions ? currentRoom.ls : null;
				readMessages(currentRoom.rid).catch(e => log(e));
			}
		}

		const nextCanAutoTranslate = canAutoTranslateMethod();
		const nextMember = await getRoomMember(get, set);

		set({ canAutoTranslate: nextCanAutoTranslate, member: nextMember });
	} catch (e) {
		log(e);
		return { failed: true, lastSeen: null };
	}
	return { failed: false, lastSeen };
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
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,

		// A transient failure retries a couple of times instead of leaving the screen empty until the
		// user navigates away and back. The loop lives here so the caller's single `loading` window
		// spans the whole retry stretch: no per-attempt `loading` write, no loaded-but-empty flash.
		init: async ({ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams = {}) => {
			if (!rid) {
				return null;
			}
			const startedEmpty = isEmptyRoom(get().room);
			for (let attempt = 1; attempt <= INIT_MAX_ATTEMPTS; attempt += 1) {
				const { failed, lastSeen } = await loadRoom(rid, get, set, { tmid, onThreadMessagesLoaded });
				if (!failed || attempt === INIT_MAX_ATTEMPTS) {
					return failed ? null : lastSeen;
				}
				await new Promise(resolve => {
					setTimeout(resolve, INIT_RETRY_DELAY);
				});
				// A store that started empty can be filled by the subscription observer mid-retry; once
				// the room has arrived there is nothing transient left to wait for.
				if (startedEmpty && !isEmptyRoom(get().room)) {
					return null;
				}
			}
			return null;
		},

		join: () => set({ joined: true }),

		// The join-code modal is per-screen state: two RoomViews (room + thread) share this rid-keyed
		// store, so the caller passes its own trigger instead of registering one here.
		joinRoom: requestJoinCode =>
			joinRoomImpl(get().room, {
				serverVersion: reduxStore.getState().server.version,
				requestJoinCode,
				onJoin: get().join
			}),
		resumeRoom: () => resumeRoomImpl(get().room, { onJoin: get().join })
	});

const observeRoom = (rid: string | undefined, t: string | undefined, store: RoomStore): (() => void) => {
	if (!rid) {
		return () => {};
	}
	const observable = database.active.get('subscriptions').query(Q.where('rid', rid)).observeWithColumns(OBSERVED_COLUMNS);
	const subscription = observable.subscribe((rows: IRoomViewState['room'][]) => {
		const next = rows[0];
		if (next) {
			store.setState({
				room: next,
				// observeWithColumns re-emits the same cached model instance mutated in place, so a fresh
				// snapshot object is what re-renders consumers on a tracked-column change.
				roomUpdate: roomAttrsUpdate.reduce((ret: IRoomViewState['roomUpdate'], attr) => {
					ret[attr] = (next as TSubscriptionModel)[attr];
					return ret;
				}, {}),
				subscribed: true,
				joined: true
			});
			return;
		}
		store.setState({ subscribed: false, ...(t !== 'd' ? { joined: false } : {}) });
	});
	return () => subscription.unsubscribe();
};

interface IRoomStoreRegistryEntry {
	store: RoomStore;
	unsubscribe: () => void;
	refCount: number;
	pendingSweep: boolean;
}

const registry = new Map<string, IRoomStoreRegistryEntry>();

// Tear down a still-unclaimed entry after the current interaction settles. Warm-up (goRoom) and
// render (peekOrCreate) create entries at refCount 0; the sweep reclaims them if no mount acquired
// them by the time the nav transition finishes. One sweep pending per entry keeps it idempotent.
const scheduleGraceSweep = (rid: string): void => {
	const entry = registry.get(rid);
	if (!entry || entry.pendingSweep) {
		return;
	}
	entry.pendingSweep = true;
	InteractionManager.runAfterInteractions(() => {
		const current = registry.get(rid);
		if (!current) {
			return;
		}
		current.pendingSweep = false;
		if (current.refCount === 0) {
			current.unsubscribe();
			registry.delete(rid);
		}
	});
};

// Render-safe: returns the rid-keyed store, creating it (observer + grace sweep) on first sight
// without touching refCount. Safe to call from a useState initializer, which may run twice under
// StrictMode/concurrent render. Acquire/release own the lifetime.
export const peekOrCreateRoomStore = ({ rid, t, initialRoom, roomUserId }: IGetOrCreateRoomStoreParams): RoomStore => {
	if (!rid) {
		return createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	}
	const existing = registry.get(rid);
	if (existing) {
		return existing.store;
	}
	const store = createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	const unsubscribe = observeRoom(rid, t, store);
	registry.set(rid, { store, unsubscribe, refCount: 0, pendingSweep: false });
	scheduleGraceSweep(rid);
	return store;
};

export const acquireRoomStore = (rid?: string): void => {
	if (!rid) {
		return;
	}
	const entry = registry.get(rid);
	if (entry) {
		entry.refCount += 1;
		return;
	}
	if (__DEV__) {
		// A missing entry here means the grace sweep reclaimed it before this acquire committed:
		// the store is now observed-but-unowned and will leak. A live miss is a real bug.
		console.warn(`acquireRoomStore: no store registered for rid "${rid}"; entry was swept before acquire.`);
	}
};

export const releaseRoomStore = (rid?: string): void => {
	if (!rid) {
		return;
	}
	const entry = registry.get(rid);
	if (!entry) {
		return;
	}
	entry.refCount -= 1;
	if (entry.refCount <= 0) {
		entry.unsubscribe();
		registry.delete(rid);
	}
};

// Inert store derived from createRoomState (the empty-room default), so a true-bug registry miss
// yields a blank room instead of throwing synchronously in native-stack header render.
let fallbackRoomStore: RoomStore | undefined;
const getFallbackRoomStore = (): RoomStore => {
	if (!fallbackRoomStore) {
		fallbackRoomStore = createStore<RoomState>(createRoomState(undefined));
	}
	return fallbackRoomStore;
};

// Non-reactive peek: read the rid-keyed store at handler time (event callbacks) without subscribing.
// Falls back to the inert empty-room store on a registry miss.
export const peekRoomStore = (rid?: string): RoomStore => (rid ? registry.get(rid)?.store : undefined) ?? getFallbackRoomStore();

// Non-owning peek hook: the native-stack header renders outside RoomView's provider tree, so its
// children read the rid-keyed store from the module registry instead of context.
export function useRoomStoreByRid<T>(rid: string | undefined, selector: (state: RoomState) => T): T {
	const entry = rid ? registry.get(rid) : undefined;
	if (__DEV__ && rid && !entry) {
		// With deferred unmount release this never fires on a healthy pop; a live miss is a real bug.
		console.warn(`useRoomStoreByRid: no store registered for rid "${rid}"; falling back to empty room.`);
	}
	return useStore(entry?.store ?? getFallbackRoomStore(), selector);
}
