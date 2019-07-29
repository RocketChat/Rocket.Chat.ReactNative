import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, TextInput, FlatList, Text, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';
import DocumentPicker from 'react-native-document-picker';
import ActionSheet from 'react-native-action-sheet';

import { userTyping as userTypingAction } from '../../actions/room';
import {
	editRequest as editRequestAction,
	editCancel as editCancelAction,
	replyCancel as replyCancelAction
} from '../../actions/messages';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import database from '../../lib/realm';
import Avatar from '../Avatar';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { emojis } from '../../emojis';
import Recording from './Recording';
import UploadModal from './UploadModal';
import log from '../../utils/log';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import debounce from '../../utils/debounce';
import { COLOR_TEXT_DESCRIPTION } from '../../constants/colors';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid } from '../../utils/deviceInfo';
import CommandPreview from './CommandPreview';

const MENTIONS_TRACKING_TYPE_USERS = '@';
const MENTIONS_TRACKING_TYPE_EMOJIS = ':';
const MENTIONS_TRACKING_TYPE_COMMANDS = '/';
const MENTIONS_COUNT_TO_DISPLAY = 4;

const onlyUnique = function onlyUnique(value, index, self) {
	return self.indexOf(({ _id }) => value._id === _id) === index;
};

const imagePickerConfig = {
	cropping: true,
	compressImageQuality: 0.8,
	avoidEmptySpaceAroundImage: false
};

const libraryPickerConfig = {
	mediaType: 'any'
};

const videoPickerConfig = {
	mediaType: 'video'
};

const FILE_CANCEL_INDEX = 0;
const FILE_PHOTO_INDEX = 1;
const FILE_VIDEO_INDEX = 2;
const FILE_LIBRARY_INDEX = 3;
const FILE_DOCUMENT_INDEX = 4;

