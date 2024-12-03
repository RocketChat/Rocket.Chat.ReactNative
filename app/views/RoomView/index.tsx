import React from 'react';
import { InteractionManager, Text, View } from 'react-native';
import { connect } from 'react-redux';
import parse from 'url-parse';
import moment from 'moment';
import { Q } from '@nozbe/watermelondb';
import { dequal } from 'dequal';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';
import * as Haptics from 'expo-haptics';

import { getRoutingConfig } from '../../lib/services/restApi';
import Touch from '../../containers/Touch';
import { replyBroadcast as replyBroadcastAction } from '../../actions/messages';
import database from '../../lib/database';
import Message from '../../containers/message';
import MessageActions, { IMessageActions } from '../../containers/MessageActions';
import MessageErrorActions, { IMessageErrorActions } from '../../containers/MessageErrorActions';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import RoomHeader from '../../containers/RoomHeader';
import StatusBar from '../../containers/StatusBar';
import ReactionsList from '../../containers/ReactionsList';
import { LISTENER } from '../../containers/Toast';
import { getBadgeColor as getBadgeColorMethod, isBlocked, makeThreadName } from '../../lib/methods/helpers/room';
import { isReadOnly } from '../../lib/methods/helpers/isReadOnly';
import { showErrorAlert } from '../../lib/methods/helpers/info';
import { withTheme } from '../../theme';
import { Review } from '../../lib/methods/helpers/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/navigation/appNavigation';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { takeInquiry, takeResume } from '../../ee/omnichannel/lib';
import { sendLoadingEvent } from '../../containers/Loading';
import getThreadNameMethod from '../../lib/methods/getThreadName';
import getRoomInfo from '../../lib/methods/getRoomInfo';
import { ContainerTypes } from '../../containers/UIKit/interfaces';
import RoomServices from './services';
import LoadMore from './LoadMore';
import Banner from './Banner';
import RightButtons from './RightButtons';
import LeftButtons from './LeftButtons';
import styles from './styles';
import JoinCode, { IJoinCode } from './JoinCode';
import UploadProgress from './UploadProgress';
import ReactionPicker from './ReactionPicker';
import List from './List';
import {
	IApplicationState,
	IAttachment,
	IMessage,
	IOmnichannelSource,
	ISubscription,
	IVisitor,
	SubscriptionType,
	TAnyMessageModel,
	TSubscriptionModel,
	IEmoji,
	TGetCustomEmoji,
	RoomType
} from '../../definitions';
import {
	E2E_MESSAGE_TYPE,
	E2E_STATUS,
	MESSAGE_TYPE_ANY_LOAD,
	MessageTypeLoad,
	themes,
	NOTIFICATION_IN_APP_VIBRATION
} from '../../lib/constants';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import {
	callJitsi,
	loadSurroundingMessages,
	loadThreadMessages,
	readMessages,
	sendMessage,
	triggerBlockAction
} from '../../lib/methods';
import {
	isGroupChat,
	getUidDirectMessage,
	getRoomTitle,
	canAutoTranslate as canAutoTranslateMethod,
	debounce,
	isIOS,
	hasPermission
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { withActionSheet } from '../../containers/ActionSheet';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { IMessageComposerRef, MessageComposerContainer } from '../../containers/MessageComposer';
import { RoomContext } from './context';
import AudioManager from '../../lib/methods/AudioManager';
import { IListContainerRef, TListRef } from './List/definitions';
import { getMessageById } from '../../lib/database/services/Message';
import { getThreadById } from '../../lib/database/services/Thread';
import { hasE2EEWarning, isE2EEDisabledEncryptedRoom, isMissingRoomE2EEKey } from '../../lib/encryption/utils';
import { clearInAppFeedback, removeInAppFeedback } from '../../actions/inAppFeedback';
import UserPreferences from '../../lib/methods/userPreferences';
import { IRoomViewProps, IRoomViewState } from './definitions';
import { roomAttrsUpdate, stateAttrsUpdate } from './constants';
import { EncryptedRoom, MissingRoomE2EEKey } from './components';

interface didMountInteraction {
	then: (onfulfilled?: (() => any) | undefined, onrejected?: (() => any) | undefined) => Promise<any>;
	done: (...args: any[]) => any;
	cancel: () => void;
}

const RoomView: React.FC<IRoomViewProps> = (props: IRoomViewProps) => {
	const rid = props.route.params?.rid;
	const t = props.route.params?.t;
	const tmid = props.route.params?.tmid;
	const name = props.route.params?.name;
	const fname = props.route.params?.fname;
	const prid = props.route.params?.prid;
	const jumpToMessageId = props.route.params?.jumpToMessageId;
	const jumpToThreadId = props.route.params?.jumpToThreadId;

	const room = props.route.params?.room ?? {
		rid: rid as string,
		t: t as string,
		name,
		fname,
		prid
	};

	const initialRoomUserId = props.route.params?.roomUserId ?? getUidDirectMessage(room);
	const initialSelectedMessages = props.route.params?.messageId ? [props.route.params.messageId] : [];

	const [state, setState] = React.useState<IRoomViewState>({
		joined: true,
		room,
		roomUpdate: {},
		member: {},
		lastOpen: null,
		reactionsModalVisible: false,
		selectedMessages: initialSelectedMessages,
		action: initialSelectedMessages.length ? 'quote' : null,
		canAutoTranslate: false,
		loading: true,
		replyWithMention: false,
		readOnly: false,
		unreadsCount: null,
		roomUserId: initialRoomUserId,
		canViewCannedResponse: false,
		canForwardGuest: false,
		canReturnQueue: false,
		canPlaceLivechatOnHold: false,
		isOnHold: false,
		rightButtonsWidth: 0
	});

	const mounted = React.useRef(false);
	const retryInit = React.useRef(0);
	const retryInitTimeout = React.useRef<NodeJS.Timeout | null>(null);
	const subObserveQuery = React.useRef<Subscription | null>(null);
	const subSubscription = React.useRef<Subscription | null>(null);
	const queryUnreads = React.useRef<Subscription | null>(null);
	const sub = React.useRef<RoomClass | null>(null);
	const messageComposerRef = React.useRef<IMessageComposerRef | null>(null);
	const didMountInteraction = React.useRef<didMountInteraction | null>(null);

	const messageErrorActions = React.useRef<IMessageErrorActions | null>(null);
	const messageActions = React.useRef<IMessageActions | null>(null);

	const list = React.useRef<IListContainerRef | null>(null);
	const flatList = React.useRef<TListRef | null>(null);
	const joinCode = React.useRef<IJoinCode | null>(null);

	React.useEffect(() => {
		mounted.current = true;

		setHeader();

		if ('id' in room) {
			observeRoom(room as TSubscriptionModel);
		} else if (rid) {
			findAndObserveRoom(rid);
		}

		setReadOnly();

		if (t === SubscriptionType.OMNICHANNEL) {
			updateOmnichannel();
		}

		if (rid && !tmid) {
			sub.current = new RoomClass(rid);
		}

		const { navigation, dispatch } = props;
		const { selectedMessages } = state;
		dispatch(clearInAppFeedback());

		didMountInteraction.current = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = props;
			setHeader();
			if (rid) {
				try {
					sub.current?.subscribe?.();
				} catch (e) {
					log(e);
				}
				if (isAuthenticated) {
					init();
				} else {
					EventEmitter.addEventListener('connected', handleConnected);
				}
			}
			if (jumpToMessageId) {
				jumpToMessage(jumpToMessageId);
			}
			if (jumpToThreadId && !jumpToMessageId) {
				navToThread({ tmid: jumpToThreadId });
			}
			if (isIOS && rid) {
				updateUnreadCount();
			}
			if (selectedMessages.length === 1) {
				onQuoteInit(selectedMessages[0]);
			}
		});
		EventEmitter.addEventListener('ROOM_REMOVED', handleRoomRemoved);

		navigation.addListener('blur', () => {
			AudioManager.pauseAudio();
		});

		return () => {
			mounted.current = false;

			const { dispatch } = props;

			dispatch(clearInAppFeedback());

			unsubscribe();
			if (didMountInteraction.current && didMountInteraction.current.cancel) {
				didMountInteraction.current.cancel();
			}
			if (subSubscription.current && subSubscription.current.unsubscribe) {
				subSubscription.current.unsubscribe();
			}

			if (subObserveQuery.current && subObserveQuery.current.unsubscribe) {
				subObserveQuery.current.unsubscribe();
			}
			if (queryUnreads.current && queryUnreads.current.unsubscribe) {
				queryUnreads.current.unsubscribe();
			}
			if (retryInitTimeout.current) {
				clearTimeout(retryInitTimeout.current);
			}

			EventEmitter.removeListener('connected', handleConnected);
			EventEmitter.removeListener('ROOM_REMOVED', handleRoomRemoved);
			if (!tmid) {
				AudioManager.unloadRoomAudios(rid);
			}
		};
	}, []);

	const updateOmnichannel = React.useCallback(async () => {
		const data = await Promise.all([canForwardGuest(), canPlaceLivechatOnHold(), canReturnQueue(), canViewCannedResponse()]);

		setState(prevState => ({
			...prevState,
			canForwardGuest: data[0],
			canReturnQueue: data[1],
			canViewCannedResponse: data[2],
			canPlaceLivechatOnHold: data[3]
		}));

		if (mounted.current) {
			setHeader();
		}
	}, []);

	const canForwardGuest = React.useCallback(async () => {
		const { transferLivechatGuestPermission } = props;
		const permissions = await hasPermission([transferLivechatGuestPermission], rid);
		return permissions[0];
	}, [rid, props.transferLivechatGuestPermission]);

	const canPlaceLivechatOnHold = React.useCallback(() => {
		const { livechatAllowManualOnHold } = props;
		const { room } = state;
		return !!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);
	}, [state, props.livechatAllowManualOnHold]);

	const canViewCannedResponse = React.useCallback(async () => {
		const { viewCannedResponsesPermission } = props;
		const permissions = await hasPermission([viewCannedResponsesPermission], rid);
		return permissions[0];
	}, [rid, props.viewCannedResponsesPermission]);

	const canReturnQueue = React.useCallback(async () => {
		try {
			const { returnQueue } = await getRoutingConfig();
			return returnQueue;
		} catch {
			return false;
		}
	}, []);

	const observeSubscriptions = React.useCallback(() => {
		try {
			const observeSubCollection = database.active
				.get('subscriptions')
				.query(Q.where('rid', rid as string))
				.observe();

			subObserveQuery.current = observeSubCollection.subscribe(data => {
				if (data[0]) {
					if (subObserveQuery.current && subObserveQuery.current.unsubscribe) {
						observeRoom(data[0]);
						setState(prevState => ({ ...prevState, room: data[0], joined: true }));
						subObserveQuery.current.unsubscribe();
					}
				}
			});
		} catch (e) {
			console.log("observeSubscriptions: Can't find subscription to observe");
		}
	}, [rid]);

	const isOmnichannel = React.useMemo(() => {
		return state.room.t === SubscriptionType.OMNICHANNEL;
	}, [state.room.t]);

	const hideSystemMessages = React.useMemo(() => {
		const { sysMes } = state.room;
		const { Hide_System_Messages } = props;

		// FIXME: handle servers with version < 3.0.0
		let hideSystemMessages = Array.isArray(sysMes) ? sysMes : Hide_System_Messages;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}
		return hideSystemMessages ?? [];
	}, [state.room, props.Hide_System_Messages]);

	const setHeader = React.useCallback(() => {
		const { room, unreadsCount, roomUserId, joined, canForwardGuest, canReturnQueue, canPlaceLivechatOnHold, rightButtonsWidth } =
			state;
		const { navigation, isMasterDetail, theme, baseUrl, user, route, encryptionEnabled } = props;

		if (!room.rid) return;

		const prid = room?.prid;
		const isGroupChatConst = isGroupChat(room as ISubscription);
		let title = route.params?.name;
		let parentTitle = '';
		// TODO: I think it's safe to remove this, but we need to test tablet without rooms
		if (!tmid) {
			title = getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let teamId: string | undefined;
		let encrypted: boolean | undefined;
		let userId: string | undefined;
		let token: string | undefined;
		let avatar: string | undefined;
		let visitor: IVisitor | undefined;
		let sourceType: IOmnichannelSource | undefined;
		let departmentId: string | undefined;

		if ('id' in room) {
			subtitle = room.topic;
			teamId = room.teamId;
			encrypted = room.encrypted;
			({ id: userId, token } = user);
			avatar = room.name;
			visitor = room.visitor;
			departmentId = room.departmentId;
		}

		if ('source' in room) {
			sourceType = room.source;
			visitor = room.visitor;
		}

		const onLayout = ({ nativeEvent }: { nativeEvent: any }) => {
			setState(prevState => ({ ...prevState, rightButtonsWidth: nativeEvent.layout.width }));
		};

		const t = room?.t;
		const teamMain = 'teamMain' in room ? room?.teamMain : false;
		const omnichannelPermissions = { canForwardGuest, canReturnQueue, canPlaceLivechatOnHold };
		const iSubRoom = room as ISubscription;
		const e2eeWarning = !!(
			'encrypted' in room && hasE2EEWarning({ encryptionEnabled, E2EKey: room.E2EKey, roomEncrypted: room.encrypted })
		);
		navigation.setOptions({
			headerLeft: () =>
				isIOS && (unreadsCount || isMasterDetail) ? (
					<LeftButtons
						rid={rid}
						tmid={tmid}
						unreadsCount={unreadsCount}
						baseUrl={baseUrl}
						userId={userId}
						token={token}
						title={avatar}
						theme={theme}
						t={t}
						goRoomActionsView={goRoomActionsView}
						isMasterDetail={isMasterDetail}
					/>
				) : undefined,
			headerTitle: () => (
				<RoomHeader
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChatConst}
					onPress={goRoomActionsView}
					testID={`room-view-title-${title}`}
					sourceType={sourceType}
					disabled={e2eeWarning}
					rightButtonsWidth={rightButtonsWidth}
				/>
			),
			headerRight: () => (
				<RightButtons
					rid={rid}
					tmid={tmid}
					teamId={teamId}
					joined={joined}
					status={room.status}
					omnichannelPermissions={omnichannelPermissions}
					t={t as SubscriptionType}
					encrypted={encrypted}
					navigation={navigation}
					toggleFollowThread={toggleFollowThread}
					showActionSheet={showActionSheet}
					departmentId={departmentId}
					notificationsDisabled={iSubRoom?.disableNotifications}
					onLayout={onLayout}
					hasE2EEWarning={e2eeWarning}
				/>
			)
		});
	}, [state, props]);

	const goRoomActionsView = React.useCallback((screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		const { room, member, joined, canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold } = state;
		const { navigation, isMasterDetail } = props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: rid as string,
					t: t as SubscriptionType,
					room: room as ISubscription,
					member,
					showCloseModal: !!screen,
					// @ts-ignore
					joined,
					omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold }
				}
			});
		} else if (rid && t) {
			navigation.push('RoomActionsView', {
				rid: rid,
				t: t as SubscriptionType,
				room: room as TSubscriptionModel,
				member,
				joined,
				omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold }
			});
		}
	}, []);

	const setReadOnly = React.useCallback(async () => {
		const { room } = state;
		const { user } = props;
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		setState(prevState => ({ ...prevState, readOnly }));
	}, []);

	const init = async () => {
		try {
			setState(prevState => ({ ...prevState, loading: true }));

			const { room, joined } = state;
			if (!rid) {
				return;
			}
			if (tmid) {
				await loadThreadMessages({ tmid: tmid, rid: rid });
			} else {
				const newLastOpen = new Date();
				await RoomServices.getMessages({
					rid: room.rid,
					t: room.t as RoomType,
					...('lastOpen' in room && room.lastOpen ? { lastOpen: room.lastOpen } : {})
				});

				// if room is joined
				if (joined && 'id' in room) {
					if (room.alert || room.unread || room.userMentions) {
						setLastOpen(room.ls);
					} else {
						setLastOpen(null);
					}
					readMessages(room.rid, newLastOpen, true).catch(e => console.log(e));
				}
			}

			const canAutoTranslate = canAutoTranslateMethod();
			const member = await getRoomMember();

			setState(prevState => ({ ...prevState, canAutoTranslate, member, loading: false }));
		} catch (e) {
			setState(prevState => ({ ...prevState, loading: false }));

			retryInit.current += 1;
			if (retryInit.current <= 1) {
				retryInitTimeout.current = setTimeout(() => {
					init();
				}, 300);
			}
		}
	};

	const getRoomMember = async () => {
		const { room } = state;
		const { t } = room;

		if ('id' in room && t === SubscriptionType.DIRECT && !isGroupChat(room)) {
			try {
				const roomUserId = getUidDirectMessage(room);
				setState(prevState => ({ ...prevState, roomUserId }));
				setHeader();

				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					return result.user;
				}
			} catch (e) {
				log(e);
			}
		}

		return {};
	};

	const findAndObserveRoom = React.useCallback(
		async (rid: string) => {
			try {
				const db = database.active;
				const subCollection = db.get('subscriptions');
				const room = await subCollection.find(rid);

				setState(prevState => ({ ...prevState, room }));

				if (!tmid) {
					setHeader();
				}

				observeRoom(room);
			} catch (error) {
				if (t !== SubscriptionType.DIRECT) {
					console.log('Room not found');

					setState(prevState => ({ ...prevState, joined: false }));
				}
				if (rid) {
					observeSubscriptions();
				}
			}
		},
		[rid]
	);

	const unsubscribe = async () => {
		if (sub.current && sub.current.unsubscribe) {
			await sub.current.unsubscribe();
		}

		sub.current = null;
	};
	const observeRoom = React.useCallback(
		(room: TSubscriptionModel) => {
			const observable = room.observe();

			subSubscription.current = observable.subscribe(changes => {
				const roomUpdate = roomAttrsUpdate.reduce((ret: any, attr) => {
					ret[attr] = changes[attr];
					return ret;
				}, {});

				setState(prevState => ({ ...prevState, room: changes, roomUpdate, isOnHold: !!changes?.onHold }));
			});
		},
		[roomAttrsUpdate]
	);

	const handleCloseEmoji = (action?: Function, params?: any) => {
		if (messageComposerRef?.current) {
			return messageComposerRef?.current.closeEmojiKeyboardAndAction(action, params);
		}
		if (action) {
			return action(params);
		}
	};

	const errorActionsShow = (message: TAnyMessageModel) => {
		handleCloseEmoji(messageErrorActions.current?.showMessageErrorActions, message);
	};

	const showActionSheet = (options: any) => {
		const { showActionSheet } = props;
		handleCloseEmoji(showActionSheet, options);
	};

	const onEditInit = (messageId: string) => {
		const { action } = state;
		if (action) {
			return;
		}

		setState(prevState => ({ ...prevState, selectedMessages: [messageId], action: 'edit' }));
	};

	const onEditCancel = () => {
		resetAction();
	};

	const onEditRequest = async (message: Pick<IMessage, 'id' | 'msg' | 'rid'>) => {
		try {
			resetAction();
			await Services.editMessage(message);
		} catch (e) {
			log(e);
		}
	};

	const onReplyInit = async (messageId: string) => {
		const message = await getMessageById(messageId);
		if (!message || !rid) {
			return;
		}

		// If there's a thread already, we redirect to it
		if (message.tlm) {
			return onThreadPress(message);
		}
		const { roomUserId } = state;
		const { navigation } = props;
		navigation.push('RoomView', {
			rid,
			tmid: messageId,
			name: makeThreadName(message),
			t: SubscriptionType.THREAD,
			roomUserId
		});
	};

	const onQuoteInit = (messageId: string) => {
		const { action } = state;
		if (action === 'quote') {
			if (!state.selectedMessages.includes(messageId)) {
				setState(prevState => ({ ...prevState, selectedMessages: [...prevState.selectedMessages, messageId] }));
			}
			return;
		}
		if (action) {
			return;
		}
		setState(prevState => ({ ...prevState, selectedMessages: [messageId], action: 'quote' }));
	};

	const onRemoveQuoteMessage = (messageId: string) => {
		const { selectedMessages } = state;
		const newSelectedMessages = selectedMessages.filter(item => item !== messageId);
		setState(prevState => ({
			...prevState,
			selectedMessages: newSelectedMessages,
			action: newSelectedMessages.length ? 'quote' : null
		}));
	};

	const resetAction = () => {
		setState(prevState => ({ ...prevState, action: null, selectedMessages: [] }));
	};

	const showReactionPicker = () => {
		const { showActionSheet } = props;
		const { selectedMessages } = state;
		setTimeout(() => {
			showActionSheet({
				children: (
					<ReactionPicker messageId={selectedMessages[0]} onEmojiSelected={onReactionPress} reactionClose={onReactionClose} />
				),
				snaps: ['50%'],
				enableContentPanningGesture: false,
				onClose: resetAction
			});
		}, 100);
	};

	const onReactionInit = (messageId: string) => {
		if (state.action) {
			return;
		}
		handleCloseEmoji(() => {
			setState(prevState => ({ ...prevState, selectedMessages: [messageId], action: 'react' }));
			showReactionPicker();
		});
	};

	const onReactionClose = () => {
		const { hideActionSheet } = props;
		resetAction();
		hideActionSheet();
	};

	const onMessageLongPress = (message: TAnyMessageModel) => {
		const { action } = state;
		if (action && action !== 'quote') {
			return;
		}
		// if it's a thread message on main room, we disable the long press
		if (message.tmid && !tmid) {
			return;
		}
		handleCloseEmoji(messageActions.current?.showMessageActions, message);
	};

	const showAttachment = (attachment: IAttachment) => {
		const { navigation } = props;
		navigation.navigate('AttachmentView', { attachment });
	};

	const onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			let shortname = '';
			if (typeof emoji === 'string') {
				shortname = emoji;
			} else {
				shortname = emoji.name;
			}
			await Services.setReaction(shortname, messageId);
			onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	const onReactionLongPress = (message: TAnyMessageModel) => {
		const { showActionSheet } = props;
		handleCloseEmoji(showActionSheet, {
			children: <ReactionsList reactions={message?.reactions} getCustomEmoji={getCustomEmoji} />,
			snaps: ['50%'],
			enableContentPanningGesture: false
		});
	};

	const onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const { navigation, isMasterDetail } = props;

		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };

		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	const onDiscussionPress = debounce(
		async (item: TAnyMessageModel) => {
			const { isMasterDetail } = props;
			if (!item.drid) return;
			const sub = await getRoomInfo(item.drid);
			if (sub) {
				goRoom({
					item: sub as TGoRoomItem,
					isMasterDetail
				});
			}
		},
		1000,
		true
	);

	// eslint-disable-next-line react/sort-comp
	const updateUnreadCount = async () => {
		if (!rid) {
			return;
		}
		const db = database.active;
		const observable = db
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(rid)))
			.observeWithColumns(['unread']);

		queryUnreads.current = observable.subscribe(rooms => {
			const unreadsCount = rooms.reduce(
				(unreadCount, room) => (room.unread > 0 && !room.hideUnreadStatus ? unreadCount + room.unread : unreadCount),
				0
			);
			if (state.unreadsCount !== unreadsCount) {
				setState(prevState => ({ ...prevState, unreadsCount }));
				setHeader();
			}
		});
	};

	const onThreadPress = debounce((item: TAnyMessageModel) => navToThread(item), 1000, true);

	const shouldNavigateToRoom = (message: IMessage) => {
		if (message.tmid && message.tmid === tmid) {
			return false;
		}
		if (!message.tmid && message.rid === rid) {
			return false;
		}
		return true;
	};

	const jumpToMessageByUrl = async (messageUrl?: string, isFromReply?: boolean) => {
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
	};

	const jumpToMessage = async (messageId: string, isFromReply?: boolean) => {
		try {
			sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessage });
			const message = await RoomServices.getMessageInfo(messageId);

			if (!message) {
				cancelJumpToMessage();
				return;
			}

			if (shouldNavigateToRoom(message)) {
				if (message.rid !== rid) {
					navToRoom(message);
				} else {
					navToThread(message);
				}
			} else if (!message.tmid && message.rid === rid && t === SubscriptionType.THREAD && !message.replies) {
				/**
				 * if the user is within a thread and the message that he is trying to jump to, is a message in the main room
				 */
				return navToRoom(message);
			} else {
				/**
				 * if it's from server, we don't have it saved locally and so we fetch surroundings
				 * we test if it's not from threads because we're fetching from threads currently with `loadThreadMessages`
				 */
				if (message.fromServer && !message.tmid && rid) {
					await loadSurroundingMessages({ messageId, rid: rid });
				}
				await Promise.race([list.current?.jumpToMessage(message.id), new Promise(res => setTimeout(res, 5000))]);
				cancelJumpToMessage();
			}
		} catch (error: any) {
			if (isFromReply && error.data?.errorType === 'error-not-allowed') {
				showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
			} else {
				log(error);
			}
			cancelJumpToMessage();
		}
	};

	const cancelJumpToMessage = () => {
		list.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const replyBroadcast = (message: IMessage) => {
		const { dispatch } = props;
		dispatch(replyBroadcastAction(message));
	};

	const handleConnected = () => {
		init();
		EventEmitter.removeListener('connected', handleConnected);
	};

	const handleRoomRemoved = ({ rid }: { rid: string }) => {
		const { room } = state;
		if (rid === rid) {
			Navigation.navigate('RoomsListView');
			!isOmnichannel && showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(room) }), I18n.t('Oops'));
		}
	};

	const internalSetState = (...args: any[]) => {
		if (!mounted.current) {
			return;
		}
		// @ts-ignore TODO: TS is complaining about this, but I don't feel like changing rn since it should be working
		setState(prevState => ({ ...prevState, ...args }));
	};

	const handleSendMessage = (message: string, tshow?: boolean) => {
		logEvent(events.ROOM_SEND_MESSAGE);
		const { rid } = state.room;
		const { user } = props;
		sendMessage(rid, message, tmid, user, tshow).then(() => {
			if (mounted.current) {
				setLastOpen(null);
			}
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	const getCustomEmoji: TGetCustomEmoji = name => {
		const { customEmojis } = props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const setLastOpen = (lastOpen: Date | null) => setState(prevState => ({ ...prevState, lastOpen }));

	const onJoin = () => {
		internalSetState({
			joined: true
		});
	};

	const joinRoom = async () => {
		logEvent(events.ROOM_JOIN);
		try {
			const { room } = state;

			if (isOmnichannel) {
				if ('_id' in room) {
					await takeInquiry(room._id);
				}
				onJoin();
			} else {
				const { joinCodeRequired, rid } = room;
				if (joinCodeRequired) {
					joinCode.current?.show();
				} else {
					await Services.joinRoom(rid, null, t as any);
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
			const { room } = state;

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

	const getThreadName = (tmid: string, messageId: string) => {
		const { rid } = state.room;
		return getThreadNameMethod(rid, tmid, messageId);
	};

	const fetchThreadName = async (tmid: string, messageId: string) => {
		const { rid } = state.room;
		const threadRecord = await getThreadById(tmid);
		if (threadRecord?.t === 'rm') {
			return I18n.t('Message_removed');
		}
		return getThreadNameMethod(rid, tmid, messageId);
	};

	const toggleFollowThread = async (isFollowingThread: boolean, threadMessageId = tmid) => {
		try {
			if (!threadMessageId) {
				return;
			}

			await Services.toggleFollowMessage(threadMessageId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	const getBadgeColor = (messageId: string) => {
		const { room } = state;
		const { theme } = props;
		return getBadgeColorMethod({ subscription: room, theme, messageId });
	};

	const navToRoomInfo = (navParam: any) => {
		const { navigation, isMasterDetail } = props;
		const { room } = state;
		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		navParam.fromRid = room.rid;
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	};

	const navToThread = async (item: TAnyMessageModel | { tmid: string }) => {
		const { roomUserId } = state;
		const { navigation } = props;

		if (!rid) {
			return;
		}

		if (item.tmid) {
			let name = '';
			let jumpToMessageId = '';
			if ('id' in item) {
				name = item.tmsg ?? '';
				jumpToMessageId = item.id;
			}
			sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessage });
			const threadRecord = await getThreadById(item.tmid);
			if (threadRecord?.t === 'rm') {
				name = I18n.t('Thread');
			}
			if (!name) {
				const result = await getThreadName(item.tmid, jumpToMessageId);
				// test if there isn't a thread
				if (!result) {
					sendLoadingEvent({ visible: false });
					return;
				}
				name = result;
			}
			if ('id' in item && item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE) {
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
				roomUserId,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId
			});
		}
	};

	const navToRoom = async (message: TAnyMessageModel) => {
		const { isMasterDetail } = props;
		const roomInfo = await getRoomInfo(message.rid);

		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	// OLD METHOD - support versions before 5.0.0
	const handleEnterCall = () => {
		const { room } = state;
		if ('id' in room) {
			const { jitsiTimeout } = room;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room });
			}
		}
	};

	const blockAction = ({
		actionId,
		appId,
		value,
		blockId,
		rid,
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
			rid,
			appId,
			container: {
				type: ContainerTypes.MESSAGE,
				id: mid
			}
		});

	const closeBanner = async () => {
		const { room } = state;
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
	};

	const isIgnored = (message: TAnyMessageModel): boolean => {
		const { room } = state;
		if ('id' in room) {
			return room?.ignored?.includes?.(message?.u?._id) ?? false;
		}
		return false;
	};

	const goToCannedResponses = () => {
		const { room } = state;
		Navigation.navigate('CannedResponsesListView', { rid: room.rid });
	};

	const hapticFeedback = (msgId: string) => {
		const { dispatch } = props;
		dispatch(removeInAppFeedback(msgId));
		const notificationInAppVibration = UserPreferences.getBool(NOTIFICATION_IN_APP_VIBRATION);
		if (notificationInAppVibration || notificationInAppVibration === null) {
			try {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} catch {
				// Do nothing: Haptic is unavailable
			}
		}
	};

	const setQuotesAndText = (text: string, quotes: string[]) => {
		if (quotes.length) {
			setState(prevState => ({ ...prevState, selectedMessages: quotes, action: 'quote' }));
		} else {
			setState(prevState => ({ ...prevState, action: null, selectedMessages: [] }));
		}

		messageComposerRef.current?.setInput(text || '');
	};

	const getText = () => messageComposerRef.current?.getText();

	const renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => {
		const { room, lastOpen, canAutoTranslate } = state;
		const {
			user,
			Message_GroupingPeriod,
			Message_TimeFormat,
			useRealName,
			baseUrl,
			Message_Read_Receipt_Enabled,
			theme,
			inAppFeedback
		} = props;
		const { action, selectedMessages } = state;
		let dateSeparator = null;
		let showUnreadSeparator = false;
		const isBeingEdited = action === 'edit' && item.id === selectedMessages[0];

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator =
				(lastOpen && moment(item.ts).isSameOrAfter(lastOpen) && moment(previousItem.ts).isBefore(lastOpen)) ?? false;
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
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
					user={user as any}
					rid={room.rid}
					archived={'id' in room && room.archived}
					broadcast={'id' in room && room.broadcast}
					status={item.status}
					isThreadRoom={!!tmid}
					isIgnored={isIgnored(item)}
					previousItem={previousItem}
					fetchThreadName={fetchThreadName}
					onReactionPress={onReactionPress}
					onReactionLongPress={onReactionLongPress}
					onLongPress={onMessageLongPress}
					onEncryptedPress={onEncryptedPress}
					onDiscussionPress={onDiscussionPress}
					onThreadPress={onThreadPress}
					onAnswerButtonPress={handleSendMessage}
					showAttachment={showAttachment}
					reactionInit={onReactionInit}
					replyBroadcast={replyBroadcast}
					errorActionsShow={errorActionsShow}
					isSystemMessage={room.sysMes as boolean}
					baseUrl={baseUrl}
					Message_GroupingPeriod={Message_GroupingPeriod}
					timeFormat={Message_TimeFormat}
					useRealName={useRealName}
					isReadReceiptEnabled={Message_Read_Receipt_Enabled}
					autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
					autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}
					navToRoomInfo={navToRoomInfo}
					getCustomEmoji={getCustomEmoji}
					handleEnterCall={handleEnterCall}
					blockAction={blockAction}
					threadBadgeColor={getBadgeColor(item?.id)}
					toggleFollowThread={toggleFollowThread}
					jumpToMessage={jumpToMessageByUrl}
					highlighted={highlightedMessage === item.id}
					theme={theme}
					closeEmojiAndAction={handleCloseEmoji}
					isBeingEdited={isBeingEdited}
					dateSeparator={dateSeparator}
					showUnreadSeparator={showUnreadSeparator}
				/>
			);
		}

		return content;
	};

	const renderFooter = () => {
		const { joined, room, readOnly, loading } = state;
		const { theme, airGappedRestrictionRemainingDays } = props;

		if (!rid) {
			return null;
		}
		if ('onHold' in room && room.onHold) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
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
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
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
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_title')}
					</Text>
					<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_description')}
					</Text>
				</View>
			);
		}
		if (readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return <MessageComposerContainer ref={messageComposerRef} />;
	};

	const renderActions = () => {
		const { room, readOnly } = state;
		const { user } = props;
		if (!('id' in room)) {
			return null;
		}
		return (
			<>
				<MessageActions
					ref={messageActions}
					tmid={tmid}
					room={room}
					user={user}
					editInit={onEditInit}
					replyInit={onReplyInit}
					quoteInit={onQuoteInit}
					reactionInit={onReactionInit}
					onReactionPress={onReactionPress}
					jumpToMessage={jumpToMessageByUrl}
					isReadOnly={readOnly}
				/>
				<MessageErrorActions ref={messageErrorActions} tmid={tmid} />
			</>
		);
	};

	const render = () => {
		console.count(`RoomView.render calls`);
		const { room, loading, action, selectedMessages } = state;
		const { user, baseUrl, theme, width, serverVersion, navigation, encryptionEnabled } = props;
		const { rid, t } = room;
		let bannerClosed;
		let announcement;
		if ('id' in room) {
			({ bannerClosed, announcement } = room);
		}

		if ('encrypted' in room) {
			// Missing room encryption key
			if (isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey })) {
				return <MissingRoomE2EEKey />;
			}

			// Encrypted room, but user session is not encrypted
			if (isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted })) {
				return <EncryptedRoom navigation={navigation} roomName={getRoomTitle(room)} />;
			}
		}

		return (
			<RoomContext.Provider
				value={{
					rid,
					t,
					tmid,
					sharing: false,
					action,
					selectedMessages,
					onRemoveQuoteMessage,
					editCancel: onEditCancel,
					editRequest: onEditRequest,
					onSendMessage: handleSendMessage,
					setQuotesAndText,
					getText
				}}>
				<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view'>
					<StatusBar />
					<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={closeBanner} />
					<List
						ref={list}
						//@ts-ignore TODO: TS is complaining about this
						listRef={flatList}
						rid={rid}
						tmid={tmid}
						renderRow={renderItem}
						loading={loading}
						hideSystemMessages={hideSystemMessages}
						showMessageInMainThread={user.showMessageInMainThread ?? false}
						serverVersion={serverVersion}
					/>
					{renderFooter()}
					{renderActions()}
					<UploadProgress rid={rid} user={user} baseUrl={baseUrl} width={width} />
					<JoinCode ref={joinCode} onJoin={onJoin} rid={rid} t={t} theme={theme} />
				</SafeAreaView>
			</RoomContext.Provider>
		);
	};

	return render();
};

