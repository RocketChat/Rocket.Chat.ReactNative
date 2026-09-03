import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { createStore, useStore, type StateCreator } from 'zustand';

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
	type RoomStore,
	type TRoomInitResult
} from '../definitions';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import getMessages from '../services/getMessages';
import { joinRoom, resumeRoom } from '../services/joinRoom';

const OBSERVED_COLUMNS = Object.values(roomAttrsUpdateColumns);

const EMPTY_ROOM: IRoomViewState['room'] = { rid: '', t: '' };
const EMPTY_MEMBER: IRoomViewState['member'] = {};

const INIT_MAX_ATTEMPTS = 3;
const INIT_RETRY_DELAY = 1000;

interface IDirectMessageMember {
	roomUserId?: string;
	member: IRoomViewState['member'];
}

const getRoomMember = async (room: IRoomViewState['room']): Promise<IDirectMessageMember> => {
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
		return { roomUserId, member: EMPTY_MEMBER };
	}
	return { member: EMPTY_MEMBER };
};

type TLoadRoomResult =
	| {
			status: 'loaded';
			lastSeen: IRoomViewState['lastSeen'];
			shouldMarkRead: boolean;
			pendingRoomState: Partial<RoomState>;
	  }
	| { status: 'skipped' }
	| { status: 'failed' };

const loadRoom = async (
	rid: string,
	room: IRoomViewState['room'],
	joined: boolean,
	{ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams
): Promise<TLoadRoomResult> => {
	try {
		if ('id' in room && isInviteSubscription(room)) {
			return { status: 'skipped' };
		}

		const pendingRoomMember = getRoomMember(room);

		let lastSeen: IRoomViewState['lastSeen'] = null;
		let shouldMarkRead = false;
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
				shouldMarkRead = true;
			}
		}

		const canAutoTranslate = canAutoTranslateMethod();
		const { roomUserId, member } = await pendingRoomMember;

		return {
			status: 'loaded',
			lastSeen,
			shouldMarkRead,
			pendingRoomState: { canAutoTranslate, member, ...(roomUserId ? { roomUserId } : {}) }
		};
	} catch (e) {
		log(e);
		return { status: 'failed' };
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
		member: EMPTY_MEMBER,
		roomUserId,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,
		lastMessageFromAgent: false,

		init: async ({ tmid, onThreadMessagesLoaded, signal }: IRoomStoreInitParams = {}): Promise<TRoomInitResult> => {
			if (!rid) {
				return { status: 'skipped' };
			}
			for (let attempt = 1; attempt <= INIT_MAX_ATTEMPTS; attempt += 1) {
				const { room, joined } = get();
				const result = await loadRoom(rid, room, joined, { tmid, onThreadMessagesLoaded });
				if (signal?.aborted || result.status === 'skipped') {
					return { status: 'skipped' };
				}
				if (result.status === 'loaded') {
					set(result.pendingRoomState);
					if (result.shouldMarkRead) {
						readMessages(room.rid).catch(e => log(e));
					}
					return { status: 'loaded', lastSeen: result.lastSeen };
				}
				if (attempt < INIT_MAX_ATTEMPTS) {
					await new Promise(resolve => {
						setTimeout(resolve, INIT_RETRY_DELAY);
					});
					if (signal?.aborted) {
						return { status: 'skipped' };
					}
				}
			}
			return { status: 'failed' };
		},

		join: () => set({ joined: true }),

		joinRoom: requestJoinCode =>
			joinRoom(get().room, {
				requestJoinCode,
				onJoin: get().join
			}),
		resumeRoom: () => resumeRoom(get().room, get().join)
	});

