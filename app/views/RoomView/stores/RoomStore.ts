import { Q } from '@nozbe/watermelondb';
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

const createRoomState =
	(
		rid: string | undefined,
		initialRoom: IRoomViewState['room'],
		roomUserId: string | null | undefined
	): StateCreator<RoomState> =>
	(set, get) => ({
		room: initialRoom,
		roomUpdate: {},
		joined: true,
		subscribed: 'id' in initialRoom,
		member: {},
		roomUserId,
		loading: true,
		lastOpen: null,
		canAutoTranslate: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canViewCannedResponse: false,
		canPlaceLivechatOnHold: false,

		init: async ({ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams = {}) => {
			if (!rid) {
				return;
			}
			set({ loading: true });
			try {
				const currentRoom = get().room;
				if ('id' in currentRoom && isInviteSubscription(currentRoom)) {
					set({ loading: false });
					return;
				}

				if (tmid) {
					await loadThreadMessages({ tmid, rid });
					onThreadMessagesLoaded?.();
				} else {
					const newLastOpen = new Date();
					await getMessages({
						rid: currentRoom.rid,
						t: currentRoom.t as RoomType,
						...('lastOpen' in currentRoom && currentRoom.lastOpen ? { lastOpen: currentRoom.lastOpen } : {})
					});

					if (get().joined && 'id' in currentRoom) {
						set({ lastOpen: currentRoom.alert || currentRoom.unread || currentRoom.userMentions ? currentRoom.ls : null });
						readMessages(currentRoom.rid, newLastOpen, true).catch(e => console.log(e));
					}
				}

				const nextCanAutoTranslate = canAutoTranslateMethod();
				const nextMember = await getRoomMember(get, set);

				set({ canAutoTranslate: nextCanAutoTranslate, member: nextMember, loading: false });
			} catch (e) {
				log(e);
				set({ loading: false });
			}
		},

		join: () => set({ joined: true }),
		markMessageSent: () => set({ lastOpen: null })
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
}

const registry = new Map<string, IRoomStoreRegistryEntry>();

export const getOrCreateRoomStore = ({ rid, t, initialRoom, roomUserId }: IGetOrCreateRoomStoreParams): RoomStore => {
	if (!rid) {
		return createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	}
	const existing = registry.get(rid);
	if (existing) {
		existing.refCount += 1;
		return existing.store;
	}
	const store = createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	const unsubscribe = observeRoom(rid, t, store);
	registry.set(rid, { store, unsubscribe, refCount: 1 });
	return store;
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

let fallbackRoomStore: RoomStore | undefined;
const getFallbackRoomStore = (): RoomStore => {
	if (!fallbackRoomStore) {
		fallbackRoomStore = createStore<RoomState>(createRoomState(undefined, { rid: '', t: '' }, null));
	}
	return fallbackRoomStore;
};

// Non-owning peek hook: the native-stack header renders outside RoomView's provider tree, so its
// children read the rid-keyed store from the module registry instead of context.
export function useRoomStoreByRid<T>(rid: string | undefined, selector: (state: RoomState) => T): T {
	'use memo';

	const store = (rid ? registry.get(rid)?.store : undefined) ?? getFallbackRoomStore();
	return useStore(store, selector);
}
