import React from 'react';
import { InteractionManager, Text, View } from 'react-native';
import { connect } from 'react-redux';
import parse from 'url-parse';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { Q } from '@nozbe/watermelondb';
import { dequal } from 'dequal';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';
import { Subscription } from 'rxjs';

import { IReduxEmoji } from '../../definitions/IEmoji';
import Touch from '../../utils/touch';
import { replyBroadcast } from '../../actions/messages';
import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions, { IMessageActions } from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox, { IMessageBoxProps } from '../../containers/MessageBox';
import log, { events, logEvent } from '../../utils/log';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import RoomHeader from '../../containers/RoomHeader';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { MESSAGE_TYPE_ANY_LOAD, MessageTypeLoad } from '../../constants/messageTypeLoad';
import debounce from '../../utils/debounce';
import ReactionsModal from '../../containers/ReactionsModal';
import { LISTENER } from '../../containers/Toast';
import { getBadgeColor, isBlocked, isTeamRoom, makeThreadName } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { showErrorAlert } from '../../utils/info';
import { withTheme } from '../../theme';
import {
	KEY_COMMAND,
	handleCommandReplyLatest,
	handleCommandRoomActions,
	handleCommandScroll,
	handleCommandSearchMessages,
	IKeyCommandEvent
} from '../../commands';
import { Review } from '../../utils/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/Navigation';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { getHeaderTitlePosition } from '../../containers/Header';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/encryption/constants';
import { takeInquiry } from '../../ee/omnichannel/lib';
import Loading from '../../containers/Loading';
import { goRoom, TGoRoomItem } from '../../utils/goRoom';
import getThreadName from '../../lib/methods/getThreadName';
import getRoomInfo from '../../lib/methods/getRoomInfo';
import { ContainerTypes } from '../../containers/UIKit/interfaces';
import RoomServices from './services';
import LoadMore from './LoadMore';
import Banner from './Banner';
import Separator from './Separator';
import RightButtons from './RightButtons';
import LeftButtons from './LeftButtons';
import styles from './styles';
import JoinCode, { IJoinCodeProps } from './JoinCode';
import UploadProgress from './UploadProgress';
import ReactionPicker from './ReactionPicker';
import List, { IListContainerProps, IListProps } from './List';
import { ChatsStackParamList } from '../../stacks/types';
import {
	IApplicationState,
	IAttachment,
	IBaseScreen,
	ILoggedUser,
	IMessage,
	ISubscription,
	IVisitor,
	SubscriptionType,
	TAnyMessageModel,
	TSubscriptionModel,
	TThreadModel
} from '../../definitions';
import { ICustomEmojis } from '../../reducers/customEmojis';

const stateAttrsUpdate = [
	'joined',
	'lastOpen',
	'reactionsModalVisible',
	'canAutoTranslate',
	'selectedMessage',
	'loading',
	'editing',
	'replying',
	'reacting',
	'readOnly',
	'member',
	'showingBlockingLoader'
];
const roomAttrsUpdate = [
	'f',
	'ro',
	'blocked',
	'blocker',
	'archived',
	'tunread',
	'muted',
	'ignored',
	'jitsiTimeout',
	'announcement',
	'sysMes',
	'topic',
	'name',
	'fname',
	'roles',
	'bannerClosed',
	'visitor',
	'joinCodeRequired',
	'teamMain',
	'teamId'
] as const;

interface IRoomViewProps extends IBaseScreen<ChatsStackParamList, 'RoomView'> {
	user: Pick<ILoggedUser, 'id' | 'username' | 'token' | 'showMessageInMainThread'>;
	appState: string;
	useRealName?: boolean;
	isAuthenticated: boolean;
	Message_GroupingPeriod?: number;
	Message_TimeFormat?: string;
	Message_Read_Receipt_Enabled?: boolean;
	Hide_System_Messages?: string[];
	baseUrl: string;
	serverVersion: string | null;
	customEmojis: ICustomEmojis;
	isMasterDetail: boolean;
	replyBroadcast: Function;
	width: number;
	height: number;
	insets: EdgeInsets;
}

type TRoomUpdate = typeof roomAttrsUpdate[number];

