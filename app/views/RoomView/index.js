import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, InteractionManager } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { Q } from '@nozbe/watermelondb';
import isEqual from 'lodash/isEqual';

import Touch from '../../utils/touch';
import {
	replyBroadcast as replyBroadcastAction
} from '../../actions/messages';
import List from './List';
import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log from '../../utils/log';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import RoomHeaderView, { RightButtons, RoomHeaderLeft } from './Header';
import StatusBar from '../../containers/StatusBar';
import Separator from './Separator';
import { themes } from '../../constants/colors';
import debounce from '../../utils/debounce';
import ReactionsModal from '../../containers/ReactionsModal';
import { LISTENER } from '../../containers/Toast';
import { isBlocked } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { showErrorAlert } from '../../utils/info';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import {
	KEY_COMMAND,
	handleCommandScroll,
	handleCommandRoomActions,
	handleCommandSearchMessages,
	handleCommandReplyLatest
} from '../../commands';
import ModalNavigation from '../../lib/ModalNavigation';
import { Review } from '../../utils/review';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import { CONTAINER_TYPES } from '../../lib/methods/actions';
import Banner from './Banner';
import Navigation from '../../lib/Navigation';

const stateAttrsUpdate = [
	'joined',
	'lastOpen',
	'reactionsModalVisible',
	'canAutoTranslate',
	'showActions',
	'showErrorActions',
	'loading',
	'editing',
	'replying',
	'reacting',
	'readOnly',
	'member'
];
const roomAttrsUpdate = ['f', 'ro', 'blocked', 'blocker', 'archived', 'muted', 'jitsiTimeout', 'announcement', 'sysMes', 'topic', 'name', 'fname', 'roles'];

