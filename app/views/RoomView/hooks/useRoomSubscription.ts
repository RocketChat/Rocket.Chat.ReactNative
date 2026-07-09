import { useCallback, useEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../lib/methods/readMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat, getUidDirectMessage, canAutoTranslate as canAutoTranslateMethod } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import { type RoomType, type TSubscriptionModel } from '../../../definitions';
import { type IRoomViewState } from '../definitions';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import RoomServices from '../services';

const OBSERVED_COLUMNS = Object.values(roomAttrsUpdateColumns);
const RETRY_DELAY = 300;

export interface IUseRoomSubscriptionParams {
	rid?: string;
	tmid?: string;
	t?: string;
	initialRoom: IRoomViewState['room'];
	roomUserId?: string | null;
	isAuthenticated: boolean;
	onThreadMessagesLoaded?: () => void;
}

export interface IUseRoomSubscriptionResult {
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	joined: boolean;
	subscribed: boolean;
	member: IRoomViewState['member'];
	roomUserId?: string | null;
	loading: boolean;
	lastOpen: Date | null;
	canAutoTranslate: boolean;
	init: () => Promise<void>;
}

export function useRoomSubscription({
	rid,
	tmid,
	t,
	initialRoom,
	roomUserId: initialRoomUserId,
	isAuthenticated,
	onThreadMessagesLoaded
}: IUseRoomSubscriptionParams): IUseRoomSubscriptionResult {
	const [room, setRoom] = useState(initialRoom);
	const [roomUpdate, setRoomUpdate] = useState<IRoomViewState['roomUpdate']>({});
	const [joined, setJoined] = useState(true);
	const [subscribed, setSubscribed] = useState(() => 'id' in initialRoom);
	const [member, setMember] = useState<IRoomViewState['member']>({});
	const [roomUserId, setRoomUserId] = useState(initialRoomUserId);
	const [loading, setLoading] = useState(true);
	const [lastOpen, setLastOpen] = useState<Date | null>(null);
	const [canAutoTranslate, setCanAutoTranslate] = useState(false);

	const roomRef = useRef(room);
	const joinedRef = useRef(joined);
	const mountedRef = useRef(true);
	const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const initRef = useRef<() => Promise<void>>(async () => {});

	useEffect(() => {
		roomRef.current = room;
	}, [room]);

	useEffect(() => {
		joinedRef.current = joined;
	}, [joined]);

	useEffect(
		() => () => {
			mountedRef.current = false;
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
		},
		[]
	);

	useEffect(() => {
		if (!rid) {
			return;
		}
		const observable = database.active.get('subscriptions').query(Q.where('rid', rid)).observeWithColumns(OBSERVED_COLUMNS);
		const subscription = observable.subscribe((rows: IRoomViewState['room'][]) => {
			const next = rows[0];
			if (next) {
				setRoom(next);
				// observeWithColumns re-emits the same cached model instance mutated in place, so a fresh
				// snapshot object is what re-renders consumers on a tracked-column change.
				setRoomUpdate(
					roomAttrsUpdate.reduce((ret: IRoomViewState['roomUpdate'], attr) => {
						ret[attr] = (next as TSubscriptionModel)[attr];
						return ret;
					}, {})
				);
				setSubscribed(true);
				setJoined(true);
				return;
			}
			setSubscribed(false);
			if (t !== 'd') {
				setJoined(false);
			}
		});
		return () => subscription.unsubscribe();
	}, [rid, t]);

	const getRoomMember = useCallback(async () => {
		const currentRoom = roomRef.current;
		if ('id' in currentRoom && currentRoom.t === 'd' && !isGroupChat(currentRoom)) {
			try {
				const nextRoomUserId = getUidDirectMessage(currentRoom);
				if (mountedRef.current) {
					setRoomUserId(nextRoomUserId);
				}
				const result = await getUserInfo(nextRoomUserId);
				if (result.success) {
					return result.user;
				}
			} catch (e) {
				log(e);
			}
		}
		return {};
	}, []);

	const init = useCallback(async () => {
		if (mountedRef.current) {
			setLoading(true);
		}
		if (!rid) {
			return;
		}
		try {
			const currentRoom = roomRef.current;
			if ('id' in currentRoom && isInviteSubscription(currentRoom)) {
				if (mountedRef.current) {
					setLoading(false);
				}
				return;
			}

			if (tmid) {
				await loadThreadMessages({ tmid, rid });
				onThreadMessagesLoaded?.();
			} else {
				const newLastOpen = new Date();
				await RoomServices.getMessages({
					rid: currentRoom.rid,
					t: currentRoom.t as RoomType,
					...('lastOpen' in currentRoom && currentRoom.lastOpen ? { lastOpen: currentRoom.lastOpen } : {})
				});

				if (joinedRef.current && 'id' in currentRoom) {
					if (mountedRef.current) {
						setLastOpen(currentRoom.alert || currentRoom.unread || currentRoom.userMentions ? currentRoom.ls : null);
					}
					readMessages(currentRoom.rid, newLastOpen, true).catch(e => console.log(e));
				}
			}

			const nextCanAutoTranslate = canAutoTranslateMethod();
			const nextMember = await getRoomMember();

			if (mountedRef.current) {
				setCanAutoTranslate(nextCanAutoTranslate);
				setMember(nextMember);
				setLoading(false);
			}
		} catch {
			if (mountedRef.current) {
				setLoading(false);
				retryTimeoutRef.current = setTimeout(() => {
					initRef.current();
				}, RETRY_DELAY);
			}
		}
	}, [rid, tmid, onThreadMessagesLoaded, getRoomMember]);

	useEffect(() => {
		initRef.current = init;
	}, [init]);

	useEffect(() => {
		if (rid && isAuthenticated) {
			init();
		}
	}, [rid, isAuthenticated, init]);

	return { room, roomUpdate, joined, subscribed, member, roomUserId, loading, lastOpen, canAutoTranslate, init };
}