interface IRoomViewState {
	[key: string]: any;
	joined: boolean;
	room: TSubscriptionModel | { rid: string; t: string; name?: string; fname?: string; prid?: string; joinCodeRequired?: boolean };
	roomUpdate: {
		[K in TRoomUpdate]?: any; // TODO: get type from TSubscriptionModel
	};
	member: any;
	lastOpen: Date | null;
	reactionsModalVisible: boolean;
	selectedMessage?: Object;
	canAutoTranslate: boolean;
	loading: boolean;
	showingBlockingLoader: boolean;
	editing: boolean;
	replying: boolean;
	replyWithMention: boolean;
	reacting: boolean;
	readOnly: boolean;
	unreadsCount: number | null;
	roomUserId?: string | null;
}

class RoomView extends React.Component<IRoomViewProps, IRoomViewState> {
	private rid?: string;
	private t?: string;
	private tmid?: string;
	private jumpToMessageId?: string;
	private jumpToThreadId?: string;
	// TODO: review these refs
	private messagebox: React.RefObject<IMessageBoxProps>;
	private list: React.RefObject<IListContainerProps>;
	private joinCode: React.RefObject<IJoinCodeProps>;
	private flatList: React.RefObject<IListProps>;
	private mounted: boolean;
	private sub?: any;
	private offset = 0;
	private didMountInteraction: any;
	private subSubscription?: Subscription;
	private queryUnreads?: Subscription;
	private retryInit = 0;
	private retryInitTimeout?: number;
	private retryFindCount = 0;
	private retryFindTimeout?: number;
	private messageErrorActions?: React.RefObject<any>; // TODO: type me
	private messageActions?: React.RefObject<IMessageActions>;

	constructor(props: IRoomViewProps) {
		super(props);
		console.time(`${this.constructor.name} init`);
		console.time(`${this.constructor.name} mount`);
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		/**
		 * On threads, we don't have a subscription.
		 * `this.state.room` is going to have only a few properties sent during navigation.
		 * Use `this.tmid` as thread id.
		 */
		this.tmid = props.route.params?.tmid;
		const selectedMessage = props.route.params?.message;
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
		const roomUserId = props.route.params?.roomUserId ?? RocketChat.getUidDirectMessage(room);
		this.state = {
			joined: true,
			room,
			roomUpdate: {},
			member: {},
			lastOpen: null,
			reactionsModalVisible: false,
			selectedMessage,
			canAutoTranslate: false,
			loading: true,
			showingBlockingLoader: false,
			editing: false,
			replying: !!selectedMessage,
			replyWithMention: false,
			reacting: false,
			readOnly: false,
			unreadsCount: null,
			roomUserId
		};
		this.setHeader();

		if ('id' in room) {
			// @ts-ignore TODO: type guard isn't helping here :(
			this.observeRoom(room);
		} else if (this.rid) {
			this.findAndObserveRoom(this.rid);
		}

		this.setReadOnly();

		this.messagebox = React.createRef();
		this.list = React.createRef();
		this.joinCode = React.createRef();
		this.flatList = React.createRef();
		this.mounted = false;

		// we don't need to subscribe to threads
		if (this.rid && !this.tmid) {
			this.sub = new RoomClass(this.rid);
		}
		console.timeEnd(`${this.constructor.name} init`);
	}

