import { type RefObject, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { type Dispatch } from 'redux';
import { Q } from '@nozbe/watermelondb';
import { type Subscription } from 'rxjs';

import { clearInAppFeedback } from '../../../actions/inAppFeedback';
import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import I18n from '../../../i18n';
import database from '../../../lib/database';
import { getThreadById } from '../../../lib/database/services/Thread';
import AudioManager from '../../../lib/methods/AudioManager';
import { getRoomTitle, isIOS } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendMessage } from '../../../lib/methods/sendMessage';
import type RoomClass from '../../../lib/methods/subscriptions/room';
import Navigation from '../../../lib/navigation/appNavigation';
import { joinRoom as joinRoomService, toggleFollowMessage } from '../../../lib/services/restApi';
import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { LISTENER } from '../../../containers/Toast';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { type TRoomViewReducerState } from '../index';
import { type IJoinCode } from '../JoinCode';
import { type RoomStore } from '../stores/RoomStore';

export interface IUseRoomLifecycleParams {
	rid?: string;
	tmid?: string;
	t?: string;
	isAuthenticated: boolean;
	isMasterDetail: boolean;
	isOmnichannel: boolean;
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	serverVersion?: string | null;
	roomStore: RoomStore;
	navigation: IRoomViewProps['navigation'];
	route: IRoomViewProps['route'];
	dispatch: Dispatch;
	messageActionStore: TMessageActionStore;
	sub?: RoomClass;
	queryUnreadsRef: RefObject<Subscription | null>;
	pendingJumpRef: RefObject<string | undefined>;
	jumpToThreadIdRef: RefObject<string | undefined>;
	unreadsCountRef: RefObject<number | null>;
	roomRef: RefObject<IRoomViewState['room']>;
	userRef: RefObject<IRoomViewProps['user']>;
	joinCodeRef: RefObject<IJoinCode | null>;
	consumeJumpParam: (messageId: string) => void;
	navToThread: (item: any) => void;
	onQuoteInit: (messageId: string) => void;
	resetAction: () => void;
	onThreadMessagesLoaded: () => void;
	setState: (partial: Partial<TRoomViewReducerState>) => void;
}

export interface IUseRoomLifecycleResult {
	joinRoom: () => Promise<void>;
	resumeRoom: () => Promise<void>;
	onJoin: () => void;
	handleSendMessage: (message?: string, tshow?: boolean) => void;
	toggleFollowThread: (isFollowingThread: boolean, threadId?: string) => Promise<void>;
	fetchThreadName: (threadId: string, messageId: string) => Promise<string | undefined>;
}

