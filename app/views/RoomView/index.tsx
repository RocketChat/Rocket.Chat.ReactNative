import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, InteractionManager, Text, View } from 'react-native';
import { connect } from 'react-redux';
import parse from 'url-parse';
import { Q } from '@nozbe/watermelondb';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { type Subscription } from 'rxjs';
import * as Haptics from 'expo-haptics';
import { type NavigatorScreenParams } from '@react-navigation/native';
import { useStore } from 'zustand';

import { type TNavigation } from 'stacks/stackType';

import dayjs from '../../lib/dayjs';
import { getRoutingConfig, joinRoom as joinRoomService, toggleFollowMessage } from '../../lib/services/restApi';
import Touch from '../../containers/Touch';
import database from '../../lib/database';
import Message from '../../containers/message';
import MessageActions, { type IMessageActions } from '../../containers/MessageActions';
import MessageErrorActions, { type IMessageErrorActions } from '../../containers/MessageErrorActions';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import { LISTENER } from '../../containers/Toast';
import { getBadgeColor, isBlocked, makeThreadName } from '../../lib/methods/helpers/room';
import { isReadOnly } from '../../lib/methods/helpers/isReadOnly';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import { withTheme } from '../../theme';
import { Review } from '../../lib/methods/helpers/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/navigation/appNavigation';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../lib/hooks/withDimensions';
import { withMasterDetail } from '../../lib/hooks/useMasterDetail';
import { takeInquiry, takeResume } from '../../ee/omnichannel/lib';
import { sendLoadingEvent } from '../../containers/Loading';
import getThreadName from '../../lib/methods/getThreadName';
import getRoomInfo from '../../lib/methods/getRoomInfo';
import { ContainerTypes } from '../../containers/UIKit/interfaces';
import LoadMore from './LoadMore';
import Banner from './Banner';
import styles from './styles';
import JoinCode, { type IJoinCode } from './JoinCode';
import UploadProgress from './UploadProgress';
import List from './List';
import {
	type IApplicationState,
	type ISubscription,
	SubscriptionType,
	type TAnyMessageModel,
	type TSubscriptionModel,
	type RoomType
} from '../../definitions';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/constants/keys';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../lib/constants/messageTypeLoad';
import { themes } from '../../lib/constants/colors';
import { NOTIFICATION_IN_APP_VIBRATION } from '../../lib/constants/notifications';
import { type ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { callJitsi } from '../../lib/methods/callJitsi';
import { isInActiveVoipCall } from '../../lib/services/voip/isInActiveVoipCall';
import { sendMessage } from '../../lib/methods/sendMessage';
import { triggerBlockAction } from '../../lib/methods/triggerActions';
import { getUidDirectMessage, getRoomTitle, debounce, isIOS, hasPermission } from '../../lib/methods/helpers';
import { withActionSheet } from '../../containers/ActionSheet';
import { goRoom, type TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { ComposerAttachments, type IMessageComposerRef, MessageComposerContainer } from '../../containers/MessageComposer';
import { createMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { RoomProviders } from './RoomProviders';
import { MessageRoomProvider } from '../../containers/message/stores/MessageRoomStore';
import AudioManager from '../../lib/methods/AudioManager';
import { type IListContainerRef, type TListRef } from './List/definitions';
import { type TGetMessageInfoResult } from './services/getMessageInfo';
import { getThreadById } from '../../lib/database/services/Thread';
import { isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../lib/encryption/utils';
import { clearInAppFeedback, removeInAppFeedback } from '../../actions/inAppFeedback';
import UserPreferences from '../../lib/methods/userPreferences';
import { type IRoomViewProps, type IRoomViewState } from './definitions';
import { EncryptedRoom, MissingRoomE2EEKey } from './components';
import { type IRoomFederated, isRoomFederated, isRoomNativeFederated } from '../../lib/methods/isRoomFederated';
import { InvitedRoom } from './components/InvitedRoom';
import { getInvitationData } from '../../lib/methods/getInvitationData';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { getOrCreateRoomStore, releaseRoomStore } from './stores/RoomStore';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { useJumpToMessage } from './hooks/useJumpToMessage';
import { useHeader } from './hooks/useHeader';
import { useMessageActions } from './hooks/useMessageActions';

const EMPTY_HIDE_SYSTEM_MESSAGES: string[] = [];

type TRoomViewReducerState = Pick<
	IRoomViewState,
	| 'readOnly'
	| 'unreadsCount'
	| 'isAutocompleteVisible'
	| 'showMissingE2EEKey'
	| 'showE2EEDisabledRoom'
	| 'canForwardGuest'
	| 'canReturnQueue'
	| 'canViewCannedResponse'
	| 'canPlaceLivechatOnHold'
>;

const initialReducerState: TRoomViewReducerState = {
	readOnly: false,
	unreadsCount: null,
	isAutocompleteVisible: false,
	showMissingE2EEKey: false,
	showE2EEDisabledRoom: false,
	canForwardGuest: false,
	canReturnQueue: false,
	canViewCannedResponse: false,
	canPlaceLivechatOnHold: false
};

const roomViewStateReducer = (state: TRoomViewReducerState, partial: Partial<TRoomViewReducerState>): TRoomViewReducerState => ({
	...state,
	...partial
});

const RoomView = (props: IRoomViewProps) => {
	const {
		route,
		navigation,
		dispatch,
		theme,
		user,
		isAuthenticated,
		baseUrl,
		serverVersion,
		isMasterDetail,
		width,
		insets,
		Message_GroupingPeriod,
		Message_Read_Receipt_Enabled,
		Hide_System_Messages,
		transferLivechatGuestPermission,
		viewCannedResponsesPermission,
		livechatAllowManualOnHold,
		inAppFeedback,
		encryptionEnabled,
		airGappedRestrictionRemainingDays,
		isFederationEnabled,
		isFederationModuleEnabled,
		showActionSheet,
		hideActionSheet
	} = props;

	const rid = route.params?.rid;
	const t = route.params?.t;
	/**
	 * On threads, we don't have a subscription.
	 * `room` is going to have only a few properties sent during navigation.
	 * Use `tmid` as thread id.
	 */
	const tmid = route.params?.tmid;

	const [messageActionStore] = useState(() => {
		const quoteMessageId = route.params?.messageId;
		return createMessageActionStore(quoteMessageId ? { kind: 'quote', messageIds: [quoteMessageId] } : null);
	});

	const [initialRoom] = useState<IRoomViewState['room']>(
		() =>
			route.params?.room ?? {
				rid: rid as string,
				t: t as string,
				name: route.params?.name,
				fname: route.params?.fname,
				prid: route.params?.prid
			}
	);
	const [initialRoomUserId] = useState(() => route.params?.roomUserId ?? getUidDirectMessage(initialRoom));
	// we don't need to subscribe to threads
	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

	const [state, setState] = useReducer(roomViewStateReducer, initialReducerState);

	const messageComposerRef = useRef<IMessageComposerRef | null>(null);
	const joinCodeRef = useRef<IJoinCode | null>(null);
	// ListContainer component
	const listRef = useRef<IListContainerRef | null>(null);
	// FlatList inside ListContainer
	const flatListRef: TListRef = useRef(null);
	const queryUnreadsRef = useRef<Subscription | null>(null);
	const messageActionsRef = useRef<IMessageActions | null>(null);
	const messageErrorActionsRef = useRef<IMessageErrorActions | null>(null);
	const pendingJumpRef = useRef<string | undefined>(route.params?.jumpToMessageId);
	const jumpToThreadIdRef = useRef<string | undefined>(route.params?.jumpToThreadId);

	// Live-mirror refs let frozen provider handlers stay referentially stable while reading fresh values.
	const roomRef = useRef(initialRoom);
	const roomUserIdRef = useRef(initialRoomUserId);
	const unreadsCountRef = useRef<number | null>(null);
	const cancelJumpToMessageRef = useRef<() => void>(() => {});
	const userRef = useRef(user);

	const navToRoom = useCallback(
		async (message: TGetMessageInfoResult) => {
			if (!message.rid) return;
			const roomInfo = await getRoomInfo(message.rid);
			return goRoom({
				item: roomInfo as TGoRoomItem,
				isMasterDetail,
				jumpToMessageId: message.id
			});
		},
		[isMasterDetail]
	);

	const navToThread = useCallback(
		async (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => {
			if (!rid) {
				return;
			}

			if (item.tmid) {
				let name = '';
				let jumpToMessageId = '';
				if ('id' in item) {
					name = 'tmsg' in item ? item.tmsg ?? '' : '';
					jumpToMessageId = item.id;
				}
				sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessageRef.current });
				const threadRecord = await getThreadById(item.tmid);
				if (threadRecord?.t === 'rm') {
					name = I18n.t('Thread');
				}
				if (!name) {
					const result = await getThreadName(rid, item.tmid, jumpToMessageId);
					// test if there isn't a thread
					if (!result) {
						sendLoadingEvent({ visible: false });
						return;
					}
					name = result;
				}
				if ('id' in item && 't' in item && item.t === E2E_MESSAGE_TYPE && 'e2e' in item && item.e2e !== E2E_STATUS.DONE) {
					name = I18n.t('Encrypted_message');
				}
				if (!jumpToMessageId) {
					setTimeout(() => {
						sendLoadingEvent({ visible: false });
					}, 300);
				}
				return navigation.push('RoomView', {
					rid,
					tmid: item.tmid,
					name,
					t: SubscriptionType.THREAD,
					roomUserId: roomUserIdRef.current,
					jumpToMessageId
				});
			}

			if ('tlm' in item) {
				return navigation.push('RoomView', {
					rid,
					tmid: item.id,
					name: makeThreadName(item),
					t: SubscriptionType.THREAD,
					roomUserId: roomUserIdRef.current
				});
			}
		},
		[rid, navigation]
	);

	const { jumpToMessage, cancelJumpToMessage } = useJumpToMessage({
		rid,
		tmid,
		t,
		listRef,
		navToRoom,
		navToThread
	});

	// Fire a jump from a Navigation param, then consume the one-shot param so re-selecting the SAME
	// message id reads as a change (undefined -> id edge) and re-fires, instead of matching a stale
	// param and no-opping. Both mount (initial param) and update (Search delivers via setParams) use this.
	const consumeJumpParam = useCallback(
		(messageId: string) => {
			pendingJumpRef.current = undefined;
			jumpToMessage(messageId);
			navigation.setParams({ jumpToMessageId: undefined });
		},
		[jumpToMessage, navigation]
	);

	// Thread jump: fired from the subscription hook's success path — the thread window is populated by
	// then, so the row exists (a non-anchored thread jump otherwise aborts and parks on the live tail).
	const onThreadMessagesLoaded = useCallback(() => {
		if (pendingJumpRef.current) {
			const messageId = pendingJumpRef.current;
			pendingJumpRef.current = undefined;
			consumeJumpParam(messageId);
		}
	}, [consumeJumpParam]);

	const [roomStore] = useState(() => getOrCreateRoomStore({ rid, t, initialRoom, roomUserId: initialRoomUserId }));
	// rid is stable for this RoomView instance (it's what roomStore was acquired for); release once on unmount.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => () => releaseRoomStore(rid ?? ''), []);

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const joined = useStore(roomStore, s => s.joined);
	const member = useStore(roomStore, s => s.member);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const loading = useStore(roomStore, s => s.loading);
	const lastOpen = useStore(roomStore, s => s.lastOpen);
	const canAutoTranslate = useStore(roomStore, s => s.canAutoTranslate);

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

	const isOmnichannel = room.t === 'l';

	const hideSystemMessages = (() => {
		const { sysMes } = room;
		// FIXME: handle servers with version < 3.0.0
		// Return stable refs (model field / redux prop / shared empty) — a fresh [] here re-subscribes
		// the message-list WatermelonDB query on every RoomView render (fetchMessages dep).
		if (Array.isArray(sysMes)) {
			return sysMes;
		}
		if (Array.isArray(Hide_System_Messages)) {
			return Hide_System_Messages;
		}
		return EMPTY_HIDE_SYSTEM_MESSAGES;
	})();

	useEffect(() => {
		roomRef.current = room;
		roomUserIdRef.current = roomUserId;
		userRef.current = user;
		unreadsCountRef.current = state.unreadsCount;
		cancelJumpToMessageRef.current = cancelJumpToMessage;
	});

	const onEncryptedPress = useCallback(() => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };
		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	}, [navigation, isMasterDetail]);

	const onDiscussionPress = useMemo(
		() =>
			debounce(
				async (drid: TAnyMessageModel['drid']) => {
					if (!drid) return;
					const discussion = await getRoomInfo(drid);
					if (discussion) {
						goRoom({
							item: discussion as TGoRoomItem,
							isMasterDetail
						});
					}
				},
				1000,
				true
			),
		[isMasterDetail]
	);

	const onThreadPress = useMemo(() => debounce((item: TAnyMessageModel) => navToThread(item), 1000, true), [navToThread]);

	const {
		resetAction,
		handleCloseEmoji,
		handleShowActionSheet,
		errorActionsShow,
		onEditInit,
		onEditCancel,
		onEditRequest,
		onQuoteInit,
		onRemoveQuoteMessage,
		onReactionPress,
		onReactionInit,
		onReactionLongPress,
		onMessageLongPress,
		showAttachment,
		onReplyInit,
		replyBroadcast,
		setQuotesAndText,
		getText
	} = useMessageActions({
		messageActionStore,
		showActionSheet,
		hideActionSheet,
		navigation,
		dispatch,
		rid,
		tmid,
		roomUserId,
		onThreadPress,
		messageComposerRef,
		messageActionsRef,
		messageErrorActionsRef
	});

	const updateUnreadCount = useCallback(async () => {
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
	}, [rid]);

	const jumpToMessageByUrl = useCallback(
		async (messageUrl?: string, isFromReply?: boolean) => {
			if (!messageUrl) {
				return;
			}
			try {
				const parsedUrl = parse(messageUrl, true);
				const messageId = parsedUrl.query.msg;
				if (messageId) {
					await jumpToMessage(messageId, isFromReply);
				}
			} catch (e) {
				log(e);
			}
		},
		[jumpToMessage]
	);

	const handleRoomRemoved = useCallback(
		({ rid: removedRid }: { rid: string }) => {
			if (removedRid === rid) {
				Navigation.popToTop(isMasterDetail);
				const currentRoom = roomRef.current;
				currentRoom.t !== 'l' &&
					showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(currentRoom) }), I18n.t('Oops'));
			}
		},
		[rid, isMasterDetail]
	);

	const handleSendMessage = useCallback(
		(message: string, tshow?: boolean) => {
			logEvent(events.ROOM_SEND_MESSAGE);
			sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
				roomStore.getState().markMessageSent();
				Review.pushPositiveEvent();
			});
			resetAction();
		},
		[rid, tmid, roomStore, resetAction]
	);

	const onJoin = useCallback(() => {
		roomStore.getState().join();
	}, [roomStore]);

	const joinRoom = useCallback(async () => {
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
	}, [isOmnichannel, room, serverVersion, onJoin, t]);

	const resumeRoom = useCallback(async () => {
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
	}, [isOmnichannel, room, onJoin]);

	const fetchThreadName = useCallback(
		async (threadId: string, messageId: string) => {
			const threadRecord = await getThreadById(threadId);
			if (threadRecord?.t === 'rm') {
				return I18n.t('Message_removed');
			}
			return getThreadName(rid as string, threadId, messageId);
		},
		[rid]
	);

	const toggleFollowThread = useCallback(
		async (isFollowingThread: boolean, threadId?: string) => {
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
		},
		[tmid]
	);

	const navToRoomInfo = useCallback(
		(navParam: any) => {
			logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
			navParam.fromRid = rid;
			if (isMasterDetail) {
				navParam.showCloseModal = true;
				// @ts-ignore
				navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
			} else {
				navigation.navigate('RoomInfoView', navParam);
			}
		},
		[rid, navigation, isMasterDetail]
	);

	// OLD METHOD - support versions before 5.0.0
	const handleEnterCall = useCallback(() => {
		if (isInActiveVoipCall()) return;
		const currentRoom = roomRef.current;
		if ('id' in currentRoom) {
			const { jitsiTimeout } = currentRoom;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room: currentRoom });
			}
		}
	}, []);

	const blockAction = useCallback(
		({
			actionId,
			appId,
			value,
			blockId,
			rid: blockRid,
			mid
		}: {
			actionId: string;
			appId: string;
			value: any;
			blockId: string;
			rid: string;
			mid: string;
		}) =>
			triggerBlockAction({
				blockId,
				actionId,
				value,
				mid,
				rid: blockRid,
				appId,
				container: {
					type: ContainerTypes.MESSAGE,
					id: mid
				}
			}),
		[]
	);

	const closeBanner = useCallback(async () => {
		if ('id' in room) {
			try {
				const db = database.active;
				await db.write(async () => {
					await room.update(r => {
						r.bannerClosed = true;
					});
				});
			} catch {
				// do nothing
			}
		}
	}, [room]);

	const hapticFeedback = useCallback(
		(msgId: string) => {
			dispatch(removeInAppFeedback(msgId));
			const notificationInAppVibration = UserPreferences.getBool(NOTIFICATION_IN_APP_VIBRATION);
			if (notificationInAppVibration || notificationInAppVibration === null) {
				try {
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				} catch {
					// Do nothing: Haptic is unavailable
				}
			}
		},
		[dispatch]
	);

	const goRoomActionsView = useCallback(
		(screen?: keyof ModalStackParamList) => {
			logEvent(events.ROOM_GO_RA);
			if (isMasterDetail) {
				// @ts-ignore — navigation types expect a literal screen name
				navigation.navigate('ModalStackNavigator', {
					screen: screen ?? 'RoomActionsView',
					params: {
						rid: rid as string,
						t: t as SubscriptionType,
						room: roomRef.current as ISubscription,
						member,
						showCloseModal: !!screen,
						// @ts-ignore
						joined,
						omnichannelPermissions: {
							canForwardGuest: state.canForwardGuest,
							canReturnQueue: state.canReturnQueue,
							canViewCannedResponse: state.canViewCannedResponse,
							canPlaceLivechatOnHold: state.canPlaceLivechatOnHold
						}
					}
				} as NavigatorScreenParams<ModalStackParamList & TNavigation>);
			} else if (rid && t) {
				navigation.push('RoomActionsView', {
					rid,
					t: t as SubscriptionType,
					room: roomRef.current as TSubscriptionModel,
					member,
					joined,
					omnichannelPermissions: {
						canForwardGuest: state.canForwardGuest,
						canReturnQueue: state.canReturnQueue,
						canViewCannedResponse: state.canViewCannedResponse,
						canPlaceLivechatOnHold: state.canPlaceLivechatOnHold
					}
				});
			}
		},
		[
			rid,
			t,
			navigation,
			isMasterDetail,
			member,
			joined,
			state.canForwardGuest,
			state.canReturnQueue,
			state.canViewCannedResponse,
			state.canPlaceLivechatOnHold
		]
	);

	const updateAutocompleteVisible = useCallback(
		(updatedAutocompleteVisible: boolean) => {
			if (updatedAutocompleteVisible && !state.isAutocompleteVisible) {
				// timeout to prevent conflict with default keyboard announcement.
				setTimeout(() => {
					AccessibilityInfo.announceForAccessibility(I18n.t('The_autocomplete_options_are_available_above_the_input_composer'));
				}, 800);
			}
			if (updatedAutocompleteVisible !== state.isAutocompleteVisible) {
				setState({ isAutocompleteVisible: updatedAutocompleteVisible });
			}
		},
		[state.isAutocompleteVisible]
	);

	const getCanForwardGuest = async () => {
		const permissions = await hasPermission([transferLivechatGuestPermission], rid);
		return permissions[0] as boolean;
	};

	const getCanReturnQueue = async () => {
		try {
			const { returnQueue } = await getRoutingConfig();
			return returnQueue;
		} catch {
			return false;
		}
	};

	const getCanViewCannedResponse = async () => {
		const permissions = await hasPermission([viewCannedResponsesPermission], rid);
		return permissions[0] as boolean;
	};

	const getCanPlaceLivechatOnHold = () =>
		!!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);

	const updateOmnichannel = async () => {
		const [canForwardGuest, canReturnQueue, canViewCannedResponse] = await Promise.all([
			getCanForwardGuest(),
			getCanReturnQueue(),
			getCanViewCannedResponse()
		]);
		const canPlaceLivechatOnHold = getCanPlaceLivechatOnHold();
		setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
	};

	const setReadOnly = useCallback(async () => {
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		setState({ readOnly });
	}, [room, user]);

	const updateE2EEState = useCallback(() => {
		if (!('encrypted' in room)) {
			setState({ showMissingE2EEKey: false, showE2EEDisabledRoom: false });
			return;
		}
		const showMissingE2EEKey = isMissingRoomE2EEKey({
			encryptionEnabled,
			roomEncrypted: room.encrypted,
			E2EKey: room.E2EKey
		});
		const showE2EEDisabledRoom = isE2EEDisabledEncryptedRoom({
			encryptionEnabled,
			roomEncrypted: room.encrypted
		});
		setState({ showMissingE2EEKey, showE2EEDisabledRoom });
	}, [room, encryptionEnabled]);

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

	// If it's a livechat room
	useEffect(() => {
		if (t === 'l') {
			updateOmnichannel();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate.lastMessage?.token, roomUpdate.visitor, roomUpdate.status, joined]);

	useEffect(() => {
		setReadOnly();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate]);

	useEffect(() => {
		updateE2EEState();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [encryptionEnabled, roomUpdate.encrypted, roomUpdate.E2EKey]);

	// init() is skipped for invite subscriptions. Initialize when invite has been accepted
	const prevStatusRef = useRef(roomUpdate.status);
	useEffect(() => {
		if (prevStatusRef.current === 'INVITED' && roomUpdate.status !== 'INVITED') {
			runInit();
		}
		prevStatusRef.current = roomUpdate.status;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomUpdate.status]);

	useHeader({
		rid,
		tmid,
		roomType: t as SubscriptionType,
		roomName: route.params?.name,
		room,
		roomUpdate,
		unreadsCount: state.unreadsCount,
		roomUserId,
		joined,
		canForwardGuest: state.canForwardGuest,
		canReturnQueue: state.canReturnQueue,
		canPlaceLivechatOnHold: state.canPlaceLivechatOnHold,
		showMissingE2EEKey: state.showMissingE2EEKey,
		showE2EEDisabledRoom: state.showE2EEDisabledRoom,
		navigation,
		isMasterDetail,
		baseUrl,
		user,
		goRoomActionsView,
		toggleFollowThread,
		showActionSheet: handleShowActionSheet
	});

	const isIgnored = (message: TAnyMessageModel): boolean => {
		if ('id' in room) {
			return room?.ignored?.includes?.(message?.u?._id) ?? false;
		}
		return false;
	};

	const getFederatedFooterDescription = (federatedRoom: IRoomFederated) => {
		if (!isRoomNativeFederated(federatedRoom)) {
			return I18n.t('Federation_Matrix_room_description_invalid_version');
		}
		if (!isFederationEnabled) {
			return I18n.t('Federation_Matrix_room_description_disabled');
		}
		if (!isFederationModuleEnabled) {
			return I18n.t('Federation_Matrix_room_description_missing_module');
		}
		return undefined;
	};

	const renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => {
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = lastOpen ? dayjs(item.ts).isAfter(lastOpen) : false;
		} else {
			showUnreadSeparator =
				(lastOpen &&
					(dayjs(item.ts).isSame(lastOpen) || dayjs(item.ts).isAfter(lastOpen)) &&
					dayjs(previousItem.ts).isBefore(lastOpen)) ??
				false;
			if (!dayjs(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}

		let content = null;
		if (item.t && MESSAGE_TYPE_ANY_LOAD.includes(item.t as MessageTypeLoad)) {
			const runOnRender = () => {
				if (item.t === MessageTypeLoad.MORE) {
					if (!previousItem) return true;
					if (previousItem?.tmid) return true;
				}
				return false;
			};
			content = (
				<LoadMore
					rid={room.rid}
					t={room.t as RoomType}
					loaderId={item.id}
					type={item.t}
					runOnRender={runOnRender()}
					dateSeparator={dateSeparator}
					showUnreadSeparator={showUnreadSeparator}
				/>
			);
		} else {
			if (inAppFeedback?.[item.id]) {
				hapticFeedback(item.id);
			}
			content = (
				<Message
					item={item}
					isIgnored={isIgnored(item)}
					previousItem={previousItem}
					onLongPress={onMessageLongPress}
					threadBadgeColor={getBadgeColor({ subscription: room, theme, messageId: item?.id })}
					highlighted={highlightedMessage === item.id}
					dateSeparator={dateSeparator}
					showUnreadSeparator={showUnreadSeparator}
				/>
			);
		}

		return content;
	};

	const renderFooter = () => {
		const footerBottomInset = { paddingBottom: insets.bottom };

		if (!rid) {
			return null;
		}
		if ('onHold' in room && room.onHold) {
			return (
				<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Chat_is_on_hold')}</Text>
					<Touch
						onPress={resumeRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
						enabled={!loading}>
						<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-chat-on-hold-button'>
							{I18n.t('Resume')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (!joined) {
			return (
				<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-join' testID='room-view-join'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('You_are_in_preview_mode')}</Text>
					<Touch
						onPress={joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
						enabled={!loading}>
						<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-join-button'>
							{I18n.t(isOmnichannel ? 'Take_it' : 'Join')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (airGappedRestrictionRemainingDays !== undefined && airGappedRestrictionRemainingDays === 0) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_title')}
					</Text>
					<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_description')}
					</Text>
				</View>
			);
		}
		if (state.readOnly) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}

		if ('id' in room && isRoomFederated(room)) {
			const description = getFederatedFooterDescription(room);

			if (description) {
				return (
					<View style={[styles.readOnly, footerBottomInset]}>
						<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{description}</Text>
					</View>
				);
			}
		}

		return (
			<MessageComposerContainer ref={messageComposerRef}>
				<ComposerAttachments />
			</MessageComposerContainer>
		);
	};

	const renderActions = () => {
		if (!('id' in room)) {
			return null;
		}
		return (
			<>
				<MessageActions
					ref={(ref: IMessageActions | null) => {
						messageActionsRef.current = ref;
					}}
					tmid={tmid}
					room={room}
					user={user}
					editInit={onEditInit}
					replyInit={onReplyInit}
					quoteInit={onQuoteInit}
					reactionInit={onReactionInit}
					onReactionPress={onReactionPress}
					jumpToMessage={jumpToMessageByUrl}
					isReadOnly={state.readOnly}
				/>
				<MessageErrorActions
					ref={(ref: IMessageErrorActions | null) => {
						messageErrorActionsRef.current = ref;
					}}
					tmid={tmid}
				/>
			</>
		);
	};

	if ('id' in room && isInviteSubscription(room)) {
		const { title, description, inviter, accept, reject } = getInvitationData(room);

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view-invited'>
				<InvitedRoom title={title} description={description} inviter={inviter} onAccept={accept} onReject={reject} />
			</SafeAreaView>
		);
	}

	if ('encrypted' in room) {
		// Missing room encryption key
		if (state.showMissingE2EEKey) {
			return <MissingRoomE2EEKey />;
		}

		// Encrypted room, but user session is not encrypted
		if (state.showE2EEDisabledRoom) {
			return <EncryptedRoom navigation={navigation} roomName={getRoomTitle(room)} />;
		}
	}

	let bannerClosed;
	let announcement;
	if ('id' in room) {
		({ bannerClosed, announcement } = room);
	}

	const federated = 'id' in room && isRoomFederated(room);

	return (
		<RoomStoreContext.Provider value={roomStore}>
			<RoomProviders
				store={messageActionStore}
				rid={room.rid}
				t={room.t}
				room={room}
				tmid={tmid}
				sharing={false}
				isAutocompleteVisible={state.isAutocompleteVisible}
				updateAutocompleteVisible={updateAutocompleteVisible}
				onRemoveQuoteMessage={onRemoveQuoteMessage}
				editCancel={onEditCancel}
				editRequest={onEditRequest}
				onSendMessage={handleSendMessage}
				setQuotesAndText={setQuotesAndText}
				getText={getText}>
				<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view'>
					{!tmid ? (
						<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />
					) : null}
					<MessageRoomProvider
						navToRoomInfo={navToRoomInfo}
						showAttachment={showAttachment}
						blockAction={blockAction}
						handleEnterCall={handleEnterCall}
						fetchThreadName={fetchThreadName}
						toggleFollowThread={toggleFollowThread}
						jumpToMessage={jumpToMessageByUrl}
						closeEmojiAndAction={handleCloseEmoji}
						onReactionPress={onReactionPress}
						onReactionLongPress={onReactionLongPress}
						reactionInit={onReactionInit}
						onDiscussionPress={onDiscussionPress}
						onThreadPress={onThreadPress}
						replyBroadcast={replyBroadcast}
						errorActionsShow={errorActionsShow}
						onAnswerButtonPress={handleSendMessage}
						onEncryptedPress={onEncryptedPress}
						archived={'id' in room && room.archived}
						isReadReceiptEnabled={Message_Read_Receipt_Enabled && !federated}
						rid={room.rid}
						user={user as any}
						baseUrl={baseUrl}
						broadcast={'id' in room && room.broadcast}
						isThreadRoom={!!tmid}
						Message_GroupingPeriod={Message_GroupingPeriod}
						autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
						autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}>
						<List
							ref={listRef}
							listRef={flatListRef}
							rid={room.rid}
							t={room.t as RoomType}
							tmid={tmid}
							renderRow={renderItem}
							hideSystemMessages={hideSystemMessages}
							showMessageInMainThread={user.showMessageInMainThread ?? false}
							serverVersion={serverVersion}
						/>
					</MessageRoomProvider>
					{renderFooter()}
					{renderActions()}
					<UploadProgress rid={room.rid} user={user} baseUrl={baseUrl} width={width} />
					<JoinCode ref={joinCodeRef} onJoin={onJoin} rid={room.rid} t={room.t} theme={theme} />
				</SafeAreaView>
			</RoomProviders>
		</RoomStoreContext.Provider>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled as boolean,
	Hide_System_Messages: state.settings.Hide_System_Messages as string[],
	transferLivechatGuestPermission: state.permissions['transfer-livechat-guest'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	airGappedRestrictionRemainingDays: state.settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days,
	inAppFeedback: state.inAppFeedback,
	encryptionEnabled: state.encryption.enabled,
	isFederationEnabled: (state.settings.Federation_Matrix_enabled || state.settings.Federation_Service_Enabled) as boolean,
	isFederationModuleEnabled: state.enterpriseModules.includes('federation') as boolean
});

export default connect(mapStateToProps)(
	withDimensions(withTheme(withSafeAreaInsets(withActionSheet(withMasterDetail(RoomView)))))
);