export function observeRoom(rid: string | undefined, store: RoomStore): () => void;
export function observeRoom(
	rid: string | undefined,
	_initialRoom: IRoomViewState['room'],
	store: RoomStore,
	onReady?: () => void
): () => void;
export function observeRoom(
	rid: string | undefined,
	initialRoomOrStore: IRoomViewState['room'] | RoomStore,
	maybeStore?: RoomStore,
	onReady?: () => void
): () => void {
	const store = maybeStore ?? (initialRoomOrStore as RoomStore);
	if (!rid) {
		return () => {};
	}
	const observable = database.active
		.get('subscriptions')
		.query(Q.where('rid', rid))
		.observeWithColumns([...OBSERVED_COLUMNS, 'last_message']);
	const subscription = observable.subscribe((rows: IRoomViewState['room'][]) => {
		const next = rows[0];
		const previous = store.getState();
		if (!next) {
			store.setState({ subscribed: false, ...(previous.room.t !== 'd' ? { joined: false } : {}) });
			return;
		}
		const roomChanged =
			next !== previous.room || roomAttrsUpdate.some(attr => previous.roomUpdate[attr] !== (next as TSubscriptionModel)[attr]);
		const lastMessageFromAgent = next.t === 'l' && !!(next.lastMessage && !next.lastMessage.token && next.lastMessage.u);
		if (!roomChanged && previous.subscribed && lastMessageFromAgent === previous.lastMessageFromAgent) {
			return;
		}
		store.setState({
			subscribed: true,
			joined: true,
			lastMessageFromAgent,
			...(roomChanged
				? {
						room: next,
						roomUpdate: Object.fromEntries(
							roomAttrsUpdate.map(attr => [attr, (next as TSubscriptionModel)[attr]])
						) as IRoomViewState['roomUpdate']
					}
				: {})
		});
	});
	onReady?.();
	return () => subscription.unsubscribe();
}

export const createRoomStore = ({
	rid,
	initialRoom,
	roomUserId
}: {
	rid?: string;
	initialRoom: IRoomViewState['room'];
	roomUserId?: string | null;
}): RoomStore => createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));

interface IRoomStoreRegistryEntry {
	store: RoomStore;
	unsubscribe: () => void;
	refCount: number;
	pendingSweep: boolean;
}

const registry = new Map<string, IRoomStoreRegistryEntry>();

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

const register = (rid: string, store: RoomStore, refCount: number): void => {
	const unsubscribe = observeRoom(rid, store);
	registry.set(rid, { store, unsubscribe, refCount, pendingSweep: false });
};

export const peekOrCreateRoomStore = ({ rid, initialRoom, roomUserId }: IGetOrCreateRoomStoreParams): RoomStore => {
	if (!rid) {
		return createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	}
	const existing = registry.get(rid);
	if (existing) {
		return existing.store;
	}
	const store = createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	register(rid, store, 0);
	scheduleGraceSweep(rid);
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

export const acquireRoomStore = ({ rid }: Pick<IGetOrCreateRoomStoreParams, 'rid'>, store: RoomStore): RoomStore => {
	if (!rid) {
		return store;
	}
	const entry = registry.get(rid);
	if (entry) {
		entry.refCount += 1;
		return entry.store;
	}
	register(rid, store, 1);
	return store;
};

export const useRoomStoreForScreen = (params: IGetOrCreateRoomStoreParams): RoomStore => {
	const [screenParams] = useState(params);
	const [peekedStore] = useState(() => peekOrCreateRoomStore(screenParams));
	const [store, setStore] = useState(peekedStore);
	const { rid } = screenParams;

	useEffect(() => {
		const acquiredStore = acquireRoomStore(screenParams, peekedStore);
		if (acquiredStore !== peekedStore) {
			setStore(acquiredStore);
		}
		return () => {
			InteractionManager.runAfterInteractions(() => releaseRoomStore(rid));
		};
	}, [rid, screenParams, peekedStore]);

	return store;
};

const fallbackRoomStore = createStore<RoomState>(createRoomState(undefined));

export const peekRoomStore = (rid?: string): RoomStore => (rid ? registry.get(rid)?.store : undefined) ?? fallbackRoomStore;

export function useRoomStoreByRid<T>(rid: string | undefined, selector: (state: RoomState) => T): T {
	const entry = rid ? registry.get(rid) : undefined;
	if (__DEV__ && rid && !entry) {
		console.warn(`useRoomStoreByRid: no store registered for rid "${rid}"; falling back to empty room.`);
	}
	return useStore(entry?.store ?? fallbackRoomStore, selector);
}
