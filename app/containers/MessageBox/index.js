import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, Alert, Keyboard, NativeModules, Text
} from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import ImagePicker from 'react-native-image-crop-picker';
import { dequal } from 'dequal';
import DocumentPicker from 'react-native-document-picker';
import { Q } from '@nozbe/watermelondb';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

import { generateTriggerId } from '../../lib/methods/actions';
import TextInput from '../../presentation/TextInput';
import { userTyping as userTypingAction } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import database from '../../lib/database';
import { emojis } from '../../emojis';
import log, { logEvent, events } from '../../utils/log';
import RecordAudio from './RecordAudio';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import debounce from '../../utils/debounce';
import { themes } from '../../constants/colors';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import { canUploadFile } from '../../utils/media';
import EventEmiter from '../../utils/events';
import {
	KEY_COMMAND,
	handleCommandTyping,
	handleCommandSubmit,
	handleCommandShowUpload
} from '../../commands';
import Mentions from './Mentions';
import MessageboxContext from './Context';
import {
	MENTIONS_TRACKING_TYPE_EMOJIS,
	MENTIONS_TRACKING_TYPE_COMMANDS,
	MENTIONS_COUNT_TO_DISPLAY,
	MENTIONS_TRACKING_TYPE_USERS,
	MENTIONS_TRACKING_TYPE_ROOMS
} from './constants';
import CommandsPreview from './CommandsPreview';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/Navigation';
import { withActionSheet } from '../ActionSheet';
import { sanitizeLikeString } from '../../lib/database/utils';
import { CustomIcon } from '../../lib/Icons';

if (isAndroid) {
	require('./EmojiKeyboard');
}

const imagePickerConfig = {
	cropping: true,
	compressImageQuality: 0.8,
	avoidEmptySpaceAroundImage: false,
	freeStyleCropEnabled: true
};

const libraryPickerConfig = {
	multiple: true,
	compressVideoPreset: 'Passthrough',
	mediaType: 'any'
};

const videoPickerConfig = {
	mediaType: 'video'
};

class MessageBox extends Component {
	static propTypes = {
		rid: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		replying: PropTypes.bool,
		editing: PropTypes.bool,
		threadsEnabled: PropTypes.bool,
		isFocused: PropTypes.func,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		roomType: PropTypes.string,
		tmid: PropTypes.string,
		replyWithMention: PropTypes.bool,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		Message_AudioRecorderEnabled: PropTypes.bool,
		getCustomEmoji: PropTypes.func,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		theme: PropTypes.string,
		replyCancel: PropTypes.func,
		showSend: PropTypes.bool,
		navigation: PropTypes.object,
		children: PropTypes.node,
		isMasterDetail: PropTypes.bool,
		showActionSheet: PropTypes.func,
		iOSScrollBehavior: PropTypes.number,
		sharing: PropTypes.bool,
		isActionsEnabled: PropTypes.bool
	}

	static defaultProps = {
		message: {
			id: ''
		},
		sharing: false,
		iOSScrollBehavior: NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset,
		isActionsEnabled: true,
		getCustomEmoji: () => {}
	}

	constructor(props) {
		super(props);
		this.state = {
			mentions: [],
			showEmojiKeyboard: false,
			showSend: props.showSend,
			recording: false,
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false,
			command: {},
			tshow: false
		};
		this.text = '';
		this.selection = { start: 0, end: 0 };
		this.focused = false;

		// MessageBox Actions
		this.options = [
			{
				title: I18n.t('Take_a_photo'),
				icon: 'camera-photo',
				onPress: this.takePhoto
			},
			{
				title: I18n.t('Take_a_video'),
				icon: 'camera',
				onPress: this.takeVideo
			},
			{
				title: I18n.t('Choose_from_library'),
				icon: 'image',
				onPress: this.chooseFromLibrary
			},
			{
				title: I18n.t('Choose_file'),
				icon: 'attach',
				onPress: this.chooseFile
			},
			{
				title: I18n.t('Create_Discussion'),
				icon: 'discussions',
				onPress: this.createDiscussion
			}
		];

		const libPickerLabels = {
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			loadingLabelText: I18n.t('Processing')
		};
		this.imagePickerConfig = {
			...imagePickerConfig,
			...libPickerLabels
		};
		this.libraryPickerConfig = {
			...libraryPickerConfig,
			...libPickerLabels
		};
		this.videoPickerConfig = {
			...videoPickerConfig,
			...libPickerLabels
		};
	}