	componentDidMount() {
		this.mounted = true;
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = this.props;
			this.setHeader();
			if (this.rid) {
				this.sub?.subscribe?.();
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
		});
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.addEventListener('ROOM_REMOVED', this.handleRoomRemoved);
		console.timeEnd(`${this.constructor.name} mount`);
	}

	shouldComponentUpdate(nextProps: IRoomViewProps, nextState: IRoomViewState) {
		const { state } = this;
		const { roomUpdate, member } = state;
		const { appState, theme, insets, route } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if (appState !== nextProps.appState) {
			return true;
		}
		if (member.statusText !== nextState.member.statusText) {
			return true;
		}
		const stateUpdated = stateAttrsUpdate.some(key => nextState[key] !== state[key]);
		if (stateUpdated) {
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
		const { roomUpdate } = this.state;
		const { appState, insets, route } = this.props;

		if (route?.params?.jumpToMessageId && route?.params?.jumpToMessageId !== prevProps.route?.params?.jumpToMessageId) {
			this.jumpToMessage(route?.params?.jumpToMessageId);
		}

		if (route?.params?.jumpToThreadId && route?.params?.jumpToThreadId !== prevProps.route?.params?.jumpToThreadId) {
			this.navToThread({ tmid: route?.params?.jumpToThreadId });
		}

		if (appState === 'foreground' && appState !== prevProps.appState && this.rid) {
			// Fire List.query() just to keep observables working
			if (this.list && this.list.current) {
				// @ts-ignore TODO: is this working?
				this.list.current?.query?.();
			}
		}
		// If it's not direct message
		if (this.t !== 'd') {
			if (roomUpdate.topic !== prevState.roomUpdate.topic) {
				this.setHeader();
			}
		}
		// If it's a livechat room
		if (this.t === 'l') {
			if (!dequal(prevState.roomUpdate.visitor, roomUpdate.visitor)) {
				this.setHeader();
			}
		}
		if (roomUpdate.teamMain !== prevState.roomUpdate.teamMain || roomUpdate.teamId !== prevState.roomUpdate.teamId) {
			this.setHeader();
		}
		if (
			(roomUpdate.fname !== prevState.roomUpdate.fname ||
				roomUpdate.name !== prevState.roomUpdate.name ||
				roomUpdate.teamMain !== prevState.roomUpdate.teamMain ||
				roomUpdate.teamId !== prevState.roomUpdate.teamId) &&
			!this.tmid
		) {
			this.setHeader();
		}
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
			this.setHeader();
		}
		this.setReadOnly();
	}

	async componentWillUnmount() {
		const { editing, room } = this.state;
		const db = database.active;
		this.mounted = false;
		if (!editing && this.messagebox && this.messagebox.current) {
			// @ts-ignore
			const { text } = this.messagebox.current;
			let obj: TSubscriptionModel | TThreadModel | null = null;
			if (this.tmid) {
				try {
					const threadsCollection = db.get('threads');
					obj = await threadsCollection.find(this.tmid);
				} catch (e) {
					// Do nothing
				}
			} else {
				obj = room as TSubscriptionModel;
			}
			if (obj) {
				try {
					await db.write(async () => {
						// FIXME: why do I need to tell ts this is non null if we have that if condition above?
						await obj!.update(r => {
							r.draftMessage = text;
						});
					});
				} catch (error) {
					// Do nothing
				}
			}
		}
		this.unsubscribe();
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.queryUnreads && this.queryUnreads.unsubscribe) {
			this.queryUnreads.unsubscribe();
		}
		if (this.retryInitTimeout) {
			clearTimeout(this.retryInitTimeout);
		}
		if (this.retryFindTimeout) {
			clearTimeout(this.retryFindTimeout);
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.removeListener('ROOM_REMOVED', this.handleRoomRemoved);
		console.countReset(`${this.constructor.name}.render calls`);
	}

	get isOmnichannel() {
		const { room } = this.state;
		return room.t === 'l';
	}

	setHeader = () => {
		const { room, unreadsCount, roomUserId, joined } = this.state;
		const { navigation, isMasterDetail, theme, baseUrl, user, insets, route } = this.props;
		const { rid, tmid } = this;
		if (!room.rid) {
			return;
		}

		const prid = room?.prid;
		const isGroupChat = RocketChat.isGroupChat(room as ISubscription);
		let title = route.params?.name;
		let parentTitle = '';
		// TODO: I think it's safe to remove this, but we need to test tablet without rooms
		if (!tmid) {
			title = RocketChat.getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = RocketChat.getRoomTitle(room);
		}
		let subtitle: string | undefined;
		let t: string;
		let teamMain: boolean | undefined;
		let teamId: string | undefined;
		let encrypted: boolean | undefined;
		let userId: string | undefined;
		let token: string | undefined;
		let avatar: string | undefined;
		let visitor: IVisitor | undefined;
		if ('id' in room) {
			subtitle = room.topic;
			t = room.t;
			teamMain = room.teamMain;
			teamId = room.teamId;
			encrypted = room.encrypted;
			({ id: userId, token } = user);
			avatar = room.name;
			visitor = room.visitor;
		}

		let numIconsRight = 2;
		if (tmid) {
			numIconsRight = 1;
		} else if (teamId && isTeamRoom({ teamId, joined })) {
			numIconsRight = 3;
		}
		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight });

		navigation.setOptions({
			headerShown: true,
			headerTitleAlign: 'left',
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerLeft: () => (
				<LeftButtons
					tmid={tmid}
					unreadsCount={unreadsCount}
					navigation={navigation}
					baseUrl={baseUrl}
					userId={userId}
					token={token}
					title={avatar}
					theme={theme}
					t={t}
					goRoomActionsView={this.goRoomActionsView}
					isMasterDetail={isMasterDetail}
				/>
			),
			headerTitle: () => (
				<RoomHeader
					rid={rid}
					prid={prid}
					tmid={tmid}
					title={title}
					teamMain={teamMain}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					isGroupChat={isGroupChat}
					onPress={this.goRoomActionsView}
					testID={`room-view-title-${title}`}
				/>
			),
			headerRight: () => (
				<RightButtons
					rid={rid}
					tmid={tmid}
					teamId={teamId}
					joined={joined}
					t={t}
					encrypted={encrypted}
					navigation={navigation}
					toggleFollowThread={this.toggleFollowThread}
				/>
			)
		});
	};

	goRoomActionsView = (screen?: string) => {
		logEvent(events.ROOM_GO_RA);
		const { room, member, joined } = this.state;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			// @ts-ignore TODO: find a way to make it work
			navigation.navigate('ModalStackNavigator', {
				// @ts-ignore
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: this.rid as string,
					t: this.t as SubscriptionType,
					// @ts-ignore
					room,
					member,
					showCloseModal: !!screen,
					joined
				}
			});
		} else if (this.rid && this.t) {
			navigation.push('RoomActionsView', {
				rid: this.rid,
				t: this.t as SubscriptionType,
				room: room as TSubscriptionModel,
				member,
				joined
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
				await RoomServices.getThreadMessages(this.tmid, this.rid);
			} else {
				const newLastOpen = new Date();
				await RoomServices.getMessages(room);

				// if room is joined
				if (joined && 'id' in room) {
					if (room.alert || room.unread || room.userMentions) {
						this.setLastOpen(room.ls);
					} else {
						this.setLastOpen(null);
					}
					RoomServices.readMessages(room.rid, newLastOpen).catch(e => console.log(e));
				}
			}

			const canAutoTranslate = RocketChat.canAutoTranslate();
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

		if ('id' in room && t === 'd' && !RocketChat.isGroupChat(room)) {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);
				this.setState({ roomUserId }, () => this.setHeader());

				const result = await RocketChat.getUserInfo(roomUserId);
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
				// We navigate to RoomView before the Room is inserted to the local db
				// So we retry just to make sure we have the right content
				this.retryFindCount = this.retryFindCount + 1 || 1;
				if (this.retryFindCount <= 3) {
					this.retryFindTimeout = setTimeout(() => {
						this.findAndObserveRoom(rid);
						this.init();
					}, 300);
				}
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
				this.internalSetState({ room: changes, roomUpdate });
			} else {
				// @ts-ignore
				this.state.room = changes;
				// @ts-ignore
				this.state.roomUpdate = roomUpdate;
			}
		});
	};

	errorActionsShow = (message: TAnyMessageModel) => {
		// @ts-ignore
		this.messageErrorActions?.showMessageErrorActions(message);
	};

	onEditInit = (message: TAnyMessageModel) => {
		const newMessage = {
			id: message.id,
			subscription: {
				// @ts-ignore TODO: we can remove this after we merge a PR separating IMessage vs IMessageFromServer
				id: message.subscription.id
			},
			msg: message?.attachments?.[0]?.description || message.msg
		};
		this.setState({ selectedMessage: newMessage, editing: true });
	};

	onEditCancel = () => {
		this.setState({ selectedMessage: undefined, editing: false });
	};

	onEditRequest = async (message: TAnyMessageModel) => {
		this.setState({ selectedMessage: undefined, editing: false });
		try {
			await RocketChat.editMessage(message);
		} catch (e) {
			log(e);
		}
	};

	onReplyInit = (message: TAnyMessageModel, mention: boolean) => {
		this.setState({
			selectedMessage: message,
			replying: true,
			replyWithMention: mention
		});
	};

	onReplyCancel = () => {
		this.setState({ selectedMessage: undefined, replying: false, replyWithMention: false });
	};

	onReactionInit = (message: TAnyMessageModel) => {
		this.setState({ selectedMessage: message, reacting: true });
	};

	onReactionClose = () => {
		this.setState({ selectedMessage: undefined, reacting: false });
	};

	onMessageLongPress = (message: TAnyMessageModel) => {
		// @ts-ignore
		this.messageActions?.showMessageActions(message);
	};

	showAttachment = (attachment: IAttachment) => {
		const { navigation } = this.props;
		// @ts-ignore
		navigation.navigate('AttachmentView', { attachment });
	};

	onReactionPress = async (shortname: string, messageId: string) => {
		try {
			await RocketChat.setReaction(shortname, messageId);
			this.onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	onReactionLongPress = (message: TAnyMessageModel) => {
		this.setState({ selectedMessage: message, reactionsModalVisible: true });
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	onCloseReactionsModal = () => {
		this.setState({ selectedMessage: undefined, reactionsModalVisible: false });
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
		(item: TAnyMessageModel) => {
			const { navigation } = this.props;
			navigation.push('RoomView', {
				rid: item.drid as string,
				prid: item.rid,
				name: item.msg,
				t: 'p' as SubscriptionType
			});
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

		this.queryUnreads = observable.subscribe(data => {
			const { unreadsCount } = this.state;
			const newUnreadsCount = data.filter(s => s.unread > 0).reduce((a, b) => a + (b.unread || 0), 0);
			if (unreadsCount !== newUnreadsCount) {
				this.setState({ unreadsCount: newUnreadsCount }, () => this.setHeader());
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

	jumpToMessageByUrl = async (messageUrl?: string) => {
		if (!messageUrl) {
			return;
		}
		try {
			this.setState({ showingBlockingLoader: true });
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await this.jumpToMessage(messageId);
			}
			this.setState({ showingBlockingLoader: false });
		} catch (e) {
			this.setState({ showingBlockingLoader: false });
			log(e);
		}
	};

	jumpToMessage = async (messageId: string) => {
		try {
			this.setState({ showingBlockingLoader: true });
			const message = await RoomServices.getMessageInfo(messageId);

			if (!message) {
				return;
			}

			if (this.shouldNavigateToRoom(message)) {
				if (message.rid !== this.rid) {
					this.navToRoom(message);
				} else {
					this.navToThread(message);
				}
			} else {
				/**
				 * if it's from server, we don't have it saved locally and so we fetch surroundings
				 * we test if it's not from threads because we're fetching from threads currently with `getThreadMessages`
				 */
				if (message.fromServer && !message.tmid && this.rid) {
					await RocketChat.loadSurroundingMessages({ messageId, rid: this.rid });
				}
				// @ts-ignore
				await Promise.race([this.list.current.jumpToMessage(message.id), new Promise(res => setTimeout(res, 5000))]);
				// @ts-ignore
				this.list.current.cancelJumpToMessage();
			}
		} catch (e) {
			log(e);
		} finally {
			this.setState({ showingBlockingLoader: false });
		}
	};

	replyBroadcast = (message: Record<string, string>) => {
		const { dispatch } = this.props;
		dispatch(replyBroadcast(message));
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
				showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: RocketChat.getRoomTitle(room) }), I18n.t('Oops'));
		}
	};

	internalSetState = (...args: any[]) => {
		if (!this.mounted) {
			return;
		}
		// @ts-ignore TODO: TS is complaining about this, but I don't feel like changing rn since it should be working
		this.setState(...args);
	};

	sendMessage = (message: string, tmid?: string, tshow?: boolean) => {
		logEvent(events.ROOM_SEND_MESSAGE);
		const { rid } = this.state.room;
		const { user } = this.props;
		RocketChat.sendMessage(rid, message, this.tmid || tmid, user, tshow).then(() => {
			if (this.list && this.list.current) {
				// @ts-ignore
				this.list.current.update();
			}
			this.setLastOpen(null);
			Review.pushPositiveEvent();
		});
	};

	// TODO: We need to unify
	getCustomEmoji = (name: string): IReduxEmoji | null => {
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
					// @ts-ignore
					this.joinCode.current?.show();
				} else {
					await RocketChat.joinRoom(rid, null, this.t as any);
					this.onJoin();
				}
			}
		} catch (e) {
			log(e);
		}
	};

	getThreadName = (tmid: string, messageId: string) => {
		const { rid } = this.state.room;
		return getThreadName(rid, tmid, messageId);
	};

	toggleFollowThread = async (isFollowingThread: boolean, tmid?: string) => {
		try {
			const threadMessageId = tmid ?? this.tmid;
			if (!threadMessageId) {
				return;
			}
			await RocketChat.toggleFollowMessage(threadMessageId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	};

	getBadgeColor = (messageId: string) => {
		const { room } = this.state;
		const { theme } = this.props;
		return getBadgeColor({ subscription: room, theme, messageId });
	};

	navToRoomInfo = (navParam: any) => {
		const { navigation, user, isMasterDetail } = this.props;
		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		if (navParam.rid === user.id) {
			return;
		}
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
			if (!name) {
				const result = await this.getThreadName(item.tmid, jumpToMessageId);
				// test if there isn't a thread
				if (!result) {
					return;
				}
				name = result;
			}
			if ('id' in item && item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
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
		const { navigation, isMasterDetail } = this.props;
		const roomInfo = await getRoomInfo(message.rid);
		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			navigationMethod: navigation.push,
			jumpToMessageId: message.id
		});
	};

	callJitsi = () => {
		const { room } = this.state;
		if ('id' in room) {
			const { jitsiTimeout } = room;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				RocketChat.callJitsi(room);
			}
		}
	};

	handleCommands = ({ event }: { event: IKeyCommandEvent }) => {
		if (this.rid) {
			const { input } = event;
			if (handleCommandScroll(event)) {
				const offset = input === 'UIKeyInputUpArrow' ? 100 : -100;
				this.offset += offset;
				// @ts-ignore
				this.flatList?.scrollToOffset({ offset: this.offset });
			} else if (handleCommandRoomActions(event)) {
				this.goRoomActionsView();
			} else if (handleCommandSearchMessages(event)) {
				this.goRoomActionsView('SearchMessagesView');
			} else if (handleCommandReplyLatest(event)) {
				if (this.list && this.list.current) {
					// @ts-ignore
					const message = this.list.current.getLastMessage();
					this.onReplyInit(message, false);
				}
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
		RocketChat.triggerBlockAction({
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

	onLoadMoreMessages = (loaderItem: TAnyMessageModel) => {
		const { room } = this.state;
		return RoomServices.getMoreMessages({
			rid: room.rid,
			tmid: this.tmid,
			t: room.t as any,
			loaderItem
		});
	};

	renderItem = (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => {
		const { room, lastOpen, canAutoTranslate } = this.state;
		const { user, Message_GroupingPeriod, Message_TimeFormat, useRealName, baseUrl, Message_Read_Receipt_Enabled } = this.props;
		let dateSeparator = null;
		let showUnreadSeparator = false;

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
			content = (
				<LoadMore
					load={() => this.onLoadMoreMessages(item)}
					type={item.t}
					runOnRender={item.t === MessageTypeLoad.MORE && !previousItem}
				/>
			);
		} else {
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
					fetchThreadName={this.getThreadName}
					onReactionPress={this.onReactionPress}
					onReactionLongPress={this.onReactionLongPress}
					onLongPress={this.onMessageLongPress}
					onEncryptedPress={this.onEncryptedPress}
					onDiscussionPress={this.onDiscussionPress}
					onThreadPress={this.onThreadPress}
					onAnswerButtonPress={this.sendMessage}
					showAttachment={this.showAttachment}
					reactionInit={this.onReactionInit}
					replyBroadcast={this.replyBroadcast}
					errorActionsShow={this.errorActionsShow}
					baseUrl={baseUrl}
					Message_GroupingPeriod={Message_GroupingPeriod}
					timeFormat={Message_TimeFormat}
					useRealName={useRealName}
					isReadReceiptEnabled={Message_Read_Receipt_Enabled}
					autoTranslateRoom={canAutoTranslate && 'id' in room && room.autoTranslate}
					autoTranslateLanguage={'id' in room ? room.autoTranslateLanguage : undefined}
					navToRoomInfo={this.navToRoomInfo}
					getCustomEmoji={this.getCustomEmoji}
					callJitsi={this.callJitsi}
					blockAction={this.blockAction}
					threadBadgeColor={this.getBadgeColor(item?.id)}
					toggleFollowThread={this.toggleFollowThread}
					jumpToMessage={this.jumpToMessageByUrl}
					highlighted={highlightedMessage === item.id}
				/>
			);
		}

		if (showUnreadSeparator || dateSeparator) {
			return (
				<>
					{content}
					<Separator ts={dateSeparator} unread={showUnreadSeparator} />
				</>
			);
		}

		return content;
	};

	renderFooter = () => {
		const { joined, room, selectedMessage, editing, replying, replyWithMention, readOnly, loading } = this.state;
		const { navigation, theme, route } = this.props;

		const usedCannedResponse = route?.params?.usedCannedResponse;

		if (!this.rid) {
			return null;
		}
		if (!joined && !this.tmid) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text
						accessibilityLabel={I18n.t('You_are_in_preview_mode')}
						style={[styles.previewMode, { color: themes[theme].titleText }]}>
						{I18n.t('You_are_in_preview_mode')}
					</Text>
					<Touch
						onPress={this.joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].actionTintColor }]}
						enabled={!loading}
						theme={theme}>
						<Text style={[styles.joinRoomText, { color: themes[theme].buttonText }]} testID='room-view-join-button'>
							{I18n.t(this.isOmnichannel ? 'Take_it' : 'Join')}
						</Text>
					</Touch>
				</View>
			);
		}
		if (readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text
						style={[styles.previewMode, { color: themes[theme].titleText }]}
						accessibilityLabel={I18n.t('This_room_is_read_only')}>
						{I18n.t('This_room_is_read_only')}
					</Text>
				</View>
			);
		}
		if ('id' in room && isBlocked(room)) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].titleText }]}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return (
			<MessageBox
				ref={this.messagebox}
				onSubmit={this.sendMessage}
				rid={this.rid}
				tmid={this.tmid}
				roomType={room.t}
				isFocused={navigation.isFocused}
				theme={theme}
				message={selectedMessage}
				editing={editing}
				editRequest={this.onEditRequest}
				editCancel={this.onEditCancel}
				replying={replying}
				replyWithMention={replyWithMention}
				replyCancel={this.onReplyCancel}
				getCustomEmoji={this.getCustomEmoji}
				navigation={navigation}
				usedCannedResponse={usedCannedResponse}
			/>
		);
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
					// @ts-ignore
					ref={ref => (this.messageActions = ref)}
					tmid={this.tmid}
					room={room}
					user={user}
					editInit={this.onEditInit}
					replyInit={this.onReplyInit}
					reactionInit={this.onReactionInit}
					onReactionPress={this.onReactionPress}
					isReadOnly={readOnly}
				/>
				{/* @ts-ignore TODO: missing interface on MessageErrorActions */}
				<MessageErrorActions ref={ref => (this.messageErrorActions = ref)} tmid={this.tmid} />
			</>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { room, reactionsModalVisible, selectedMessage, loading, reacting, showingBlockingLoader } = this.state;
		const { user, baseUrl, theme, navigation, Hide_System_Messages, width, height, serverVersion } = this.props;
		const { rid, t } = room;
		let sysMes;
		let bannerClosed;
		let announcement;
		let tunread;
		let ignored;
		if ('id' in room) {
			({ sysMes, bannerClosed, announcement, tunread, ignored } = room);
		}

		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='room-view'>
				<StatusBar />
				<Banner title={I18n.t('Announcement')} text={announcement} bannerClosed={bannerClosed} closeBanner={this.closeBanner} />
				<List
					// @ts-ignore
					ref={this.list}
					listRef={this.flatList}
					rid={rid}
					t={t}
					tmid={this.tmid}
					theme={theme}
					tunread={tunread}
					ignored={ignored}
					renderRow={this.renderItem}
					loading={loading}
					navigation={navigation}
					hideSystemMessages={Array.isArray(sysMes) ? sysMes : Hide_System_Messages}
					showMessageInMainThread={user.showMessageInMainThread ?? false}
					serverVersion={serverVersion}
				/>
				{this.renderFooter()}
				{this.renderActions()}
				<ReactionPicker
					show={reacting}
					message={selectedMessage}
					onEmojiSelected={this.onReactionPress}
					reactionClose={this.onReactionClose}
					width={width}
					height={height}
					theme={theme}
				/>
				<UploadProgress rid={rid} user={user} baseUrl={baseUrl} width={width} />
				<ReactionsModal
					message={selectedMessage}
					isVisible={reactionsModalVisible}
					user={user}
					baseUrl={baseUrl}
					onClose={this.onCloseReactionsModal}
					getCustomEmoji={this.getCustomEmoji}
					theme={theme}
				/>
				<JoinCode ref={this.joinCode} onJoin={this.onJoin} rid={rid} t={t} theme={theme} />
				<Loading visible={showingBlockingLoader} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name as boolean,
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod as number,
	Message_TimeFormat: state.settings.Message_TimeFormat as string,
	customEmojis: state.customEmojis,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled as boolean,
	Hide_System_Messages: state.settings.Hide_System_Messages as string[]
});

export default connect(mapStateToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomView))));
