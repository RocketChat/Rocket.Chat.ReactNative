import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, LayoutAnimation, InteractionManager, Alert, Clipboard, Share
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import moment from 'moment';
import EJSON from 'ejson';
import * as Haptics from 'expo-haptics';

import {
	toggleReactionPicker as toggleReactionPickerAction,
	errorActionsShow as errorActionsShowAction,
	editCancel as editCancelAction,
	replyCancel as replyCancelAction,
	replyBroadcast as replyBroadcastAction,
	deleteRequest as deleteRequestAction,
	editInit as editInitAction,
	replyInit as replyInitAction,
	togglePinRequest as togglePinRequestAction,
	toggleStarRequest as toggleStarRequestAction
} from '../../actions/messages';
import { List } from './List';
import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log from '../../utils/log';
import { isIOS } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import RoomHeaderView, { RightButtons } from './Header';
import StatusBar from '../../containers/StatusBar';
import Separator from './Separator';
import { COLOR_WHITE } from '../../constants/colors';
import debounce from '../../utils/debounce';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import FileModal from '../../containers/FileModal';
import ReactionsModal from '../../containers/ReactionsModal';
import { getMessageTranslation } from '../../containers/message/utils';
import { Toast } from '../../utils/info';
import { LISTNER, SNAP_PONITS } from '../ActionSheet';