class MessageBox extends Component {
	static propTypes = {
		rid: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		replyMessage: PropTypes.object,
		replying: PropTypes.bool,
		editing: PropTypes.bool,
		threadsEnabled: PropTypes.bool,
		isFocused: PropTypes.bool,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		roomType: PropTypes.string,
		tmid: PropTypes.string,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		closeReply: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			mentions: [],
			showEmojiKeyboard: false,
			showSend: false,
			recording: false,
			trackingType: '',
			file: {
				isVisible: false
			},
			commandPreview: []
		};
		this.showCommandPreview = false;
		this.commands = [];
		this.users = [];
		this.rooms = [];
		this.emojis = [];
		this.customEmojis = [];
		this.onEmojiSelected = this.onEmojiSelected.bind(this);
		this.text = '';
		this.fileOptions = [
			I18n.t('Cancel'),
			I18n.t('Take_a_photo'),
			I18n.t('Take_a_video'),
			I18n.t('Choose_from_library'),
			I18n.t('Choose_file')
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

	componentDidMount() {
		const { rid, tmid } = this.props;
		let msg;
		if (tmid) {
			const thread = database.objectForPrimaryKey('threads', tmid);
			if (thread) {
				msg = thread.draftMessage;
			}
		} else {
			const [room] = database.objects('subscriptions').filtered('rid = $0', rid);
			if (room) {
				msg = room.draftMessage;
			}
		}
		if (msg) {
			this.setInput(msg);
			this.setShowSend(true);
		}

		if (isAndroid) {
			require('./EmojiKeyboard');
		}
	}

	componentWillReceiveProps(nextProps) {
		const { message, replyMessage, isFocused } = this.props;
		if (!isFocused) {
			return;
		}
		if (!equal(message, nextProps.message) && nextProps.message.msg) {
			this.setInput(nextProps.message.msg);
			if (this.text) {
				this.setShowSend(true);
			}
			this.focus();
		} else if (!equal(replyMessage, nextProps.replyMessage)) {
			this.focus();
		} else if (!nextProps.message) {
			this.clearInput();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			showEmojiKeyboard, showSend, recording, mentions, file, commandPreview
		} = this.state;
		const {
			roomType, replying, editing, isFocused
		} = this.props;
		if (!isFocused) {
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
		if (!equal(nextState.mentions, mentions)) {
			return true;
		}
		if (!equal(nextState.commandPreview, commandPreview)) {
			return true;
		}
		if (!equal(nextState.file, file)) {
			return true;
		}
		return false;
	}

	onChangeText = debounce((text) => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.handleTyping(!isTextEmpty);
		this.setInput(text);
		// matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
		const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
		if (slashCommand) {
			const [, name, params] = slashCommand;
			const command = database.objects('slashCommand').filtered('command == $0', name);
			if (command && command[0] && command[0].providesPreview) {
				return this.setCommandPreview(name, params);
			}
		}

		if (!isTextEmpty) {
			const { start, end } = this.component._lastNativeSelection;
			const cursor = Math.max(start, end);
			const lastNativeText = this.component._lastNativeText;
			// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
			const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
			const result = lastNativeText.substr(0, cursor).match(regexp);
			this.showCommandPreview = false;
			if (!result) {
				const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
				if (slash) {
					return this.identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
				}
				return this.stopTrackingMention();
			}
			const [, lastChar, name] = result;
			this.identifyMentionKeyword(name, lastChar);
		} else {
			this.stopTrackingMention();
			this.showCommandPreview = false;
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
		const { start, end } = this.component._lastNativeSelection;
		const cursor = Math.max(start, end);
		const regexp = /([a-z0-9._-]+)$/im;
		const result = msg.substr(0, cursor).replace(regexp, '');
		const mentionName = trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
			? `${ item.name || item }:`
			: (item.username || item.name || item.command);
		const text = `${ result }${ mentionName } ${ msg.slice(cursor) }`;
		if ((trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) && item.providesPreview) {
			this.showCommandPreview = true;
		}
		this.setInput(text);
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	}

	onPressCommandPreview = (item) => {
		const { rid } = this.props;
		const { text } = this;
		const command = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		this.showCommandPreview = false;
		this.setState({ commandPreview: [] });
		this.stopTrackingMention();
		this.clearInput();
		try {
			RocketChat.executeCommandPreview(command, params, rid, item);
		} catch (e) {
			log('onPressCommandPreview', e);
		}
	}

	onEmojiSelected = (keyboardId, params) => {
		const { text } = this;
		const { emoji } = params;
		let newText = '';

		// if messagebox has an active cursor
		if (this.component && this.component._lastNativeSelection) {
			const { start, end } = this.component._lastNativeSelection;
			const cursor = Math.max(start, end);
			newText = `${ text.substr(0, cursor) }${ emoji }${ text.substr(cursor) }`;
		} else {
			// if messagebox doesn't have a cursor, just append selected emoji
			newText = `${ text }${ emoji }`;
		}
		this.setInput(newText);
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
		if ('all'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -1, username: 'all' }, ...this.users];
		}
		if ('here'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -2, username: 'here' }, ...this.users];
		}
	}

	getUsers = async(keyword) => {
		this.users = database.objects('users');
		if (keyword) {
			this.users = this.users.filtered('username CONTAINS[c] $0', keyword);
		}
		this.getFixedMentions(keyword);
		this.setState({ mentions: this.users.slice() });

		const usernames = [];

		if (keyword && this.users.length > 7) {
			return;
		}

		this.users.forEach(user => usernames.push(user.username));

		if (this.oldPromise) {
			this.oldPromise();
		}
		try {
			const results = await Promise.race([
				RocketChat.spotlight(keyword, usernames, { users: true }),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]);
			if (results.users && results.users.length) {
				database.write(() => {
					results.users.forEach((user) => {
						try {
							database.create('users', user, true);
						} catch (e) {
							log('err_create_users', e);
						}
					});
				});
			}
		} catch (e) {
			console.warn('spotlight canceled');
		} finally {
			delete this.oldPromise;
			this.users = database.objects('users').filtered('username CONTAINS[c] $0', keyword).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			this.getFixedMentions(keyword);
			this.setState({ mentions: this.users });
		}
	}

	getRooms = async(keyword = '') => {
		this.roomsCache = this.roomsCache || [];
		this.rooms = database.objects('subscriptions')
			.filtered('t != $0', 'd');
		if (keyword) {
			this.rooms = this.rooms.filtered('name CONTAINS[c] $0', keyword);
		}

		const rooms = [];
		this.rooms.forEach(room => rooms.push(room));

		this.roomsCache.forEach((room) => {
			if (room.name && room.name.toUpperCase().indexOf(keyword.toUpperCase()) !== -1) {
				rooms.push(room);
			}
		});

		if (rooms.length > 3) {
			this.setState({ mentions: rooms });
			return;
		}

		if (this.oldPromise) {
			this.oldPromise();
		}

		try {
			const results = await Promise.race([
				RocketChat.spotlight(keyword, [...rooms, ...this.roomsCache].map(r => r.name), { rooms: true }),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]);
			if (results.rooms && results.rooms.length) {
				this.roomsCache = [...this.roomsCache, ...results.rooms].filter(onlyUnique);
			}
			this.setState({ mentions: [...rooms.slice(), ...results.rooms] });
		} catch (e) {
			console.warn('spotlight canceled');
		} finally {
			delete this.oldPromise;
		}
	}

	getEmojis = (keyword) => {
		if (keyword) {
			this.customEmojis = database.objects('customEmojis').filtered('name CONTAINS[c] $0', keyword).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			this.emojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const mergedEmojis = [...this.customEmojis, ...this.emojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
			this.setState({ mentions: mergedEmojis });
		}
	}

	getSlashCommands = (keyword) => {
		this.commands = database.objects('slashCommand').filtered('command CONTAINS[c] $0', keyword);
		this.setState({ mentions: this.commands });
	}

	focus = () => {
		if (this.component && this.component.focus) {
			this.component.focus();
		}
	}

	handleTyping = (isTyping) => {
		const { typing, rid } = this.props;
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

	setCommandPreview = async(command, params) => {
		const { rid } = this.props;
		try	{
			const { preview } = await RocketChat.getCommandPreview(command, rid, params);
			this.showCommandPreview = true;
			this.setState({ commandPreview: preview.items });
		} catch (e) {
			this.showCommandPreview = false;
			log('command Preview', e);
		}
	}

	setInput = (text) => {
		this.text = text;
		if (this.component && this.component.setNativeProps) {
			this.component.setNativeProps({ text });
		}
	}

	setShowSend = (showSend) => {
		this.setState({ showSend });
	}

	clearInput = () => {
		this.setInput('');
		this.setShowSend(false);
	}

	sendMediaMessage = async(file) => {
		const {
			rid, tmid, baseUrl: server, user
		} = this.props;
		this.setState({ file: { isVisible: false } });
		const fileInfo = {
			name: file.name,
			description: file.description,
			size: file.size,
			type: file.mime,
			store: 'Uploads',
			path: file.path
		};
		try {
			await RocketChat.sendFileMessage(rid, fileInfo, tmid, server, user);
		} catch (e) {
			log('err_send_media_message', e);
		}
	}

	takePhoto = async() => {
		try {
			const image = await ImagePicker.openCamera(this.imagePickerConfig);
			this.showUploadModal(image);
		} catch (e) {
			log('err_take_photo', e);
		}
	}

	takeVideo = async() => {
		try {
			const video = await ImagePicker.openCamera(this.videoPickerConfig);
			this.showUploadModal(video);
		} catch (e) {
			log('err_take_video', e);
		}
	}

	chooseFromLibrary = async() => {
		try {
			const image = await ImagePicker.openPicker(this.libraryPickerConfig);
			this.showUploadModal(image);
		} catch (e) {
			log('err_choose_from_library', e);
		}
	}

	chooseFile = async() => {
		try {
			const res = await DocumentPicker.pick({
				type: [DocumentPicker.types.allFiles]
			});
			this.showUploadModal({
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri
			});
		} catch (error) {
			if (!DocumentPicker.isCancel(error)) {
				log('chooseFile', error);
			}
		}
	}


	showUploadModal = (file) => {
		this.setState({ file: { ...file, isVisible: true } });
	}

	showFileActions = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.fileOptions,
			cancelButtonIndex: FILE_CANCEL_INDEX
		}, (actionIndex) => {
			this.handleFileActionPress(actionIndex);
		});
	}

	handleFileActionPress = (actionIndex) => {
		switch (actionIndex) {
			case FILE_PHOTO_INDEX:
				this.takePhoto();
				break;
			case FILE_VIDEO_INDEX:
				this.takeVideo();
				break;
			case FILE_LIBRARY_INDEX:
				this.chooseFromLibrary();
				break;
			case FILE_DOCUMENT_INDEX:
				this.chooseFile();
				break;
			default:
				break;
		}
	}

	editCancel = () => {
		const { editCancel } = this.props;
		editCancel();
		this.clearInput();
	}

	openEmoji = async() => {
		await this.setState({
			showEmojiKeyboard: true
		});
	}

	recordAudioMessage = async() => {
		const recording = await Recording.permission();
		this.setState({ recording });
	}

	finishAudioMessage = async(fileInfo) => {
		const {
			rid, tmid, baseUrl: server, user
		} = this.props;

		this.setState({
			recording: false
		});
		if (fileInfo) {
			try {
				await RocketChat.sendFileMessage(rid, fileInfo, tmid, server, user);
			} catch (e) {
				if (e && e.error === 'error-file-too-large') {
					return Alert.alert(I18n.t(e.error));
				}
				log('err_finish_audio_message', e);
			}
		}
	}

	closeEmoji = () => {
		this.setState({ showEmojiKeyboard: false });
	}

	submit = async() => {
		const {
			message: editingMessage, editRequest, onSubmit, rid: roomId
		} = this.props;
		const message = this.text;

		this.clearInput();
		this.closeEmoji();
		this.stopTrackingMention();
		this.handleTyping(false);
		if (message.trim() === '') {
			return;
		}

		const {
			editing, replying
		} = this.props;

		// Slash command

		if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
			const command = message.replace(/ .*/, '').slice(1);
			const slashCommand = database.objects('slashCommand').filtered('command CONTAINS[c] $0', command);
			if (slashCommand.length > 0) {
				try {
					const messageWithoutCommand = message.substr(message.indexOf(' ') + 1);
					RocketChat.runSlashCommand(command, roomId, messageWithoutCommand);
				} catch (e) {
					log('slashCommand', e);
				}
				this.clearInput();
				return;
			}
		}
		// Edit
		if (editing) {
			const { _id, rid } = editingMessage;
			editRequest({ _id, msg: message, rid });

		// Reply
		} else if (replying) {
			const { replyMessage, closeReply, threadsEnabled } = this.props;

			// Thread
			if (threadsEnabled && replyMessage.mention) {
				onSubmit(message, replyMessage._id);

			// Legacy reply or quote (quote is a reply without mention)
			} else {
				const { user, roomType } = this.props;
				const permalink = await this.getPermalink(replyMessage);
				let msg = `[ ](${ permalink }) `;

				// if original message wasn't sent by current user and neither from a direct room
				if (user.username !== replyMessage.u.username && roomType !== 'd' && replyMessage.mention) {
					msg += `@${ replyMessage.u.username } `;
				}

				msg = `${ msg } ${ message }`;
				onSubmit(msg);
			}
			closeReply();

		// Normal message
		} else {
			onSubmit(message);
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
		const { trackingType } = this.state;
		if (!trackingType) {
			return;
		}
		this.setState({
			mentions: [],
			trackingType: '',
			commandPreview: []
		});
		this.users = [];
		this.rooms = [];
		this.customEmojis = [];
		this.emojis = [];
		this.commands = [];
	}

	renderFixedMentionItem = item => (
		<TouchableOpacity
			style={styles.mentionItem}
			onPress={() => this.onPressMention(item)}
		>
			<Text style={styles.fixedMentionAvatar}>{item.username}</Text>
			<Text style={styles.mentionText}>{item.username === 'here' ? I18n.t('Notify_active_in_this_room') : I18n.t('Notify_all_in_this_room')}</Text>
		</TouchableOpacity>
	)

	renderMentionEmoji = (item) => {
		const { baseUrl } = this.props;

		if (item.name) {
			return (
				<CustomEmoji
					key='mention-item-avatar'
					style={styles.mentionItemCustomEmoji}
					emoji={item}
					baseUrl={baseUrl}
				/>
			);
		}
		return (
			<Text
				key='mention-item-avatar'
				style={styles.mentionItemEmoji}
			>
				{emojify(`:${ item }:`, { output: 'unicode' })}
			</Text>
		);
	}

	renderMentionItem = ({ item }) => {
		const { trackingType } = this.state;
		const { baseUrl, user } = this.props;

		if (item.username === 'all' || item.username === 'here') {
			return this.renderFixedMentionItem(item);
		}
		const defineTestID = (type) => {
			switch (type) {
				case MENTIONS_TRACKING_TYPE_EMOJIS:
					return `mention-item-${ item.name || item }`;
				case MENTIONS_TRACKING_TYPE_COMMANDS:
					return `mention-item-${ item.command || item }`;
				default:
					return `mention-item-${ item.username || item.name || item }`;
			}
		};

		const testID = defineTestID(trackingType);

		return (
			<TouchableOpacity
				style={styles.mentionItem}
				onPress={() => this.onPressMention(item)}
				testID={testID}
			>

				{(() => {
					switch (trackingType) {
						case MENTIONS_TRACKING_TYPE_EMOJIS:
							return (
								<React.Fragment>
									{this.renderMentionEmoji(item)}
									<Text key='mention-item-name' style={styles.mentionText}>:{ item.name || item }:</Text>
								</React.Fragment>
							);
						case MENTIONS_TRACKING_TYPE_COMMANDS:
							return (
								<React.Fragment>
									<Text key='mention-item-command' style={styles.slash}>/</Text>
									<Text key='mention-item-param'>{ item.command}</Text>
								</React.Fragment>
							);
						default:
							return (
								<React.Fragment>
									<Avatar
										key='mention-item-avatar'
										style={styles.avatar}
										text={item.username || item.name}
										size={30}
										type={item.username ? 'd' : 'c'}
										baseUrl={baseUrl}
										userId={user.id}
										token={user.token}
									/>
									<Text key='mention-item-name' style={styles.mentionText}>{ item.username || item.name || item }</Text>
								</React.Fragment>
							);
					}
				})()
				}
			</TouchableOpacity>
		);
	}

	renderMentions = () => {
		const { mentions, trackingType } = this.state;
		if (!trackingType) {
			return null;
		}
		return (
			<ScrollView
				testID='messagebox-container'
				style={styles.scrollViewMention}
				keyboardShouldPersistTaps='always'
			>
				<FlatList
					style={styles.mentionList}
					data={mentions}
					renderItem={this.renderMentionItem}
					keyExtractor={item => item._id || item.username || item.command || item}
					keyboardShouldPersistTaps='always'
				/>
			</ScrollView>
		);
	};

	renderCommandPreviewItem = ({ item }) => (
		<CommandPreview item={item} onPress={this.onPressCommandPreview} />
	);

	renderCommandPreview = () => {
		const { commandPreview } = this.state;
		if (!this.showCommandPreview) {
			return null;
		}
		return (
			<View key='commandbox-container' testID='commandbox-container'>
				<FlatList
					style={styles.mentionList}
					data={commandPreview}
					renderItem={this.renderCommandPreviewItem}
					keyExtractor={item => item.id}
					keyboardShouldPersistTaps='always'
					horizontal
					showsHorizontalScrollIndicator={false}
				/>
			</View>
		);
	}

	renderReplyPreview = () => {
		const {
			replyMessage, replying, closeReply, user
		} = this.props;
		if (!replying) {
			return null;
		}
		return <ReplyPreview key='reply-preview' message={replyMessage} close={closeReply} username={user.username} />;
	};

	renderContent = () => {
		const { recording, showEmojiKeyboard, showSend } = this.state;
		const { editing } = this.props;

		if (recording) {
			return (<Recording onFinish={this.finishAudioMessage} />);
		}
		return (
			<React.Fragment>
				{this.renderCommandPreview()}
				{this.renderMentions()}
				<View style={styles.composer} key='messagebox'>
					{this.renderReplyPreview()}
					<View
						style={[styles.textArea, editing && styles.editing]}
						testID='messagebox'
					>
						<LeftButtons
							showEmojiKeyboard={showEmojiKeyboard}
							editing={editing}
							showFileActions={this.showFileActions}
							editCancel={this.editCancel}
							openEmoji={this.openEmoji}
							closeEmoji={this.closeEmoji}
						/>
						<TextInput
							ref={component => this.component = component}
							style={styles.textBoxInput}
							returnKeyType='default'
							keyboardType='twitter'
							blurOnSubmit={false}
							placeholder={I18n.t('New_Message')}
							onChangeText={this.onChangeText}
							underlineColorAndroid='transparent'
							defaultValue=''
							multiline
							placeholderTextColor={COLOR_TEXT_DESCRIPTION}
							testID='messagebox-input'
						/>
						<RightButtons
							showSend={showSend}
							submit={this.submit}
							recordAudioMessage={this.recordAudioMessage}
							showFileActions={this.showFileActions}
						/>
					</View>
				</View>
			</React.Fragment>
		);
	}

	render() {
		const { showEmojiKeyboard, file } = this.state;
		return (
			<React.Fragment>
				<KeyboardAccessoryView
					renderContent={this.renderContent}
					kbInputRef={this.component}
					kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
					onKeyboardResigned={this.onKeyboardResigned}
					onItemSelected={this.onEmojiSelected}
					trackInteractive
					// revealKeyboardInteractive
					requiresSameParentToManageScrollView
					addBottomView
				/>
				<UploadModal
					isVisible={(file && file.isVisible)}
					file={file}
					close={() => this.setState({ file: {} })}
					submit={this.sendMediaMessage}
				/>
			</React.Fragment>
		);
	}
}

const mapStateToProps = state => ({
	message: state.messages.message,
	replyMessage: state.messages.replyMessage,
	replying: state.messages.replying,
	editing: state.messages.editing,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	threadsEnabled: state.settings.Threads_enabled,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
});

const dispatchToProps = ({
	editCancel: () => editCancelAction(),
	editRequest: message => editRequestAction(message),
	typing: (rid, status) => userTypingAction(rid, status),
	closeReply: () => replyCancelAction()
});

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(MessageBox);
