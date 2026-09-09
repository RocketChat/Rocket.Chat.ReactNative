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
import { type TRoomOrPreview } from '../../../definitions/TRoom';
import {
	type IRoomStoreInitParams,
	type IRoomViewState,
	type RoomState,
	type RoomStore,
	type TRoomInitResult
} from '../definitions';
import getMessages from '../services/getMessages';
import { joinRoom, resumeRoom } from '../services/joinRoom';

const EMPTY_ROOM: TRoomOrPreview = { rid: '', t: '' };
const EMPTY_MEMBER: IRoomViewState['member'] = {};

const INIT_MAX_ATTEMPTS = 3;
const INIT_RETRY_DELAY = 1000;

interface IDirectMessageMember {
	roomUserId?: string;
	member: IRoomViewState['member'];
}

const getRoomMember = async (room: TRoomOrPreview): Promise<IDirectMessageMember> => {
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
	room: TRoomOrPreview,
	joined: boolean,
	{ tmid, onThreadMessagesLoaded, signal }: IRoomStoreInitParams
): Promise<TLoadRoomResult> => {
	const isAborted = () => signal?.aborted === true;
	try {
		if (isAborted() || ('id' in room && isInviteSubscription(room))) {
			return { status: 'skipped' };
		}

		const pendingRoomMember = getRoomMember(room);

		let lastSeen: IRoomViewState['lastSeen'] = null;
		let shouldMarkRead = false;
		if (tmid) {
			await loadThreadMessages({ tmid, rid });
			if (isAborted()) {
				return { status: 'skipped' };
			}
			onThreadMessagesLoaded?.();
		} else {
			await getMessages({
				rid: room.rid,
				...('lastOpen' in room && room.lastOpen ? {} : { t: room.t as RoomType })
			});
			if (isAborted()) {
				return { status: 'skipped' };
			}

			if (joined && 'id' in room) {
				lastSeen = room.alert || room.unread || room.userMentions ? room.ls : null;
				shouldMarkRead = true;
			}
		}

		const canAutoTranslate = canAutoTranslateMethod();
		const { roomUserId, member } = await pendingRoomMember;
		if (isAborted()) {
			return { status: 'skipped' };
		}

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
		initialRoom: TRoomOrPreview = EMPTY_ROOM,
		roomUserId: string | null | undefined = null
	): StateCreator<RoomState> =>
	(set, get) => ({
		room: initialRoom,
		joined: true,
		member: EMPTY_MEMBER,
		roomUserId,
		canAutoTranslate: false,
		canForwardGuest: false,
		canViewCannedResponse: false,

		init: async ({ tmid, onThreadMessagesLoaded, signal }: IRoomStoreInitParams = {}): Promise<TRoomInitResult> => {
			if (!rid) {
				return { status: 'skipped' };
			}
			for (let attempt = 1; attempt <= INIT_MAX_ATTEMPTS; attempt += 1) {
				const { room, joined } = get();
				const result = await loadRoom(rid, room, joined, { tmid, onThreadMessagesLoaded, signal });
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

		joinRoom: (requestJoinCode?: () => void): Promise<void> =>
			joinRoom(get().room, {
				requestJoinCode,
				onJoin: get().join
			}),
		resumeRoom: (): Promise<void> => resumeRoom(get().room, get().join)
	});

const publishRoom = (store: RoomStore, next: TSubscriptionModel): void => {
	store.setState({ room: next, joined: true });
};

const observeRecord = (store: RoomStore, record: TSubscriptionModel): (() => void) => {
	const subscription = record.observe().subscribe({
		next: (next: TSubscriptionModel) => publishRoom(store, next),
		complete: () => {
			if (store.getState().room.t !== 'd') {
				store.setState({ joined: false });
			}
		}
	});
	return () => subscription.unsubscribe();
};

const observeQueryUntilPresent = (rid: string, store: RoomStore): (() => void) => {
	let recordCleanup: (() => void) | undefined;
	// `var` (not `let`) so a synchronous emission below sees `subscription` as hoisted-but-undefined
	// instead of throwing on the temporal-dead-zone read.
	var subscription: { unsubscribe: () => void } | undefined;
	const observable = database.active.get('subscriptions').query(Q.where('rid', rid)).observe();
	subscription = observable.subscribe((rows: TSubscriptionModel[]) => {
		const record = rows[0];
		if (record) {
			recordCleanup = observeRecord(store, record);
			subscription?.unsubscribe();
		}
	});
	if (recordCleanup) {
		subscription.unsubscribe();
	}
	return () => (recordCleanup ? recordCleanup() : subscription?.unsubscribe());
};

export function observeRoom(rid: string | undefined, store: RoomStore, onReady?: () => void): () => void {
	if (!rid) {
		return () => {};
	}

	let cancelled = false;
	let cleanup: () => void = () => {};

	database.active
		.get('subscriptions')
		.find(rid)
		.then((record: TSubscriptionModel) => {
			if (cancelled) {
				return;
			}
			cleanup = observeRecord(store, record);
			onReady?.();
		})
		.catch(() => {
			if (cancelled) {
				return;
			}
			if (store.getState().room.t !== 'd') {
				store.setState({ joined: false });
			}
			cleanup = observeQueryUntilPresent(rid, store);
			onReady?.();
		});

	return () => {
		cancelled = true;
		cleanup();
	};
}

export const createRoomStore = ({
	rid,
	initialRoom,
	roomUserId
}: {
	rid?: string;
	initialRoom: TRoomOrPreview;
	roomUserId?: string | null;
}): RoomStore => createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