export function useRoomLifecycle({
	rid,
	tmid,
	t,
	isAuthenticated,
	isMasterDetail,
	isOmnichannel,
	room,
	roomUpdate,
	serverVersion,
	roomStore,
	navigation,
	route,
	dispatch,
	messageActionStore,
	sub,
	queryUnreadsRef,
	pendingJumpRef,
	jumpToThreadIdRef,
	unreadsCountRef,
	roomRef,
	userRef,
	joinCodeRef,
	consumeJumpParam,
	navToThread,
	onQuoteInit,
	resetAction,
	onThreadMessagesLoaded,
	setState
}: IUseRoomLifecycleParams): IUseRoomLifecycleResult {
	'use memo';

	// onThreadMessagesLoaded is recreated every render; a ref keeps the trigger effect's deps at
	// [rid, isAuthenticated] so it doesn't re-fire on identity change alone (see ticket NATIVE-1356).
	const onThreadMessagesLoadedRef = useRef(onThreadMessagesLoaded);
	useEffect(() => {
		onThreadMessagesLoadedRef.current = onThreadMessagesLoaded;
	});

	const runInit = () => roomStore.getState().init({ tmid, onThreadMessagesLoaded: () => onThreadMessagesLoadedRef.current?.() });

	useEffect(() => {
		if (!rid || !isAuthenticated) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => {
			runInit();
		});
		return () => task.cancel();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rid, isAuthenticated]);

	const updateUnreadCount = async () => {
		if (!rid) {
			return;
		}
		const db = database.active;
		const observable = await db
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(rid)))
			.observeWithColumns(['unread']);

		queryUnreadsRef.current = observable.subscribe(rooms => {
			const unreadsCount = rooms.reduce(
				(unreadCount, item) => (item.unread > 0 && !item.hideUnreadStatus ? unreadCount + item.unread : unreadCount),
				0
			);
			if (unreadsCountRef.current !== unreadsCount) {
				setState({ unreadsCount });
			}
		});
	};

	const handleRoomRemoved = ({ rid: removedRid }: { rid: string }) => {
		if (removedRid === rid) {
			Navigation.popToTop(isMasterDetail);
			const currentRoom = roomRef.current;
			currentRoom.t !== 'l' &&
				showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(currentRoom) }), I18n.t('Oops'));
		}
	};

	const handleSendMessage = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	const onJoin = () => {
		roomStore.getState().join();
	};

	const joinRoom = async () => {
		logEvent(events.ROOM_JOIN);
		try {
			if (isOmnichannel) {
				if ('_id' in room) {
					await takeInquiry(room._id, serverVersion as string);
				}
				onJoin();
			} else {
				const { joinCodeRequired, rid: roomRid } = room;
				if (joinCodeRequired) {
					joinCodeRef.current?.show();
				} else {
					await joinRoomService(roomRid, null, t as any);
					onJoin();
				}
			}
		} catch (e) {
			log(e);
		}
	};

	const resumeRoom = async () => {
		logEvent(events.ROOM_RESUME);
		try {
			if (isOmnichannel) {
				if ('rid' in room) {
					await takeResume(room.rid);
				}
				onJoin();
			}
		} catch (e) {
			log(e);
		}
	};

	const fetchThreadName = async (threadId: string, messageId: string) => {
		const threadRecord = await getThreadById(threadId);
		if (threadRecord?.t === 'rm') {
			return I18n.t('Message_removed');
		}
		return getThreadName(rid as string, threadId, messageId);
	};

	const toggleFollowThread = async (isFollowingThread: boolean, threadId?: string) => {
		try {
			const threadMessageId = threadId ?? tmid;
			if (!threadMessageId) {
				return;
			}
			await toggleFollowMessage(threadMessageId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		const { action } = messageActionStore.getState();
		const didMountInteraction = InteractionManager.runAfterInteractions(() => {
			if (rid) {
				try {
					sub?.subscribe?.();
				} catch (e) {
					log(e);
				}
			}
			// Main-list jump: re-anchors its own window, so fire immediately. A thread jump waits for its
			// rows and is fired from the subscription hook's success path instead.
			if (pendingJumpRef.current && !tmid) {
				consumeJumpParam(pendingJumpRef.current);
			}
			if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
				navToThread({ tmid: jumpToThreadIdRef.current });
			}
			if (isIOS && rid) {
				updateUnreadCount();
			}
			if (action?.kind === 'quote' && action.messageIds.length === 1) {
				onQuoteInit(action.messageIds[0]);
			}
		});
		const unsubscribeBlur = navigation.addListener('blur', () => {
			AudioManager.pauseAudio();
		});
		return () => {
			if (didMountInteraction?.cancel) {
				didMountInteraction.cancel();
			}
			if (queryUnreadsRef.current?.unsubscribe) {
				queryUnreadsRef.current.unsubscribe();
			}
			unsubscribeBlur();
			if (sub?.unsubscribe) {
				sub.unsubscribe();
			}
			if (!tmid) {
				AudioManager.unloadRoomAudios(rid);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		EventEmitter.addEventListener('ROOM_REMOVED', handleRoomRemoved);
		return () => {
			EventEmitter.removeListener('ROOM_REMOVED', handleRoomRemoved);
		};
	}, [handleRoomRemoved]);

	useEffect(() => {
		dispatch(clearInAppFeedback());
		return () => {
			dispatch(clearInAppFeedback());
		};
	}, [dispatch]);

	const prevJumpToMessageIdRef = useRef(route.params?.jumpToMessageId);
	useEffect(() => {
		const next = route.params?.jumpToMessageId;
		if (next && next !== prevJumpToMessageIdRef.current) {
			consumeJumpParam(next);
		}
		prevJumpToMessageIdRef.current = next;
	}, [route.params?.jumpToMessageId, consumeJumpParam]);

	const prevJumpToThreadIdRef = useRef(route.params?.jumpToThreadId);
	useEffect(() => {
		const next = route.params?.jumpToThreadId;
		if (next && next !== prevJumpToThreadIdRef.current) {
			navToThread({ tmid: next });
		}
		prevJumpToThreadIdRef.current = next;
	}, [route.params?.jumpToThreadId, navToThread]);

	// init() is skipped for invite subscriptions. Initialize when invite has been accepted
	const prevStatusRef = useRef(roomUpdate.status);
	useEffect(() => {
		if (prevStatusRef.current === 'INVITED' && roomUpdate.status !== 'INVITED') {
			runInit();
		}
		prevStatusRef.current = roomUpdate.status;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate.status]);

	useEffect(() => {
		roomStore.setState({ joinRoom, resumeRoom });
	}, [roomStore, joinRoom, resumeRoom]);

	return {
		joinRoom,
		resumeRoom,
		onJoin,
		handleSendMessage,
		toggleFollowThread,
		fetchThreadName
	};
}