	async componentDidMount() {
		const db = database.active;
		const {
			rid, tmid, navigation, sharing
		} = this.props;
		let msg;
		try {
			const threadsCollection = db.get('threads');
			const subsCollection = db.get('subscriptions');
			try {
				this.room = await subsCollection.find(rid);
			} catch (error) {
				console.log('Messagebox.didMount: Room not found');
			}
			if (tmid) {
				try {
					this.thread = await threadsCollection.find(tmid);
					if (this.thread && !sharing) {
						msg = this.thread.draftMessage;
					}
				} catch (error) {
					console.log('Messagebox.didMount: Thread not found');
				}
			} else if (!sharing) {
				msg = this.room?.draftMessage;
			}
		} catch (e) {
			log(e);
		}

		if (msg) {
			this.setInput(msg);
			this.setShowSend(true);
		}

		if (isTablet) {
			EventEmiter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		this.unsubscribeFocus = navigation.addListener('focus', () => {
			// didFocus
			// We should wait pushed views be dismissed
			this.trackingTimeout = setTimeout(() => {
				if (this.tracking && this.tracking.resetTracking) {
					// Reset messageBox keyboard tracking
					this.tracking.resetTracking();
				}
			}, 500);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.component?.blur();
		});
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const {
			isFocused, editing, replying, sharing
		} = this.props;
		if (!isFocused?.()) {
			return;
		}
		if (sharing) {
			this.setInput(nextProps.message.msg ?? '');
			return;
		}
		if (editing !== nextProps.editing && nextProps.editing) {
			this.setInput(nextProps.message.msg);
			if (this.text) {
				this.setShowSend(true);
			}
			this.focus();
		} else if (replying !== nextProps.replying && nextProps.replying) {
			this.focus();
		} else if (!nextProps.message) {
			this.clearInput();
		}
		if (this.trackingTimeout) {
			clearTimeout(this.trackingTimeout);
			this.trackingTimeout = false;
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			showEmojiKeyboard, showSend, recording, mentions, commandPreview, tshow
		} = this.state;

		const {
			roomType, replying, editing, isFocused, message, theme
		} = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!isFocused()) {
			return false;
		}
		if (nextProps.roomType !== roomType) {
			return true;
		}
		if (nextProps.replying !== replying) {
			return true;
		}
		if (nextProps.editing !== editing) {
			return true;
		}
		if (nextState.showEmojiKeyboard !== showEmojiKeyboard) {
			return true;
		}
		if (nextState.showSend !== showSend) {
			return true;
		}
		if (nextState.recording !== recording) {
			return true;
		}
		if (nextState.tshow !== tshow) {
			return true;
		}
		if (!dequal(nextState.mentions, mentions)) {
			return true;
		}
		if (!dequal(nextState.commandPreview, commandPreview)) {
			return true;
		}
		if (!dequal(nextProps.message?.id, message?.id)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		console.countReset(`${ this.constructor.name }.render calls`);
		if (this.onChangeText && this.onChangeText.stop) {
			this.onChangeText.stop();
		}
		if (this.getUsers && this.getUsers.stop) {
			this.getUsers.stop();
		}
		if (this.getRooms && this.getRooms.stop) {
			this.getRooms.stop();
		}
		if (this.getEmojis && this.getEmojis.stop) {
			this.getEmojis.stop();
		}
		if (this.getSlashCommands && this.getSlashCommands.stop) {
			this.getSlashCommands.stop();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (isTablet) {
			EventEmiter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	onChangeText = (text) => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.debouncedOnChangeText(text);
		this.setInput(text);
	}

	onSelectionChange = (e) => {
		this.selection = e.nativeEvent.selection;
	}

	// eslint-disable-next-line react/sort-comp
	debouncedOnChangeText = debounce(async(text) => {
		const { sharing } = this.props;
		const isTextEmpty = text.length === 0;
		if (isTextEmpty) {
			this.stopTrackingMention();
			return;
		}
		this.handleTyping(!isTextEmpty);
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const txt = cursor < text.length ? text.substr(0, cursor).split(' ') : text.split(' ');
		const lastWord = txt[txt.length - 1];
		const result = lastWord.substring(1);

		const commandMention = text.match(/^\//); // match only if message begins with /
		const channelMention = lastWord.match(/^#/);
		const userMention = lastWord.match(/^@/);
		const emojiMention = lastWord.match(/^:/);

		if (commandMention && !sharing) {
			const command = text.substr(1);
			const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
			if (commandParameter) {
				const db = database.active;
				const [, name, params] = commandParameter;
				const commandsCollection = db.get('slash_commands');
				try {
					const commandRecord = await commandsCollection.find(name);
					if (commandRecord.providesPreview) {
						return this.setCommandPreview(commandRecord, name, params);
					}
				} catch (e) {
					// do nothing
				}
			}
			return this.identifyMentionKeyword(command, MENTIONS_TRACKING_TYPE_COMMANDS);
		} else if (channelMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_ROOMS);
		} else if (userMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_USERS);
		} else if (emojiMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_EMOJIS);
		} else {
			return this.stopTrackingMention();
		}
	}, 100)

	onKeyboardResigned = () => {
		this.closeEmoji();
	}

	onPressMention = (item) => {
		if (!this.component) {
			return;
		}
		const { trackingType } = this.state;
		const msg = this.text;
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const regexp = /([a-z0-9._-]+)$/im;
		const result = msg.substr(0, cursor).replace(regexp, '');
		const mentionName = trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
			? `${ item.name || item }:`
			: (item.username || item.name || item.command);
		const text = `${ result }${ mentionName } ${ msg.slice(cursor) }`;
		if ((trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) && item.providesPreview) {
			this.setState({ showCommandPreview: true });
		}
		const newCursor = cursor + mentionName.length;
		this.setInput(text, { start: newCursor, end: newCursor });
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	}

	onPressCommandPreview = (item) => {
		const { command } = this.state;
		const {
			rid, tmid, message: { id: messageTmid }, replyCancel
		} = this.props;
		const { text } = this;
		const name = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		this.setState({ commandPreview: [], showCommandPreview: false, command: {} });
		this.stopTrackingMention();
		this.clearInput();
		this.handleTyping(false);
		try {
			const { appId } = command;
			const triggerId = generateTriggerId(appId);
			RocketChat.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
			replyCancel();
		} catch (e) {
			log(e);
		}
	}

	onEmojiSelected = (keyboardId, params) => {
		const { text } = this;
		const { emoji } = params;
		let newText = '';

		// if messagebox has an active cursor
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		newText = `${ text.substr(0, cursor) }${ emoji }${ text.substr(cursor) }`;
		const newCursor = cursor + emoji.length;
		this.setInput(newText, { start: newCursor, end: newCursor });
		this.setShowSend(true);
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalinkMessage(message);
		} catch (error) {
			return null;
		}
	}

	getFixedMentions = (keyword) => {
		let result = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ rid: -1, username: 'all' }];
		}
		if ('here'.indexOf(keyword) !== -1) {
			result = [{ rid: -2, username: 'here' }, ...result];
		}
		return result;
	}

	getUsers = debounce(async(keyword) => {
		let res = await RocketChat.search({ text: keyword, filterRooms: false, filterUsers: true });
		res = [...this.getFixedMentions(keyword), ...res];
		this.setState({ mentions: res });
	}, 300)

	getRooms = debounce(async(keyword = '') => {
		const res = await RocketChat.search({ text: keyword, filterRooms: true, filterUsers: false });
		this.setState({ mentions: res });
	}, 300)

	getEmojis = debounce(async(keyword) => {
		const db = database.active;
		const customEmojisCollection = db.get('custom_emojis');
		const likeString = sanitizeLikeString(keyword);
		const whereClause = [];
		if (likeString) {
			whereClause.push(Q.where('name', Q.like(`${ likeString }%`)));
		}
		let customEmojis = await customEmojisCollection.query(...whereClause).fetch();
		customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
		const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
		const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
		this.setState({ mentions: mergedEmojis || [] });
	}, 300)

	getSlashCommands = debounce(async(keyword) => {
		const db = database.active;
		const commandsCollection = db.get('slash_commands');
		const likeString = sanitizeLikeString(keyword);
		const commands = await commandsCollection.query(
			Q.where('id', Q.like(`${ likeString }%`))
		).fetch();
		this.setState({ mentions: commands || [] });
	}, 300)

	focus = () => {
		if (this.component && this.component.focus) {
			this.component.focus();
		}
	}

	handleTyping = (isTyping) => {
		const { typing, rid, sharing } = this.props;
		if (sharing) {
			return;
		}
		if (!isTyping) {
			if (this.typingTimeout) {
				clearTimeout(this.typingTimeout);
				this.typingTimeout = false;
			}
			typing(rid, false);
			return;
		}

		if (this.typingTimeout) {
			return;
		}

		this.typingTimeout = setTimeout(() => {
			typing(rid, true);
			this.typingTimeout = false;
		}, 1000);
	}

	setCommandPreview = async(command, name, params) => {
		const { rid } = this.props;
		try	{
			const { success, preview } = await RocketChat.getCommandPreview(name, rid, params);
			if (success) {
				return this.setState({ commandPreview: preview?.items, showCommandPreview: true, command });
			}
		} catch (e) {
			log(e);
		}
		this.setState({ commandPreview: [], showCommandPreview: true, command: {} });
	}

	setInput = (text, selection) => {
		this.text = text;
		if (selection) {
			return this.component.setTextAndSelection(text, selection);
		}
		this.component.setNativeProps({ text });
	}

	setShowSend = (showSend) => {
		const { showSend: prevShowSend } = this.state;
		const { showSend: propShowSend } = this.props;
		if (prevShowSend !== showSend && !propShowSend) {
			this.setState({ showSend });
		}
	}

	clearInput = () => {
		this.setInput('');
		this.setShowSend(false);
		this.setState({ tshow: false });
	}

	canUploadFile = (file) => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const result = canUploadFile(file, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize);
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
		return false;
	}

	takePhoto = async() => {
		logEvent(events.ROOM_BOX_ACTION_PHOTO);
		try {
			const image = await ImagePicker.openCamera(this.imagePickerConfig);
			if (this.canUploadFile(image)) {
				this.openShareView([image]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_PHOTO_F);
		}
	}

	takeVideo = async() => {
		logEvent(events.ROOM_BOX_ACTION_VIDEO);
		try {
			const video = await ImagePicker.openCamera(this.videoPickerConfig);
			if (this.canUploadFile(video)) {
				this.openShareView([video]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_VIDEO_F);
		}
	}

	chooseFromLibrary = async() => {
		logEvent(events.ROOM_BOX_ACTION_LIBRARY);
		try {
			const attachments = await ImagePicker.openPicker(this.libraryPickerConfig);
			this.openShareView(attachments);
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_LIBRARY_F);
		}
	}

	chooseFile = async() => {
		logEvent(events.ROOM_BOX_ACTION_FILE);
		try {
			const res = await DocumentPicker.pick({
				type: [DocumentPicker.types.allFiles]
			});
			const file = {
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri
			};
			if (this.canUploadFile(file)) {
				this.openShareView([file]);
			}
		} catch (e) {
			if (!DocumentPicker.isCancel(e)) {
				logEvent(events.ROOM_BOX_ACTION_FILE_F);
				log(e);
			}
		}
	}

	openShareView = (attachments) => {
		const { message, replyCancel, replyWithMention } = this.props;
		// Start a thread with an attachment
		let { thread } = this;
		if (replyWithMention) {
			thread = message;
			replyCancel();
		}
		Navigation.navigate('ShareView', { room: this.room, thread, attachments });
	}

	createDiscussion = () => {
		logEvent(events.ROOM_BOX_ACTION_DISCUSSION);
		const { isMasterDetail } = this.props;
		const params = { channel: this.room, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	}

	showMessageBoxActions = () => {
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		const { showActionSheet } = this.props;
		showActionSheet({ options: this.options });
	}

	editCancel = () => {
		const { editCancel } = this.props;
		editCancel();
		this.clearInput();
	}

	openEmoji = () => {
		logEvent(events.ROOM_OPEN_EMOJI);
		this.setState({ showEmojiKeyboard: true });
	}

	recordingCallback = (recording) => {
		this.setState({ recording });
	}

	finishAudioMessage = async(fileInfo) => {
		const {
			rid, tmid, baseUrl: server, user
		} = this.props;

		if (fileInfo) {
			try {
				if (this.canUploadFile(fileInfo)) {
					await RocketChat.sendFileMessage(rid, fileInfo, tmid, server, user);
				}
			} catch (e) {
				log(e);
			}
		}
	}

	closeEmoji = () => {
		this.setState({ showEmojiKeyboard: false });
	}

	submit = async() => {
		const { tshow } = this.state;
		const {
			onSubmit, rid: roomId, tmid, showSend, sharing
		} = this.props;
		const message = this.text;

		// if sharing, only execute onSubmit prop
		if (sharing) {
			onSubmit(message);
			return;
		}

		this.clearInput();
		this.debouncedOnChangeText.stop();
		this.closeEmoji();
		this.stopTrackingMention();
		this.handleTyping(false);
		if (message.trim() === '' && !showSend) {
			return;
		}

		const {
			editing, replying, message: { id: messageTmid }, replyCancel
		} = this.props;

		// Slash command
		if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
			const db = database.active;
			const commandsCollection = db.get('slash_commands');
			const command = message.replace(/ .*/, '').slice(1);
			const likeString = sanitizeLikeString(command);
			const slashCommand = await commandsCollection.query(
				Q.where('id', Q.like(`${ likeString }%`))
			).fetch();
			if (slashCommand.length > 0) {
				logEvent(events.COMMAND_RUN);
				try {
					const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
					const [{ appId }] = slashCommand;
					const triggerId = generateTriggerId(appId);
					RocketChat.runSlashCommand(command, roomId, messageWithoutCommand, triggerId, tmid || messageTmid);
					replyCancel();
				} catch (e) {
					logEvent(events.COMMAND_RUN_F);
					log(e);
				}
				this.clearInput();
				return;
			}
		}
		// Edit
		if (editing) {
			const { message: editingMessage, editRequest } = this.props;
			const { id, subscription: { id: rid } } = editingMessage;
			editRequest({ id, msg: message, rid });

		// Reply
		} else if (replying) {
			const {
				message: replyingMessage, threadsEnabled, replyWithMention
			} = this.props;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id, tshow);

			// Legacy reply or quote (quote is a reply without mention)
			} else {
				const { user, roomType } = this.props;
				const permalink = await this.getPermalink(replyingMessage);
				let msg = `[ ](${ permalink }) `;

				// if original message wasn't sent by current user and neither from a direct room
				if (user.username !== replyingMessage.u.username && roomType !== 'd' && replyWithMention) {
					msg += `@${ replyingMessage.u.username } `;
				}

				msg = `${ msg } ${ message }`;
				onSubmit(msg);
			}
			replyCancel();

		// Normal message
		} else {
			onSubmit(message, undefined, tshow);
		}
	}

	updateMentions = (keyword, type) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this.getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			this.getEmojis(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
			this.getSlashCommands(keyword);
		} else {
			this.getRooms(keyword);
		}
	}

	identifyMentionKeyword = (keyword, type) => {
		this.setState({
			showEmojiKeyboard: false,
			trackingType: type
		});
		this.updateMentions(keyword, type);
	}

	stopTrackingMention = () => {
		const { trackingType, showCommandPreview } = this.state;
		if (!trackingType && !showCommandPreview) {
			return;
		}
		this.setState({
			mentions: [],
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false
		});
	}

	handleCommands = ({ event }) => {
		if (handleCommandTyping(event)) {
			if (this.focused) {
				Keyboard.dismiss();
			} else {
				this.component.focus();
			}
			this.focused = !this.focused;
		} else if (handleCommandSubmit(event)) {
			this.submit();
		} else if (handleCommandShowUpload(event)) {
			this.showMessageBoxActions();
		}
	}

	onPressSendToChannel = () => this.setState(({ tshow }) => ({ tshow: !tshow }))

	renderSendToChannel = () => {
		const { tshow } = this.state;
		const { theme, tmid, replyWithMention } = this.props;

		if (!tmid && !replyWithMention) {
			return null;
		}
		return (
			<TouchableWithoutFeedback
				style={[styles.sendToChannelButton, { backgroundColor: themes[theme].messageboxBackground }]}
				onPress={this.onPressSendToChannel}
				testID='messagebox-send-to-channel'
			>
				<CustomIcon name={tshow ? 'checkbox-checked' : 'checkbox-unchecked'} size={24} color={themes[theme].auxiliaryText} />
				<Text style={[styles.sendToChannelText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Messagebox_Send_to_channel')}</Text>
			</TouchableWithoutFeedback>
		);
	}

	renderContent = () => {
		const {
			recording, showEmojiKeyboard, showSend, mentions, trackingType, commandPreview, showCommandPreview
		} = this.state;
		const {
			editing, message, replying, replyCancel, user, getCustomEmoji, theme, Message_AudioRecorderEnabled, children, isActionsEnabled, tmid
		} = this.props;

		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: this.submit,
			returnKeyType: 'send'
		} : {};

		const recordAudio = showSend || !Message_AudioRecorderEnabled ? null : (
			<RecordAudio
				theme={theme}
				recordingCallback={this.recordingCallback}
				onFinish={this.finishAudioMessage}
			/>
		);

		const commandsPreviewAndMentions = !recording ? (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
			</>
		) : null;

		const replyPreview = !recording ? (
			<ReplyPreview
				message={message}
				close={replyCancel}
				username={user.username}
				replying={replying}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
		) : null;

		const textInputAndButtons = !recording ? (
			<>
				<LeftButtons
					theme={theme}
					showEmojiKeyboard={showEmojiKeyboard}
					editing={editing}
					showMessageBoxActions={this.showMessageBoxActions}
					editCancel={this.editCancel}
					openEmoji={this.openEmoji}
					closeEmoji={this.closeEmoji}
					isActionsEnabled={isActionsEnabled}
				/>
				<TextInput
					ref={component => this.component = component}
					style={[styles.textBoxInput, { color: themes[theme].bodyText }]}
					returnKeyType='default'
					keyboardType='twitter'
					blurOnSubmit={false}
					placeholder={I18n.t('New_Message')}
					placeholderTextColor={themes[theme].auxiliaryText}
					onChangeText={this.onChangeText}
					onSelectionChange={this.onSelectionChange}
					underlineColorAndroid='transparent'
					defaultValue=''
					multiline
					testID={`messagebox-input${ tmid ? '-thread' : '' }`}
					theme={theme}
					{...isAndroidTablet}
				/>
				<RightButtons
					theme={theme}
					showSend={showSend}
					submit={this.submit}
					showMessageBoxActions={this.showMessageBoxActions}
					isActionsEnabled={isActionsEnabled}
				/>
			</>
		) : null;

		return (
			<>
				{commandsPreviewAndMentions}
				<View style={[styles.composer, { borderTopColor: themes[theme].borderColor }]}>
					{replyPreview}
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground },
							!recording && editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						{textInputAndButtons}
						{recordAudio}
					</View>
					{this.renderSendToChannel()}
				</View>
				{children}
			</>
		);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { showEmojiKeyboard } = this.state;
		const {
			user, baseUrl, theme, iOSScrollBehavior
		} = this.props;
		return (
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: this.onPressMention,
					onPressCommandPreview: this.onPressCommandPreview
				}}
			>
				<KeyboardAccessoryView
					ref={ref => this.tracking = ref}
					renderContent={this.renderContent}
					kbInputRef={this.component}
					kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
					onKeyboardResigned={this.onKeyboardResigned}
					onItemSelected={this.onEmojiSelected}
					trackInteractive
					// revealKeyboardInteractive
					requiresSameParentToManageScrollView
					addBottomView
					bottomViewColor={themes[theme].messageboxBackground}
					iOSScrollBehavior={iOSScrollBehavior}
				/>
			</MessageboxContext.Provider>
		);
	}
}

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail,
	baseUrl: state.server.server,
	threadsEnabled: state.settings.Threads_enabled,
	user: getUserSelector(state),
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	Message_AudioRecorderEnabled: state.settings.Message_AudioRecorderEnabled
});

const dispatchToProps = ({
	typing: (rid, status) => userTypingAction(rid, status)
});

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(withActionSheet(MessageBox));
