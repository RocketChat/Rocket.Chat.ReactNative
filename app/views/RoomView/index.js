import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, InteractionManager } from 'react-native';
import { connect } from 'react-redux';

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { Q } from '@nozbe/watermelondb';
import isEqual from 'lodash/isEqual';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '../../utils/touch';
import {
	replyBroadcast as replyBroadcastAction
} from '../../actions/messages';
import List from './List';
import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import { Encryption } from '../../lib/encryption';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log, { logEvent, events } from '../../utils/log';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import RoomHeaderView, { RightButtons, LeftButtons } from './Header';
import StatusBar from '../../containers/StatusBar';
import Separator from './Separator';
import { themes } from '../../constants/colors';
import debounce from '../../utils/debounce';
import ReactionsModal from '../../containers/ReactionsModal';
import { LISTENER } from '../../containers/Toast';
import { getBadgeColor, isBlocked, makeThreadName } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { showErrorAlert } from '../../utils/info';
import { withTheme } from '../../theme';
import {
	KEY_COMMAND,
	handleCommandScroll,
	handleCommandRoomActions,
	handleCommandSearchMessages,
	handleCommandReplyLatest
} from '../../commands';
import { Review } from '../../utils/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import { CONTAINER_TYPES } from '../../lib/methods/actions';
import Banner from './Banner';
import Navigation from '../../lib/Navigation';
import SafeAreaView from '../../containers/SafeAreaView';
import { withDimensions } from '../../dimensions';
import { getHeaderTitlePosition } from '../../containers/Header';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/encryption/constants';

import { takeInquiry } from '../../ee/omnichannel/lib';

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
	'member'
];
const roomAttrsUpdate = ['f', 'ro', 'blocked', 'blocker', 'archived', 'muted', 'jitsiTimeout', 'announcement', 'sysMes', 'topic', 'name', 'fname', 'roles', 'bannerClosed', 'visitor'];