function propsAreEqual(prevProps: IRoomViewProps, nextProps: IRoomViewProps) {
	const { theme, insets, route, encryptionEnabled, airGappedRestrictionRemainingDays } = prevProps;
	if (theme !== nextProps.theme) {
		return true;
	}
	if (encryptionEnabled !== nextProps.encryptionEnabled) {
		return true;
	}
	if (airGappedRestrictionRemainingDays !== nextProps.airGappedRestrictionRemainingDays) {
		return true;
	}
	if (!dequal(nextProps.insets, insets)) {
		return true;
	}
	if (!dequal(nextProps.route?.params, route?.params)) {
		return true;
	}
	return Object.is(prevProps, nextProps);
}

export default React.memo(RoomView, propsAreEqual);
class RoomViewComponent extends React.Component<IRoomViewProps, IRoomViewState> {
	private rid?: string;
	private t?: string;
	private tmid?: string;
	private jumpToMessageId?: string;
	private jumpToThreadId?: string;
	private messageComposerRef: React.RefObject<IMessageComposerRef>;
	private joinCode: React.RefObject<IJoinCode>;
	// ListContainer component
	private list: React.RefObject<IListContainerRef>;
	// FlatList inside ListContainer
	private flatList: TListRef;
	private mounted: boolean;
	private subObserveQuery?: Subscription;
	private subSubscription?: Subscription;
	private queryUnreads?: Subscription;
	private retryInit = 0;
	private retryInitTimeout?: ReturnType<typeof setTimeout>;
	private messageErrorActions?: IMessageErrorActions | null;
	private messageActions?: IMessageActions | null;
	// Type of InteractionManager.runAfterInteractions
	private didMountInteraction?: {
		then: (onfulfilled?: (() => any) | undefined, onrejected?: (() => any) | undefined) => Promise<any>;
		done: (...args: any[]) => any;
		cancel: () => void;
	};
	private sub?: RoomClass;
	private unsubscribeBlur?: () => void;
	private unsubscribeFocus?: () => void;