@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	actionMessage: state.messages.actionMessage,
	editing: state.messages.editing,
	replying: state.messages.replying,
	showActions: state.messages.showActions,
	showErrorActions: state.messages.showErrorActions,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name,
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	useMarkdown: state.markdown.useMarkdown,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled,
	Message_AllowDeleting: state.settings.Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing: state.settings.Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning: state.settings.Message_AllowPinning,
	Message_AllowStarring: state.settings.Message_AllowStarring,
	Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users
}), dispatch => ({
	editCancel: () => dispatch(editCancelAction()),
	replyCancel: () => dispatch(replyCancelAction()),
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
	errorActionsShow: actionMessage => dispatch(errorActionsShowAction(actionMessage)),
	replyBroadcast: message => dispatch(replyBroadcastAction(message)),
	deleteRequest: message => dispatch(deleteRequestAction(message)),
	editInit: message => dispatch(editInitAction(message)),
	toggleStarRequest: message => dispatch(toggleStarRequestAction(message)),
	togglePinRequest: message => dispatch(togglePinRequestAction(message)),
	replyInit: (message, mention) => dispatch(replyInitAction(message, mention))
}))
export default class RoomView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const rid = navigation.getParam('rid');
		const prid = navigation.getParam('prid');
		const title = navigation.getParam('name');
		const t = navigation.getParam('t');
		const tmid = navigation.getParam('tmid');
		const toggleFollowThread = navigation.getParam('toggleFollowThread', () => {});
		return {
			headerTitleContainerStyle: styles.headerTitleContainerStyle,
			headerTitle: (
				<RoomHeaderView
					rid={rid}
					prid={prid}
					tmid={tmid}
					title={title}
					type={t}
					widthOffset={tmid ? 95 : 130}
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
		showErrorActions: PropTypes.bool,
		actionMessage: PropTypes.object,
		appState: PropTypes.string,
		useRealName: PropTypes.bool,
		isAuthenticated: PropTypes.bool,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		Message_Read_Receipt_Enabled: PropTypes.bool,
		editing: PropTypes.bool,
		replying: PropTypes.bool,
		baseUrl: PropTypes.string,
		useMarkdown: PropTypes.bool,
		toggleReactionPicker: PropTypes.func,
		editCancel: PropTypes.func,
		replyCancel: PropTypes.func,
		replyBroadcast: PropTypes.func,
		errorActionsShow: PropTypes.func,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		toggleStarRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		replyInit: PropTypes.func.isRequired,
		Message_AllowDeleting: PropTypes.bool,
		Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
		Message_AllowEditing: PropTypes.bool,
		Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
		Message_AllowPinning: PropTypes.bool,
		Message_AllowStarring: PropTypes.bool,
		Message_Read_Receipt_Store_Users: PropTypes.bool
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.tmid = props.navigation.getParam('tmid');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		const canAutoTranslate = RocketChat.canAutoTranslate();
		this.state = {
			joined: this.rooms.length > 0,
			room: this.rooms[0] || { rid: this.rid, t: this.t },
			lastOpen: null,
			photoModalVisible: false,
			reactionsModalVisible: false,
			selectedAttachment: {},
			selectedMessage: {},
			canAutoTranslate
		};
		this.beginAnimating = false;
		this.beginAnimatingTimeout = setTimeout(() => this.beginAnimating = true, 300);
		this.messagebox = React.createRef();
		this.willBlurListener = props.navigation.addListener('willBlur', () => this.mounted = false);
		this.mounted = false;
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { room } = this.state;
			const { navigation, isAuthenticated } = this.props;

			if (room._id && !this.tmid) {
				navigation.setParams({ name: this.getRoomTitle(room), t: room.t });
			}
			if (this.tmid) {
				navigation.setParams({ toggleFollowThread: this.toggleFollowThread });
			}

			if (isAuthenticated) {
				this.init();
			} else {
				EventEmitter.addEventListener('connected', this.handleConnected);
			}
			safeAddListener(this.rooms, this.updateRoom);
			this.mounted = true;
		});
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, joined, lastOpen, photoModalVisible, reactionsModalVisible, canAutoTranslate
		} = this.state;
		const { showErrorActions, appState } = this.props;

		if (lastOpen !== nextState.lastOpen) {
			return true;
		} else if (photoModalVisible !== nextState.photoModalVisible) {
			return true;
		} else if (reactionsModalVisible !== nextState.reactionsModalVisible) {
			return true;
		} else if (room.ro !== nextState.room.ro) {
			return true;
		} else if (room.f !== nextState.room.f) {
			return true;
		} else if (room.blocked !== nextState.room.blocked) {
			return true;
		} else if (room.blocker !== nextState.room.blocker) {
			return true;
		} else if (room.archived !== nextState.room.archived) {
			return true;
		} else if (joined !== nextState.joined) {
			return true;
		} else if (canAutoTranslate !== nextState.canAutoTranslate) {
			return true;
		} else if (showErrorActions !== nextProps.showErrorActions) {
			return true;
		} else if (appState !== nextProps.appState) {
			return true;
		} else if (!equal(room.muted, nextState.room.muted)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { room } = this.state;
		const { appState } = this.props;

		if (appState === 'foreground' && appState !== prevProps.appState) {
			this.onForegroundInteraction = InteractionManager.runAfterInteractions(() => {
				RocketChat.loadMissedMessages(room).catch(e => console.log(e));
				RocketChat.readMessages(room.rid).catch(e => console.log(e));
			});
		}
	}

	componentWillUnmount() {
		this.mounted = false;
		const { editing, replying } = this.props;
		if (!editing && this.messagebox && this.messagebox.current) {
			const { text } = this.messagebox.current;
			let obj;
			if (this.tmid) {
				obj = database.objectForPrimaryKey('threads', this.tmid);
			} else {
				[obj] = this.rooms;
			}
			if (obj) {
				database.write(() => {
					obj.draftMessage = text;
				});
			}
		}
		this.rooms.removeAllListeners();
		if (this.sub && this.sub.stop) {
			this.sub.stop();
		}
		if (this.beginAnimatingTimeout) {
			clearTimeout(this.beginAnimatingTimeout);
		}
		if (editing) {
			const { editCancel } = this.props;
			editCancel();
		}
		if (replying) {
			const { replyCancel } = this.props;
			replyCancel();
		}
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.onForegroundInteraction && this.onForegroundInteraction.cancel) {
			this.onForegroundInteraction.cancel();
		}
		if (this.updateStateInteraction && this.updateStateInteraction.cancel) {
			this.updateStateInteraction.cancel();
		}
		if (this.initInteraction && this.initInteraction.cancel) {
			this.initInteraction.cancel();
		}
		if (this.willBlurListener && this.willBlurListener.remove) {
			this.willBlurListener.remove();
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	// eslint-disable-next-line react/sort-comp
	init = () => {
		try {
			this.initInteraction = InteractionManager.runAfterInteractions(async() => {
				const { room } = this.state;
				if (this.tmid) {
					await this.getThreadMessages();
				} else {
					await this.getMessages(room);

					// if room is joined
					if (room._id) {
						if (room.alert || room.unread || room.userMentions) {
							this.setLastOpen(room.ls);
						} else {
							this.setLastOpen(null);
						}
						RocketChat.readMessages(room.rid).catch(e => console.log(e));
						this.sub = await RocketChat.subscribeRoom(room);
					}
				}

				// We run `canAutoTranslate` again in order to refetch auto translate permission
				// in case of a missing connection or poor connection on room open
				const canAutoTranslate = RocketChat.canAutoTranslate();
				this.setState({ canAutoTranslate });
			});
		} catch (e) {
			log('err_room_init', e);
		}
	}

	onMessageLongPress = (item) => {
		const {
			Message_AllowStarring, Message_AllowPinning, Message_Read_Receipt_Store_Users, user
		} = this.props;
		// eslint-disable-next-line react/destructuring-assignment
		const { archived, autoTranslate } = this.state.room;
		if (this.isInfo || this.hasError || archived) {
			return;
		}
		const options = [
			// { label: I18n.t('Cancel'), handler: () => {}, icon: 'circle-cross' },
			{ label: I18n.t('Permalink'), handler: () => this.handlePermalink(item), icon: 'permalink' },
			{ label: I18n.t('Copy'), handler: () => this.handleCopy(item), icon: 'copy' },
			{ label: I18n.t('Share'), handler: () => this.handleShare(item), icon: 'share' }
		];

		// Reply
		if (!this.isRoomReadOnly()) {
			options.push({ label: I18n.t('Reply'), handler: () => this.handleReply(item), icon: 'reply' });
		}

		// Edit
		if (this.allowEdit(item)) {
			options.push({ label: I18n.t('Edit'), handler: () => this.handleEdit(item), icon: 'edit' });
		}
		// Quote
		if (!this.isRoomReadOnly()) {
			options.push({ label: I18n.t('Quote'), handler: () => this.handleQuote(item), icon: 'quote' });
		}
		// Star
		if (Message_AllowStarring) {
			options.push({ label: I18n.t(item && item.starred ? 'Unstar' : 'Star'), handler: () => this.handleStar(item), icon: 'star' });
		}
		// Pin
		if (Message_AllowPinning) {
			options.push({ label: I18n.t(item && item.pinned ? 'Unpin' : 'Pin'), handler: () => this.handlePin(item), icon: 'pin' });
		}

		// Reaction
		if (!this.isRoomReadOnly() || this.canReactWhenReadOnly()) {
			options.push({ label: I18n.t('Add_Reaction'), handler: () => this.handleReaction(item), icon: 'emoji' });
		}
		// Delete
		if (this.allowDelete(item)) {
			options.push({ label: I18n.t('Delete'), handler: () => this.handleDelete(item), icon: 'cross' });
		}

		// Report
		options.push({ label: I18n.t('Report'), handler: () => this.handleReport(item), icon: 'flag' });

		// Toggle - translate
		if (autoTranslate && item.u && item.u._id !== user.id) {
			options.push({ lable: I18n.t(item.autoTranslate ? 'View_Original' : 'Translate'), handler: () => this.handleToggleTranslation(item), icon: 'flag' });
		}

		// Read Receipts
		if (Message_Read_Receipt_Store_Users) {
			options.push({ label: I18n.t('Read_Receipt'), handler: () => this.handleReadReceipt(item), icon: 'flag' });
		}
		EventEmitter.emit(LISTNER, { options, snapPoint: SNAP_PONITS.HALF });
	}


	onOpenFileModal = (attachment) => {
		this.setState({ selectedAttachment: attachment, photoModalVisible: true });
	}

	onCloseFileModal = () => {
		this.setState({ selectedAttachment: {}, photoModalVisible: false });
	}

	onReactionPress = (shortname, messageId) => {
		const { actionMessage, toggleReactionPicker } = this.props;
		try {
			if (!messageId) {
				RocketChat.setReaction(shortname, actionMessage._id);
				return toggleReactionPicker();
			}
			RocketChat.setReaction(shortname, messageId);
		} catch (e) {
			log('err_room_on_reaction_press', e);
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

	onThreadPress = debounce((item) => {
		const { navigation } = this.props;
		if (item.tmid) {
			navigation.push('RoomView', {
				rid: item.rid, tmid: item.tmid, name: item.tmsg, t: 'thread'
			});
		} else if (item.tlm) {
			const title = item.msg || (item.attachments && item.attachments.length && item.attachments[0].title);
			navigation.push('RoomView', {
				rid: item.rid, tmid: item._id, name: title, t: 'thread'
			});
		}
	}, 1000, true)

	toggleReactionPicker = (message) => {
		const { toggleReactionPicker } = this.props;
		toggleReactionPicker(message);
	}

	replyBroadcast = (message) => {
		const { replyBroadcast } = this.props;
		replyBroadcast(message);
	}

	errorActionsShow = (message) => {
		const { errorActionsShow } = this.props;
		errorActionsShow(message);
	}

	handleConnected = () => {
		this.init();
		EventEmitter.removeListener('connected', this.handleConnected);
	}

	internalSetState = (...args) => {
		if (!this.mounted) {
			return;
		}
		if (isIOS && this.beginAnimating) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	updateRoom = () => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			if (this.rooms[0]) {
				const room = JSON.parse(JSON.stringify(this.rooms[0] || {}));
				this.internalSetState({ room });
			}
		});
	}

	sendMessage = (message, tmid) => {
		LayoutAnimation.easeInEaseOut();
		RocketChat.sendMessage(this.rid, message, this.tmid || tmid).then(() => {
			this.setLastOpen(null);
		});
	};

	getRoomTitle = (room) => {
		const { useRealName } = this.props;
		return ((room.prid || useRealName) && room.fname) || room.name;
	}

	getMessages = async() => {
		const { room } = this.state;
		try {
			if (room.lastOpen) {
				await RocketChat.loadMissedMessages(room);
			} else {
				await RocketChat.loadMessagesForRoom(room);
			}
			return Promise.resolve();
		} catch (e) {
			log('err_get_messages', e);
		}
	}

	getThreadMessages = () => {
		try {
			return RocketChat.loadThreadMessages({ tmid: this.tmid });
		} catch (e) {
			log('err_get_thread_messages', e);
		}
	}

	setLastOpen = lastOpen => this.setState({ lastOpen });

	joinRoom = async() => {
		try {
			await RocketChat.joinRoom(this.rid, this.t);
			this.internalSetState({
				joined: true
			});
		} catch (e) {
			log('err_join_room', e);
		}
	};

	isOwner = () => {
		const { room } = this.state;
		return room && room.roles && room.roles.length && !!room.roles.find(role => role === 'owner');
	}

	isMuted = () => {
		const { room } = this.state;
		const { user } = this.props;
		return room && room.muted && room.muted.find && !!room.muted.find(m => m === user.username);
	}

	isReadOnly = () => {
		const { room } = this.state;
		if (this.isOwner()) {
			return false;
		}
		return (room && room.ro) || this.isMuted();
	}

	isBlocked = () => {
		const { room } = this.state;

		if (room) {
			const { t, blocked, blocker } = room;
			if (t === 'd' && (blocked || blocker)) {
				return true;
			}
		}
		return false;
	}

	// eslint-disable-next-line react/sort-comp
	fetchThreadName = async(tmid) => {
		try {
			// TODO: we should build a tmid queue here in order to search for a single tmid only once
			const thread = await RocketChat.getSingleMessage(tmid);
			database.write(() => {
				database.create('threads', buildMessage(EJSON.fromJSONValue(thread)), true);
			});
		} catch (error) {
			log('err_fetch_thread_name', error);
		}
	}

	toggleFollowThread = async(isFollowingThread) => {
		try {
			await RocketChat.toggleFollowMessage(this.tmid, !isFollowingThread);
			this.toast.show(isFollowingThread ? 'Unfollowed thread' : 'Following thread');
		} catch (e) {
			log('err_toggle_follow_thread', e);
		}
	}

	// here
	parseMessage = item => JSON.parse(JSON.stringify(item));

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalinkMessage(message);
		} catch (error) {
			return null;
		}
	}

	isOwn = (item, user) => item.u && item.u._id === user.id;

	isRoomReadOnly = () => {
		const { room } = this.state;
		return room.ro;
	}

	canReactWhenReadOnly = () => {
		const { room } = this.state;
		return room.reactWhenReadOnly;
	}

	allowEdit = (item) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const { user } = this.props;
		const editOwn = this.isOwn(item, user);
		const { Message_AllowEditing: isEditAllowed, Message_AllowEditing_BlockEditInMinutes } = this.props;

		if (!(this.hasEditPermission || (isEditAllowed && editOwn))) {
			return false;
		}

		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (item.ts != null) {
				msgTs = moment(item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	}

	allowDelete = (item) => {
		if (this.isRoomReadOnly()) {
			return false;
		}
		const {
			Message_AllowDeleting: isDeleteAllowed, Message_AllowDeleting_BlockDeleteInMinutes, user
		} = this.props;

		// Prevent from deleting thread start message when positioned inside the thread
		if (this.tmid && this.tmid === item._id) {
			return false;
		}
		const deleteOwn = this.isOwn(item, user);
		if (!(this.hasDeletePermission || (isDeleteAllowed && deleteOwn) || this.hasForceDeletePermission)) {
			return false;
		}
		if (this.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (item.ts != null) {
				msgTs = moment(item.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	}

	handleDelete = (item) => {
		const { deleteRequest } = this.props;
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('You_will_not_be_able_to_recover_this_message'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: 'delete' }),
					style: 'destructive',
					onPress: () => deleteRequest(item)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit = (item) => {
		const { editInit } = this.props;
		const { _id, msg, rid } = item;
		editInit({ _id, msg, rid });
	}

	handleCopy = async(item) => {
		await Clipboard.setString(item.msg);
		this.toast.show(I18n.t('Copied_to_clipboard'));
	}

	handleShare = async(item) => {
		const permalink = await this.getPermalink(item);
		Share.share({
			message: permalink
		});
	};

	handleStar = (item) => {
		const { toggleStarRequest } = this.props;
		toggleStarRequest(item);
	}

	handlePermalink = async(item) => {
		const permalink = await this.getPermalink(item);
		Clipboard.setString(permalink);
		this.toast.show(I18n.t('Permalink_copied_to_clipboard'));
	}

	handlePin = (item) => {
		const { togglePinRequest } = this.props;
		togglePinRequest(item);
	}

	handleReply = (item) => {
		const { replyInit } = this.props;
		replyInit(item, true);
	}

	handleQuote = (item) => {
		const { replyInit } = this.props;
		replyInit(item, false);
	}

	handleReaction = (item) => {
		this.toggleReactionPicker(this.parseMessage(item));
	}

	handleReadReceipt = (item) => {
		const { navigation } = this.props;
		navigation.navigate('ReadReceiptsView', { messageId: item._id });
	}

	handleReport = async(item) => {
		try {
			await RocketChat.reportMessage(item._id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (err) {
			log('err_report_message', err);
		}
	}

	handleToggleTranslation = async(item) => {
		const { room } = this.state;
		try {
			const message = database.objectForPrimaryKey('messages', item._id);
			database.write(() => {
				message.autoTranslate = !message.autoTranslate;
				message._updatedAt = new Date();
			});
			const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
			if (!translatedMessage) {
				await RocketChat.translateMessage(item, room.autoTranslateLanguage);
			}
		} catch (err) {
			log('err_toggle_translation', err);
		}
	}
	// here end

	renderItem = (item, previousItem) => {
		const { room, lastOpen, canAutoTranslate } = this.state;
		const {
			user, Message_GroupingPeriod, Message_TimeFormat, useRealName, baseUrl, useMarkdown, Message_Read_Receipt_Enabled
		} = this.props;
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator = lastOpen
				&& moment(item.ts).isAfter(lastOpen)
				&& moment(previousItem.ts).isBefore(lastOpen);
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}

		const message = (
			<Message
				key={item._id}
				item={item}
				user={user}
				archived={room.archived}
				broadcast={room.broadcast}
				status={item.status}
				_updatedAt={item._updatedAt}
				previousItem={previousItem}
				fetchThreadName={this.fetchThreadName}
				onReactionPress={this.onReactionPress}
				onReactionLongPress={this.onReactionLongPress}
				onDiscussionPress={this.onDiscussionPress}
				onThreadPress={this.onThreadPress}
				onOpenFileModal={this.onOpenFileModal}
				toggleReactionPicker={this.toggleReactionPicker}
				replyBroadcast={this.replyBroadcast}
				errorActionsShow={this.errorActionsShow}
				baseUrl={baseUrl}
				onLongPress={this.onMessageLongPress}
				Message_GroupingPeriod={Message_GroupingPeriod}
				timeFormat={Message_TimeFormat}
				useRealName={useRealName}
				useMarkdown={useMarkdown}
				isReadReceiptEnabled={Message_Read_Receipt_Enabled}
				autoTranslateRoom={canAutoTranslate && room.autoTranslate}
				autoTranslateLanguage={room.autoTranslateLanguage}
				room={room}
				toast={this.toast}
			/>
		);

		if (showUnreadSeparator || dateSeparator) {
			return (
				<React.Fragment>
					{message}
					<Separator
						ts={dateSeparator}
						unread={showUnreadSeparator}
					/>
				</React.Fragment>
			);
		}

		return message;
	}

	renderFooter = () => {
		const { joined, room } = this.state;
		const { navigation } = this.props;

		if (!joined && !this.tmid) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text style={styles.previewMode}>{I18n.t('You_are_in_preview_mode')}</Text>
					<RectButton
						onPress={this.joinRoom}
						style={styles.joinRoomButton}
						activeOpacity={0.5}
						underlayColor={COLOR_WHITE}
					>
						<Text style={styles.joinRoomText} testID='room-view-join-button'>{I18n.t('Join')}</Text>
					</RectButton>
				</View>
			);
		}
		if (this.isReadOnly()) {
			return (
				<View style={styles.readOnly}>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if (this.isBlocked()) {
			return (
				<View style={styles.readOnly}>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_blocked')}</Text>
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
				isFocused={navigation.isFocused()}
			/>
		);
	};

	renderActions = () => {
		const { showErrorActions, navigation } = this.props;
		if (!navigation.isFocused()) {
			return null;
		}
		return (
			<React.Fragment>
				{showErrorActions ? <MessageErrorActions /> : null}
			</React.Fragment>
		);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const {
			room, photoModalVisible, reactionsModalVisible, selectedAttachment, selectedMessage
		} = this.state;
		const { user, baseUrl } = this.props;
		const { rid, t } = room;

		return (
			<SafeAreaView style={styles.container} testID='room-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<List rid={rid} t={t} tmid={this.tmid} renderRow={this.renderItem} />
				{this.renderFooter()}
				{this.renderActions()}
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
				<UploadProgress rid={this.rid} />
				<FileModal
					attachment={selectedAttachment}
					isVisible={photoModalVisible}
					onClose={this.onCloseFileModal}
					user={user}
					baseUrl={baseUrl}
				/>
				<ReactionsModal
					message={selectedMessage}
					isVisible={reactionsModalVisible}
					onClose={this.onCloseReactionsModal}
					user={user}
					baseUrl={baseUrl}
				/>
				<Toast ref={toast => this.toast = toast} />
			</SafeAreaView>
		);
	}
}
