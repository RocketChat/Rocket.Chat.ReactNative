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
import {
	createRoomSnapshot,
	getRoom,
	getRoomObservationPatch,
	getRoomObservedFieldValues,
	roomObservedColumns,
	type TRoomObservedFields
} from '../../../lib/roomObservation';

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
		roomSnapshot: createRoomSnapshot(initialRoom),
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
				const { roomSnapshot, joined } = get();
				const room = getRoom(roomSnapshot);
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
			joinRoom(getRoom(get().roomSnapshot), {
				requestJoinCode,
				onJoin: get().join
			}),
		resumeRoom: (): Promise<void> => resumeRoom(getRoom(get().roomSnapshot), get().join)
	});

export function observeRoom(rid: string | undefined, store: RoomStore, onReady?: () => void): () => void {
	if (!rid) {
		return () => {};
	}
	let fields: TRoomObservedFields = getRoomObservedFieldValues(getRoom(store.getState().roomSnapshot));
	const observable = database.active.get('subscriptions').query(Q.where('rid', rid)).observeWithColumns(roomObservedColumns);
	const subscription = observable.subscribe((rows: TRoomOrPreview[]) => {
		const { roomSnapshot, subscribed, joined, lastMessageFromAgent } = store.getState();
		const patch = getRoomObservationPatch(
			{ fields, snapshot: roomSnapshot, subscribed, joined, lastMessageFromAgent },
			rows[0] as TSubscriptionModel | undefined
		);
		if (!patch) {
			return;
		}
		const { fields: nextFields, snapshot, ...rest } = patch;
		if (nextFields) {
			fields = nextFields;
		}
		store.setState(snapshot ? { ...rest, roomSnapshot: snapshot } : rest);
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
	initialRoom: TRoomOrPreview;
	roomUserId?: string | null;
}): RoomStore => createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