	constructor(props: IRoomViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		/**
		 * On threads, we don't have a subscription.
		 * `this.state.room` is going to have only a few properties sent during navigation.
		 * Use `this.tmid` as thread id.
		 */
		this.tmid = props.route.params?.tmid;
		const name = props.route.params?.name;
		const fname = props.route.params?.fname;
		const prid = props.route.params?.prid;
		const room = props.route.params?.room ?? {
			rid: this.rid as string,
			t: this.t as string,
			name,
			fname,
			prid
		};
		this.jumpToMessageId = props.route.params?.jumpToMessageId;
		this.jumpToThreadId = props.route.params?.jumpToThreadId;
		const roomUserId = props.route.params?.roomUserId ?? getUidDirectMessage(room);
		const selectedMessages = props.route.params?.messageId ? [props.route.params.messageId] : [];
		this.state = {
			joined: true,
			room,
			roomUpdate: {},
			member: {},
			lastOpen: null,
			reactionsModalVisible: false,
			selectedMessages,
			action: selectedMessages.length ? 'quote' : null,
			canAutoTranslate: false,
			loading: true,
			replyWithMention: false,
			readOnly: false,
			unreadsCount: null,
			roomUserId,
			canViewCannedResponse: false,
			canForwardGuest: false,
			canReturnQueue: false,
			canPlaceLivechatOnHold: false,
			isOnHold: false,
			rightButtonsWidth: 0
		};

		this.setHeader();

		if ('id' in room) {
			// @ts-ignore TODO: type guard isn't helping here :(
			this.observeRoom(room);
		} else if (this.rid) {
			this.findAndObserveRoom(this.rid);
		}

		this.setReadOnly();

		this.messageComposerRef = React.createRef();
		this.list = React.createRef();
		this.flatList = React.createRef();
		this.joinCode = React.createRef();
		this.mounted = false;

		if (this.t === 'l') {
			this.updateOmnichannel();
		}

		// we don't need to subscribe to threads
		if (this.rid && !this.tmid) {
			this.sub = new RoomClass(this.rid);
		}
	}