class RoomView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const rid = navigation.getParam('rid', null);
		const prid = navigation.getParam('prid');
		const title = navigation.getParam('name');
		const subtitle = navigation.getParam('subtitle');
		const t = navigation.getParam('t');
		const tmid = navigation.getParam('tmid');
		const baseUrl = navigation.getParam('baseUrl');
		const userId = navigation.getParam('userId');
		const token = navigation.getParam('token');
		const avatar = navigation.getParam('avatar');
		const toggleFollowThread = navigation.getParam('toggleFollowThread', () => {});
		const goRoomActionsView = navigation.getParam('goRoomActionsView', () => {});
		const unreadsCount = navigation.getParam('unreadsCount', null);
		const roomUserId = navigation.getParam('roomUserId');
		if (!rid) {
			return {
				...themedHeader(screenProps.theme)
			};
		}
		return {
			...themedHeader(screenProps.theme),
			headerTitle: (
				<RoomHeaderView
					rid={rid}
					prid={prid}
					tmid={tmid}
					title={title}
					subtitle={subtitle}
					type={t}
					widthOffset={tmid ? 95 : 130}
					roomUserId={roomUserId}
					goRoomActionsView={goRoomActionsView}
				/>
			),
			headerRight: (
				<RightButtons
					rid={rid}
					tmid={tmid}
					t={t}
					navigation={navigation}
					toggleFollowThread={toggleFollowThread}
				/>
			),
			headerLeft: (
				<RoomHeaderLeft
					tmid={tmid}
					unreadsCount={unreadsCount}
					navigation={navigation}
					baseUrl={baseUrl}
					userId={userId}
					token={token}
					title={avatar}
					theme={screenProps.theme}
					t={t}
					goRoomActionsView={goRoomActionsView}
					split={screenProps.split}
				/>
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
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
		screenProps: PropTypes.object,
		theme: PropTypes.string,
		replyBroadcast: PropTypes.func
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.tmid = props.navigation.getParam('tmid', null);
		const room = props.navigation.getParam('room');
		const selectedMessage = props.navigation.getParam('message');
		const name = props.navigation.getParam('name');
		const fname = props.navigation.getParam('fname');
		const search = props.navigation.getParam('search');
		const prid = props.navigation.getParam('prid');
		this.state = {
			joined: true,
			room: room || {
				rid: this.rid, t: this.t, name, fname, prid
			},
			roomUpdate: {},
			member: {},
			lastOpen: null,
			reactionsModalVisible: false,
			selectedMessage: selectedMessage || {},
			canAutoTranslate: false,
			loading: true,
			showActions: false,
			showErrorActions: false,
			editing: false,
			replying: !!selectedMessage,
			replyWithMention: false,
			reacting: false,
			readOnly: false
		};

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
		this.sub = new RoomClass(this.rid);
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		this.offset = 0;
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { room } = this.state;
			const {
				navigation, isAuthenticated, user, baseUrl
			} = this.props;
			if ((room.id || room.rid) && !this.tmid) {
				navigation.setParams({
					name: this.getRoomTitle(room),
					subtitle: room.topic,
					avatar: room.name,
					t: room.t,
					token: user.token,
					userId: user.id,
					goRoomActionsView: this.goRoomActionsView,
					baseUrl
				});
			}
			if (this.tmid) {
				navigation.setParams({ toggleFollowThread: this.toggleFollowThread, goRoomActionsView: this.goRoomActionsView });
			}
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
		const { appState, theme } = this.props;
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
		return roomAttrsUpdate.some(key => !isEqual(nextState.roomUpdate[key], roomUpdate[key]));
	}

	componentDidUpdate(prevProps, prevState) {
		const { roomUpdate, room } = this.state;
		const { appState, navigation } = this.props;

		if (appState === 'foreground' && appState !== prevProps.appState && this.rid) {
			this.onForegroundInteraction = InteractionManager.runAfterInteractions(() => {
				// Fire List.init() just to keep observables working
				if (this.list && this.list.current) {
					this.list.current.init();
				}
			});
		}
		// If it's not direct message
		if (this.t !== 'd') {
			if (roomUpdate.topic !== prevState.roomUpdate.topic) {
				navigation.setParams({ subtitle: roomUpdate.topic });
			}
			if (!isEqual(prevState.roomUpdate.roles, roomUpdate.roles)) {
				this.setReadOnly();
			}
		}
		if (((roomUpdate.fname !== prevState.roomUpdate.fname) || (roomUpdate.name !== prevState.roomUpdate.name)) && !this.tmid) {
			navigation.setParams({ name: this.getRoomTitle(room) });
		}
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
		if (this.onForegroundInteraction && this.onForegroundInteraction.cancel) {
			this.onForegroundInteraction.cancel();
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

	// eslint-disable-next-line react/sort-comp
	goRoomActionsView = () => {
		const { room, member } = this.state;
		const { navigation } = this.props;
		navigation.navigate('RoomActionsView', {
			rid: this.rid, t: this.t, room, member
		});
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
			const { navigation } = this.props;

			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);

				navigation.setParams({ roomUserId });

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
			const { navigation } = this.props;
			const subCollection = await db.collections.get('subscriptions');
			const room = await subCollection.find(rid);
			this.setState({ room });
			if (!this.tmid) {
				navigation.setParams({
					name: this.getRoomTitle(room),
					subtitle: room.topic,
					avatar: room.name,
					t: room.t
				});
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
		this.setState({ selectedMessage: message, showErrorActions: true });
	}

	onActionsHide = () => {
		const { editing, replying, reacting } = this.state;
		if (editing || replying || reacting) {
			return;
		}
		this.setState({ selectedMessage: {}, showActions: false });
	}

	onErrorActionsHide = () => {
		this.setState({ selectedMessage: {}, showErrorActions: false });
	}

	onEditInit = (message) => {
		this.setState({ selectedMessage: message, editing: true, showActions: false });
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
			selectedMessage: message, replying: true, showActions: false, replyWithMention: mention
		});
	}

	onReplyCancel = () => {
		this.setState({ selectedMessage: {}, replying: false });
	}

	onReactionInit = (message) => {
		this.setState({ selectedMessage: message, reacting: true, showActions: false });
	}

	onReactionClose = () => {
		this.setState({ selectedMessage: {}, reacting: false });
	}

	onMessageLongPress = (message) => {
		this.setState({ selectedMessage: message, showActions: true });
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
			const { navigation } = this.props;
			const unreadsCount = data.filter(s => s.unread > 0).reduce((a, b) => a + (b.unread || 0), 0);
			if (unreadsCount !== navigation.getParam('unreadsCount')) {
				navigation.setParams({
					unreadsCount
				});
			}
		});
	};

	onThreadPress = debounce(async(item) => {
		const { navigation } = this.props;
		if (item.tmid) {
			if (!item.tmsg) {
				await this.fetchThreadName(item.tmid, item.id);
			}
			navigation.push('RoomView', {
				rid: item.subscription.id, tmid: item.tmid, name: item.tmsg, t: 'thread'
			});
		} else if (item.tlm) {
			navigation.push('RoomView', {
				rid: item.subscription.id, tmid: item.id, name: item.msg, t: 'thread'
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
			showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: this.getRoomTitle(room) }), I18n.t('Oops'));
		}
	}

	internalSetState = (...args) => {
		if (!this.mounted) {
			return;
		}
		this.setState(...args);
	}

	sendMessage = (message, tmid) => {
		const { user } = this.props;
		RocketChat.sendMessage(this.rid, message, this.tmid || tmid, user).then(() => {
			if (this.list && this.list.current) {
				this.list.current.update();
			}
			this.setLastOpen(null);
			Review.pushPositiveEvent();
		});
	};

	getRoomTitle = (room) => {
		const { useRealName } = this.props;
		return ((room.prid || useRealName) && room.fname) || room.name;
	}

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
		try {
			await RocketChat.joinRoom(this.rid, this.t);
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
				const thread = await RocketChat.getSingleMessage(tmid);
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

	toggleFollowThread = async(isFollowingThread) => {
		try {
			await RocketChat.toggleFollowMessage(this.tmid, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	}

	navToRoomInfo = (navParam) => {
		const { room } = this.state;
		const { navigation, user, screenProps } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		if (screenProps && screenProps.split) {
			navigation.navigate('RoomActionsView', { rid: this.rid, t: this.t, room });
			ModalNavigation.navigate('RoomInfoView', navParam);
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
			const { room } = this.state;
			const { navigation } = this.props;
			const { input } = event;
			if (handleCommandScroll(event)) {
				const offset = input === 'UIKeyInputUpArrow' ? 100 : -100;
				this.offset += offset;
				this.flatList.scrollToOffset({ offset: this.offset });
			} else if (handleCommandRoomActions(event)) {
				navigation.navigate('RoomActionsView', { rid: this.rid, t: this.t, room });
			} else if (handleCommandSearchMessages(event)) {
				navigation.navigate('RoomActionsView', { rid: this.rid, t: this.t, room });
				ModalNavigation.navigate('SearchMessagesView', { rid: this.rid });
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
						<Text style={[styles.joinRoomText, { color: themes[theme].buttonText }]} testID='room-view-join-button'>{I18n.t('Join')}</Text>
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
		const {
			room, selectedMessage, showActions, showErrorActions, joined, readOnly
		} = this.state;
		const {
			user, navigation
		} = this.props;
		if (!navigation.isFocused()) {
			return null;
		}
		return (
			<>
				{joined && showActions
					? (
						<MessageActions
							tmid={this.tmid}
							room={room}
							user={user}
							message={selectedMessage}
							actionsHide={this.onActionsHide}
							editInit={this.onEditInit}
							replyInit={this.onReplyInit}
							reactionInit={this.onReactionInit}
							isReadOnly={readOnly}
						/>
					)
					: null
				}
				{showErrorActions ? (
					<MessageErrorActions
						tmid={this.tmid}
						message={selectedMessage}
						actionsHide={this.onErrorActionsHide}
					/>
				) : null}
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
			user, baseUrl, theme, navigation, Hide_System_Messages
		} = this.props;
		const { rid, t, sysMes } = room;

		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: themes[theme].backgroundColor }
				]}
				testID='room-view'
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar theme={theme} />
				<Banner
					rid={rid}
					title={I18n.t('Announcement')}
					text={room.announcement}
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
					hideSystemMessages={sysMes || Hide_System_Messages}
				/>
				{this.renderFooter()}
				{this.renderActions()}
				<ReactionPicker
					show={reacting}
					message={selectedMessage}
					onEmojiSelected={this.onReactionPress}
					reactionClose={this.onReactionClose}
				/>
				<UploadProgress rid={this.rid} user={user} baseUrl={baseUrl} />
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

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomView));