class RoomView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired,
			showMessageInMainThread: PropTypes.bool
		}),
		appState: PropTypes.string,
		useRealName: PropTypes.bool,
		isAuthenticated: PropTypes.bool,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		Message_Read_Receipt_Enabled: PropTypes.bool,
		Hide_System_Messages: PropTypes.array,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		isMasterDetail: PropTypes.bool,
		theme: PropTypes.string,
		replyBroadcast: PropTypes.func,
		width: PropTypes.number,
		height: PropTypes.number,
		insets: PropTypes.object
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.rid = props.route.params?.rid;
		this.t = props.route.params?.t;
		this.tmid = props.route.params?.tmid;
		const selectedMessage = props.route.params?.message;
		const name = props.route.params?.name;
		const fname = props.route.params?.fname;
		const search = props.route.params?.search;
		const prid = props.route.params?.prid;
		const room = props.route.params?.room ?? {
			rid: this.rid, t: this.t, name, fname, prid
		};
		const roomUserId = props.route.params?.roomUserId ?? RocketChat.getUidDirectMessage(room);
		this.state = {
			joined: true,
			room,
			roomUpdate: {},
			member: {},
			lastOpen: null,
			reactionsModalVisible: false,
			selectedMessage: selectedMessage || {},
			canAutoTranslate: false,
			loading: true,
			editing: false,
			replying: !!selectedMessage,
			replyWithMention: false,
			reacting: false,
			readOnly: false,
			unreadsCount: null,
			roomUserId
		};
		this.setHeader();

		if (room && room.observe) {
			this.observeRoom(room);
		} else if (this.rid) {
			this.findAndObserveRoom(this.rid);
		}

		this.setReadOnly();

		if (search) {
			this.updateRoom();
		}

		this.messagebox = React.createRef();
		this.list = React.createRef();
		this.mounted = false;
		if (this.rid) {
			this.sub = new RoomClass(this.rid);
		}
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		this.offset = 0;
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = this.props;
			this.setHeader();
			if (this.rid) {
				this.sub.subscribe();
				if (isAuthenticated) {
					this.init();
				} else {
					EventEmitter.addEventListener('connected', this.handleConnected);
				}
			}
			if (isIOS && this.rid) {
				this.updateUnreadCount();
			}
		});
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.addEventListener('ROOM_REMOVED', this.handleRoomRemoved);
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { state } = this;
		const { roomUpdate, member } = state;
		const { appState, theme, insets } = this.props;
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
		if (!isEqual(nextProps.insets, insets)) {
			return true;
		}
		return roomAttrsUpdate.some(key => !isEqual(nextState.roomUpdate[key], roomUpdate[key]));
	}

	componentDidUpdate(prevProps, prevState) {
		const { roomUpdate } = this.state;
		const { appState, insets } = this.props;

		if (appState === 'foreground' && appState !== prevProps.appState && this.rid) {
			// Fire List.query() just to keep observables working
			if (this.list && this.list.current) {
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
			if (!isEqual(prevState.roomUpdate.visitor, roomUpdate.visitor)) {
				this.setHeader();
			}
		}
		if (((roomUpdate.fname !== prevState.roomUpdate.fname) || (roomUpdate.name !== prevState.roomUpdate.name)) && !this.tmid) {
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
			const { text } = this.messagebox.current;
			let obj;
			if (this.tmid) {
				try {
					const threadsCollection = db.collections.get('threads');
					obj = await threadsCollection.find(this.tmid);
				} catch (e) {
					// Do nothing
				}
			} else {
				obj = room;
			}
			if (obj) {
				try {
					await db.action(async() => {
						await obj.update((r) => {
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
		if (this.willBlurListener && this.willBlurListener.remove) {
			this.willBlurListener.remove();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.queryUnreads && this.queryUnreads.unsubscribe) {
			this.queryUnreads.unsubscribe();
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.removeListener('ROOM_REMOVED', this.handleRoomRemoved);
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	get isOmnichannel() {
		const { room } = this.state;
		return room.t === 'l';
	}

	setHeader = () => {
		const {
			room, unreadsCount, roomUserId
		} = this.state;
		const {
			navigation, isMasterDetail, theme, baseUrl, user, insets, route
		} = this.props;
		const { rid, tmid } = this;
		const prid = room?.prid;
		let title = route.params?.name;
		let parentTitle;
		if ((room.id || room.rid) && !tmid) {
			title = RocketChat.getRoomTitle(room);
		}
		if (tmid) {
			parentTitle = RocketChat.getRoomTitle(room);
		}
		const subtitle = room?.topic;
		const t = room?.t;
		const { id: userId, token } = user;
		const avatar = room?.name;
		const visitor = room?.visitor;
		if (!room?.rid) {
			return;
		}
		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 2 });
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
				<RoomHeaderView
					rid={rid}
					prid={prid}
					tmid={tmid}
					title={title}
					parentTitle={parentTitle}
					subtitle={subtitle}
					type={t}
					roomUserId={roomUserId}
					visitor={visitor}
					goRoomActionsView={this.goRoomActionsView}
				/>
			),
			headerRight: () => (
				<RightButtons
					rid={rid}
					tmid={tmid}
					t={t}
					navigation={navigation}
					toggleFollowThread={this.toggleFollowThread}
				/>
			)
		});
	}

	goRoomActionsView = (screen) => {
		logEvent(events.ROOM_GO_RA);
		const { room, member } = this.state;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: this.rid, t: this.t, room, member, showCloseModal: !!screen
				}
			});
		} else {
			navigation.navigate('RoomActionsView', {
				rid: this.rid, t: this.t, room, member
			});
		}
	}

	setReadOnly = async() => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room, user);
		this.setState({ readOnly });
	}

	updateRoom = async() => {
		const db = database.active;

		try {
			const subCollection = db.collections.get('subscriptions');
			const sub = await subCollection.find(this.rid);

			const { room } = await RocketChat.getRoomInfo(this.rid);

			await db.action(async() => {
				await sub.update((s) => {
					Object.assign(s, room);
				});
			});
		} catch {
			// do nothing
		}
	}

	init = async() => {
		try {
			this.setState({ loading: true });
			const { room, joined } = this.state;
			if (this.tmid) {
				await this.getThreadMessages();
			} else {
				const newLastOpen = new Date();
				await this.getMessages(room);

				// if room is joined
				if (joined) {
					if (room.alert || room.unread || room.userMentions) {
						this.setLastOpen(room.ls);
					} else {
						this.setLastOpen(null);
					}
					RocketChat.readMessages(room.rid, newLastOpen, true).catch(e => console.log(e));
				}
			}

			// We run `canAutoTranslate` again in order to refetch auto translate permission
			// in case of a missing connection or poor connection on room open
			const canAutoTranslate = await RocketChat.canAutoTranslate();

			const member = await this.getRoomMember();

			this.setState({ canAutoTranslate, member, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			this.retryInit = this.retryInit + 1 || 1;
			if (this.retryInit <= 1) {
				this.retryInitTimeout = setTimeout(() => {
					this.init();
				}, 300);
			}
		}
	}

	getRoomMember = async() => {
		const { room } = this.state;
		const { t } = room;

		if (t === 'd' && !RocketChat.isGroupChat(room)) {
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
	}

	findAndObserveRoom = async(rid) => {
		try {
			const db = database.active;
			const subCollection = await db.collections.get('subscriptions');
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
	}

	unsubscribe = async() => {
		if (this.sub && this.sub.unsubscribe) {
			await this.sub.unsubscribe();
		}
		delete this.sub;
	}

	observeRoom = (room) => {
		const observable = room.observe();
		this.subSubscription = observable
			.subscribe((changes) => {
				const roomUpdate = roomAttrsUpdate.reduce((ret, attr) => {
					ret[attr] = changes[attr];
					return ret;
				}, {});
				if (this.mounted) {
					this.internalSetState({ room: changes, roomUpdate });
				} else {
					this.state.room = changes;
					this.state.roomUpdate = roomUpdate;
				}
			});
	}

	errorActionsShow = (message) => {
		this.messageErrorActions?.showMessageErrorActions(message);
	}

	onEditInit = (message) => {
		this.setState({ selectedMessage: message, editing: true });
	}

	onEditCancel = () => {
		this.setState({ selectedMessage: {}, editing: false });
	}

	onEditRequest = async(message) => {
		this.setState({ selectedMessage: {}, editing: false });
		try {
			await RocketChat.editMessage(message);
		} catch (e) {
			log(e);
		}
	}

	onReplyInit = (message, mention) => {
		this.setState({
			selectedMessage: message, replying: true, replyWithMention: mention
		});
	}

	onReplyCancel = () => {
		this.setState({ selectedMessage: {}, replying: false, replyWithMention: false });
	}

	onReactionInit = (message) => {
		this.setState({ selectedMessage: message, reacting: true });
	}

	onReactionClose = () => {
		this.setState({ selectedMessage: {}, reacting: false });
	}

	onMessageLongPress = (message) => {
		this.messageActions?.showMessageActions(message);
	}

	showAttachment = (attachment) => {
		const { navigation } = this.props;
		navigation.navigate('AttachmentView', { attachment });
	}

	onReactionPress = async(shortname, messageId) => {
		try {
			await RocketChat.setReaction(shortname, messageId);
			this.onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	};

	onReactionLongPress = (message) => {
		this.setState({ selectedMessage: message, reactionsModalVisible: true });
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	onCloseReactionsModal = () => {
		this.setState({ selectedMessage: {}, reactionsModalVisible: false });
	}

	onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const { navigation, isMasterDetail } = this.props;

		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };

		if (isMasterDetail) {
			return navigation.navigate('ModalStackNavigator', screen);
		}
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	}

	onDiscussionPress = debounce((item) => {
		const { navigation } = this.props;
		navigation.push('RoomView', {
			rid: item.drid, prid: item.rid, name: item.msg, t: 'p'
		});
	}, 1000, true)

	// eslint-disable-next-line react/sort-comp
	updateUnreadCount = async() => {
		const db = database.active;
		const observable = await db.collections
			.get('subscriptions')
			.query(
				Q.where('archived', false),
				Q.where('open', true),
				Q.where('rid', Q.notEq(this.rid))
			)
			.observeWithColumns(['unread']);

		this.queryUnreads = observable.subscribe((data) => {
			const { unreadsCount } = this.state;
			const newUnreadsCount = data.filter(s => s.unread > 0).reduce((a, b) => a + (b.unread || 0), 0);
			if (unreadsCount !== newUnreadsCount) {
				this.setState({ unreadsCount: newUnreadsCount }, () => this.setHeader());
			}
		});
	};

	onThreadPress = debounce(async(item) => {
		const { roomUserId } = this.state;
		const { navigation } = this.props;
		if (item.tmid) {
			if (!item.tmsg) {
				await this.fetchThreadName(item.tmid, item.id);
			}
			let name = item.tmsg;
			if (item.t === E2E_MESSAGE_TYPE && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
			}
			navigation.push('RoomView', {
				rid: item.subscription.id, tmid: item.tmid, name, t: 'thread', roomUserId
			});
		} else if (item.tlm) {
			navigation.push('RoomView', {
				rid: item.subscription.id, tmid: item.id, name: makeThreadName(item), t: 'thread', roomUserId
			});
		}
	}, 1000, true)

	replyBroadcast = (message) => {
		const { replyBroadcast } = this.props;
		replyBroadcast(message);
	}

	handleConnected = () => {
		this.init();
		EventEmitter.removeListener('connected', this.handleConnected);
	}

	handleRoomRemoved = ({ rid }) => {
		const { room } = this.state;
		if (rid === this.rid) {
			Navigation.navigate('RoomsListView');
			showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: RocketChat.getRoomTitle(room) }), I18n.t('Oops'));
		}
	}

	internalSetState = (...args) => {
		if (!this.mounted) {
			return;
		}
		this.setState(...args);
	}

	sendMessage = (message, tmid, tshow) => {
		logEvent(events.ROOM_SEND_MESSAGE);
		const { user } = this.props;
		RocketChat.sendMessage(this.rid, message, this.tmid || tmid, user, tshow).then(() => {
			if (this.list && this.list.current) {
				this.list.current.update();
			}
			this.setLastOpen(null);
			Review.pushPositiveEvent();
		});
	};

	getMessages = () => {
		const { room } = this.state;
		if (room.lastOpen) {
			return RocketChat.loadMissedMessages(room);
		} else {
			return RocketChat.loadMessagesForRoom(room);
		}
	}

	getThreadMessages = () => RocketChat.loadThreadMessages({ tmid: this.tmid, rid: this.rid })

	getCustomEmoji = (name) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	}

	setLastOpen = lastOpen => this.setState({ lastOpen });

	joinRoom = async() => {
		logEvent(events.ROOM_JOIN);
		try {
			const { room } = this.state;

			if (this.isOmnichannel) {
				await takeInquiry(room._id);
			} else {
				await RocketChat.joinRoom(this.rid, this.t);
			}
			this.internalSetState({
				joined: true
			});
		} catch (e) {
			log(e);
		}
	}

	// eslint-disable-next-line react/sort-comp
	fetchThreadName = async(tmid, messageId) => {
		try {
			const db = database.active;
			const threadCollection = db.collections.get('threads');
			const messageCollection = db.collections.get('messages');
			const messageRecord = await messageCollection.find(messageId);
			let threadRecord;
			try {
				threadRecord = await threadCollection.find(tmid);
			} catch (error) {
				console.log('Thread not found. We have to search for it.');
			}
			if (threadRecord) {
				await db.action(async() => {
					await messageRecord.update((m) => {
						m.tmsg = threadRecord.msg || (threadRecord.attachments && threadRecord.attachments.length && threadRecord.attachments[0].title);
					});
				});
			} else {
				let { message: thread } = await RocketChat.getSingleMessage(tmid);
				thread = await Encryption.decryptMessage(thread);
				await db.action(async() => {
					await db.batch(
						threadCollection.prepareCreate((t) => {
							t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
							t.subscription.id = this.rid;
							Object.assign(t, thread);
						}),
						messageRecord.prepareUpdate((m) => {
							m.tmsg = thread.msg || (thread.attachments && thread.attachments.length && thread.attachments[0].title);
						})
					);
				});
			}
		} catch (e) {
			// log(e);
		}
	}

	toggleFollowThread = async(isFollowingThread, tmid) => {
		try {
			await RocketChat.toggleFollowMessage(tmid ?? this.tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	}

	getBadgeColor = (messageId) => {
		const { room } = this.state;
		const { theme } = this.props;
		return getBadgeColor({ subscription: room, theme, messageId });
	}

	navToRoomInfo = (navParam) => {
		const { navigation, user, isMasterDetail } = this.props;
		logEvent(events[`ROOM_GO_${ navParam.t === 'd' ? 'USER' : 'ROOM' }_INFO`]);
		if (navParam.rid === user.id) {
			return;
		}
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	}

	callJitsi = () => {
		const { room } = this.state;
		const { jitsiTimeout } = room;
		if (jitsiTimeout < Date.now()) {
			showErrorAlert(I18n.t('Call_already_ended'));
		} else {
			RocketChat.callJitsi(this.rid);
		}
	};

	handleCommands = ({ event }) => {
		if (this.rid) {
			const { input } = event;
			if (handleCommandScroll(event)) {
				const offset = input === 'UIKeyInputUpArrow' ? 100 : -100;
				this.offset += offset;
				this.flatList?.scrollToOffset({ offset: this.offset });
			} else if (handleCommandRoomActions(event)) {
				this.goRoomActionsView();
			} else if (handleCommandSearchMessages(event)) {
				this.goRoomActionsView('SearchMessagesView');
			} else if (handleCommandReplyLatest(event)) {
				if (this.list && this.list.current) {
					const message = this.list.current.getLastMessage();
					this.onReplyInit(message, false);
				}
			}
		}
	}

	blockAction = ({
		actionId, appId, value, blockId, rid, mid
	}) => RocketChat.triggerBlockAction({
		blockId,
		actionId,
		value,
		mid,
		rid,
		appId,
		container: {
			type: CONTAINER_TYPES.MESSAGE,
			id: mid
		}
	});

	closeBanner = async() => {
		const { room } = this.state;
		try {
			const db = database.active;
			await db.action(async() => {
				await room.update((r) => {
					r.bannerClosed = true;
				});
			});
		} catch {
			// do nothing
		}
	};

	renderItem = (item, previousItem) => {
		const { room, lastOpen, canAutoTranslate } = this.state;
		const {
			user, Message_GroupingPeriod, Message_TimeFormat, useRealName, baseUrl, Message_Read_Receipt_Enabled, theme
		} = this.props;
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator = lastOpen
				&& moment(item.ts).isSameOrAfter(lastOpen)
				&& moment(previousItem.ts).isBefore(lastOpen);
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}

		const message = (
			<Message
				item={item}
				user={user}
				rid={room.rid}
				archived={room.archived}
				broadcast={room.broadcast}
				status={item.status}
				isThreadRoom={!!this.tmid}
				previousItem={previousItem}
				fetchThreadName={this.fetchThreadName}
				onReactionPress={this.onReactionPress}
				onReactionLongPress={this.onReactionLongPress}
				onLongPress={this.onMessageLongPress}
				onEncryptedPress={this.onEncryptedPress}
				onDiscussionPress={this.onDiscussionPress}
				onThreadPress={this.onThreadPress}
				showAttachment={this.showAttachment}
				reactionInit={this.onReactionInit}
				replyBroadcast={this.replyBroadcast}
				errorActionsShow={this.errorActionsShow}
				baseUrl={baseUrl}
				Message_GroupingPeriod={Message_GroupingPeriod}
				timeFormat={Message_TimeFormat}
				useRealName={useRealName}
				isReadReceiptEnabled={Message_Read_Receipt_Enabled}
				autoTranslateRoom={canAutoTranslate && room.autoTranslate}
				autoTranslateLanguage={room.autoTranslateLanguage}
				navToRoomInfo={this.navToRoomInfo}
				getCustomEmoji={this.getCustomEmoji}
				callJitsi={this.callJitsi}
				blockAction={this.blockAction}
				getBadgeColor={this.getBadgeColor}
				toggleFollowThread={this.toggleFollowThread}
			/>
		);

		if (showUnreadSeparator || dateSeparator) {
			return (
				<>
					{message}
					<Separator
						ts={dateSeparator}
						unread={showUnreadSeparator}
						theme={theme}
					/>
				</>
			);
		}

		return message;
	}

	renderFooter = () => {
		const {
			joined, room, selectedMessage, editing, replying, replyWithMention, readOnly
		} = this.state;
		const { navigation, theme } = this.props;

		if (!this.rid) {
			return null;
		}
		if (!joined && !this.tmid) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text accessibilityLabel={I18n.t('You_are_in_preview_mode')} style={[styles.previewMode, { color: themes[theme].titleText }]}>{I18n.t('You_are_in_preview_mode')}</Text>
					<Touch
						onPress={this.joinRoom}
						style={[styles.joinRoomButton, { backgroundColor: themes[theme].actionTintColor }]}
						theme={theme}
					>
						<Text style={[styles.joinRoomText, { color: themes[theme].buttonText }]} testID='room-view-join-button'>{I18n.t(this.isOmnichannel ? 'Take_it' : 'Join')}</Text>
					</Touch>
				</View>
			);
		}
		if (readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text style={[styles.previewMode, { color: themes[theme].titleText }]} accessibilityLabel={I18n.t('This_room_is_read_only')}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if (isBlocked(room)) {
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
			/>
		);
	};

	renderActions = () => {
		const { room, readOnly } = this.state;
		const {
			user, navigation
		} = this.props;
		if (!navigation.isFocused()) {
			return null;
		}
		return (
			<>
				<MessageActions
					ref={ref => this.messageActions = ref}
					tmid={this.tmid}
					room={room}
					user={user}
					editInit={this.onEditInit}
					replyInit={this.onReplyInit}
					reactionInit={this.onReactionInit}
					onReactionPress={this.onReactionPress}
					isReadOnly={readOnly}
				/>
				<MessageErrorActions
					ref={ref => this.messageErrorActions = ref}
					tmid={this.tmid}
				/>
			</>
		);
	}

	setListRef = ref => this.flatList = ref;

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const {
			room, reactionsModalVisible, selectedMessage, loading, reacting
		} = this.state;
		const {
			user, baseUrl, theme, navigation, Hide_System_Messages, width, height
		} = this.props;
		const {
			rid, t, sysMes, bannerClosed, announcement
		} = room;

		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID='room-view'
			>
				<StatusBar />
				<Banner
					rid={rid}
					title={I18n.t('Announcement')}
					text={announcement}
					bannerClosed={bannerClosed}
					closeBanner={this.closeBanner}
					theme={theme}
				/>
				<List
					ref={this.list}
					listRef={this.setListRef}
					rid={rid}
					t={t}
					tmid={this.tmid}
					theme={theme}
					room={room}
					renderRow={this.renderItem}
					loading={loading}
					navigation={navigation}
					hideSystemMessages={Array.isArray(sysMes) ? sysMes : Hide_System_Messages}
					showMessageInMainThread={user.showMessageInMainThread}
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
				/>
				<UploadProgress rid={this.rid} user={user} baseUrl={baseUrl} width={width} />
				<ReactionsModal
					message={selectedMessage}
					isVisible={reactionsModalVisible}
					user={user}
					baseUrl={baseUrl}
					onClose={this.onCloseReactionsModal}
					getCustomEmoji={this.getCustomEmoji}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name,
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	customEmojis: state.customEmojis,
	baseUrl: state.server.server,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled,
	Hide_System_Messages: state.settings.Hide_System_Messages
});

const mapDispatchToProps = dispatch => ({
	replyBroadcast: message => dispatch(replyBroadcastAction(message))
});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomView))));