	componentDidMount() {
		const { navigation, dispatch } = this.props;
		const { selectedMessages } = this.state;
		dispatch(clearInAppFeedback());
		this.mounted = true;
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = this.props;
			this.setHeader();
			if (this.rid) {
				try {
					this.sub?.subscribe?.();
				} catch (e) {
					log(e);
				}
				if (isAuthenticated) {
					this.init();
				} else {
					EventEmitter.addEventListener('connected', this.handleConnected);
				}
			}
			if (this.jumpToMessageId) {
				this.jumpToMessage(this.jumpToMessageId);
			}
			if (this.jumpToThreadId && !this.jumpToMessageId) {
				this.navToThread({ tmid: this.jumpToThreadId });
			}
			if (isIOS && this.rid) {
				this.updateUnreadCount();
			}
			if (selectedMessages.length === 1) {
				this.onQuoteInit(selectedMessages[0]);
			}
		});
		EventEmitter.addEventListener('ROOM_REMOVED', this.handleRoomRemoved);
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			AudioManager.pauseAudio();
		});
	}

	shouldComponentUpdate(nextProps: IRoomViewProps, nextState: IRoomViewState) {
		const { state } = this;
		const { roomUpdate, member, isOnHold } = state;
		const { theme, insets, route, encryptionEnabled, airGappedRestrictionRemainingDays } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if (encryptionEnabled !== nextProps.encryptionEnabled) {
			return true;
		}
		if (airGappedRestrictionRemainingDays !== nextProps.airGappedRestrictionRemainingDays) {
			return true;
		}
		if (member.statusText !== nextState.member.statusText) {
			return true;
		}
		if (isOnHold !== nextState.isOnHold) {
			return true;
		}
		const stateUpdated = stateAttrsUpdate.some(key => nextState[key] !== state[key]);
		if (stateUpdated) {
			return true;
		}
		if (!dequal(nextState.selectedMessages, state.selectedMessages)) {
			return true;
		}
		if (!dequal(nextProps.insets, insets)) {
			return true;
		}
		if (!dequal(nextProps.route?.params, route?.params)) {
			return true;
		}
		return roomAttrsUpdate.some(key => !dequal(nextState.roomUpdate[key], roomUpdate[key]));
	}

	componentDidUpdate(prevProps: IRoomViewProps, prevState: IRoomViewState) {
		const { roomUpdate, joined, rightButtonsWidth } = this.state;
		const { insets, route } = this.props;

		if (route?.params?.jumpToMessageId && route?.params?.jumpToMessageId !== prevProps.route?.params?.jumpToMessageId) {
			this.jumpToMessage(route?.params?.jumpToMessageId);
		}

		if (route?.params?.jumpToThreadId && route?.params?.jumpToThreadId !== prevProps.route?.params?.jumpToThreadId) {
			this.navToThread({ tmid: route?.params?.jumpToThreadId });
		}

		// If it's a livechat room
		if (this.t === 'l') {
			if (
				!dequal(prevState.roomUpdate.lastMessage?.token, roomUpdate.lastMessage?.token) ||
				!dequal(prevState.roomUpdate.visitor, roomUpdate.visitor) ||
				!dequal(prevState.roomUpdate.status, roomUpdate.status) ||
				prevState.joined !== joined
			) {
				this.updateOmnichannel();
			}
		}
		if (roomAttrsUpdate.some(key => !dequal(prevState.roomUpdate[key], roomUpdate[key]))) this.setHeader();
		if (
			insets.left !== prevProps.insets.left ||
			insets.right !== prevProps.insets.right ||
			rightButtonsWidth !== prevState.rightButtonsWidth
		) {
			this.setHeader();
		}
		this.setReadOnly();
	}

	async componentWillUnmount() {
		const { dispatch } = this.props;
		dispatch(clearInAppFeedback());
		this.mounted = false;
		this.unsubscribe();
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}

		if (this.subObserveQuery && this.subObserveQuery.unsubscribe) {
			this.subObserveQuery.unsubscribe();
		}
		if (this.queryUnreads && this.queryUnreads.unsubscribe) {
			this.queryUnreads.unsubscribe();
		}
		if (this.retryInitTimeout) {
			clearTimeout(this.retryInitTimeout);
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		EventEmitter.removeListener('ROOM_REMOVED', this.handleRoomRemoved);
		if (!this.tmid) {
			await AudioManager.unloadRoomAudios(this.rid);
		}
	}

	updateOmnichannel = async () => {
		const canForwardGuest = await this.canForwardGuest();
		const canPlaceLivechatOnHold = this.canPlaceLivechatOnHold();
		const canReturnQueue = await this.canReturnQueue();
		const canViewCannedResponse = await this.canViewCannedResponse();
		this.setState({ canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold });
		if (this.mounted) {
			this.setHeader();
		}
	};

	canForwardGuest = async () => {
		const { transferLivechatGuestPermission } = this.props;
		const permissions = await hasPermission([transferLivechatGuestPermission], this.rid);
		return permissions[0] as boolean;
	};

	canPlaceLivechatOnHold = () => {
		const { livechatAllowManualOnHold } = this.props;
		const { room } = this.state;
		return !!(livechatAllowManualOnHold && !room?.lastMessage?.token && room?.lastMessage?.u && !room.onHold);
	};

	canViewCannedResponse = async () => {
		const { viewCannedResponsesPermission } = this.props;
		const permissions = await hasPermission([viewCannedResponsesPermission], this.rid);
		return permissions[0] as boolean;
	};

	canReturnQueue = async () => {
		try {
			const { returnQueue } = await getRoutingConfig();
			return returnQueue;
		} catch {
			return false;
		}
	};

	observeSubscriptions = () => {
		try {
			const db = database.active;
			const observeSubCollection = db
				.get('subscriptions')
				.query(Q.where('rid', this.rid as string))
				.observe();
			this.subObserveQuery = observeSubCollection.subscribe(data => {
				if (data[0]) {
					if (this.subObserveQuery && this.subObserveQuery.unsubscribe) {
						this.observeRoom(data[0]);
						this.setState({ room: data[0], joined: true });
						this.subObserveQuery.unsubscribe();
					}
				}
			});
		} catch (e) {
			console.log("observeSubscriptions: Can't find subscription to observe");
		}
	};

	get isOmnichannel() {
		const { room } = this.state;
		return room.t === 'l';
	}

	get hideSystemMessages() {
		const { sysMes } = this.state.room;
		const { Hide_System_Messages } = this.props;

		// FIXME: handle servers with version < 3.0.0
		let hideSystemMessages = Array.isArray(sysMes) ? sysMes : Hide_System_Messages;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}
		return hideSystemMessages ?? [];
	}

	setHeader = () => {
		const { room, unreadsCount, roomUserId, joined, canForwardGuest, canReturnQueue, canPlaceLivechatOnHold, rightButtonsWidth } =
			this.state;
		const { navigation, isMasterDetail, theme, baseUrl, user, route, encryptionEnabled } = this.props;
		const { rid, tmid } = this;
		if (!room.rid) {
			return;
		}

		const prid = room?.prid;
		const isGroupChatConst = isGroupChat(room as ISubscription);
		let title = route.params?.name;
		let parentTitle = '';
		// TODO: I think it's safe to remove this, but we need to test tablet without rooms
		if (!tmid) {
			title = getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let teamId: string | undefined;
		let encrypted: boolean | undefined;
		let userId: string | undefined;
		let token: string | undefined;
		let avatar: string | undefined;
		let visitor: IVisitor | undefined;
		let sourceType: IOmnichannelSource | undefined;
		let departmentId: string | undefined;
		if ('id' in room) {
			subtitle = room.topic;
			teamId = room.teamId;
			encrypted = room.encrypted;
			({ id: userId, token } = user);
			avatar = room.name;
			visitor = room.visitor;
			departmentId = room.departmentId;
		}

		if ('source' in room) {
			sourceType = room.source;
			visitor = room.visitor;
		}

		const onLayout = ({ nativeEvent }: { nativeEvent: any }) => {
			this.setState({ rightButtonsWidth: nativeEvent.layout.width });
		};

		const t = room?.t;
		const teamMain = 'teamMain' in room ? room?.teamMain : false;
		const omnichannelPermissions = { canForwardGuest, canReturnQueue, canPlaceLivechatOnHold };
		const iSubRoom = room as ISubscription;
		const e2eeWarning = !!(
			'encrypted' in room && hasE2EEWarning({ encryptionEnabled, E2EKey: room.E2EKey, roomEncrypted: room.encrypted })
		);
		navigation.setOptions({
			headerLeft: () =>
				isIOS && (unreadsCount || isMasterDetail) ? (
					<LeftButtons
						rid={rid}
						tmid={tmid}
						unreadsCount={unreadsCount}
						baseUrl={baseUrl}
						userId={userId}
						token={token}
						title={avatar}
						theme={theme}
						t={t}
						goRoomActionsView={this.goRoomActionsView}
						isMasterDetail={isMasterDetail}
					/>
				) : undefined,
			headerTitle: () => (
				<RoomHeader
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChatConst}
					onPress={this.goRoomActionsView}
					testID={`room-view-title-${title}`}
					sourceType={sourceType}
					disabled={e2eeWarning}
					rightButtonsWidth={rightButtonsWidth}
				/>
			),
			headerRight: () => (
				<RightButtons
					rid={rid}
					tmid={tmid}
					teamId={teamId}
					joined={joined}
					status={room.status}
					omnichannelPermissions={omnichannelPermissions}
					t={(this.t || t) as SubscriptionType}
					encrypted={encrypted}
					navigation={navigation}
					toggleFollowThread={this.toggleFollowThread}
					showActionSheet={this.showActionSheet}
					departmentId={departmentId}
					notificationsDisabled={iSubRoom?.disableNotifications}
					onLayout={onLayout}
					hasE2EEWarning={e2eeWarning}
				/>
			)
		});
	};

	goRoomActionsView = (screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		const { room, member, joined, canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold } = this.state;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: this.rid as string,
					t: this.t as SubscriptionType,
					room: room as ISubscription,
					member,
					showCloseModal: !!screen,
					// @ts-ignore
					joined,
					omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold }
				}
			});
		} else if (this.rid && this.t) {
			navigation.push('RoomActionsView', {
				rid: this.rid,
				t: this.t as SubscriptionType,
				room: room as TSubscriptionModel,
				member,
				joined,
				omnichannelPermissions: { canForwardGuest, canReturnQueue, canViewCannedResponse, canPlaceLivechatOnHold }
			});
		}
	};

	setReadOnly = async () => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room as ISubscription, user.username as string);
		this.setState({ readOnly });
	};

	init = async () => {
		try {
			this.setState({ loading: true });
			const { room, joined } = this.state;
			if (!this.rid) {
				return;
			}
			if (this.tmid) {
				await loadThreadMessages({ tmid: this.tmid, rid: this.rid });
			} else {
				const newLastOpen = new Date();
				await RoomServices.getMessages({
					rid: room.rid,
					t: room.t as RoomType,
					...('lastOpen' in room && room.lastOpen ? { lastOpen: room.lastOpen } : {})
				});

				// if room is joined
				if (joined && 'id' in room) {
					if (room.alert || room.unread || room.userMentions) {
						this.setLastOpen(room.ls);
					} else {
						this.setLastOpen(null);
					}
					readMessages(room.rid, newLastOpen, true).catch(e => console.log(e));
				}
			}

			const canAutoTranslate = canAutoTranslateMethod();
			const member = await this.getRoomMember();

			this.setState({ canAutoTranslate, member, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			this.retryInit += 1;
			if (this.retryInit <= 1) {
				this.retryInitTimeout = setTimeout(() => {
					this.init();
				}, 300);
			}
		}
	};

	getRoomMember = async () => {
		const { room } = this.state;
		const { t } = room;

		if ('id' in room && t === 'd' && !isGroupChat(room)) {
			try {
				const roomUserId = getUidDirectMessage(room);
				this.setState({ roomUserId }, () => this.setHeader());

				const result = await Services.getUserInfo(roomUserId);
				if (result.success) {
					return result.user;
				}
			} catch (e) {
				log(e);
			}
		}

		return {};
	};

	findAndObserveRoom = async (rid: string) => {
		try {
			const db = database.active;
			const subCollection = await db.get('subscriptions');
			const room = await subCollection.find(rid);
			this.setState({ room });
			if (!this.tmid) {
				this.setHeader();
			}
			this.observeRoom(room);
		} catch (error) {
			if (this.t !== 'd') {
				console.log('Room not found');
				this.internalSetState({ joined: false });
			}
			if (this.rid) {
				this.observeSubscriptions();
			}
		}
	};

	unsubscribe = async () => {
		if (this.sub && this.sub.unsubscribe) {
			await this.sub.unsubscribe();
		}
		delete this.sub;
	};

	observeRoom = (room: TSubscriptionModel) => {
		const observable = room.observe();
		this.subSubscription = observable.subscribe(changes => {
			const roomUpdate = roomAttrsUpdate.reduce((ret: any, attr) => {
				ret[attr] = changes[attr];
				return ret;
			}, {});
			if (this.mounted) {
				this.internalSetState({ room: changes, roomUpdate, isOnHold: !!changes?.onHold });
			} else {
				// @ts-ignore
				this.state.room = changes;
				// @ts-ignore
				this.state.roomUpdate = roomUpdate;
			}
		});
	};

	handleCloseEmoji = (action?: Function, params?: any) => {
		if (this.messageComposerRef?.current) {
			return this.messageComposerRef?.current.closeEmojiKeyboardAndAction(action, params);
		}
		if (action) {
			return action(params);
		}
	};

	errorActionsShow = (message: TAnyMessageModel) => {
		this.handleCloseEmoji(this.messageErrorActions?.showMessageErrorActions, message);
	};

	showActionSheet = (options: any) => {
		const { showActionSheet } = this.props;
		this.handleCloseEmoji(showActionSheet, options);
	};

	onEditInit = (messageId: string) => {
		const { action } = this.state;
		if (action) {
			return;
		}
		this.setState({ selectedMessages: [messageId], action: 'edit' });
	};

	onEditCancel = () => {
		this.resetAction();
	};

	onEditRequest = async (message: Pick<IMessage, 'id' | 'msg' | 'rid'>) => {
		try {
			this.resetAction();
			await Services.editMessage(message);
		} catch (e) {
			log(e);
		}
	};

	onReplyInit = async (messageId: string) => {
		const message = await getMessageById(messageId);
		if (!message || !this.rid) {
			return;
		}

		// If there's a thread already, we redirect to it
		if (message.tlm) {
			return this.onThreadPress(message);
		}
		const { roomUserId } = this.state;
		const { navigation } = this.props;
		navigation.push('RoomView', {
			rid: this.rid,
			tmid: messageId,
			name: makeThreadName(message),
			t: SubscriptionType.THREAD,
			roomUserId
		});
	};

	onQuoteInit = (messageId: string) => {
		const { action } = this.state;
		if (action === 'quote') {
			if (!this.state.selectedMessages.includes(messageId)) {
				this.setState(({ selectedMessages }) => ({ selectedMessages: [...selectedMessages, messageId] }));
			}
			return;
		}
		if (action) {
			return;
		}
		this.setState({ selectedMessages: [messageId], action: 'quote' });
	};

	onRemoveQuoteMessage = (messageId: string) => {
		const { selectedMessages } = this.state;
		const newSelectedMessages = selectedMessages.filter(item => item !== messageId);
		this.setState({ selectedMessages: newSelectedMessages, action: newSelectedMessages.length ? 'quote' : null });
	};

	resetAction = () => {
		this.setState({ action: null, selectedMessages: [] });
	};

	showReactionPicker = () => {
		const { showActionSheet } = this.props;
		const { selectedMessages } = this.state;
		setTimeout(() => {
			showActionSheet({
				children: (
					<ReactionPicker
						messageId={selectedMessages[0]}
						onEmojiSelected={this.onReactionPress}
						reactionClose={this.onReactionClose}
					/>
				),
				snaps: ['50%'],
				enableContentPanningGesture: false,
				onClose: this.resetAction
			});
		}, 100);
	};

	onReactionInit = (messageId: string) => {
		if (this.state.action) {
			return;
		}
		this.handleCloseEmoji(() => {
			this.setState({ selectedMessages: [messageId], action: 'react' }, this.showReactionPicker);
		});
	};

	onReactionClose = () => {
		const { hideActionSheet } = this.props;
		this.resetAction();
		hideActionSheet();
	};

	onMessageLongPress = (message: TAnyMessageModel) => {
		const { action } = this.state;
		if (action && action !== 'quote') {
			return;
		}
		// if it's a thread message on main room, we disable the long press
		if (message.tmid && !this.tmid) {
			return;
		}
		this.handleCloseEmoji(this.messageActions?.showMessageActions, message);
	};

	showAttachment = (attachment: IAttachment) => {
		const { navigation } = this.props;
		// @ts-ignore
		navigation.navigate('AttachmentView', { attachment });
	};

	onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			let shortname = '';
			if (typeof emoji === 'string') {
				shortname = emoji;
			} else {
				shortname = emoji.name;
			}
			await Services.setReaction(shortname, messageId);
			this.onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	onReactionLongPress = (message: TAnyMessageModel) => {
		const { showActionSheet } = this.props;
		this.handleCloseEmoji(showActionSheet, {
			children: <ReactionsList reactions={message?.reactions} getCustomEmoji={this.getCustomEmoji} />,
			snaps: ['50%'],
			enableContentPanningGesture: false
		});
	};

	onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const { navigation, isMasterDetail } = this.props;

		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };

		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	onDiscussionPress = debounce(
		async (item: TAnyMessageModel) => {
			const { isMasterDetail } = this.props;
			if (!item.drid) return;
			const sub = await getRoomInfo(item.drid);
			if (sub) {
				goRoom({
					item: sub as TGoRoomItem,
					isMasterDetail
				});
			}
		},
		1000,
		true
	);

	// eslint-disable-next-line react/sort-comp
	updateUnreadCount = async () => {
		if (!this.rid) {
			return;
		}
		const db = database.active;
		const observable = await db
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(this.rid)))
			.observeWithColumns(['unread']);

		this.queryUnreads = observable.subscribe(rooms => {
			const unreadsCount = rooms.reduce(
				(unreadCount, room) => (room.unread > 0 && !room.hideUnreadStatus ? unreadCount + room.unread : unreadCount),
				0
			);
			if (this.state.unreadsCount !== unreadsCount) {
				this.setState({ unreadsCount }, this.setHeader);
			}
		});
	};

	onThreadPress = debounce((item: TAnyMessageModel) => this.navToThread(item), 1000, true);

	shouldNavigateToRoom = (message: IMessage) => {
		if (message.tmid && message.tmid === this.tmid) {
			return false;
		}
		if (!message.tmid && message.rid === this.rid) {
			return false;
		}
		return true;
	};

	jumpToMessageByUrl = async (messageUrl?: string, isFromReply?: boolean) => {
		if (!messageUrl) {
			return;
		}
		try {
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await this.jumpToMessage(messageId, isFromReply);
			}
		} catch (e) {
			log(e);
		}
	};

	jumpToMessage = async (messageId: string, isFromReply?: boolean) => {
		try {
			sendLoadingEvent({ visible: true, onCancel: this.cancelJumpToMessage });
			const message = await RoomServices.getMessageInfo(messageId);

			if (!message) {
				this.cancelJumpToMessage();
				return;
			}

			if (this.shouldNavigateToRoom(message)) {
				if (message.rid !== this.rid) {
					this.navToRoom(message);
				} else {
					this.navToThread(message);
				}
			} else if (!message.tmid && message.rid === this.rid && this.t === 'thread' && !message.replies) {
				/**
				 * if the user is within a thread and the message that he is trying to jump to, is a message in the main room
				 */
				return this.navToRoom(message);
			} else {
				/**
				 * if it's from server, we don't have it saved locally and so we fetch surroundings
				 * we test if it's not from threads because we're fetching from threads currently with `loadThreadMessages`
				 */
				if (message.fromServer && !message.tmid && this.rid) {
					await loadSurroundingMessages({ messageId, rid: this.rid });
				}
				await Promise.race([this.list.current?.jumpToMessage(message.id), new Promise(res => setTimeout(res, 5000))]);
				this.cancelJumpToMessage();
			}
		} catch (error: any) {
			if (isFromReply && error.data?.errorType === 'error-not-allowed') {
				showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
			} else {
				log(error);
			}
			this.cancelJumpToMessage();
		}
	};

	cancelJumpToMessage = () => {
		this.list.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	replyBroadcast = (message: IMessage) => {
		const { dispatch } = this.props;
		dispatch(replyBroadcastAction(message));
	};

	handleConnected = () => {
		this.init();
		EventEmitter.removeListener('connected', this.handleConnected);
	};

	handleRoomRemoved = ({ rid }: { rid: string }) => {
		const { room } = this.state;
		if (rid === this.rid) {
			Navigation.navigate('RoomsListView');
			!this.isOmnichannel &&
				showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(room) }), I18n.t('Oops'));
		}
	};

	internalSetState = (...args: any[]) => {
		if (!this.mounted) {
			return;
		}
		// @ts-ignore TODO: TS is complaining about this, but I don't feel like changing rn since it should be working
		this.setState(...args);
	};

	handleSendMessage = (message: string, tshow?: boolean) => {
		logEvent(events.ROOM_SEND_MESSAGE);
		const { rid } = this.state.room;
		const { user } = this.props;
		sendMessage(rid, message, this.tmid, user, tshow).then(() => {
			if (this.mounted) {
				this.setLastOpen(null);
			}
			Review.pushPositiveEvent();
		});
		this.resetAction();
	};

	getCustomEmoji: TGetCustomEmoji = name => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	setLastOpen = (lastOpen: Date | null) => this.setState({ lastOpen });

	onJoin = () => {
		this.internalSetState({
			joined: true
		});
	};

	joinRoom = async () => {
		logEvent(events.ROOM_JOIN);
		try {
			const { room } = this.state;

			if (this.isOmnichannel) {
				if ('_id' in room) {
					await takeInquiry(room._id);
				}
				this.onJoin();
			} else {
				const { joinCodeRequired, rid } = room;
				if (joinCodeRequired) {
					this.joinCode.current?.show();
				} else {
					await Services.joinRoom(rid, null, this.t as any);
					this.onJoin();
				}
			}
		} catch (e) {
			log(e);
		}
	};

	resumeRoom = async () => {
		logEvent(events.ROOM_RESUME);
		try {
			const { room } = this.state;

			if (this.isOmnichannel) {
				if ('rid' in room) {
					await takeResume(room.rid);
				}
				this.onJoin();
			}
		} catch (e) {
			log(e);
		}
	};

	getThreadName = (tmid: string, messageId: string) => {
		const { rid } = this.state.room;
		return getThreadNameMethod(rid, tmid, messageId);
	};

	fetchThreadName = async (tmid: string, messageId: string) => {
		const { rid } = this.state.room;
		const threadRecord = await getThreadById(tmid);
		if (threadRecord?.t === 'rm') {
			return I18n.t('Message_removed');
		}
		return getThreadNameMethod(rid, tmid, messageId);
	};

	toggleFollowThread = async (isFollowingThread: boolean, tmid?: string) => {
		try {
			const threadMessageId = tmid ?? this.tmid;
			if (!threadMessageId) {
				return;
			}
			await Services.toggleFollowMessage(threadMessageId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	getBadgeColor = (messageId: string) => {
		const { room } = this.state;
		const { theme } = this.props;
		return getBadgeColorMethod({ subscription: room, theme, messageId });
	};

	navToRoomInfo = (navParam: any) => {
		const { navigation, isMasterDetail } = this.props;
		const { room } = this.state;
		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		navParam.fromRid = room.rid;
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	};

	navToThread = async (item: TAnyMessageModel | { tmid: string }) => {
		const { roomUserId } = this.state;
		const { navigation } = this.props;

		if (!this.rid) {
			return;
		}

		if (item.tmid) {
			let name = '';
			let jumpToMessageId = '';
			if ('id' in item) {
				name = item.tmsg ?? '';
				jumpToMessageId = item.id;
			}
			sendLoadingEvent({ visible: true, onCancel: this.cancelJumpToMessage });
			const threadRecord = await getThreadById(item.tmid);
			if (threadRecord?.t === 'rm') {
				name = I18n.t('Thread');
			}
			if (!name) {
				const result = await this.getThreadName(item.tmid, jumpToMessageId);
				// test if there isn't a thread
				if (!result) {
					sendLoadingEvent({ visible: false });
					return;
				}
				name = result;
			}
			if ('id' in item && item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
			}
			if (!jumpToMessageId) {
				setTimeout(() => {
					sendLoadingEvent({ visible: false });
				}, 300);
			}
			return navigation.push('RoomView', {
				rid: this.rid,
				tmid: item.tmid,
				name,
				t: SubscriptionType.THREAD,
				roomUserId,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid: this.rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId
			});
		}
	};

	navToRoom = async (message: TAnyMessageModel) => {
		const { isMasterDetail } = this.props;
		const roomInfo = await getRoomInfo(message.rid);

		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	// OLD METHOD - support versions before 5.0.0
	handleEnterCall = () => {
		const { room } = this.state;
		if ('id' in room) {
			const { jitsiTimeout } = room;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room });
			}
		}
	};

	blockAction = ({
		actionId,
		appId,
		value,
		blockId,
		rid,
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
			rid,
			appId,
			container: {
				type: ContainerTypes.MESSAGE,
				id: mid
			}
		});

	closeBanner = async () => {
		const { room } = this.state;
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
	};

	isIgnored = (message: TAnyMessageModel): boolean => {
		const { room } = this.state;
		if ('id' in room) {
			return room?.ignored?.includes?.(message?.u?._id) ?? false;
		}
		return false;
	};

	goToCannedResponses = () => {
		const { room } = this.state;
		Navigation.navigate('CannedResponsesListView', { rid: room.rid });
	};

	hapticFeedback = (msgId: string) => {
		const { dispatch } = this.props;
		dispatch(removeInAppFeedback(msgId));
		const notificationInAppVibration = UserPreferences.getBool(NOTIFICATION_IN_APP_VIBRATION);
		if (notificationInAppVibration || notificationInAppVibration === null) {
			try {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} catch {
				// Do nothing: Haptic is unavailable
			}
		}
	};

	setQuotesAndText = (text: string, quotes: string[]) => {
		if (quotes.length) {
			this.setState({ selectedMessages: quotes, action: 'quote' });
		} else {
			this.setState({ action: null, selectedMessages: [] });
		}
		this.messageComposerRef.current?.setInput(text || '');
	};

	getText = () => this.messageComposerRef.current?.getText();

	renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => {
		const { room, lastOpen, canAutoTranslate } = this.state;
		const {
			user,
			Message_GroupingPeriod,
			Message_TimeFormat,
			useRealName,
			baseUrl,
			Message_Read_Receipt_Enabled,
			theme,
			inAppFeedback
		} = this.props;
		const { action, selectedMessages } = this.state;
		let dateSeparator = null;
		let showUnreadSeparator = false;
		const isBeingEdited = action === 'edit' && item.id === selectedMessages[0];

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator =
				(lastOpen && moment(item.ts).isSameOrAfter(lastOpen) && moment(previousItem.ts).isBefore(lastOpen)) ?? false;
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
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
				this.hapticFeedback(item.id);
			}
			content = (
				<Message
					item={item}
					user={user as any}
					rid={room.rid}
					archived={'id' in room && room.archived}
					broadcast={'id' in room && room.broadcast}
					status={item.status}
					isThreadRoom={!!this.tmid}
					isIgnored={this.isIgnored(item)}
					previousItem={previousItem}
					fetchThreadName={this.fetchThreadName}
					onReactionPress={this.onReactionPress}
					onReactionLongPress={this.onReactionLongPress}
					onLongPress={this.onMessageLongPress}
					onEncryptedPress={this.onEncryptedPress}
					onDiscussionPress={this.onDiscussionPress}
					onThreadPress={this.onThreadPress}
					onAnswerButtonPress={this.handleSendMessage}
					showAttachment={this.showAttachment}
					reactionInit={this.onReactionInit}
					replyBroadcast={this.replyBroadcast}
					errorActionsShow={this.errorActionsShow}
					isSystemMessage={room.sysMes as boolean}
					baseUrl={baseUrl}
					Message_GroupingPeriod={Message_GroupingPeriod}
					timeFormat={Message_TimeFormat}
					useRealName={useRealName}
					isReadReceiptEnabled={Message_Read_Receipt_Enabled}
					autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
					autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}
					navToRoomInfo={this.navToRoomInfo}
					getCustomEmoji={this.getCustomEmoji}
					handleEnterCall={this.handleEnterCall}
					blockAction={this.blockAction}
					threadBadgeColor={this.getBadgeColor(item?.id)}
					toggleFollowThread={this.toggleFollowThread}
					jumpToMessage={this.jumpToMessageByUrl}
					highlighted={highlightedMessage === item.id}
					theme={theme}
					closeEmojiAndAction={this.handleCloseEmoji}
					isBeingEdited={isBeingEdited}
					dateSeparator={dateSeparator}
					showUnreadSeparator={showUnreadSeparator}
				/>
			);
		}

		return content;
	};

	renderFooter = () => {
		const { joined, room, readOnly, loading } = this.state;
		const { theme, airGappedRestrictionRemainingDays } = this.props;

		if (!this.rid) {
			return null;
		}
		if ('onHold' in room && room.onHold) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Chat_is_on_hold')}</Text>
					<Touch
						onPress={this.resumeRoom}
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
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('You_are_in_preview_mode')}</Text>
					<Touch
						onPress={this.joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
						enabled={!loading}>
						<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-join-button'>
							{I18n.t(this.isOmnichannel ? 'Take_it' : 'Join')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (airGappedRestrictionRemainingDays !== undefined && airGappedRestrictionRemainingDays === 0) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_title')}
					</Text>
					<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
						{I18n.t('AirGapped_workspace_read_only_description')}
					</Text>
				</View>
			);
		}
		if (readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return <MessageComposerContainer ref={this.messageComposerRef} />;
	};

	renderActions = () => {
		const { room, readOnly } = this.state;
		const { user } = this.props;
		if (!('id' in room)) {
			return null;
		}
		return (
			<>
				<MessageActions
					ref={ref => (this.messageActions = ref)}
					tmid={this.tmid}
					room={room}
					user={user}
					editInit={this.onEditInit}
					replyInit={this.onReplyInit}
					quoteInit={this.onQuoteInit}
					reactionInit={this.onReactionInit}
					onReactionPress={this.onReactionPress}
					jumpToMessage={this.jumpToMessageByUrl}
					isReadOnly={readOnly}
				/>
				<MessageErrorActions ref={ref => (this.messageErrorActions = ref)} tmid={this.tmid} />
			</>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { room, loading, action, selectedMessages } = this.state;
		const { user, baseUrl, theme, width, serverVersion, navigation, encryptionEnabled } = this.props;
		const { rid, t } = room;
		let bannerClosed;
		let announcement;
		if ('id' in room) {
			({ bannerClosed, announcement } = room);
		}

		if ('encrypted' in room) {
			// Missing room encryption key
			if (isMissingRoomE2EEKey({ encryptionEnabled, roomEncrypted: room.encrypted, E2EKey: room.E2EKey })) {
				return <MissingRoomE2EEKey />;
			}

			// Encrypted room, but user session is not encrypted
			if (isE2EEDisabledEncryptedRoom({ encryptionEnabled, roomEncrypted: room.encrypted })) {
				return <EncryptedRoom navigation={navigation} roomName={getRoomTitle(room)} />;
			}
		}

		return (
			<RoomContext.Provider
				value={{
					rid,
					t,
					tmid: this.tmid,
					sharing: false,
					action,
					selectedMessages,
					onRemoveQuoteMessage: this.onRemoveQuoteMessage,
					editCancel: this.onEditCancel,
					editRequest: this.onEditRequest,
					onSendMessage: this.handleSendMessage,
					setQuotesAndText: this.setQuotesAndText,
					getText: this.getText
				}}>
				<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='room-view'>
					<StatusBar />
					<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={this.closeBanner} />
					<List
						ref={this.list}
						listRef={this.flatList}
						rid={rid}
						tmid={this.tmid}
						renderRow={this.renderItem}
						loading={loading}
						hideSystemMessages={this.hideSystemMessages}
						showMessageInMainThread={user.showMessageInMainThread ?? false}
						serverVersion={serverVersion}
					/>
					{this.renderFooter()}
					{this.renderActions()}
					<UploadProgress rid={rid} user={user} baseUrl={baseUrl} width={width} />
					<JoinCode ref={this.joinCode} onJoin={this.onJoin} rid={rid} t={t} theme={theme} />
				</SafeAreaView>
			</RoomContext.Provider>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	Message_TimeFormat: state.settings.Message_TimeFormat as string,
	customEmojis: state.customEmojis,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled as boolean,
	Hide_System_Messages: state.settings.Hide_System_Messages as string[],
	transferLivechatGuestPermission: state.permissions['transfer-livechat-guest'],
	viewCannedResponsesPermission: state.permissions['view-canned-responses'],
	livechatAllowManualOnHold: state.settings.Livechat_allow_manual_on_hold as boolean,
	airGappedRestrictionRemainingDays: state.settings.Cloud_Workspace_AirGapped_Restrictions_Remaining_Days,
	inAppFeedback: state.inAppFeedback,
	encryptionEnabled: state.encryption.enabled
});

//export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(withActionSheet(RoomView)))));
