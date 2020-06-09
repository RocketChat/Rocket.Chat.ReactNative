import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, TouchableOpacity, Dimensions, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';
import DocumentPicker from 'react-native-document-picker';
import ActionSheet from 'react-native-action-sheet';
import { Q } from '@nozbe/watermelondb';
import Animated from 'react-native-reanimated';

import sharedStyles from '../../views/Styles';
import { generateTriggerId } from '../../lib/methods/actions';
import TextInput from '../../presentation/TextInput';
import { userTyping as userTypingAction } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import database from '../../lib/database';
import { emojis } from '../../emojis';
import Recording from './Recording';
import UploadModal from './UploadModal';
import log from '../../utils/log';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import debounce from '../../utils/debounce';
import { themes } from '../../constants/colors';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import { canUploadFile as fileUploadable } from '../../utils/media';
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
	MENTIONS_TRACKING_TYPE_USERS
} from './constants';
import CommandsPreview from './CommandsPreview';
import { Review } from '../../utils/review';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/Navigation';


const messageBoxActions = [
	I18n.t('Cancel'),
	I18n.t('Take_a_photo'),
	I18n.t('Take_a_video'),
	I18n.t('Choose_from_library'),
	I18n.t('Choose_file'),
	I18n.t('Create_Discussion')
];
const libPickerLabels = {
	cropperChooseText: I18n.t('Choose'),
	cropperCancelText: I18n.t('Cancel'),
	loadingLabelText: I18n.t('Processing')
};
const imagePickerConfig = {
	cropping: true,
	compressImageQuality: 0.8,
	avoidEmptySpaceAroundImage: false,
	...libPickerLabels
};
const libraryPickerConfig = {
	mediaType: 'any',
	...libPickerLabels
};
const videoPickerConfig = {
	mediaType: 'video',
	...libPickerLabels
};

const FILE_CANCEL_INDEX = 0;
const FILE_PHOTO_INDEX = 1;
const FILE_VIDEO_INDEX = 2;
const FILE_LIBRARY_INDEX = 3;
const FILE_DOCUMENT_INDEX = 4;
const CREATE_DISCUSSION_INDEX = 5;

const TOP = 0;
const BOTTOM = Dimensions.get('window').height;
const stylez = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 0,
		left: 0,
		height: '100%'
	},
	input: {
		textAlignVertical: 'top',
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		padding: 15,
		fontSize: 17,
		letterSpacing: 0,
		...sharedStyles.textRegular,
		height: '90%'
	},
	buttons: {
		zIndex: 5,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	rightButtons: {
		flexDirection: 'row'
	},
	topButton: {
		width: '100%',
		backgroundColor: 'red',
		padding: '1%'
	}
});


