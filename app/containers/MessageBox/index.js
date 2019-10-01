import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, TextInput, FlatList, Text, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { connect } from 'react-redux';
import { shortnameToUnicode } from 'emoji-toolkit';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';
import DocumentPicker from 'react-native-document-picker';
import ActionSheet from 'react-native-action-sheet';
import { Q } from '@nozbe/watermelondb';

import { userTyping as userTypingAction } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import database from '../../lib/database';
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
import { canUploadFile } from '../../utils/media';

const MENTIONS_TRACKING_TYPE_USERS = '@';
const MENTIONS_TRACKING_TYPE_EMOJIS = ':';
const MENTIONS_TRACKING_TYPE_COMMANDS = '/';
const MENTIONS_COUNT_TO_DISPLAY = 4;

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
		replyWithMention: PropTypes.bool,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		getCustomEmoji: PropTypes.func,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		replyCancel: PropTypes.func
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
			commandPreview: [],
			showCommandPreview: false
		};
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

	async componentDidMount() {
		const db = database.active;
		const { rid, tmid } = this.props;
		let msg;
		try {
			const threadsCollection = db.collections.get('threads');
			const subsCollection = db.collections.get('subscriptions');
			if (tmid) {
				try {
					const thread = await threadsCollection.find(tmid);
					if (thread) {
						msg = thread.draftMessage;
					}
				} catch (error) {
					console.log('Messagebox.didMount: Thread not found');
				}
			} else {
				try {
					const room = await subsCollection.find(rid);
					msg = room.draftMessage;
				} catch (error) {
					console.log('Messagebox.didMount: Room not found');
				}
			}
		} catch (e) {
			log(e);
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
		const { isFocused, editing, replying } = this.props;
		if (!isFocused) {
			return;
		}
		if (editing !== nextProps.editing && nextProps.editing) {
			this.setInput(nextProps.message.msg);
			if (this.text) {
				this.setShowSend(true);
			}
		} else if (replying !== nextProps.replying && nextProps.replying) {
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
	}

	onChangeText = (text) => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.debouncedOnChangeText(text);
	}

	// eslint-disable-next-line react/sort-comp
	debouncedOnChangeText = debounce(async(text) => {
		const db = database.active;
		const isTextEmpty = text.length === 0;
		// this.setShowSend(!isTextEmpty);
		this.handleTyping(!isTextEmpty);
		this.setInput(text);
		// matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
		const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
		if (slashCommand) {
			const [, name, params] = slashCommand;
			const commandsCollection = db.collections.get('slash_commands');
			try {
				const command = await commandsCollection.find(name);
				if (command.providesPreview) {
					return this.setCommandPreview(name, params);
				}
			} catch (e) {
				console.log('Slash command not found');
			}
		}

		if (!isTextEmpty) {
			try {
				const { start, end } = this.component._lastNativeSelection;
				const cursor = Math.max(start, end);
				const lastNativeText = this.component._lastNativeText || '';
				// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
				const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
				const result = lastNativeText.substr(0, cursor).match(regexp);
				if (!result) {
					const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
					if (slash) {
						return this.identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
					}
					return this.stopTrackingMention();
				}
				const [, lastChar, name] = result;
				this.identifyMentionKeyword(name, lastChar);
			} catch (e) {
				log(e);
			}
		} else {
			this.stopTrackingMention();
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
			this.setState({ showCommandPreview: true });
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
		this.setState({ commandPreview: [], showCommandPreview: false });
		this.stopTrackingMention();
		this.clearInput();
		this.handleTyping(false);
		try {
			RocketChat.executeCommandPreview(command, params, rid, item);
		} catch (e) {
			log(e);
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
		let result = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ id: -1, username: 'all' }];
		}
		if ('here'.indexOf(keyword) !== -1) {
			result = [{ id: -2, username: 'here' }, ...result];
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
		if (keyword) {
			const customEmojisCollection = db.collections.get('custom_emojis');
			let customEmojis = await customEmojisCollection.query(
				Q.where('name', Q.like(`${ Q.sanitizeLikeString(keyword) }%`))
			).fetch();
			customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
			this.setState({ mentions: mergedEmojis || [] });
		}
	}, 300)

	getSlashCommands = debounce(async(keyword) => {
		const db = database.active;
		const commandsCollection = db.collections.get('slash_commands');
		const commands = await commandsCollection.query(
			Q.where('id', Q.like(`${ Q.sanitizeLikeString(keyword) }%`))
		).fetch();
		this.setState({ mentions: commands || [] });
	}, 300)

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
			this.setState({ commandPreview: preview.items, showCommandPreview: true });
		} catch (e) {
			this.setState({ commandPreview: [], showCommandPreview: true });
			log(e);
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

	canUploadFile = (file) => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const result = canUploadFile(file, { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize });
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
		return false;
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
			log(e);
		}
	}

	takePhoto = async() => {
		try {
			const image = await ImagePicker.openCamera(this.imagePickerConfig);
			if (this.canUploadFile(image)) {
				this.showUploadModal(image);
			}
		} catch (e) {
			log(e);
		}
	}

	takeVideo = async() => {
		try {
			const video = await ImagePicker.openCamera(this.videoPickerConfig);
			if (this.canUploadFile(video)) {
				this.showUploadModal(video);
			}
		} catch (e) {
			log(e);
		}
	}

	chooseFromLibrary = async() => {
		try {
			const image = await ImagePicker.openPicker(this.libraryPickerConfig);
			if (this.canUploadFile(image)) {
				this.showUploadModal(image);
			}
		} catch (e) {
			log(e);
		}
	}

	chooseFile = async() => {
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
				this.showUploadModal(file);
			}
		} catch (e) {
			if (!DocumentPicker.isCancel(e)) {
				log(e);
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
		const {
			onSubmit, rid: roomId
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
			const db = database.active;
			const commandsCollection = db.collections.get('slash_commands');
			const command = message.replace(/ .*/, '').slice(1);
			const slashCommand = await commandsCollection.query(
				Q.where('id', Q.like(`${ Q.sanitizeLikeString(command) }%`))
			).fetch();
			if (slashCommand.length > 0) {
				try {
					const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
					RocketChat.runSlashCommand(command, roomId, messageWithoutCommand);
				} catch (e) {
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
				message: replyingMessage, replyCancel, threadsEnabled, replyWithMention
			} = this.props;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id);

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
				{shortnameToUnicode(`:${ item }:`)}
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
								<>
									{this.renderMentionEmoji(item)}
									<Text key='mention-item-name' style={styles.mentionText}>:{ item.name || item }:</Text>
								</>
							);
						case MENTIONS_TRACKING_TYPE_COMMANDS:
							return (
								<>
									<Text key='mention-item-command' style={styles.slash}>/</Text>
									<Text key='mention-item-param'>{ item.command}</Text>
								</>
							);
						default:
							return (
								<>
									<Avatar
										key='mention-item-avatar'
										style={styles.avatar}
										text={item.username || item.name}
										size={30}
										type={item.t}
										baseUrl={baseUrl}
										userId={user.id}
										token={user.token}
									/>
									<Text key='mention-item-name' style={styles.mentionText}>{ item.username || item.name || item }</Text>
								</>
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
					extraData={mentions}
					renderItem={this.renderMentionItem}
					keyExtractor={item => item.id || item.username || item.command || item}
					keyboardShouldPersistTaps='always'
				/>
			</ScrollView>
		);
	};

	renderCommandPreviewItem = ({ item }) => (
		<CommandPreview item={item} onPress={this.onPressCommandPreview} />
	);

	renderCommandPreview = () => {
		const { commandPreview, showCommandPreview } = this.state;
		if (!showCommandPreview) {
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
			message, replying, replyCancel, user, getCustomEmoji
		} = this.props;
		if (!replying) {
			return null;
		}
		return <ReplyPreview key='reply-preview' message={message} close={replyCancel} username={user.username} getCustomEmoji={getCustomEmoji} />;
	};

	renderContent = () => {
		const { recording, showEmojiKeyboard, showSend } = this.state;
		const { editing } = this.props;

		if (recording) {
			return (<Recording onFinish={this.finishAudioMessage} />);
		}
		return (
			<>
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
			</>
		);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { showEmojiKeyboard, file } = this.state;
		return (
			<>
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
			</>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	threadsEnabled: state.settings.Threads_enabled,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize
});

const dispatchToProps = ({
	typing: (rid, status) => userTypingAction(rid, status)
});

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(MessageBox);