const MessageBox = React.memo(({
	rid,
	baseUrl,
	message,
	replying,
	editing,
	threadsEnabled,
	isFocused,
	user,
	roomType,
	tmid,
	replyWithMention,
	FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize,
	Message_AudioRecorderEnabled,
	getCustomEmoji,
	editCancel,
	editRequest,
	onSubmit,
	typing,
	theme,
	replyCancel,
	navigation
}) => {
	const [text, setText] = useState('');
	const [up, setUp] = useState(0);
	const translateY = up ? TOP : BOTTOM;
	const [mentions, setMentions] = useState([]);
	const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
	const [showSend, setStateShowSend] = useState(false);
	const [recording, setRecording] = useState(false);
	const [trackingType, setTrackingType] = useState('');
	const [file, setFile] = useState({
		isVisible: false
	});
	const [commandPreview, setStateCommandPreview] = useState([]);
	const [showCommandPreview, setShowCommandPreview] = useState(false);
	const [command, setCommand] = useState({});
	const [typingTimeout, setTypingTimeout] = useState(false);
	const [room, setRoom] = useState();
	const [focused, setFocused] = useState(false);
	const component = useRef();
	const tracking = useRef();

	function setInput(text) {
		setText(text);
		if (component && component.current?.setNativeProps) {
			component.current?.setNativeProps({ text });
		}
	}

	function setShowSend(nextShowSend) {
		if (nextShowSend !== showSend) {
			setStateShowSend(nextShowSend);
		}
	}

	function onKeyboardResigned() {
		closeEmoji();
	}

	function onEmojiSelected(keyboardId, params) {
		const { emoji } = params;
		let newText = '';

		// if messagebox has an active cursor
		if (component.current?.lastNativeSelection) {
			const { start, end } = component.current?.lastNativeSelection;
			const cursor = Math.max(start, end);
			newText = `${text.substr(0, cursor)}${emoji}${text.substr(cursor)}`;
		} else {
			// if messagebox doesn't have a cursor, just append selected emoji
			newText = `${text}${emoji}`;
		}
		setInput(newText);
		setShowSend(true);
	};

	function clearInput() {
		setInput('');
		setShowSend(false);
	}

	function onChangeText(text) {
		const isTextEmpty = text.length === 0;
		setShowSend(!isTextEmpty);
		debouncedOnChangeText(text);
		setInput(text);
	}

	function setShowSend(nextShowSend) {
		if (nextShowSend !== showSend) {
			setStateShowSend(nextShowSend);
		}
	}

	function focus() {
		if (component && component.current?.focus) {
			component.current?.focus();
		}
	}

	function handleTyping(isTyping) {
		if (!isTyping) {
			if (typingTimeout) {
				clearTimeout(typingTimeout);
				setTypingTimeout(false);
			}
			typing(rid, false);
			return;
		}

		if (typingTimeout) {
			return;
		}

		setTypingTimeout(setTimeout(() => {
			typing(rid, true);
			setTypingTimeout(false);
		}, 1000));
	}

	function getFixedMentions(keyword) {
		let result = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ id: -1, username: 'all' }];
		}
		if ('here'.indexOf(keyword) !== -1) {
			result = [{ id: -2, username: 'here' }, ...result];
		}
		return result;
	}

	const getUsers = debounce(async (keyword) => {
		let res = await RocketChat.search({ text: keyword, filterRooms: false, filterUsers: true });
		res = [...getFixedMentions(keyword), ...res];
		setMentions(res);
	}, 300)

	const getRooms = debounce(async (keyword = '') => {
		const res = await RocketChat.search({ text: keyword, filterRooms: true, filterUsers: false });
		setMentions(res);
	}, 300)

	const getEmojis = debounce(async (keyword) => {
		const db = database.active;
		if (keyword) {
			const customEmojisCollection = db.collections.get('custom_emojis');
			let customEmojis = await customEmojisCollection.query(
				Q.where('name', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
			).fetch();
			customEmojis = customEmojis.slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
			setMentions(mergedEmojis || []);
		}
	}, 300)

	const getSlashCommands = debounce(async (keyword) => {
		const db = database.active;
		const commandsCollection = db.collections.get('slash_commands');
		const commands = await commandsCollection.query(
			Q.where('id', Q.like(`${Q.sanitizeLikeString(keyword)}%`))
		).fetch();
		setMentions(commands || []);
	}, 300)

	async function setCommandPreview(command, name, params) {
		try {
			const { preview } = await RocketChat.getCommandPreview(name, rid, params);
			setStateCommandPreview(preview.items);
			setShowCommandPreview(true);
			setCommand(command);
		} catch (e) {
			setStateCommandPreview([]);
			setShowCommandPreview(true);
			setCommand({});
			log(e);
		}
	}

	function stopTrackingMention() {
		if (!trackingType && !showCommandPreview) {
			return;
		}
		setMentions([]);
		setTrackingType('');
		setCommandPreview([]);
		setShowCommandPreview(false);
	}

	function updateMentions(keyword, type) {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			getEmojis(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
			getSlashCommands(keyword);
		} else {
			getRooms(keyword);
		}
	}

	function identifyMentionKeyword(keyword, type) {
		setShowEmojiKeyboard(false);
		setTrackingType(type);
		updateMentions(keyword, type);
	}

	const debouncedOnChangeText = debounce(async (text) => {
		const db = database.active;
		const isTextEmpty = text.length === 0;
		// this.setShowSend(!isTextEmpty);
		handleTyping(!isTextEmpty);
		// matches if their is text that stats with '/' and group the command and params so we can use it "/command params"
		const slashCommand = text.match(/^\/([a-z0-9._-]+) (.+)/im);
		if (slashCommand) {
			const [, name, params] = slashCommand;
			const commandsCollection = db.collections.get('slash_commands');
			try {
				const command = await commandsCollection.find(name);
				if (command.providesPreview) {
					return setCommandPreview(command, name, params);
				}
			} catch (e) {
				console.log('Slash command not found');
			}
		}

		if (!isTextEmpty) {
			try {
				const { start, end } = component.current?.lastNativeSelection;
				const cursor = Math.max(start, end);
				const lastNativeText = component.current?.lastNativeText || '';
				// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
				const regexp = /(#|@|:|^\/)([a-z0-9._-]+)$/im;
				const result = lastNativeText.substr(0, cursor).match(regexp);
				if (!result) {
					const slash = lastNativeText.match(/^\/$/); // matches only '/' in input
					if (slash) {
						return identifyMentionKeyword('', MENTIONS_TRACKING_TYPE_COMMANDS);
					}
					return stopTrackingMention();
				}
				const [, lastChar, name] = result;
				identifyMentionKeyword(name, lastChar);
			} catch (e) {
				log(e);
			}
		} else {
			stopTrackingMention();
		}
	}, 100)

	function onPressMention(item) {
		if (!component.current) {
			return;
		}
		const msg = text;
		const { start, end } = component.current?.lastNativeSelection;
		const cursor = Math.max(start, end);
		const regexp = /([a-z0-9._-]+)$/im;
		const result = msg.substr(0, cursor).replace(regexp, '');
		const mentionName = trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
			? `${item.name || item}:`
			: (item.username || item.name || item.command);
		const newText = `${result}${mentionName} ${msg.slice(cursor)}`;
		if ((trackingType === MENTIONS_TRACKING_TYPE_COMMANDS) && item.providesPreview) {
			setShowCommandPreview(true);
		}
		setInput(newText);
		focus();
		requestAnimationFrame(() => stopTrackingMention());
	}

	function onPressCommandPreview(item) {
		const { id: messageTmid } = message;
		const name = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		setStateCommandPreview([]);
		setShowCommandPreview(false);
		setCommand({});
		stopTrackingMention();
		clearInput();
		handleTyping(false);
		try {
			const { appId } = command;
			const triggerId = generateTriggerId(appId);
			RocketChat.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
			replyCancel();
		} catch (e) {
			log(e);
		}
	}

	function stopTrackingMention() {
		if (!trackingType && !showCommandPreview) {
			return;
		}
		setMentions([]);
		setTrackingType('');
		setCommandPreview([]);
		setShowCommandPreview(false);
	}

	function closeEmoji() {
		setShowEmojiKeyboard(false);
	}

	async function submit() {
		const message = text;

		clearInput();
		debouncedOnChangeText.stop();
		closeEmoji();
		stopTrackingMention();
		handleTyping(false);
		if (message.trim() === '') {
			return;
		}

		const { id: messageTmid } = message;

		// Slash command
		if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
			const db = database.active;
			const commandsCollection = db.collections.get('slash_commands');
			const command = message.replace(/ .*/, '').slice(1);
			const slashCommand = await commandsCollection.query(
				Q.where('id', Q.like(`${Q.sanitizeLikeString(command)}%`))
			).fetch();
			if (slashCommand.length > 0) {
				try {
					const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
					const [{ appId }] = slashCommand;
					const triggerId = generateTriggerId(appId);
					RocketChat.runSlashCommand(command, this.rid, messageWithoutCommand, triggerId, tmid || messageTmid);
					replyCancel();
				} catch (e) {
					log(e);
				}
				clearInput();
				return;
			}
		}
		// Edit
		if (editing) {
			const { editingMessage } = message;
			const { id, subscription: { id: rid } } = editingMessage;
			editRequest({ id, msg: message, rid });

			// Reply
		} else if (replying) {
			const { replyingMessage } = message;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id);

				// Legacy reply or quote (quote is a reply without mention)
			} else {
				const permalink = await this.getPermalink(replyingMessage);
				let msg = `[ ](${permalink}) `;

				// if original message wasn't sent by current user and neither from a direct room
				if (user.username !== replyingMessage.u.username && roomType !== 'd' && replyWithMention) {
					msg += `@${replyingMessage.u.username} `;
				}

				msg = `${msg} ${message}`;
				onSubmit(msg);
			}
			replyCancel();

			// Normal message
		} else {
			onSubmit(message);
		}
	}

	async function recordAudioMessage() {
		const recording = await Recording.permission();
		setRecording(recording);
	}

	function canUploadFile(file) {
		const result = fileUploadable(file, { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize });
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
		return false;
	}

	async function sendMediaMessage(file) {
		const { id: messageTmid } = message;
		setFile({ isVisible: false })
		const fileInfo = {
			name: file.name,
			description: file.description,
			size: file.size,
			type: file.mime,
			store: 'Uploads',
			path: file.path
		};
		try {
			replyCancel();
			await RocketChat.sendFileMessage(rid, fileInfo, tmid || messageTmid, baseUrl, user);
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
	}

	async function takePhoto() {
		try {
			const image = await ImagePicker.openCamera(imagePickerConfig);
			if (canUploadFile(image)) {
				showUploadModal(image);
			}
		} catch (e) {
			// Do nothing
		}
	}

	async function takeVideo() {
		try {
			const video = await ImagePicker.openCamera(videoPickerConfig);
			if (canUploadFile(video)) {
				showUploadModal(video);
			}
		} catch (e) {
			// Do nothing
		}
	}

	async function chooseFromLibrary() {
		try {
			const image = await ImagePicker.openPicker(libraryPickerConfig);
			if (canUploadFile(image)) {
				showUploadModal(image);
			}
		} catch (e) {
			// Do nothing
		}
	}

	async function chooseFile() {
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
			if (canUploadFile(file)) {
				showUploadModal(file);
			}
		} catch (e) {
			if (!DocumentPicker.isCancel(e)) {
				log(e);
			}
		}
	}

	function createDiscussion() {
		Navigation.navigate('CreateDiscussionView', { channel: room });
	}

	function showUploadModal(newFile) {
		setFile({ ...newFile, isVisible: true });
	}

	function showMessageBoxActions() {
		ActionSheet.showActionSheetWithOptions({
			options: messageBoxActions,
			cancelButtonIndex: FILE_CANCEL_INDEX
		}, (actionIndex) => {
			handleMessageBoxActions(actionIndex);
		});
	}

	function handleMessageBoxActions(actionIndex) {
		switch (actionIndex) {
			case FILE_PHOTO_INDEX:
				takePhoto();
				break;
			case FILE_VIDEO_INDEX:
				takeVideo();
				break;
			case FILE_LIBRARY_INDEX:
				chooseFromLibrary();
				break;
			case FILE_DOCUMENT_INDEX:
				chooseFile();
				break;
			case CREATE_DISCUSSION_INDEX:
				createDiscussion();
				break;
			default:
				break;
		}
	}

	function handleCommands ({ event }) {
		if (handleCommandTyping(event)) {
			if (focused) {
				Keyboard.dismiss();
			} else {
				component.current?.focus();
			}
			setFocused(!focused);
		} else if (handleCommandSubmit(event)) {
			submit();
		} else if (handleCommandShowUpload(event)) {
			showMessageBoxActions();
		}
	}

	function renderTopButton() {
		return <TouchableOpacity onPress={() => setUp(!up)} style={stylez.topButton} />
	}

	function renderComposer() {
		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: () => { },
			returnKeyType: 'send'
		} : {};

		if (recording) {
			return <Recording theme={theme} onFinish={() => { }} />;
		}
		return (
			<>
				<View style={[styles.composer, { borderTopColor: themes[theme].separatorColor }]}>
					{renderTopButton()}
					<ReplyPreview
						message={message}
						close={replyCancel}
						username={user.username}
						replying={replying}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground }, editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						<LeftButtons
							theme={theme}
							showEmojiKeyboard={false}
							editing={false}
							showMessageBoxActions={() => { }}
							editCancel={() => { }}
							openEmoji={() => { }}
							closeEmoji={() => { }}
						/>
						<TextInput
							ref={component}
							style={styles.textBoxInput}
							returnKeyType='default'
							keyboardType='twitter'
							blurOnSubmit={false}
							placeholder={I18n.t('New_Message')}
							onChangeText={onChangeText}
							underlineColorAndroid='transparent'
							defaultValue={text}
							multiline
							testID='messagebox-input'
							theme={theme}
							{...isAndroidTablet}
						/>
						<RightButtons
							theme={theme}
							showSend={showSend}
							submit={submit}
							recordAudioMessage={recordAudioMessage}
							recordAudioMessageEnabled={Message_AudioRecorderEnabled}
							showMessageBoxActions={showMessageBoxActions}
						/>
					</View>
				</View>
			</>
		);
	}

	function renderContent() {
		return (
			<>
				<Animated.View style={[stylez.container, { transform: [{ translateY }] }]}>
					{renderTopButton()}
					<TextInput
						ref={component}
						style={[stylez.input, { backgroundColor: themes[theme].chatComponentBackground }]}
						returnKeyType='default'
						keyboardType='twitter'
						blurOnSubmit={false}
						placeholder={I18n.t('New_Message')}
						onChangeText={onChangeText}
						underlineColorAndroid='transparent'
						defaultValue={text}
						multiline
						testID='messagebox-input'
						theme={theme}
						autoGrow={false}
					/>
				</Animated.View>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
				{
					up ?
						<View style={[stylez.buttons, { backgroundColor: themes[theme].chatComponentBackground }]}>
							<LeftButtons
								theme={theme}
								showEmojiKeyboard={false}
								editing={false}
								showMessageBoxActions={() => { }}
								editCancel={() => { }}
								openEmoji={() => { }}
								closeEmoji={() => { }}
							/>
							<View style={stylez.rightButtons}>
								<RightButtons
									theme={theme}
									showSend={false}
									submit={() => { }}
									recordAudioMessage={() => { }}
									recordAudioMessageEnabled={() => { }}
									showMessageBoxActions={() => { }}
								/>
							</View>
						</View>
						: renderComposer()
				}
			</>
		);
	}

	return (
		<>
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: onPressMention,
					onPressCommandPreview: onPressCommandPreview
				}}
			>
				<KeyboardAccessoryView
					ref={tracking}
					renderContent={renderContent}
					kbInputRef={component}
					kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
					onKeyboardResigned={onKeyboardResigned}
					onItemSelected={onEmojiSelected}
					trackInteractive
					// revealKeyboardInteractive
					requiresSameParentToManageScrollView
					addBottomView
					bottomViewColor={themes[theme].messageboxBackground}
				/>
				<UploadModal
					isVisible={(file && file.isVisible)}
					file={file}
					close={() => this.setFile({})}
					submit={sendMediaMessage}
				/>
			</MessageboxContext.Provider>
		</>
	);
});

MessageBox.propTypes = {
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
	navigation: PropTypes.object
};

const mapStateToProps = state => ({
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

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(MessageBox);
